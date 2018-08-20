const EventEmitter = require('events');
const mqtt = require("mqtt");

export default class extends EventEmitter {

    constructor() {
        super();
        this._url = null;
        this._connect = false;
        this._subscribed = ["node/#"];
        this._cnt = 0;
        this._messages = [];
        this._messagesMaxLength = 5;
        this._highlighted_messages = {};
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

            for (let i in this._subscribed) {
                this.client.subscribe(this._subscribed[i]);
            }
        });

        this.client.on("disconnect", () => {
            this._connect = false;
            this.emit("connect", false);
        });

        this.client.on("message", (topic, data) => {
            let message = { topic: topic,  payload: data.toString(), time: new Date(), key: this._cnt++ };

            this._messages.push(message);

            if (this._messages.length > this._messagesMaxLength) {
                this._messages.shift();
            }

            if (topic in this._highlighted_messages) {
                this._highlighted_messages[topic] = message;
            }

            this.emit("message", message);
        });

        this.isHighlightedMessages = this.isHighlightedMessages.bind(this);
    }

    isConnect() {
        return this._connect;
    }

    subscribe(topic) {
        if (this._subscribed.indexOf(topic) != -1) return;

        this._subscribed.push(topic);

        if (this._connect) {
            this.client.subscribe(topic);
        }

        this.emit("subscribe", topic);
    }

    unsubscribe(topic) {
        let index = this._subscribed.indexOf(topic);

        if (index == -1) return;

        this._subscribed.splice(index, 1);

        if (this._connect) {
            this.client.unsubscribe(topic);
        }

        this.emit("unsubscribe", topic);
    }

    unSubscribeAll() {
        if (this._connect) {
            for (let i in this._subscribed) {
                let topic = this._subscribed[i]
                this.client.unsubscribe(topic);
                this.emit("unsubscribe", topic);
            }
        }
        this._subscribed = [];
        this.emit("unsubscribe", null);
    }

    getSubscribed() {
        return this._subscribed;
    }

    getMesages() {
        return this._messages;
    }

    getHighlightedMessages() {
        return Object.values(this._highlighted_messages);
    }

    addHighlightedMessages(message) {
        if (this.isHighlightedMessages(message.topic)) return false;
        this._highlighted_messages[message.topic] = message;
        return true;
    }

    removeHighlightedMessages(topic) {
        if (!this.isHighlightedMessages(topic)) return false;
        delete this._highlighted_messages[topic];
        return true;
    }

    isHighlightedMessages(topic) {
        return topic in this._highlighted_messages;
    }

    publish(topic, message) {
        if (this._connect) {
            this.client.publish(topic, message);
        }
    }
}
