"use strict";
var aedes = require('aedes')()

const isPortReachable = require("is-port-reachable");
const { ipcMain } = require("electron");


const DefaultMqttPort = 1883;

let server;
let status = "offline";

async function setup(port) {
    const reachable = await isPortReachable(port || DefaultMqttPort);

    if (!reachable) {
        var server = require('net').createServer(aedes.handle)
        var port = 1883

        server.listen(port, function () {
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
