"use strict";
const { Gateway, port_list } = require("./../utils/Gateway");
const { ipcMain, BrowserWindow } = require("electron");

const DefaultMqttUrl = "mqtt://127.0.0.1:1883";

let gateway = null;

function notifyAll(topic, data) {
    let newList = [];
    BrowserWindow.getAllWindows().forEach((view) => {
      try {
        view.webContents.send(topic, data);
      }
      catch (error) {
        // Window no longer exists
      }
    });
}

function setup() {
    ipcMain.on("gateway/connect", (event, device) => {
        console.log("on gateway:connect", device);

        if (gateway) {

            if (device == gateway.getDevice() && gateway.isConnected()) {
                return;
            }

            gateway.disconnect();
        }

        gateway = new Gateway(device, DefaultMqttUrl, (status) => {
            notifyAll("gateway/status", status == "connected" ? "online" : "offline");
        });
    });

    ipcMain.on("gateway/disconnect", (event, data) => {
        if (gateway) {
            gateway.disconnect();
            gateway = null;
        }
    });

    ipcMain.on("gateway/status/get", (event, data) => {
        notifyAll("gateway/status", gateway == null ? "offline" : gateway.isConnected() ? "online" : "offline");
    });

    ipcMain.on("gateway/port-list/get", (event, data) => {
        port_list((ports)=>{
            event.sender.send("gateway/port-list", ports);
        });
    });

}

module.exports = { setup, Gateway }
