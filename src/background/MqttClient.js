"use strict";

const { ipcMain } = require("electron");
const mqtt = require("mqtt");

const defaultUrl = "mqtt://127.0.0.1:1883";

// Window list contain reference to itself and MQTT client as well as subscribed topics and messages
let windowList = [];

function setup(ip, view) {

    var carry = {
        client: mqtt.connect(defaultUrl),
        topics: [],
        history: [],
        view: view
    }
    carry.client.on("message", (topic, message) => {
        console.log("Zprava");
        var _parse = { topic, payload: message.toString('utf8'), time: new Date().getHours() + ":" + new Date().getMinutes() };
        carry.view.send("mqtt:client:message", _parse);
    })
    carry.client.on("connect", () => {
        console.log("Connected");
        carry.view.send("mqtt:client:connected", true);
    })
    return carry;
}

function findWindow(id) {
    return windowList.find((item) => item.view.id == id);
}

/*
// Returns connected status for window
ipcMain.on("mqtt:client:connected", (event) => {
    var window = findWindow(event.sender.id);
    event.returnValue = (window == null ? false : window.client.connected);
})*/

/* TODO?
// Returns subscribed topics and messages for window
ipcMain.on("mqtt:client:history", (event) => {
    console.log("Getting history");
    var window = findWindow(event.sender.id)
    if (window.client.connected && window != null) {
        console.log(window.history);
        window.view.send("mqtt:client:history", window.history);
    }
})

ipcMain.on("mqtt:client:subscribed", (event) => {
    console.log("Getting topics");
    var window = findWindow(event.sender.id)
    if (window.client.connected && window != null) {
        console.log(window.topics);
        window.view.send("mqtt:client:subscribed", window.topics);
    }
})
*/
ipcMain.on("mqtt:client:publish", (event, data) => {
    console.log("Publishing", data);
    var window = findWindow(event.sender.id);
    if (window != null && window.client.connected) {
        window.client.publish(data.topic, data.payload);
    }
})

ipcMain.on("mqtt:client:subscribe", (event, data) => {
    console.log("data to sub", windowList.length);
    var window = findWindow(event.sender.id);
    if (window != null && window.client.connected) {
        window.topics.push(data);
        window.client.subscribe(data);
    }
})

// Notify this background that view wants to subscribe to MQTT
ipcMain.on("mqtt:window:subscribe", (event, data) => {
    var window = findWindow(event.sender.id);
    if (window == null) {
        windowList.push(setup(data, event.sender));
        console.log("Subbing window", windowList.length);
    }
})

// Notify this background that view wants to unsubscribe to MQTT
ipcMain.on("mqtt:window:unsubscribe", (event, data) => {
    var window = findWindow(event.sender.id);
    if (window != null) {
        window.client.end();
        var index = windowList.indexOf(window);
        if (index > -1) {
            windowList.splice(index, 1);
        }
    }
})

module.exports = { setup };