const path = require("path")
const electron = require("electron")
const fs = require("fs");
let loadedLanguage;
let fallBackLanguage;
let app = electron.app ? electron.app : electron.remote.app


function setup() {
    if (fs.existsSync(path.join(app.getPath("userData"), app.getLocale() + ".json"))) {
        loadedLanguage = JSON.parse(fs.readFileSync(path.join(app.getPath("userData"), app.getLocale() + ".json"), "utf8"));
        fallBackLanguage = JSON.parse(fs.readFileSync(path.join(app.getPath("userData"), "en.json"), "utf8"));
    }
    else {
        loadedLanguage = JSON.parse(fs.readFileSync(path.join(app.getPath("userData"), "en.json"), "utf8"));
    }
    console.log("Tada", app.getPath("userData"));
}

function __(phrase) {
    let translation = loadedLanguage[phrase];
    if (translation === undefined) {
        translation = fallBackLanguage[phrase];
        if (translation === undefined) {
            translation = phrase;
        }
    }
    return translation;
}


module.exports = { setup, __ };