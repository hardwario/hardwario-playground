import React from "react";
import { HashRouter, Route, Switch, NavLink } from "react-router-dom";

import reducers from "./reducers";
import Home from "./components/Home";
import NodeRED from "./components/NodeRED";
import Dashboard from "./components/Dashboard";
import MqttLog from "./components/MqttLog";

import Navbar from "./components/Navbar";

// Import SCSS
import "../assets/scss/index.scss";

export default (
    <HashRouter>
        <div id="app">
            <Navbar>
                <NavLink exact to="/">Home</NavLink>
                <NavLink to="/nodered">NodeRED</NavLink>
                <NavLink to="/dashboard">Dashboard</NavLink>
                <NavLink to="/mqttlog">MQTT&nbsp;Log</NavLink>
                <NavLink to="/settings">Settings</NavLink>
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