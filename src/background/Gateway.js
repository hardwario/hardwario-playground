"use strict";
const { Gateway, port_list } = require("./../utils/Gateway");
const { ipcMain, BrowserWindow } = require("electron");

const DefaultDevice = "/dev/ttyUSB0";
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
            notifyAll("gateway/status", status == "connected");
            notifyAll("gateway:status", status == "connected");
        });
    });

    ipcMain.on("gateway/disconnect", (event, data) => {
        if (gateway) {
            gateway.disconnect();
            gateway = null;
        }
    });

    ipcMain.on("gateway:status", (event, data) => {
        notifyAll("gateway:status", gateway == null ? false : gateway.isConnected());
    });

    ipcMain.on("gateway/port-list/get", (event, data) => {
        port_list((ports)=>{
            event.sender.send("gateway/port-list", ports);
        });
    });

}



// Take reference for window to send async requests
/*
ipcMain.on("gateway:window:subscribe", (event, data) => {
  var window = findWindow(event.sender.id);
  if (window == null) {
    windowList.push(event.sender);
  }
  if (windowList.length == 1) {
    intervalCheck = setInterval(port_list, 250);
  }
})

// Take off reference for window to send async requests
ipcMain.on("gateway:window:unsubscribe", (event, data) => {
  var window = findWindow(event.sender.id);
  console.log("Odstranovani");
  if (window != null) {
    var index = windowList.indexOf(window);
    if (index > -1) {
      console.log("Odstranovani");
      windowList.splice(index, 1);
    }
  }
  if (windowList.length == 0) {
    clearInterval(intervalCheck);
  }
  console.log(windowList.length);
})
*/
module.exports = { setup, Gateway }
