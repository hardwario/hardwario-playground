"use strict";

const { ipcMain } = require("electron");
const mqtt = require("mqtt");
const { getSettings } = require("../utils/Settings");

const defaultUrl = "127.0.0.1:1883";

// Window list contain reference to itself and MQTT client as well as subscribed topics and messages
let windowList = [];

function setup(ip = defaultUrl, view) {
    var carry = {
        client: mqtt.connect("mqtt://" + ip),
        topics: [],
        history: [],
        view: view
    }
    carry.client.on("message", (topic, message) => {
        var _parse = { topic, payload: message.toString('utf8'), time: new Date().getHours() + ":" + new Date().getMinutes() };
        carry.view.send("mqtt:client:message", _parse);
    })
    carry.client.on("connect", () => {
        carry.view.send("mqtt:client:connected", true);
    })
    carry.client.on("disconnect", () => {
        carry.view.send("mqtt:client:connected", false);
    })
    return carry;
}

function findWindow(id) {
    return windowList.find((item) => item.view.id == id);
}

ipcMain.on("mqtt:client:publish", (event, data) => {
    var window = findWindow(event.sender.id);
    if (window != null && window.client.connected) {
        window.client.publish(data.topic, data.payload);
    }
})

ipcMain.on("mqtt:client:subscribe", (event, data) => {
    var window = findWindow(event.sender.id);
    if (window != null && window.client.connected) {
        window.topics.push(data);
        window.client.subscribe(data);
    }
})

ipcMain.on("mqtt:client:unsubscribe", (event, data) => {
    var window = findWindow(event.sender.id);
    if (window != null && window.client.connected) {
        //window.topics.push(data);
        window.client.unsubscribe(data);
    }
})

// Notify this background that view wants to subscribe to MQTT
ipcMain.on("mqtt:window:subscribe", (event, data) => {
    var window = findWindow(event.sender.id);
    if (window == null) {
        var settings = getSettings();
        data = settings.mqtt.remoteIp;
        windowList.push(setup(data, event.sender));
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
