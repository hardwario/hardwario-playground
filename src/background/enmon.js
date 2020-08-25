const fs = require("fs");
const path = require("path");
const { ipcMain } = require("electron");
const notifyAll = require("../utils/notifyAll");
const EventEmitter = require('events');
const { spawn } = require('child_process');
const mqtt = require("mqtt");
const { settings } = require('./Settings')

class Enmon extends EventEmitter {

    constructor() {
        super();
        this._process = null;
        this._enable = false;
        this._timeout = false;
        this._isConnected = false;
        this._delay = 5;
    }

    _start() {
        console.log("Enmon:start", this._enable, this._process === null);
        if (!this._enable) return;
        if (this._process) return;
        if (this._timeout) {
            clearTimeout(this._timeout);
        }

        this._isConnected = false;

        const programPath = path.join(__dirname, "..", "assets", "enmon");

        this._process = spawn(programPath, ['--loop', '--delay', this._delay.toString()]);

        const self = this;

        this._process.on('close', (code) => {
            self._process = null;
            console.log(`Enmon child process exited with code ${code}`);

            if (this._isConnected) {
                this._isConnected = false;
                self.emit('state', self.getState());
            }

            if (self._enable) {
                self._timeout = setTimeout(() => { self._start(); }, self._delay * 1000);
            }
        });

        self._line = '';

        this._process.stdout.on('data', (buffer) => {
            if (!this._isConnected) {
                this._isConnected = true;
                self.emit('state', self.getState());
            }
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

    }

    _stop() {
        if (this._process) {
            this._process.kill();
        }
    }

    enable() {
        if (this._enable) return;
        this._enable = true;
        this.emit('state', this.getState());
        this._start();
    }

    disable() {
        if (!this._enable) return;
        this._enable = false;
        this._stop();
        if (this._timeout) {
            clearTimeout(this._timeout);
        }
        this.emit('state', this.getState());
    }

    getState() {
        if (!this._enable) return 'disabled';
        return this._isConnected ? 'online' : 'offline';
    }
}

var client;
var enmon;

function enable(value) {

    if (value) {
        if (enmon) {
            enmon.enable();

        } else {
            enmon = new Enmon();

            client = mqtt.connect("mqtt://" + settings.get('mqtt.ip'));

            enmon.on('line', (line) => {
                console.log('Enmon line:', line);
                if (line.startsWith('@SENSOR: "')) {
                    line = line.substring(10);
                    const i = line.indexOf('",');
                    const name = line.substring(0, i).toLowerCase();
                    const value = line.substring(i + 2);
                    client.publish(`bridge/${name}`, value);
                }
            });

            enmon.on('state', (state) => {
                console.log('Enmon state', state);
                notifyAll('bridge/status', { status: state });
            });

            enmon.enable();
        }
    } else {
        if (enmon) {
            enmon.disable()
        }
    }
}

module.exports.setup = () => {

    settings.on('enmon-enable', (value) => {
        console.log('enmon-enable', value);
        enable(value);
    });

    settings.on('enmon-delay', (value) => {
        console.log('enmon-delay', value);
    });

    enable(settings.get('enmon-enable'));

    ipcMain.on("bridge/status/get", (event, data) => {
        event.sender.send("bridge/status", { status: !enmon ? 'disabled' : enmon.getState() } );
    });
};
