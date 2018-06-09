const path = require("path")
const electron = require("electron")
const fs = require("fs");
let loadedLanguage;
let fallBackLanguage;
let app = electron.app ? electron.app : electron.remote.app

function setup(language) {
    //var language = JSON.parse(fs.readFileSync(path.join(app.getPath("userData"), "settings.json")))["app"]["languages"][0];
    //console.log("language:", language);
    if (fs.existsSync(path.join(app.getPath("userData"), language + ".json"))) {
        loadedLanguage = JSON.parse(fs.readFileSync(path.join(app.getPath("userData"), language + ".json"), "utf8"));
        fallBackLanguage = JSON.parse(fs.readFileSync(path.join(app.getPath("userData"), "en.json"), "utf8"));
    }
    else {
        loadedLanguage = JSON.parse(fs.readFileSync(path.join(app.getPath("userData"), "en.json"), "utf8"));
    }
}

function __(phrase) {
    //console.log(phrase, loadedLanguage);
    if (loadedLanguage == null || fallBackLanguage == null) {
        return phrase;
    }

    let translation = loadedLanguage[phrase];
    if (translation === undefined) {
        translation = fallBackLanguage[phrase];
        if (translation === undefined) {
            translation = phrase;
        }
    }
    return translation;
}

module.exports = { __, setup };
