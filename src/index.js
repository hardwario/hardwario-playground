import React from "react";
import { render } from "react-dom";
import "bootstrap/dist/css/bootstrap.css";

// Creates div when React will be attached
let root = document.createElement("div");
root.id = "root";
document.body.appendChild(root);

render(<div className="jumbotron">Hello world</div>, document.getElementById("root"));


