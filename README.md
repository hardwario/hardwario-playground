<a href="https://www.bigclown.com/"><img src="https://bigclown.sirv.com/logo.png" width="200" alt="BigClown Logo" align="right"></a>

# BigClown Playground app

[![Travis](https://img.shields.io/travis/bigclownlabs/bch-playground/master.svg)](https://travis-ci.org/bigclownlabs/bch-playground)
[![Appveyor](https://ci.appveyor.com/api/projects/status/j90ijfjm7awnydkp/branch/master?svg=true)](https://ci.appveyor.com/project/blavka/bch-playground/branch/master)
[![Release](https://img.shields.io/github/release/bigclownlabs/bch-playground.svg)](https://github.com/bigclownlabs/bch-playground/releases)
[![License](https://img.shields.io/github/license/bigclownlabs/bch-playground.svg)](https://github.com/bigclownlabs/bch-playground/blob/master/LICENSE)
[![Twitter](https://img.shields.io/twitter/follow/BigClownLabs.svg?style=social&label=Follow)](https://twitter.com/BigClownLabs)


This repository contains Playground application.

## Contains
- NodeRED instance
- NodeRED Dashboard
- MQTT logger
- MQTT broker
- Bigclown Gateway for USB Dongle
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

    sudo npm install node-pre-gyp -g
    sudo npm install electron-packager -g
    sudo npm install -g electron --unsafe-perm=true --allow-root
    sudo npm install -g serialport --unsafe-perm=true --allow-root
    npm install

In case install of serialport fails, run this script (Ubuntu 16.04)
https://gist.github.com/katopz/8b766a5cb0ca96c816658e9407e83d00


Made with &#x2764;&nbsp; by [**HARDWARIO s.r.o.**](https://www.hardwario.com/) in the heart of Europe.
