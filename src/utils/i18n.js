const path = require("path")
const electron = require("electron")
const fs = require("fs");
let loadedLanguage;
let fallBackLanguage;
let app = electron.app ? electron.app : electron.remote.app


function setup(renderer = true) {
    if (fs.existsSync(path.join("src", "assets", "i18n", app.getLocale() + ".json"))) {
        loadedLanguage = JSON.parse(fs.readFileSync(path.join("src", "assets", "i18n", app.getLocale() + ".json"), 'utf8'));
        fallBackLanguage = JSON.parse(fs.readFileSync(path.join("src", "assets", "i18n", "en.json"), 'utf8'));
    }
    else {
        loadedLanguage = JSON.parse(fs.readFileSync(path.join("src", "assets", "i18n", "en.json"), 'utf8'));
    }
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