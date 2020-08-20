const fs = require("fs");
const path = require("path");
const EventEmitter = require('events');
const { spawn } = require('child_process');
const mqtt = require("mqtt");
const { settings } = require('./Settings')

var client;
var enmon;

class Enmon extends EventEmitter {

    start(delay) {
        const programPath = path.join(__dirname, "..", "assets", "enmon");

        this._process = spawn(programPath, ['--loop', '--delay', delay.toString()]);

        this.emit('state', 'start');

        const self = this;
        self._line = '';

        this._process.stdout.on('data', (buffer) => {
            // console.log(`Enmon stdout: ${buffer}`);

            const decoder = new TextDecoder('utf-8');
            const text = decoder.decode(buffer);

            for (let i = 0, l = text.length; i < l; i++) {
                if ((text[i] === '\n') || (text[i] === '\r') && this._line.length > 0) {
                    this.emit('line', this._line);
                    this._line = '';

                } else {
                    this._line += text[i];
                }
            }
        });

        this._process.stderr.on('data', (buffer) => {
            console.error(`Enmon stderr: ${buffer}`);
        });

        this._process.on('close', (code) => {
            this._process = null;
            console.log(`Enmon child process exited with code ${code}`);
            this.emit('state', 'exit');
        });
    }

    stop() {
        if (this._process) {
            this._process.kill();
        }
    }
}

function start() {
    if (enmon) return;

    if (!client) {
        client = mqtt.connect("mqtt://" + settings.get('mqtt.ip'));
    }

    enmon = new Enmon();
    enmon.start(1);
    enmon.on('line', (line) => {
        console.log('Enmon line:', line);
        if (line.startsWith('@SENSOR: "')) {
            line = line.substring(10);
            const i = line.indexOf('",');
            const name = line.substring(0, i).toLowerCase();
            const value = line.substring(i + 2);
            client.publish(`node/enmon/${name}`, value);
        }
    });
}

module.exports.setup = () => {
    // start(1);
};
