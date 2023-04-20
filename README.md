<a href="https://www.hardwario.com/"><img src="https://www.hardwario.com/ci/assets/hw-logo.svg" width="200" alt="HARDWARIO Logo" align="right"></a>

# Hardwario Playground app
![Build status](https://github.com/hardwario/bch-playground/actions/workflows/main.yml/badge.svg)
[![Release](https://img.shields.io/github/release/hardwario/bch-playground.svg)](https://github.com/hardwario/bch-playground/releases)
[![License](https://img.shields.io/github/license/hardwario/bch-playground.svg)](https://github.com/hardwario/bch-playground/blob/master/LICENSE)
[![Twitter](https://img.shields.io/twitter/follow/hardwario_en.svg?style=social&label=Follow)](https://twitter.com/hardwario_en)


This repository contains Playground application.

## Contains
- NodeRED instance
- NodeRED Dashboard
- MQTT logger
- MQTT broker
- TOWER Gateway for USB Dongle
- HARDWARIO Blockly
- Firmware flasher

## Contributing

Feel free to contribute to this application.


## Development

### Commands

|       Meaning      |      Command      |
| ------------------ | :---------------: |
| Development server |   `npm run dev`   |
| Production server  |   `npm run prod`  |
| Package app        | `npm run package` |

---


## Install (not fully tested)

Node.js v8.x:

    curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -
    sudo apt-get install -y nodejs


    sudo npm install npm -g


    sudo apt install node-gyp




    sudo npm install node-pre-gyp -g
    sudo npm install electron-packager -g
    sudo npm install -g electron --unsafe-perm=true --allow-root
    sudo npm install -g serialport --unsafe-perm=true --allow-root
    npm install

In case install of serialport fails, run this script (Ubuntu 16.04)
https://gist.github.com/katopz/8b766a5cb0ca96c816658e9407e83d00


Made with &#x2764;&nbsp; by [**HARDWARIO a.s.**](https://www.hardwario.com/) in the heart of Europe.
