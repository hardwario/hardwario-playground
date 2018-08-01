import React from "react";
import { render } from "react-dom";
import { ipcRenderer } from "electron";
import "bootstrap/dist/css/bootstrap.css";
import 'react-select/dist/react-select.css';

import Routes from "./render/Routes";

// Creates div where React will be attached
let root = document.createElement("div");
root.id = "root";
document.body.appendChild(root);

ipcRenderer.on("settings:get", (sender, settings) => {
    render(Routes(), document.getElementById("root"));
    ipcRenderer.removeAllListeners("settings:get");
});
ipcRenderer.send("settings:get");

render(<div>Loading...</div>, document.getElementById("root"));
