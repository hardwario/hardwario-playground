"use strict";

// Import parts of electron to use
const { app, BrowserWindow, Menu, ipcMain, dialog } = require("electron");
const path = require("path");
const url = require("url");
const { getSettings } = require("./src/utils/Settings");

// Import background workers
const NodeREDWorker = require("./src/background/NodeREDWorker");
const HomeDirectory = require("./src/background/HomeDirectory");
const MqttBroker = require("./src/background/MqttBroker");
const MqttClient = require("./src/background/MqttClient");
const CustomMenu = require("./src/utils/Menu");
const Settings = require("./src/background/Settings");
const Gateway = require("./src/background/Gateway");

let windows = [];

// Keep a reference for dev mode
let dev = false;
if (process.defaultApp || /[\\/]electron-prebuilt[\\/]/.test(process.execPath) || /[\\/]electron[\\/]/.test(process.execPath)) {
  dev = true;
}

HomeDirectory.setup(dev)
MqttBroker.setup();
NodeREDWorker.setup();

function createWindow() {
  let mainWindow;
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    minWidth: 720,
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

  mainWindow.on("closed", function () {
    const index = windows.indexOf(mainWindow);
    windows.splice(index, 1);
    mainWindow = null;
  });

  windows.push(mainWindow);
}

app.on("ready", createWindow);

app.on("app:window:new", createWindow);

// Quit when all windows are closed.
app.on("window-all-closed", () => {
  //if (process.platform !== "darwin") {
    app.quit();
  //}
});

app.on("activate", () => {
  if (windows.length == 0) {
    createWindow();
  }
});