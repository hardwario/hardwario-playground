const { app, Menu, BrowserWindow } = require("electron");
const path = require("path")
const url = require("url")

const menuItems = [
    {
        role: 'window',
        submenu: [
            {
                label: "Open new window",
                click() {
                    app.emit("app:window:new");
                }
            },
            { role: 'minimize' },
            { role: 'close' }
        ]
    },
    {
        label: 'Edit',
        submenu: [
            { role: 'undo' },
            { role: 'redo' },
            { type: 'separator' },
            { role: 'cut'},
            { role: 'copy' },
            { role: 'paste' },
            { role: 'pasteandmatchstyle' },
            { role: 'delete' },
            { role: 'selectall' }
        ]
    },
    {
        label: 'View',
        submenu: [
            {
                label: "Open new window",
                click() {
                    app.emit("app:window:new");
                }
            },
            { role: 'reload' },
            { role: 'forcereload' },
            { role: 'toggledevtools' },
            { type: 'separator' },
            { role: 'resetzoom' },
            { role: 'zoomin' },
            { role: 'zoomout' },
            { type: 'separator' },
            { role: 'togglefullscreen' }
        ]
    }
    // {
    //     role: 'help',
    //     submenu: [
    //         {
    //             label: 'Learn More',
    //             click() { require('electron').shell.openExternal('https://electronjs.org') }
    //         }
    //     ]
    // }
]

if (process.platform === 'darwin') {
    menuItems.unshift({
        label: app.getName(),
        submenu: [
            { role: 'about' },
            { type: 'separator' },
            { role: 'quit' }
        ]
    })
}


function setup(productionMenu = false) {
    const menu = Menu.buildFromTemplate(menuItems);
    Menu.setApplicationMenu(menu);
}

module.exports = { setup };
