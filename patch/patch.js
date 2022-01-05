const fs = require("fs");
const fse = require('fs-extra');
const path = require('path');

const srcDir = path.join(__dirname, 'node_modules');
const destDir = path.join(process.cwd(), 'node_modules')

// Copy files
console.log('srcDir', srcDir);
console.log('destDir', destDir);
fse.copySync(srcDir, destDir, { overwrite: true });
console.log("Copy success!");

// Patch file BufferList.js
const fileName = path.join(process.cwd(), '/node_modules/mqtt/node_modules/bl/BufferList.js');
console.log('fileName', fileName);
let text = fs.readFileSync(fileName, { encoding: 'utf-8' });
fs.writeFileSync(fileName, text.replace(/function copy \(/, 'function \('), { encoding: 'utf-8' });
