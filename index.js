"use strict";

// Import parts of electron to use
const { app, BrowserWindow, Menu, ipcMain } = require("electron");
const path = require("path")
const url = require("url")

// Import background workers
const NodeREDWorker = require("./src/background/NodeREDWorker");
const HomeDirectory = require("./src/background/HomeDirectory");
const MqttBroker = require("./src/background/MqttBroker");
const MqttClient = require("./src/background/MqttClient");
const CustomMenu = require("./src/utils/Menu");

// Keep a global reference of the window object, if you don"t, the window will
// be closed automatically when the JavaScript object is garbage collected.
let windows = [];

// Keep a reference for dev mode
let dev = false;
if (process.defaultApp || /[\\/]electron-prebuilt[\\/]/.test(process.execPath) || /[\\/]electron[\\/]/.test(process.execPath)) {
  dev = true;
}

console.log("Starting background procedures");
HomeDirectory.setup()
MqttBroker.setup();
NodeREDWorker.setup();

function createWindow() {
  let mainWindow;
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    show: false
    //,titleBarStyle: 'hidden' future purpose?
  });

  // Setup menu, you should change this
  CustomMenu.setup(!dev);

  // and load the index.html of the app.
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
    console.log(windows.length);
    windows.splice(index, 1);
    mainWindow = null;
  });

  windows.push(mainWindow);
}

app.on("ready", createWindow);

app.on("app:window:new", createWindow);

// Quit when all windows are closed.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (windows.length == 0) {
    createWindow();
  }
});
