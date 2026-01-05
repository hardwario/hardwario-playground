import { app, BrowserWindow, Menu, ipcMain, dialog, shell } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import fs from 'fs';
import contextMenu from 'electron-context-menu';

// ESM __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create require for CommonJS modules
const require = createRequire(import.meta.url);

// Import background workers (these will be converted to TypeScript later)
// For now, we use require for CommonJS modules
const NodeREDWorker = require('../src/background/NodeREDWorker');
const BlocklyWorker = require('../src/background/BlocklyWorker');
const MqttBroker = require('../src/background/MqttBroker');
const Settings = require('../src/background/Settings');
const Firmware = require('../src/background/Firmware');
const Gateway = require('../src/background/Gateway');
const Home = require('../src/background/Home');
const CustomMenu = require('../src/utils/Menu');

// Enable context menu
contextMenu({});

// Keep references
const windows: BrowserWindow[] = [];

// Detect development mode
const isDev = process.env.NODE_ENV === 'development' ||
  process.defaultApp ||
  /[\\/]electron-prebuilt[\\/]/.test(process.execPath) ||
  /[\\/]electron[\\/]/.test(process.execPath);

// Vite dev server URL
const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';

function createWindow(): void {
  if (!app.isReady()) return;

  const mainWindow = new BrowserWindow({
    width: 1000,
    minWidth: 1000,
    minHeight: 480,
    show: false,
    icon: path.join(__dirname, '..', 'src', 'assets', 'icons', 'icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false, // Required for some native modules
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  CustomMenu.setup(!isDev);

  // Load the app
  if (isDev && VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
  });

  let closeTimer: ReturnType<typeof setTimeout> | null = null;

  mainWindow.on('close', (e) => {
    if (closeTimer) {
      clearTimeout(closeTimer);
    }

    e.preventDefault();

    closeTimer = setTimeout(() => {
      dialog
        .showMessageBox(mainWindow, {
          type: 'warning',
          buttons: ['Cancel', 'Close without Saving'],
          title: 'Warning',
          message: 'Node-RED contains unsaved changes',
        })
        .then((result) => {
          if (result.response === 1) {
            mainWindow.webContents.send('iframe:node-red:visible', false);
            closeTimer = setTimeout(() => {
              mainWindow.destroy();
            }, 100);
          }
        })
        .catch((err) => {
          console.error('showMessageBox error:', err);
        });
    }, 1000);
  });

  mainWindow.on('closed', () => {
    if (closeTimer) clearTimeout(closeTimer);
    const index = windows.indexOf(mainWindow);
    if (index > -1) {
      windows.splice(index, 1);
    }
  });

  windows.push(mainWindow);
}

// Ensure userData directory exists
const userDataPath = app.getPath('userData');
if (!fs.existsSync(userDataPath)) {
  fs.mkdirSync(userDataPath, { recursive: true });
}

// Setup background workers
Settings.setup();
MqttBroker.setup();
Gateway.setup();
Firmware.setup();
NodeREDWorker.setup().finally(() => {
  for (const win of windows) {
    win.reload();
  }
});
Home.setup();
BlocklyWorker.setup();

// IPC handlers for app info
ipcMain.handle('app/getVersion', () => app.getVersion());
ipcMain.handle('app/getPath', (_event, name: string) => app.getPath(name as any));

// Handle shell:openExternal securely
ipcMain.on('shell:openExternal', (_event, url: string) => {
  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      shell.openExternal(url);
    }
  } catch {
    console.error('Invalid URL for openExternal:', url);
  }
});

// App lifecycle
app.on('window-all-closed', () => {
  console.log('window-all-closed');
  if (process.platform !== 'darwin') {
    console.log('app.quit');
    app.quit();
  }
});

app.on('ready', createWindow);

app.on('activate', () => {
  if (windows.length === 0) {
    createWindow();
  }
});

// Custom event for creating new windows
app.on('app:window:new' as any, createWindow);

export { windows };
