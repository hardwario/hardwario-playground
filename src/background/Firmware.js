"use strict";
const SerialPort = require("serialport");
const { app, dialog , ipcMain} = require("electron");
const path = require("path");
const os = require("os");
const fs = require("fs");
const request = require('request');
const rprogress = require('request-progress');
const notifyAll = require("../utils/notifyAll");

const { flash, port_list } = require("./../utils/flasher/flasher-serial");
const FIRMWARE_JSON_URL = "https://firmware.bigclown.com/json";

var firmware_list = [];

function getFirmwarePath() {
    let cachepath = path.join(app.getPath("userData"), "firmware");

    if (!fs.existsSync(cachepath)) {
        fs.mkdirSync(cachepath)
    }

    return cachepath;
}

function getFirmwareJsonPath() {
    return path.join(getFirmwarePath(), "firmware.json");
}

function updateFirmwareJson() {
    return new Promise((resolve, reject) => {

        let filepath = getFirmwareJsonPath() + ".download";

        let file = fs.createWriteStream(filepath);

        request(FIRMWARE_JSON_URL, null, ()=>{})
        .on('error', function (err) {
            reject(err);
        })
        .pipe(file);

        file.on('finish', ()=>{
            file.close(()=>{
                let list = loadFirmwareJson(filepath);
                if (list != null) {
                    fs.renameSync(filepath, getFirmwareJsonPath());
                    firmware_list = list;
                    resolve();
                }
            });
        });
    });
}

function loadFirmwareJson(jsonpath) {
    if (!fs.existsSync(jsonpath)) return null

    let payload = JSON.parse(fs.readFileSync(jsonpath, { encoding: "utf8" })) || [];

    return payload['list'];

    // return list.sort((a,b)=>{
    //     let wa = a.name.indexOf("wireless") > -1;
    //     let wb = b.name.indexOf("wireless") > -1;

    //     if (wa && !wb) {
    //         return -1;
    //     } else if (!wa && wb) {
    //         return 1;
    //     }

    //     return a.name.localeCompare(b.name)
    // });
}

function getFirmware(name) {
    for (let i in firmware_list) {
        if (firmware_list[i].name == name) {
            return firmware_list[i];
        }
    }
}

function downloadFirmware(url, reporthook, name=null) {
    return new Promise((resolve, reject) => {
        console.log('downloadFirmware', url);

        if (!name) {
            name = url.replace(/[^\d\w-_\.]/g, '_');
        }

        let firmware_bin = path.join(getFirmwarePath(), name);

        if (!fs.existsSync(firmware_bin)) {

            let file = fs.createWriteStream(firmware_bin + ".download");

            reporthook({percent: 1});

            rprogress(request(url), null, ()=>{})
                .on('progress', reporthook)
                .on('error', function (err) {
                    reject(err);
                })
                .on('end', function () {
                    reporthook({percent: 100});
                })
                .pipe(file);

                file.on('finish', ()=>{
                    file.close(()=>{
                        fs.renameSync(firmware_bin + ".download", firmware_bin);
                        resolve(firmware_bin);
                    });
                });

        } else {
            resolve(firmware_bin);
        }
    });
}

var progress_payload = {};
var flash_lock = false;

function setup() {

    updateFirmwareJson()
        .then(()=>{
            notifyAll("firmware:list", firmware_list);
        })
        .catch((err)=>{
            console.error(err);
            firmware_list = loadFirmwareJson(getFirmwareJsonPath()) || [];
        });


    ipcMain.on("firmware:run-flash", async (event, payload) => {
        console.log('firmware:run-flash', payload);

        if (flash_lock){
            event.sender.send("firmware:error", "In progress in another window");
            return;
        }

        flash_lock = true;

        progress_payload.erase = 0;
        progress_payload.write = 0;
        progress_payload.verify = 0;

        function sendErrorAndUnlock(msg) {
            flash_lock = false;
            event.sender.send("firmware:error", msg);
        }

        if (!payload.port) {
            return sendErrorAndUnlock("Unknown port");
        }

        if (!payload.firmware) {
            return sendErrorAndUnlock("Unknown firmware");
        }

        let firmware_bin;

        if (fs.existsSync(payload.firmware)){
            firmware_bin = payload.firmware;

        } else if (payload.firmware.startsWith("https://")) {

            try {
                firmware_bin = await downloadFirmware(payload.firmware, (state) => {
                    event.sender.send("firmware:download", state);
                });

            } catch (error) {
                return sendErrorAndUnlock("Download problem " + error.toString());
            }

        } else {
            let firmware = getFirmware(payload.firmware);

            if (!firmware) {
                return sendErrorAndUnlock("Unknown firmware");
            }

            let version;

            if (payload.version == "latest") {
                version = firmware.versions[0];
            } else {
                for (let i in firmware.versions) {
                    if (payload.version == firmware.versions[i].name) {
                        version = firmware.versions[i]
                    }
                }
            }

            if (!version) {
                return sendErrorAndUnlock("Unknown firmware version");
            }

            try {

                let name = firmware.name + "-" + version.name + ".bin"
                name = name.replace(/\//g, '___');

                firmware_bin = await downloadFirmware(version.url, (state) => {
                    event.sender.send("firmware:download", state);
                }, name);

            } catch (error) {
                return sendErrorAndUnlock("Download problem " + error.toString());
            }
        }

        if (!firmware_bin) {
            return sendErrorAndUnlock("Unknown firmware bin");
        }
        console.log(firmware_bin);

        flash(payload.port, firmware_bin, (type, progress, progress_max) =>{
                // console.log(type, progress, progress_max);

                let percent = Math.round((progress / progress_max) * 100);

                if (progress_payload[type] != percent) {
                    progress_payload[type] = percent;
                    event.sender.send("firmware:progress", progress_payload);
                }
        })
        .then(() => {
            event.sender.send("firmware:done");
            flash_lock = false;
        })
        .catch((e) => {
            let msg = e.toString();

            console.log('catch', JSON.stringify(msg));

            if (msg == "Error: Error Resource temporarily unavailable Cannot lock port") {
                return sendErrorAndUnlock("If you flash the gateway, please disconnect it first from the Devices tab.");
            } else if (msg ==  "Error: bad file descriptor") {
                return sendErrorAndUnlock("Device has been probably disconnect.")
            }

            return sendErrorAndUnlock("Please try to press FLASH FIRMWARE again.");
        });

    });

    ipcMain.on("firmware:get-port-list", (event, payload) => {
        port_list((ports)=>{
            event.sender.send("firmware:port-list", ports);
        });
    });

    ipcMain.on("firmware:get-list", (event, payload) => {
        event.sender.send("firmware:list", firmware_list || []);
    });
}

module.exports = { setup };
