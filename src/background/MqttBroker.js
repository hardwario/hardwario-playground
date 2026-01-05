"use strict";
var aedes = require('aedes')()
const http = require('http');
const WebSocket = require('ws');

// is-port-reachable is ESM-only, use dynamic import
const { settings } = require('./Settings');
const { ipcMain } = require("electron");

let server;
let status = "offline";

async function setup() {
    const { default: isPortReachable } = await import('is-port-reachable');
    const reachable = await isPortReachable(1883, { host: '127.0.0.1' });

    if (!reachable) {
        // TCP server for native MQTT clients (port 1883)
        var tcpServer = require('net').createServer(aedes.handle)

        tcpServer.listen({
            port: 1883,
            host: settings.get("mqtt-broker-bind"),
        }, function () {
            console.log("MQTT aedes TCP server is up and running on port 1883");
        })

        // WebSocket server for browser clients (port 9001)
        const httpServer = http.createServer();
        const wss = new WebSocket.Server({ server: httpServer });

        wss.on('connection', function connection(ws) {
            const stream = WebSocket.createWebSocketStream(ws);
            aedes.handle(stream);
        });

        httpServer.listen(9001, settings.get("mqtt-broker-bind"), function () {
            console.log("MQTT aedes WebSocket server is up and running on port 9001");
            status = "online";
        });

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
