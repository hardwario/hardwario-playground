const EventEmitter = require('events');
const mqtt = require("mqtt");

export default class extends EventEmitter {

    constructor() {
        super();
        this._url = null;
        this._connect = false;
        this._cnt = 0;
    }

    connect(url) {
        if (this._url == url) return;

        if (this.mqttConnect) {
            this.client.end(true);
            this.mqttConnect = false;
        }

        this._url = url;

        this.client = mqtt.connect(this._url);

        this.client.on("connect", () => {
            this._connect = true;
            this.emit("connect", true);
            this.client.subscribe('bridge/#');
        });

        this.client.on("disconnect", () => {
            this._connect = false;
            this.emit("connect", false);
        });

        this.client.on("message", (topic, data) => {
            let message = { topic: topic.substring(7),  payload: data.toString() };
            this.emit("message", message);
        });
    }

    isConnect() {
        return this._connect;
    }
}
