const { ipcMain } = require("electron");
const { getSettings, setSettings } = require("../utils/Settings");

ipcMain.on("settings:get", (event, data) => {
    event.sender.send("settings:get", getSettings());
});

ipcMain.on("settings:set", (event, data) => {
    console.log("data", data);
    setSettings(data);
});
