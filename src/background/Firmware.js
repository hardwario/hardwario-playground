"use strict";

const SerialPort = require("serialport");
const { app, dialog , ipcMain} = require("electron");
const path = require("path");
const os = require("os");
const fs = require("fs");
const { flash, port_list } = require("./../utils/flasher/flasher-serial");

function setup() {

    let progress_payload = {};

    ipcMain.on("firmware:run-flash", (event, payload) => {
        console.log('firmware:run-flash', payload);

        progress_payload.erasse = 0;
        progress_payload.write = 0;
        progress_payload.verify = 0;

        if (!payload.port) {
            return event.sender.send("firmware:error", "Unknown port");
        }

        if (!payload.file) {
            return event.sender.send("firmware:error", "Unknown firmware");
        }

        flash(payload.port, payload.file, (type, progress, progress_max) =>{
            console.log(type, progress, progress_max);

            progress_payload[type] = (progress / progress_max) * 100 ;

            event.sender.send("firmware:progress", progress_payload);
        })
        .then(() => {
            event.sender.send("firmware:done");
        })
        .catch((e) => {
            console.log('catch', e.toString());

            event.sender.send("firmware:error", e.toString());
        });
    });

    ipcMain.on("firmware:get-port-list", (event, payload) => {
        port_list((ports)=>{
            event.sender.send("firmware:port-list", ports);
        });
    });
}

module.exports = { setup };
