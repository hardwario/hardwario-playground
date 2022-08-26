"use strict";

const { SerialPort } = require('serialport')
const sleep = require("./sleep");

class SerialPortFtdi {
    constructor(device, baudrate=115200) {
        this._serial = new SerialPort({
            path: device,
            autoOpen: false,
            baudRate: baudrate,
            parity: "even",
        });

        this._serial.on("open", function () {
            console.log('open');

            this.connected = true;
        }.bind(this));

        this._serial.on("close", function () {
            this.connected = false;
        }.bind(this));

        this._ser = this._serial.binding;

        this.open = this.open.bind(this);
        this.close = this.close.bind(this);
        this.clear_buffer = this.clear_buffer.bind(this);
        this.reset_sequence = this.reset_sequence.bind(this);
        this.boot_sequence = this.boot_sequence.bind(this);
    }

    open() {
        return new Promise((resolve, reject) => {
            this._serial.open((error) => {
                if (error) return reject(error);

                this._ser = this._serial.port;

                this.write = this._ser.write.bind(this._ser);
                this.read = this._ser.read.bind(this._ser);
                this.flush = this._ser.flush.bind(this._ser);

                this.clear_buffer()
                    .then(resolve)
                    .catch(reject);
            });
        });
    }

    close() {
        return new Promise((resolve, reject) => {
            this._serial.close((error) => {
                if (error) {
                    reject(error);
                } else {
                    resolve();
                }
            });
        });
    }

    clear_buffer() {
        return new Promise((resolve) => {
            this._ser.flush()
                .then(() => { return this._ser.drain() })
                .then(() => { return resolve(true); });
        });
    }

    async reset_sequence() {
        await this._ser.set({ rts: true, dtr: false });
        await sleep.msleep(100);
        await this._ser.set({ rts: true, dtr: true });
        return true;
    }

    async boot_sequence() {
        await this._ser.set({ rts: false, dtr: false });
        await sleep.msleep(100);
        await this._ser.set({ rts: true, dtr: false });
        await sleep.msleep(100);
        await this._ser.set({ rts: true, dtr: true });
        await this._ser.set({ rts: false, dtr: true });
        await sleep.msleep(100);
        await this._ser.set({ rts: true, dtr: true });
        return true;
    }
}

function port_list(callback) {
    SerialPort.list()
        .then((ports) => {
            callback(ports.filter((port) => {
                return port.manufacturer == "0403" || port.vendorId == "0403";
            }));

        })
        .catch(() => {
            callback([]);
        });
}

module.exports = { SerialPortFtdi, port_list }
