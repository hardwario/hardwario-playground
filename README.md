<a href="https://www.hardwario.com/"><img src="https://www.hardwario.com/ci/assets/hw-logo.svg" width="200" alt="HARDWARIO Logo" align="right"></a>

# HARDWARIO Playground

![Build status](https://github.com/hardwario/bch-playground/actions/workflows/main.yml/badge.svg)
[![Release](https://img.shields.io/github/release/hardwario/bch-playground.svg)](https://github.com/hardwario/bch-playground/releases)
[![License](https://img.shields.io/github/license/hardwario/bch-playground.svg)](https://github.com/hardwario/bch-playground/blob/master/LICENSE)
[![Twitter](https://img.shields.io/twitter/follow/hardwario_en.svg?style=social&label=Follow)](https://twitter.com/hardwario_en)

Desktop application for IoT hardware prototyping with HARDWARIO TOWER hardware.

## Features

- **Node-RED** - Visual flow-based programming
- **Node-RED Dashboard** - Create UI dashboards
- **MQTT Broker** - Built-in Aedes MQTT broker (port 1883)
- **MQTT Logger** - Monitor MQTT messages in real-time
- **TOWER Gateway** - USB Dongle device management
- **HARDWARIO Blockly** - Visual block-based programming
- **Firmware Flasher** - Flash firmware to TOWER modules

## Requirements

- Node.js 18.x LTS
- npm 8+

## Development

### Setup

```bash
# Install dependencies
npm install

# Apply patches
npm run patch
```

### Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build production version |
| `npm run typecheck` | Run TypeScript type checking |
| `npm run package-win64` | Package for Windows 64-bit |
| `npm run package-linux64` | Package for Linux 64-bit |
| `npm run package-mac` | Package for macOS |

### Tech Stack

- **Electron 28** - Desktop application framework
- **React 18** - UI framework
- **TypeScript** - Type-safe JavaScript
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Node-RED 3.x** - Flow-based programming
- **Aedes** - MQTT broker
- **SerialPort 12** - Serial communication

## Architecture

```
src/
├── render/              # React frontend (renderer process)
│   ├── App.tsx          # Main app with routing
│   ├── components/      # React components
│   └── hooks/           # Custom React hooks
├── background/          # Main process workers
│   ├── NodeREDWorker.js # Embedded Node-RED server (port 1880)
│   ├── MqttBroker.js    # Aedes MQTT broker (port 1883)
│   ├── Firmware.js      # Firmware download/flash logic
│   └── Gateway.js       # Serial device connection
├── utils/               # Shared utilities
└── assets/              # Static resources, i18n
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

Made with &#x2764;&nbsp; by [**HARDWARIO s.r.o.**](https://www.hardwario.com/) in the heart of Europe.
