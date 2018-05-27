"use strict";

const path = require("path");
const os = require("os");
const fs = require("fs");

// Folders name definition
const rootName = ".BigClown-application";
const metaData = "metadata";
const fileFolder = "saved";
const nodeRed = "node-red";

// Path definition
let homeDirPath;
let metaDataPath;
let fileFolderPath;
let nodeRedPath;

function setup() {
    homeDirPath = path.join(os.homedir(), rootName);
    metaDataPath = path.join(homeDirPath, metaData);
    fileFolderPath = path.join(homeDirPath, fileFolder);
    nodeRedPath = path.join(homeDirPath, nodeRed);

    if (!fs.existsSync(homeDirPath)) {
        fs.mkdirSync(homeDirPath);
        fs.mkdirSync(metaDataPath);
        fs.mkdirSync(fileFolderPath);
        fs.mkdirSync(nodeRedPath);
    }
}

module.exports = {
    setup,
    homeDirPath: () => homeDirPath,
    metaData: () => metaDataPath,
    fileFolder: () => fileFolderPath,
    nodeRed: () => nodeRedPath
}
