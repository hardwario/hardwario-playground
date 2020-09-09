const { ipcMain } = require("electron");
const ConfigStore = require("../utils/ConfigStore");

var settings = new ConfigStore("settings.json", {
    "language": "en",
    "mqtt.ip": "127.0.0.1",
    "mqtt-broker-bind": "127.0.0.1",
    "node-red-bind": "127.0.0.1",
    "enmon-enable": false,
    "enmon-delay": 5,
});

function setup() {
    ipcMain.on("settings/get", (event, key) => {
        console.log("settings/get", key, settings.get(key));
        event.sender.send("settings/value/" + key , settings.get(key) );
    });

    ipcMain.on("settings/getAll", (event, dummy) => {
        event.sender.send("settings/all" , settings.getAll() );
    });

    ipcMain.on("settings/set", (event, data) => {
        console.log("settings/set", data);
        settings.set(data.key, data.value);
    });

    ipcMain.on('settings/get-sync', (event, key) => {
        console.log("settings/get-sync", key, settings.get(key));
        event.returnValue = settings.get(key)
    });
}

module.exports = {
    setup,
    settings,
}
