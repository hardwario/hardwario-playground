"use strict";
const { Gateway, port_list } = require("./../utils/Gateway");
const { ipcMain, BrowserWindow, app } = require("electron");
const path = require("path");
const notifyAll = require("../utils/notifyAll");

const DefaultMqttUrl = "mqtt://127.0.0.1:1883";

let gateway = null;
let error_msg = null;

function makeStatus() {
    return {
        status: gateway == null ? "offline" : gateway.isConnected() ? "online" : "offline",
        error: error_msg
    }
}

function setup() {
    const cacheDir = path.join(app.getPath("userData"), "gateway");

    ipcMain.on("gateway/connect", (event, device) => {
        console.log("on gateway:connect", device);

        if (gateway) {
            if (device == gateway.getDevice() && gateway.isConnected()) {
                return;
            }

            gateway.disconnect();
        }

        error_msg = null;

        gateway = new Gateway(device, DefaultMqttUrl, (status) => {
            notifyAll("gateway/status", makeStatus());
        }, (msg)=>{
            error_msg = msg;
        }, cacheDir);
    });

    ipcMain.on("gateway/disconnect", (event, data) => {
        if (gateway) {
            gateway.disconnect();
            gateway = null;
            notifyAll("gateway/status", "offline");
        }
    });

    ipcMain.on("gateway/status/get", (event, data) => {
        event.sender.send("gateway/status", makeStatus());
    });

    ipcMain.on("gateway/device/get", (event, data) => {
        event.sender.send("gateway/device", gateway == null ? "" : gateway.getDevice());
    });

    ipcMain.on("gateway/port-list/get", (event, data) => {
        port_list((ports)=>{
            event.sender.send("gateway/port-list", ports);
        });
    });

}

module.exports = { setup, Gateway }
