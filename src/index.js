import React from "react";
import { render } from "react-dom";
import "bootstrap/dist/css/bootstrap.css";

// Import router
import Router from "./render/Routes";

// Creates div where React will be attached
let root = document.createElement("div");
root.id = "root";
document.body.appendChild(root);

render(Router, document.getElementById("root"));


