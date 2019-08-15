"use strict";
const http = require("http");
const express = require("express");
const RED = require("node-red");
const fs = require("fs");
const path = require("path");
const { app, ipcMain } = require("electron");
const isPortReachable = require('is-port-reachable');

const listenPort = 1880;
const flowFile = "flows.json";
const flowFileStarting = "starting-flows.json";
let userDir;

function copyFileSync( source, target ) {
    var targetFile = target;

    if ( fs.existsSync( target ) ) {
        if ( fs.lstatSync( target ).isDirectory() ) {
            targetFile = path.join( target, path.basename( source ) );
        }
    }

    if (fs.existsSync(targetFile)) {
        return;
    }

    fs.writeFileSync(targetFile, fs.readFileSync(source));
}

function copyFolderRecursiveSync( source, target ) {
    var files = [];

    var targetFolder = path.join( target, path.basename( source ) );
    if ( !fs.existsSync( targetFolder ) ) {
        fs.mkdirSync( targetFolder );
    }

    if ( fs.lstatSync( source ).isDirectory() ) {
        files = fs.readdirSync( source );
        files.forEach( function ( file ) {
            var curSource = path.join( source, file );
            if ( fs.lstatSync( curSource ).isDirectory() ) {
                copyFolderRecursiveSync( curSource, targetFolder );
            } else {
                copyFileSync( curSource, targetFolder );
            }
        } );
    }
}

function setup() {
    let status = "offline";

    ipcMain.on("nodered/status/get", (event, data) => {
        event.sender.send("nodered/status", status);
    });

    return new Promise(async (resolve, reject) => {

        const reachable = await isPortReachable(listenPort);

        if (!reachable) {
            const userDir =  path.join(app.getPath("userData"), "node-red");
            const sourceDir = path.join(__dirname, "..", "assets", "node-red");

            copyFolderRecursiveSync(sourceDir, app.getPath("userData") );

            var settings = {
                uiPort: listenPort,
                verbose: true,
                httpAdminRoot: "/",
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
                server.listen(listenPort, "127.0.0.1", ()=>{
                    status = "online";

                    resolve();
                });
            });
        } else {
            status = "external";

            reject();
        }
    });
}

module.exports = {
    setup
}
