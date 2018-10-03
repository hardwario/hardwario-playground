"use strict";

// Import parts of electron to use
const { app, BrowserWindow, Menu, ipcMain, dialog } = require("electron");
const path = require("path");
const url = require("url");
const fs = require("fs");

require('electron-context-menu')({});

const CustomMenu = require("./src/utils/Menu");

// Import background workers
const NodeREDWorker = require("./src/background/NodeREDWorker");
const MqttBroker = require("./src/background/MqttBroker");
const Settings = require("./src/background/Settings");
const Firmware = require("./src/background/Firmware");
const Gateway = require("./src/background/Gateway");

let windows = [];

// Keep a reference for dev mode
let dev = false;
if (process.defaultApp || /[\\/]electron-prebuilt[\\/]/.test(process.execPath) || /[\\/]electron[\\/]/.test(process.execPath)) {
  dev = true;
}

function createWindow() {
  if (!app.isReady()) return;
  
  let mainWindow;
  mainWindow = new BrowserWindow({
    width: 1000,
    minWidth: 1000,
    minHeight: 480,
    show: false
    //,titleBarStyle: 'hidden' future purpose?
  });

  CustomMenu.setup(!dev);

  // Load the index.html of the app.
  let indexPath;
  if (dev && process.argv.indexOf("--noDevServer") === -1) {
    indexPath = url.format({
      protocol: "http:",
      host: "localhost:8080",
      pathname: "index.html",
      slashes: true
    });
  } else {
    indexPath = url.format({
      protocol: "file:",
      pathname: path.join(__dirname, "dist", "index.html"),
      slashes: true
    });
  }
  mainWindow.loadURL(indexPath);
  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
    // Open the DevTools automatically if developing
    if (dev) {
      mainWindow.webContents.openDevTools();
    }
  });

  let timer = null;

  mainWindow.on('close', (e) => {
    if (timer) {
        clearTimeout(timer);
    }

    timer = setTimeout(()=>{

        dialog.showMessageBox(mainWindow, {
            type: "warning",
            buttons: ["Cancel", "Close without Saving"],
            title: "Warning",
            message: "Node-RED contains unsaved changes"
        }, (response)=>{
            if (response == 1) {
                mainWindow.send("iframe:node-red:visible", false);
                timer = setTimeout(()=>{mainWindow.close()}, 100);
            }
        });

    }, 1000);
  })

  mainWindow.on("closed", function () {
    if (timer) clearTimeout(timer);
    const index = windows.indexOf(mainWindow);
    windows.splice(index, 1);
    mainWindow = null;
  });

  windows.push(mainWindow);
}

let userDataPath = app.getPath("userData");

if (!fs.existsSync(userDataPath)) {
    fs.mkdirSync(userDataPath)
}

Settings.setup();
MqttBroker.setup();
Gateway.setup();
Firmware.setup();
NodeREDWorker.setup().finally(()=>{
    for (let i in windows) {
        windows[i].reload();
    }
})

// Quit when all windows are closed.
app.on("window-all-closed", () => {
    console.log("window-all-closed");
    if (process.platform != 'darwin'){
      console.log("app.quit");
    app.quit();
    }
});

app.on("app:window:new", createWindow);

app.on("ready", createWindow);

app.on("activate", () => {
  if (windows.length == 0) {
    createWindow();
  }
});
