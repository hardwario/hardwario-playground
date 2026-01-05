"use strict";

const { SerialPort } = require('serialport')
const { ReadlineParser } = require('@serialport/parser-readline')
var mqtt = require("mqtt");
const path = require('path');
const fs = require('fs');

const gateway_topics = [
    "/nodes/get",
    "/nodes/purge",
    "/nodes/add",
    "/nodes/remove",
    "/pairing-mode/start",
    "/pairing-mode/stop",
    "/alias/set",
    "/alias/remove",
    "/info/get"
];

class Gateway {
    constructor(device, mqttUrl, callback, onError, cacheDir) {
        this._device = device;
        this._connected = false;
        this._name = null;
        this._alias = null;
        this._nodes = null;
        this._cache_nodes = {}
        this._subscribes = [];
        this._cacheDirNodesJson = path.join(cacheDir, 'nodes.json');

        if (!fs.existsSync(cacheDir)) {
            fs.mkdirSync(cacheDir);
        }

        this._ser = new SerialPort({
            path: device,
            autoOpen: false,
            baudRate: 115200,
            parity: "none",
        });

        try {
            this._cache_nodes = JSON.parse(fs.readFileSync(this._cacheDirNodesJson), { encoding: "utf8" });
        } catch(error) {}

        this._ser.on("open", function () {
            this._connected = true;

            callback("connected")

            this._ser.flush(function () {
                this._ser.write("\n");
                this.write("/info/get");

                this._timeout = setTimeout(()=>{
                    if (!this._connected) return;
                    if (onError) onError("There is no answer from the device. Please, make sure the device is the Radio Dongle and has the correct firmware.");
                    this._ser.close();
                }, 1000);

            }.bind(this));
        }.bind(this));

        this._ser.on("close", () => {
            this._connected = false;
            this._alias = null;
            this._nodes = null

            if (this._timeout) clearTimeout(this._timeout);

            console.log("Gateway odpojena");

            if (this._name) {
                for (let i in gateway_topics) {
                    this._unsubscribe("gateway/" + this._name + gateway_topics[i]);
                }
                this.pub("gateway/" + this._name + "/info", null);
            }

            this._name = null;

            callback("disconected");

            this._mqtt.end();
        });
        this._ser.on("error", (e) => {
            console.error(e);
        });

        const parser = this._ser.pipe(new ReadlineParser({ delimiter: "\n" }))
        parser.on("data", this._device_readline.bind(this));

        this._ser.open();

        this._mqtt = mqtt.connect(mqttUrl);
        this._mqtt.on("connect", this._mqtt_on_connect.bind(this));
        this._mqtt.on("message", this._mqtt_on_message.bind(this));
        this._mqtt.on("disconnect", this._mqtt_on_disconnect.bind(this));
    }

    disconnect() {
        if (!this._connected) return;
        this._ser.write(Buffer.from('["/pairing-mode/stop", null]\n'), ()=>{
            this._ser.close();
        });
    }

    getDevice() {
        return this._device;
    }

    isConnected() {
        return this._connected;
    }

    _mqtt_on_connect() {
        console.log("Gateway MQTT connect");
        this._mqtt.subscribe("gateway/all/info/get");
        for (let i in this._subscribes) {
            const topic = this._subscribes[i];
            console.log("Gateway MQTT subscribe: ", topic);
            this._mqtt.subscribe(topic);
        }
    }

    _mqtt_on_disconnect() {
        console.log("Gateway MQTT disconnect");
    }

