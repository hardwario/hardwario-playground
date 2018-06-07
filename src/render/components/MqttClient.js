const EventEmitter = require('events');
const ipcRenderer = require("electron").ipcRenderer;

class MqttClient extends EventEmitter {

    constructor() {
        super();
        this._isConnected = false;
        this._subscribe = [];

        ipcRenderer.send("mqtt:window:subscribe");

        ipcRenderer.on("mqtt:client:connected", (sender, connected) => {
            this._isConnected = true;

            for (let i in this.subscribe) {
                ipcRenderer.send("mqtt:client:subscribe",  this.subscribe[i]);
            }

            this.emit('connect', this);
        })

        ipcRenderer.on("mqtt:client:disconnect", (sender, connected) => {
            this._isConnected = false;

            this.emit('disconnect', this);
        });

        ipcRenderer.on("mqtt:client:message", (sender, message) => {
            this.emit('message', message);
        })
    }

    destroy() {
        ipcRenderer.send("mqtt:window:unsubscribe");
        ipcRenderer.removeAllListeners("mqtt:client:connected");
        ipcRenderer.removeAllListeners("mqtt:client:message");

        this.emit('destroy');
        this.removeAllListeners();
    }

    subscribe(topic) {
        if (this._subscribe.indexOf(topic) != -1) return;

        this._subscribe.push(topic);

        if (this._isConnected) {
            ipcRenderer.send("mqtt:client:subscribe", topic);
        }
    }

    publish(topic, payload) {
        ipcRenderer.send("mqtt:client:publish", { topic: topic, payload: payload });
    }
}

module.exports = MqttClient;
