"use strict";

const { app } = require("electron");
const path = require("path");
const os = require("os");
const fs = require("fs");

// Folders name definition
const rootName = "." + app.getName();

// Path definition
let homeDirPath;

function setup() {
    homeDirPath = path.join(os.homedir(), rootName);
    if (!fs.existsSync(homeDirPath)) {
        fs.mkdirSync(homeDirPath);

        fs.readdirSync(path.join(__dirname, "..", "assets", "i18n")).forEach((file) => {
            console.log("to:" + path.join(homeDirPath, file));
            fs.writeFileSync(path.join(homeDirPath, file), fs.readFileSync(path.join(__dirname, "..", "assets", "i18n", file), "utf8"));
        })
    }
    app.setPath("userData", homeDirPath);
}

module.exports = {
    setup
}
