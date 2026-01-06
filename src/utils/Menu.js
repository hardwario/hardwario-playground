const { app, Menu, BrowserWindow, ipcMain } = require("electron");

// Minimal menu for macOS (required for app to work properly)
const menuItems = process.platform === 'darwin' ? [
    {
        label: app.getName(),
        submenu: [
            { role: 'about' },
            { type: 'separator' },
            { role: 'quit' }
        ]
    }
] : [];

function setup(productionMenu = false) {
    if (menuItems.length > 0) {
        const menu = Menu.buildFromTemplate(menuItems);
        Menu.setApplicationMenu(menu);
    } else {
        // Hide menu bar on Windows/Linux
        Menu.setApplicationMenu(null);
    }

    // IPC handlers for zoom controls
    ipcMain.on('zoom:in', () => {
        const win = BrowserWindow.getFocusedWindow();
        if (win) {
            const currentZoom = win.webContents.getZoomFactor();
            win.webContents.setZoomFactor(Math.min(currentZoom + 0.1, 2.0));
        }
    });

    ipcMain.on('zoom:out', () => {
        const win = BrowserWindow.getFocusedWindow();
        if (win) {
            const currentZoom = win.webContents.getZoomFactor();
            win.webContents.setZoomFactor(Math.max(currentZoom - 0.1, 0.5));
        }
    });

    ipcMain.on('zoom:reset', () => {
        const win = BrowserWindow.getFocusedWindow();
        if (win) {
            win.webContents.setZoomFactor(1.0);
        }
    });

    ipcMain.handle('zoom:get', () => {
        const win = BrowserWindow.getFocusedWindow();
        if (win) {
            return Math.round(win.webContents.getZoomFactor() * 100);
        }
        return 100;
    });
}

module.exports = { setup };
