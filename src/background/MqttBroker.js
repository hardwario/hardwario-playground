"use strict";
const mosca = require("mosca");
const isPortReachable = require("is-port-reachable");
const { ipcMain } = require("electron");


const DefaultMqttPort = 1883;

let server;
let status = false;

async function setup(port) {
    const reachable = await isPortReachable(port || DefaultMqttPort);
    if (!reachable) {
        status = true;
        server = new mosca.Server({ port: port || DefaultMqttPort });
        server.on("clientConnected", function (client) {
            console.log("MQTT client connected", client.id);
        });
        server.on("clientDisconnected", function (client) {
            console.log("MQTT client disconnected", client.id);
        });

        server.on("ready", function () {
            console.log("MQTT Mosca server is up and running");
        });
    }
}

ipcMain.on("broker:status", (event, data) => {
    event.sender.send("broker:status", status);
});

module.exports = { setup }