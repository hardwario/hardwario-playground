import React, { Component } from "react";
import { HashRouter, Route, Switch, NavLink } from "react-router-dom";
import { ipcRenderer } from "electron";

import { RouteIframe, RouteWithProps } from "./components/Route";

import MqttLog from "./components/MqttLog";
import Settings from "./components/Settings";
import RadioManager from "./components/RadioManager";
import Firmware from "./components/Firmware";
import GatewayList from "./components/GatewayList";

// Import SCSS
import "../assets/scss/index.scss";

// Import language files
const i18n = require("../utils/i18n");

export default class extends Component {
    constructor(props) {
        super(props);
        this.state = {
            visible: true,
            gatewayStatus: "offline",
            noderedStatus: "offline",
            brokerStatus: "offline"
        };
    }

    componentDidMount() {
        console.log("App:componentDidMount");

        ipcRenderer.on("gateway/status", (sender, gatewayStatus) => { this.setState({ gatewayStatus }); });
        ipcRenderer.on("nodered/status", (sender, noderedStatus) => { this.setState({ noderedStatus }); });
        ipcRenderer.on("broker/status", (sender, brokerStatus) => { this.setState({ brokerStatus }); });

        ipcRenderer.send("gateway/status/get");
        ipcRenderer.send("nodered/status/get");
        ipcRenderer.send("broker/status/get");
    }

    componentWillUnmount() {
        console.log("App:componentWillUnmount");

        ipcRenderer.removeAllListeners("gateway/status");
        ipcRenderer.removeAllListeners("nodered/status");
        ipcRenderer.removeAllListeners("broker/status");
    }

    render() {
        return (
            <HashRouter>
                <div id="app" >

                    <div id="navbar" >
                        <aside className={this.state.visible ? "fade-in" : "fade-out"}>
                            <img src={require("../assets/images/logo.png")} className="logo" />
                            <nav>
                                <NavLink exact to="/">{i18n.__("home")}</NavLink>
                                <NavLink to="/radiomanager">{i18n.__("radio")}</NavLink>
                                <NavLink to="/node-red">{i18n.__("node-red")}</NavLink>
                                <NavLink to="/dashboard">{i18n.__("dashboard")}</NavLink>
                                <NavLink to="/mqttlog">{i18n.__("mqtt")}</NavLink>
                                <NavLink to="/firmware">{i18n.__("firmware")}</NavLink>
                                <NavLink to="/settings">{i18n.__("settings")}</NavLink>
                            </nav>

                            <nav className="bottom">
                                <div className="item">
                                    Status:<br/>
                                    &nbsp;&nbsp;<span className={this.state.noderedStatus}>Node-Red</span><br/>
                                    &nbsp;&nbsp;<span className={this.state.brokerStatus}>MQTT</span><br/>
                                    &nbsp;&nbsp;<span className={this.state.gatewayStatus}>Gateway</span>
                                </div>
                            </nav>
                        </aside>
                    </div>

                    <main>
                        <Route path="/settings" component={Settings}/>
                        <Route path="/radiomanager" component={RadioManager} />
                        <Route path="/mqttlog" component={MqttLog}/>
                        <RouteIframe path="/node-red" src="http://localhost:1880/" id="node-red" />
                        <RouteIframe path="/dashboard" src="http://localhost:1880/ui" />
                        <Route path="/firmware" component={Firmware} />
                        <RouteIframe path="/" exact src="https://www.bigclown.com/doc/" />
                    </main>
                </div>
            </HashRouter>
        )
    };
}
