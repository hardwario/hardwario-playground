const { app, ipcMain } = require("electron");
const fs = require("fs");
const path = require("path");

ipcMain.on("settings:get", (event, data) => {
    var readData = fs.readFileSync(path.join(app.getPath("userData"), "settings.json"), { encoding: "utf8" }).toString();
    event.sender.send("settings:get", JSON.parse(readData));
});

ipcMain.on("settings:set", (event, data) => {
    fs.writeFileSync(path.join(app.getPath("userData"), "settings.json"), JSON.stringify(data));
});
