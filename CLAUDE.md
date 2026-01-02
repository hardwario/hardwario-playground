# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

HARDWARIO Playground is an Electron desktop application for IoT hardware prototyping. It integrates Node-RED visual programming, MQTT broker, firmware flashing, and device management for HARDWARIO TOWER hardware.

## Development Commands

| Command | Description |
|---------|-------------|
| `npm install` | Install dependencies (runs electron-builder install-app-deps) |
| `npm run dev` | Start development server with hot reload (port 8080) |
| `npm run prod` | Build and run production version |
| `npm run webpack` | Build webpack bundle only |
| `npm run package-win64` | Package for Windows 64-bit |
| `npm run package-linux64` | Package for Linux 64-bit |
| `npm run package-mac` | Package for macOS |

## Architecture

### Electron Process Model

**Main Process (`index.js`):**
- Creates BrowserWindow, manages IPC communication
- Initializes background workers in sequence: Settings → MqttBroker → Gateway → Firmware → NodeREDWorker → Home → BlocklyWorker

**Renderer Process (`src/render/`):**
- React 16 application with React Router (HashRouter)
- Components in `src/render/components/`
- EventEmitter-based models in `src/render/model/`

### Key Directories

```
src/
├── render/              # React frontend (renderer process)
│   ├── App.js           # Main app with routing
│   ├── components/      # React components (Devices, Firmware, MqttLog, etc.)
│   └── model/           # EventEmitter-based data models
├── background/          # Main process workers
│   ├── NodeREDWorker.js # Embedded Node-RED server (port 1880)
│   ├── MqttBroker.js    # Aedes MQTT broker (port 1883)
│   ├── Firmware.js      # Firmware download/flash logic
│   └── Gateway.js       # Serial device connection
├── utils/               # Shared utilities
│   ├── Gateway.js       # Low-level gateway class (serial + MQTT)
│   ├── Settings.js      # Settings file management
│   └── flasher/         # STM32 bootloader protocol
└── assets/              # Static resources, defaults, i18n
```

### IPC Communication

Main IPC channels:
- `settings/get`, `settings/set`, `settings/getAll` - Settings management
- `gateway/connect`, `gateway/disconnect`, `gateway/status` - Device connection
- `firmware:progress`, `firmware:done`, `firmware:error` - Flash operations
- `nodered/status`, `broker/status` - Service status updates

Use `notifyAll()` utility to broadcast to all windows.

### Routes

- `/` - Devices (gateway device list)
- `/messages` - MQTT Log
- `/functions` - Node-RED editor (iframe to port 1880)
- `/dashboard` - Node-RED dashboard (iframe to port 1880/ui)
- `/blockly` - Blockly IDE
- `/firmware/:fw?` - Firmware flasher

### Integrated Services

- **Node-RED**: Embedded server on port 1880, flows stored in userData/node-red/
- **MQTT Broker**: Aedes on port 1883 (checks for external broker first)
- **Gateway**: SerialPort at 115200 baud, JSON over MQTT protocol

## Tech Stack

- Electron 20.1.0 with nodeIntegration enabled (legacy)
- React 16.13.1 with Reactstrap (Bootstrap 4)
- Webpack 4 with Babel 6 (ES2015, React, Stage-2)
- Node-RED 3.0.2, Aedes MQTT 0.47.0, SerialPort 10.4.0

## Adding New Features

**New page/route:**
1. Create component in `src/render/components/`
2. Add route in `src/render/App.js`
3. Create IPC handlers in `src/background/` if needed

**New setting:**
1. Add default to `src/assets/settings/settings.json`
2. Access via `ipcRenderer.sendSync('settings/get-sync', key)` or async variant

## Build Output

- `dist/` - Webpack bundle output
- `release/` - Packaged applications
