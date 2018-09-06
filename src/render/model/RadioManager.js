const EventEmitter = require('events');
const mqtt = require("mqtt");
const gateway_topics = [
    "/info",
    "/nodes",
    "/attach",
    "/detach",
    "/alias/set/ok",
    "/alias/remove/ok",
    "/pairing-mode"
];

export default class extends EventEmitter {

    constructor(name="usb-dongle") {
        super();
        this.url = null;
        this.name = name;
        this.mqttConnect = false;
        this.gatewayConnect = false;
        this.info = {}
        this.nodes = []
        this.pairingMode = false;
    }

    connect(url) {
        // if (!url.startsWith("mqtt://")) {
        //     url = "mqtt://" + url;
        // }

        if (this.url == url) return;

        if (this.mqttConnect) {
            this.client.end(true);
            this.mqttConnect = false;
        }

        this.url = url;

        this.client = mqtt.connect(this.url);

        this.client.on("connect", () => {

            this.mqttConnect = true;

            for (let i = 0; i < gateway_topics.length; i++) {
                this.client.subscribe("gateway/" + this.name + gateway_topics[i]);
            }

            this.emit('mqttConnect', true);

            this.publish("gateway/all/info/get");

            setTimeout(()=>{
                if (!this.gatewayConnect) {
                    this.emit("connect", this.gatewayConnect);
                }
            }, 1000);
        });

        this.client.on("disconnect", () => {

            this.emit('mqttConnect', false);

            for (let i = 0; i < gateway_topics.length; i++) {
                this.client.unsubscribe("gateway/" + this.name + gateway_topics[i]);
            }

            this._disconnect();
        });

        this.client.on("message", (topic, message) => {
            console.log("mqtt message", topic, message.toString());

            let payload;

            try {
                payload = JSON.parse(message.toString());
            } catch (error) {
                console.error(error, message);
            }

            if (topic == "gateway/"  + this.name + "/info") {
                this.info = payload;

                if (payload) {
                    this._connect()
                    this.emit("info", this.info);
                } else {
                    this._disconnect();
                }
            }
            else if (topic == "gateway/" + this.name + "/nodes") {
                this.nodes = payload;

                this.emit("nodes", this.nodes);
            }
            else if (topic == "gateway/" + this.name + "/pairing-mode") {
                this.pairingMode = payload == "start";

                this.emit("pairing-mode", this.pairingMode);
            }
            else {
                this.nodeListUpdate();
            }
        });
    }

    _connect() {
        if (!this.gatewayConnect) {
            this.gatewayConnect = true;
            this.emit("connect", this.gatewayConnect);

            this.nodeListUpdate();
        }
    }

    _disconnect() {
        if (this.gatewayConnect) {
            this.gatewayConnect = false;
            this.info = {}
            this.nodes = []
            this.pairingMode = false;
            this.emit("connect", this.gatewayConnect);
            this.emit("info", this.info);
            this.emit("nodes", this.nodes);
            this.emit("pairing-mode", this.pairingMode);
        }
    }

    isMqttConnect() {
        return this.mqttConnect;
    }

    isGatewayConnect() {
        return this.gatewayConnect;
    }

    getNodes() {
        return this.nodes;
    }

    getIsPairingModeStart() {
        return this.pairingMode;
    }

    publish(topic, payload=null) {
        if (!this.mqttConnect) return;

        if (typeof topic == "object") {
            topic = topic.join("/");
        }
        this.client.publish(topic, JSON.stringify(payload));
    }

    pairringStart() {
        this.publish("gateway/" + this.name + "/pairing-mode/start");
    }

    pairringStop() {
        this.publish("gateway/" + this.name + "/pairing-mode/stop");
    }

    nodeListUpdate() {
        this.publish("gateway/" + this.name + "/nodes/get");
    }

    nodeRename(id, newAlias) {
        this.publish("gateway/" + this.name + "/alias/set", { id: id, alias: newAlias });
    }

    nodeRemove(id) {
        this.publish("gateway/" + this.name + "/nodes/remove", id);
    }
}
