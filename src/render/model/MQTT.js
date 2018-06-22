const mqtt = require("mqtt");

export default class {
    constructor(url, onMessage, onConnect) {
        this.client = mqtt.connect("mqtt://" + url);
        console.log("Setting up client", url);
        this.client.on("message", (topic, message) => {
            console.log("Nova zprava", message.toString());
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
        this.client.publish(topic, message);
    }
}