"use strict";
const { ipcMain, BrowserWindow } = require("electron");
const { hub_list } = require("./../utils/hub");

function setup() {

    ipcMain.on("hub/list/get", async (event) => {
        console.log("hub/list/get")
        hub_list((list)=>{
            console.log('hub_list', list);
            event.sender.send("hub/list", list);
        });
    });
}

module.exports = { setup };
