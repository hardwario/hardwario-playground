"use strict";
var aedes = require('aedes')()

const isPortReachable = require("is-port-reachable");
const { settings } = require('./Settings');
const { ipcMain } = require("electron");

let server;
let status = "offline";

async function setup() {
    const reachable = await isPortReachable(1883);

    if (!reachable) {
        var server = require('net').createServer(aedes.handle)

        server.listen({
            port: 1883,
            host: settings.get("mqtt-broker-bind"),
        }, function () {
            console.log("MQTT aedes server is up and running");
            status = "online";
        })

        aedes.on("client", function (client) {
            console.log("MQTT client connected", client.id);
        });

        aedes.on("clientDisconnect", function (client) {
            console.log("MQTT client disconnected", client.id);
        });

    } else {
        status = "external";
    }

    ipcMain.on("broker/status/get", (event, data) => {
        event.sender.send("broker/status", status);
    });
}

module.exports = { setup }
