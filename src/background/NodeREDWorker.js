"use strict";
const http = require("http");
const express = require("express");
const RED = require("node-red");
const fs = require("fs");
const path = require("path");
const { app } = require("electron");
const isPortReachable = require('is-port-reachable');

const listenPort = 1880;
const flowFile = "flows.json";
const flowFileStarting = "starting-flows.json";
let userDir;

async function setup() {
    const reachable = await isPortReachable(listenPort);
    if (!reachable) {
        userDir = app.getPath("userData");

        
        if (!fs.existsSync(path.join(userDir, flowFile))) {
            fs.writeFileSync(path.join(userDir, flowFile), fs.readFileSync(path.join(__dirname, "..", "assets", "nodered", flowFileStarting)));
        }

        var settings = {
            uiPort: listenPort,
            verbose: true,
            httpAdminRoot: "/admin",
            httpNodeRoot: "/",
            userDir,
            flowFile,
            functionGlobalContext: {} // enables global context
        };

        let http_app = express();
        let server = http.createServer(http_app);
        RED.init(server, settings);
        http_app.use(settings.httpAdminRoot, RED.httpAdmin);
        http_app.use(settings.httpNodeRoot, RED.httpNode);

        RED.start().then(function () {
            server.listen(listenPort, "127.0.0.1");
        });
    }
}

module.exports = {
    setup
}