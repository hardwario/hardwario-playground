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

// Patch file BufferList.js (only if it exists - older mqtt versions)
const fileName = path.join(process.cwd(), '/node_modules/mqtt/node_modules/bl/BufferList.js');
if (fs.existsSync(fileName)) {
    console.log('Patching BufferList.js:', fileName);
    let text = fs.readFileSync(fileName, { encoding: 'utf-8' });
    fs.writeFileSync(fileName, text.replace(/function copy \(/, 'function \('), { encoding: 'utf-8' });
    console.log("BufferList.js patched!");
} else {
    console.log('BufferList.js not found - skipping patch (not needed for mqtt 5.x)');
}
