'use strict';
const mosca = require('mosca');
const isPortReachable = require('is-port-reachable');
const { ipcMain } = require("electron");


const DefaultMqttPort = 1883;

let server;

async function setup(port) {
    const reachable = await isPortReachable(port || DefaultMqttPort);
    if (!reachable) {
        server = new mosca.Server({ port: port || DefaultMqttPort });
        server.on('clientConnected', function (client) {
            console.log('MQTT client connected', client.id);
        });
        server.on('clientDisconnected', function (client) {
            console.log('MQTT client disconnected', client.id);
        });

        server.on('ready', function () {
            console.log('MQTT Mosca server is up and running');
        });
    }
}

module.exports = { setup }