    _mqtt_on_message(topic, message) {
        let payload = message.toString();
        console.log("Gateway MQTT message", topic, payload);

        let t = topic.split("/");

        if ((t.length > 3) && (t[t.length - 2] == 'color'))
        {
            if (payload.length == 6) {
                payload = '"#' + payload + '"';
            }
            else if ((payload.length == 7) && payload[0] == '#') {
                payload = '"' + payload + '"';
            }
        }

        try {
            payload = payload.length > 0 ? JSON.parse(payload) : null;
        } catch (error) {
            console.error(error.toString());
            return;
        }

        let typ = t.shift(0);
        if (typ == "gateway") {
            if (topic == "gateway/all/info/get") {
                this.write("/info/get");
                return;
            }

            if (t.shift(0) == this._name) {

                topic = "/" + t.join("/");

                if (topic == "/alias/set") {
                    this._eeprom_alias_add(payload.id, payload.alias);
                    return;

                } else if (topic == "/alias/remove") {
                    this._eeprom_alias_remove(payload);
                    return;
                }

                this.write(topic, payload);
            }

        } else if (typ == "node") {
            if ((this._alias != null) && (t[0] in this._alias.name)) {
                t[0] = this._alias.name[t[0]]
            }
            this.write(t.join("/"), payload);
        }
    }

    _device_readline(line) {
        console.log("Gateway read:", line)
        let msg;

        try {
            msg = JSON.parse(line);
        } catch (error) {
            if (line.indexOf("/info") > 0) {
                this.write("/info/get");
            }else{
                console.log("Gateway readline " + error);
            }
            return;
        }

        let topic = msg[0];
        let payload = msg[1];

        if (topic[0] == "/") {
            this._gateway_msg(topic, payload);
        } else if (topic[0] == "$") {
            this._sys_message(topic, payload);
        } else if (topic[0] == "#") {
            // log messages
        } else {

            if (this._alias == null) return;

            let id = topic.substr(0, 12);
            topic = topic.substr(12);

            if (topic == "/info") {
                payload["firmware"] = payload["firmware"].replace("kit-","").replace("wireless-");
                // auto rename from firemware name
                if (this._alias.id[id] == undefined) {
                    let new_alias_base = payload["firmware"];

                    if (new_alias_base.startsWith('generic-node')) {
                        new_alias_base = "generic-node";
                    }

                    let new_alias = null;

                    for (let i = 0; i < 32; i++) {
                        new_alias = new_alias_base + ':' + i;
                        if (!this._alias.name[new_alias]) {
                            break;
                        }
                    }

                    this._eeprom_alias_add(id, new_alias);

                    this._subscribe("node/" + new_alias + "/+/+/+/+");
                }

                this._nodes[id]["info"] = payload;

                this._save_nodes_json();
            }

            let alias = id;

            if (id in this._alias.id) {
                alias = this._alias.id[id];
            }

            this.pub("node/" + alias + topic, payload);
        }
    }

    _gateway_msg(topic, payload) {

        if (topic == "/info") {
            if (payload["id"] == "000000000000") {
                this.write("/info/get");
                return;
            }

            let m = (payload["firmware"] + ":").match(/(?:bcf|twr)-gateway-(.*?):/)

            if (!m) {
                return;
            }

            if (this._timeout) {
                clearTimeout(this._timeout);
                this._timeout = null;
            }

            if (this._name != m[1]) {

                this._name = m[1];

                for (let i in gateway_topics) {
                    this._subscribe("gateway/" + this._name + gateway_topics[i]);
                }
            }

            if (this._nodes == null) {
                this._nodes = {};

                this.write("/nodes/get");
            }

        } else if (topic == "/nodes") {

            if (this._alias == null) {
                this._alias = {
                    id: {},
                    name: {},
                    rename: {}
                };
                this.write("$eeprom/alias/list", 0)
                return
            }

            for (let i in payload) {
                let node = payload[i];
                if (typeof node === "string") node = {id: node};

                this._add_node(node.id);

                node["alias"] = this._alias.id[node.id] || null;

                let info = this._nodes[node.id].info;
                if (info) {
                    node['firmware'] = info.firmware;
                    node['version'] = info.version;
                }

                payload[i] = node;
            };

        } else if (topic == "/detach") {
            this._unsubscribe_node(payload);
            delete this._nodes[payload];
            this._eeprom_alias_remove(payload);

        } else if (topic == "/attach") {
            this._add_node(payload);
        }

        if (this._name) {
            this.pub("gateway/" + this._name + topic, payload);
        }
    }

