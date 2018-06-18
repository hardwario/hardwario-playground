"use strict";

const { app } = require("electron");
const path = require("path");
const os = require("os");
const fs = require("fs");

// Folders name definition
const rootName = "." + app.getName();

// Path definition
let homeDirPath;

// Let HomeDirectory worker now whenever app is in development mode to override userData TODO
function setup(dev) {
    homeDirPath = path.join(os.homedir(), rootName);
    if (!fs.existsSync(homeDirPath)) {
        fs.mkdirSync(homeDirPath);
        
        // Copy settings to userData
        fs.writeFileSync(path.join(homeDirPath, "settings.json"), fs.readFileSync(path.join(__dirname, "..", "assets", "settings", "settings.json"), "utf8"));
    }

    // Copy language packs to userData
    fs.readdirSync(path.join(__dirname, "..", "assets", "i18n")).forEach((file) => {
        fs.writeFileSync(path.join(homeDirPath, file), fs.readFileSync(path.join(__dirname, "..", "assets", "i18n", file), "utf8"));
    })

    app.setPath("userData", homeDirPath);
}

module.exports = { setup };
