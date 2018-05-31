"use strict";

const SerialPort = require("serialport");
var mqtt = require("mqtt");

class Gateway {
  constructor(device) {
    this._name = null;
    this._alias = null;
    this._nodes = null;

    this.ser = new SerialPort(device, {
      autoOpen: false,
      baudRate: 115200,
      parity: "none",
    });

    this.ser.on("open", function() {
      console.log("Gateway device open");
      this.ser.flush(function() {
        this.ser.write("\n");
        this.write("/info/get");
      }.bind(this));
    }.bind(this));

    const parser = this.ser.pipe(new SerialPort.parsers.Readline({ delimiter: "\n" }));
    parser.on("data", this._device_readline.bind(this));

    this.ser.open();

    this._subscribes = ["gateway/all/info/get"];

    this.mqtt = mqtt.connect("mqtt://127.0.0.1:1883");
    this.mqtt.on("connect", this._mqtt_on_connect.bind(this));
    this.mqtt.on("message", this._mqtt_on_message.bind(this));
    this.mqtt.on("disconnect", this._mqtt_on_disconnect.bind(this));
  }

  _mqtt_on_connect() {
    console.log("Gateway MQTT connect");
    for (let i in this._subscribes) {
      this.mqtt.subscribe(this._subscribes[i]);
    }
  }

  _mqtt_on_disconnect() {
    console.log("Gateway MQTT disconnect");
  }

  _mqtt_on_message(topic, message) {
    let payload = message.toString();

    console.log("Gateway MQTT message", topic, payload);

    payload = payload.length > 0 ? JSON.parse(message.toString()) : null;

    let t = topic.split("/");
    let typ = t.shift(0);
    if (typ == "gateway") {
      if (topic == "gateway/all/info/get") {
        this.write("/info/get");
        return;
      }
      if (t.shift(0) == this._name) {
        this.write("/" + t.join("/"));
      }

    } else if (typ == "node") {
      if (t[0] in this._alias.name) {
        t[0] = this._alias.name[t[0]]
      }

      console.log(t, payload);

      this.write(t.join("/"), payload);
    }

  }

  _device_readline(line) {
    console.log("Gateway device readline:", line)
    let msg = JSON.parse(line);
    let topic = msg[0];
    let payload = msg[1];

    if (topic[0] == "/") {
      this._gateway_msg(topic, payload);
    } else if (topic[0] == "$") {
      this._sys_message(topic, payload);
    } else if (topic[0] == "#") {

    } else {

      let id = topic.substr(0, 12);
      if (id in this._alias.id) {
        this.pub("node/" + this._alias.id[id] + topic.substr(12), payload);
      } else {
        this.pub("node/" + topic, payload);
      }
    }
  }

  _gateway_msg(topic, payload) {

    if (topic == "/info") {
      if (payload["id"] == "000000000000") {
        this.write("/info/get");
        return;
      }
      let m = (payload["firmware"] + ":").match(/bcf-gateway-(.*?):/)
      if (!m) {
        return;
      }

      this._name = m[1];

      this._subscribe("gateway/" + this._name + "/nodes/get");
      this._subscribe("gateway/" + this._name + "/nodes/purge");
      this._subscribe("gateway/" + this._name + "/nodes/add");
      this._subscribe("gateway/" + this._name + "/nodes/remove");
      this._subscribe("gateway/" + this._name + "/pairing-mode/start");
      this._subscribe("gateway/" + this._name + "/pairing-mode/stop");

      if (this._nodes == null) {
        this._nodes = [];

        this.write("/nodes/get");
      }

    } else if (topic == "/nodes") {

      this._nodes = payload;

      for (let i in payload) {
        let id = payload[i];
        this._subscribe("node/" + id + "/+/+/+/+");
        if (this._alias && (payload[i] in this._alias.id)) {
          this._subscribe("node/" + this._alias.id[id] + "/+/+/+/+");
        }
      }

      if (this._alias == null) {
        this._alias = {
          id: {},
          name: {},
        };
        this.write("$eeprom/alias/list", 0)
      }

    } else if (topic == "/detach") {

    } else if (topic == "/attach") {
      this.write("/nodes/get");
    }


    if (this._name) {
      this.pub("gateway/" + this._name + topic, payload);
    }
  }

  _sys_message(topic, payload) {
    let m = topic.match(/\$eeprom\/alias\/list\/(\d+)/);
    if (m) {
      for (let key in payload) {
        this._alias.id[key] = payload[key];
        this._alias.name[payload[key]] = key;

        if (key in this._nodes) {
          this._subscribe("node/" + payload[key] + "/+/+/+/+");
        }
      }
      this.write("$eeprom/alias/list", parseInt(m[1]) + 1);
    }
  }

  _subscribe(topic) {
    if (this._subscribes.indexOf(topic) == -1) {
      this._subscribes.push(topic);
      this.mqtt.subscribe(topic);
    }
  }

  write(topic, payload = null, callback = null) {
    this.ser.write(JSON.stringify([topic, payload]) + "\n");
    this.ser.drain(callback);
  }

  pub(topic, payload) {
    this.mqtt.publish(topic, JSON.stringify(payload));
  }

}

function port_list() {
  return new Promise((resolve, reject) => {
    SerialPort.list()
      .then((all_ports) => {
        let ports = []
        all_ports.map((port) => {
          if (port.manufacturer == "0403" && port.vendorId == "0403") {
            ports.push(port);
          }
        });
        resolve(ports);
      })
      .catch(reject);
  });
}

module.exports = { Gateway, port_list }