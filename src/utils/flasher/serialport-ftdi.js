"use strict";

const SerialPort = require("serialport");
const sleep = require("sleep");

class SerialPortFtdi {
  constructor(device) {
    this._serial = new SerialPort(device, {
      autoOpen: false,
      baudRate: 921600,
      parity: "even",
    });

    this._serial.on("open", function() {
      console.log('open');

      this.connected = true;
    }.bind(this));

    this._serial.on("close", function() {
      this.connected = false;
    }.bind(this));

    this._ser = this._serial.binding;

    this.open = this.open.bind(this);
    this.close = this.close.bind(this);
    this.clear_buffer = this.clear_buffer.bind(this);
    this.reset_sequence = this.reset_sequence.bind(this);
    this.boot_sequence = this.boot_sequence.bind(this);

    this.write = this._ser.write.bind(this._ser);
    this.read = this._ser.read.bind(this._ser);
    this.flush = this._ser.flush.bind(this._ser);
  }

  open() {
    return new Promise((resolve, reject) => {
      this._serial.open((error) => {
        if (error) return reject(error);

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

  reset_sequence() {
    return new Promise((resolve, reject) => {
      this._ser.set({ rts: true, dtr: false }).then(() => {
        sleep.msleep(100);
        this._ser.set({ rts: true, dtr: true }).then(resolve).catch(reject);
      });
    })
  }

  boot_sequence() {
    return new Promise((resolve, reject) => {
      this._ser.set({ rts: false, dtr: false })
        .then(() => {
          sleep.msleep(100);
          return this._ser.set({ rts: true, dtr: false })
        })
        .then(() => {
          sleep.msleep(100);
          return this._ser.set({  rts: true, dtr: true })
        })
        .then(()=>{
          return this._ser.set({  rts: false, dtr: true })
        })
        .then(()=>{
          sleep.msleep(100);
          return this._ser.set({  rts: true, dtr: true })
        })
       .then(resolve)
       .catch(reject);
    });
  }
}

function port_list(callback) {
    SerialPort.list()
        .then((ports) => {
            callback( ports.filter((port) => {
                return port.manufacturer == "0403" || port.vendorId == "0403";
            }));

        })
        .catch(()=>{
            callback([]);
        });
}

module.exports = { SerialPortFtdi, port_list }