    _sys_message(topic, payload) {

        if (topic == "$eeprom/alias/add/ok") {
            let id = payload;
            let alias = this._alias.rename[id];

            this._alias.id[id] = alias;
            this._alias.name[alias] = id;

            this.pub("gateway/" + this._name + "/alias/set/ok", { id: id, alias: alias });

            delete this._alias.rename[id];
            return;
        } else if (topic == "$eeprom/alias/remove/ok") {
            let id = payload;
            if (this._alias.id[id]) {
                let alias = this._alias.id[id];
                delete this._alias.id[id];
                delete this._alias.name[alias];
            }
            this.pub("gateway/" + this._name + "/alias/remove/ok", id);
            return;
        }

        let m = topic.match(/\$eeprom\/alias\/list\/(\d+)/);
        if (m) {
            let cnt = 0;
            for (let key in payload) {
                cnt++;
                this._alias.id[key] = payload[key];
                this._alias.name[payload[key]] = key;
            }
            if (cnt == 8) {
                this.write("$eeprom/alias/list", parseInt(m[1]) + 1);
            } else {
                this.write("/nodes/get");
            }
        }
    }

    _add_node(id) {
        if (!(id in this._nodes)) {
            this._nodes[id] = this._cache_nodes[id] || {};
            this._subscribe("node/" + id + "/+/+/+/+");
        }

        if (this._alias && (id in this._alias.id)) {
            this._subscribe("node/" + this._alias.id[id] + "/+/+/+/+");
        }
    }

    _unsubscribe_node(id) {
        this._unsubscribe("node/" + id + "/+/+/+/+");

        if (this._alias && (id in this._alias.id)) {
            this._unsubscribe("node/" + this._alias.id[id] + "/+/+/+/+");
        }
    }

    _subscribe(topic) {
        if (this._subscribes.indexOf(topic) == -1) {
            console.log("Gateway MQTT subscribe: ", topic);
            this._subscribes.push(topic);
            this._mqtt.subscribe(topic);
        }
    }

    _unsubscribe(topic) {
        let index = this._subscribes.indexOf(topic);
        if (index != -1) {
            console.log("Gateway MQTT unsubscribe: ", topic);
            this._subscribes.pop(topic);
            this._mqtt.unsubscribe(topic);
        }
    }

    _eeprom_alias_add(id, alias) {
        if (alias == "") alias = null;

        if (alias) {
            this._alias.rename[id] = alias;
            this.write('$eeprom/alias/add', { 'id': id, 'name': alias });
        } else {
            this._eeprom_alias_remove(id);
        }
    }

    _eeprom_alias_remove(id) {
        if (!this._alias.id[id]) return;
        this.write('$eeprom/alias/remove', id);
    }

    write(topic, payload = null, callback = null) {
        if (!this._connected) return;
        const line = JSON.stringify([topic, payload]);
        console.log("Gateway write:", line);
        this._ser.write(line + "\n");
        this._ser.drain(callback);
    }

    pub(topic, payload) {
        console.log("Gateway MQTT publish:", topic, payload);
        this._mqtt.publish(topic, JSON.stringify(payload));
    }

    _save_nodes_json() {
        fs.writeFile(this._cacheDirNodesJson, JSON.stringify(this._nodes), 'utf8', (err) => {
            if (err) {
                console.log('Error save file ' + this._cacheDirNodesJson);
            } else {
                console.log('The file ' + this._cacheDirNodesJson + ' has been saved!');
            }
        });
    }
}

function port_list(callback) {
    SerialPort.list()
        .then((ports) => {

            // for (let i=0, l=ports.length; i<l; i++) {
            //     console.log(ports[i].serialNumber);
            // }

            callback(ports.filter((port) => {
                return port.manufacturer == "0403" || port.vendorId == "0403";
            }));
        })
        .catch(() => {
            callback([]);
        });
}

module.exports = { Gateway, port_list }
