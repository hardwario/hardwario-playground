'use strict';
const mosca = require('mosca');

const DefaultMqttPort = 1883;

let server;

function setup(port) {
    server = new mosca.Server({ port: port || DefaultMqttPort });
    server.on('clientConnected', function (client) {
        console.log('MQTT client connected', client.id);
    });

    server.on('ready', function () {
        console.log('MQTT Mosca server is up and running');
    });
}

module.exports = { setup }