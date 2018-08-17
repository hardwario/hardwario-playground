import React, { Component } from "react";
import { HashRouter, Route, Switch, NavLink } from "react-router-dom";
import { ipcRenderer } from "electron";

import { RouteIframe, RouteWithProps } from "./components/Route";

import RadioManagerModel from "./model/RadioManager";

import MqttLog from "./components/MqttLog";
import Settings from "./components/Settings";
import RadioManager from "./components/RadioManager";
import Firmware from "./components/Firmware";
import Gateway from "./components/Gateway";

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

        this.rm = new RadioManagerModel();
    }

    componentDidMount() {
        console.log("App:componentDidMount");

        ipcRenderer.on("gateway/status", (sender, gatewayStatus) => {
            if (this.state.gatewayStatus != gatewayStatus) {
                this.setState({ gatewayStatus });
            }
        });
        ipcRenderer.on("nodered/status", (sender, noderedStatus) => {
            if (this.state.noderedStatus != noderedStatus) {
                this.setState({ noderedStatus });
            }
        });
        ipcRenderer.on("broker/status", (sender, brokerStatus) => {
            if (this.state.brokerStatus != brokerStatus) {
                this.setState({ brokerStatus });
            }
        });

        ipcRenderer.on("settings/value/mqtt.ip", (sender, mqttIp) => {
            this.rm.connect(mqttIp);
        });

        ipcRenderer.send("gateway/status/get");
        ipcRenderer.send("nodered/status/get");
        ipcRenderer.send("broker/status/get");
        ipcRenderer.send("settings/get", "mqtt.ip");
    }

    componentWillUnmount() {
        console.log("App:componentWillUnmount");

        ipcRenderer.removeAllListeners("gateway/status");
        ipcRenderer.removeAllListeners("nodered/status");
        ipcRenderer.removeAllListeners("broker/status");
        ipcRenderer.removeAllListeners("settings/value/mqtt.ip");
    }

    render() {
        return (
            <HashRouter>
                <div id="app" >

                    <div id="navbar" key="navbar">
                        <aside className={this.state.visible ? "fade-in" : "fade-out"}>
                            <nav>
                                <NavLink exact to="/">{i18n.__("home")}</NavLink>
                                <NavLink to="/devices">{i18n.__("Devices")}</NavLink>
                                <NavLink to="/connect">{i18n.__("Connect")}</NavLink>
                                <NavLink to="/dashboard">{i18n.__("dashboard")}</NavLink>
                                <NavLink to="/messages">{i18n.__("Messages")}</NavLink>
                                <NavLink to="/firmware">{i18n.__("firmware")}</NavLink>
                                <NavLink to="/settings">{i18n.__("settings")}</NavLink>
                                <NavLink to="/gateway">{i18n.__("Gateway")}</NavLink>
                            </nav>

                            <nav className="bottom">

                            </nav>

                            <img src={require("../assets/images/logo.png")} className="logo" />
                        </aside>
                    </div>

                    <main key="main">
                        <RouteIframe path="/" exact src="https://www.bigclown.com/doc/" />
                        <Route path="/settings" component={Settings}/>
                        <RouteWithProps path="/devices" component={RadioManager} model={this.rm} />
                        <RouteIframe path="/connect" src="http://localhost:1880/" id="node-red" />
                        <RouteIframe path="/dashboard" src="http://localhost:1880/ui" />
                        <Route path="/messages" component={MqttLog}/>
                        <Route path="/firmware" component={Firmware} />
                        <Route path="/gateway" component={Gateway} />
                    </main>
                </div>
            </HashRouter>
        )
    };
}
