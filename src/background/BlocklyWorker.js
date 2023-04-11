const blockly = require("hardwario-blockly-dev");
const shell = require('shelljs');

function setup() {
    shell.config.execPath = shell.which('node').toString()
    blockly.init();
}

module.exports = {
    setup
}
