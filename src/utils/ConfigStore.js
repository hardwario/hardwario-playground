const electron = require('electron');
const path = require('path');
const fs = require('fs');

class ConfigStore {
    constructor(filename, defaults={}) {
        const userDataPath = (electron.app || electron.remote.app).getPath('userData');

        this.path = path.join(userDataPath, filename);

        console.log("ConfigStore open", this.path);

        this.data = Object.assign(defaults, parseDataFile(this.path, defaults));
    }

    get(key) {
        return this.data[key];
    }

    getAll() {
        return this.data;
    }

    set(key, val) {
        this.data[key] = val;

        fs.writeFileSync(this.path, JSON.stringify(this.data), { encoding: "utf8" });
    }
}

function parseDataFile(filePath, defaults) {
    try {
        return JSON.parse(fs.readFileSync(filePath), { encoding: "utf8" });
    } catch(error) {
        return defaults;
    }
}

module.exports = ConfigStore;
