import React from "react";
import { HashRouter, Route, Switch, NavLink } from "react-router-dom";
import { ipcRenderer } from "electron";

import Home from "./components/Home";
import NodeRED from "./components/NodeRED";
import Dashboard from "./components/Dashboard";
import MqttLog from "./components/MqttLog";

import Navbar from "./components/Navbar";

// Import SCSS
import "../assets/scss/index.scss";

// Import language files
const i18n = require("../utils/i18n");
i18n.setup();

export default (
    <HashRouter>
        <div id="app">
            <Navbar>
                <NavLink exact to="/">{i18n.__("home")}</NavLink>
                <NavLink to="/nodered">{i18n.__("nodered")}</NavLink>
                <NavLink to="/dashboard">{i18n.__("dashboard")}</NavLink>
                <NavLink to="/mqttlog">{i18n.__("mqttLog")}</NavLink>
                <NavLink to="/settings">{i18n.__("settings")}</NavLink>
            </Navbar>
            <main>
                <Route path="/mqttlog" component={MqttLog} />
                <Route path="/dashboard" component={Dashboard} />
                <Route path="/nodered" component={NodeRED} />
                <Route path="/" exact component={Home} />
            </main>
        </div>
    </HashRouter>
);