const mqtt = require("mqtt");

export default class {
    constructor(url, onMessage, onConnect) {
        this.client = mqtt.connect("mqtt://" + url);
        this.client.on("message", (topic, message) => {
            onMessage({ topic, payload: message.toString(), time: new Date().getHours() + ":" + new Date().getMinutes() });
        })
        this.client.on("connect", () => {
            onConnect(true);
        })
        this.client.on("disconnect", () => {
            onConnect(false);
        })
    }
    disconnect(){
        this.client.end();
    }
    subscribe(topic) {
        console.log("Subscribing", topic);
        this.client.subscribe(topic);
    }
    unsubscribe(topic) {
        this.client.unsubscribe(topic);
    }
    publish(topic, message = null) {
        console.log("Publishing message", topic, message);
        this.client.publish(topic, message);
    }
}