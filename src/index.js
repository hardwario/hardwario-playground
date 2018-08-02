import React from "react";
import { render } from "react-dom";
import { ipcRenderer } from "electron";
import "bootstrap/dist/css/bootstrap.css";
import 'react-select/dist/react-select.css';

import Routes from "./render/Routes";

// Import language files
const i18n = require("./utils/i18n");

// Creates div where React will be attached
let root = document.createElement("div");
root.id = "root";
document.body.appendChild(root);

ipcRenderer.on("settings/value/language", (sender, language) => {
    i18n.setup(language);

    ipcRenderer.removeAllListeners("settings/value/language");

    render(Routes(), document.getElementById("root"));
});

ipcRenderer.send("settings/get", "language");

render(<div>Loading...</div>, document.getElementById("root"));
