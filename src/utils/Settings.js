const { app } = require("electron");
const fs = require("fs");
const path = require("path");
var deepUpdate = require("./Deep-update");

const getSettings = () => {
    var defaultData = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "assets", "settings", "settings.json"), { encoding: "utf8" }).toString());
    var readData = JSON.parse(fs.readFileSync(path.join(app.getPath("userData"), "settings.json"), { encoding: "utf8" }).toString());

    return deepUpdate(defaultData, readData);
};

const setSettings = (data) => {
    fs.writeFileSync(path.join(app.getPath("userData"), "settings.json"), JSON.stringify(data));
};

module.exports = { setSettings, getSettings };
