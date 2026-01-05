import React from "react";
import { render } from "react-dom";
import { ipcRenderer } from "electron";
import "bootstrap/dist/css/bootstrap.css";
import 'react-select/dist/react-select.css';

import App from "./render/App";

// Import language files
const i18n = require("./utils/i18n");

// Creates div where React will be attached
let root = document.createElement("div");
root.id = "root";
document.body.appendChild(root);
var language = ipcRenderer.sendSync('settings/get-sync', 'language');
i18n.setup(language);
render(<App />, document.getElementById("root"));
