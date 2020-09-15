import React, { Component } from "react";
import { HashRouter, Route, Switch, NavLink } from "react-router-dom";
import { ipcRenderer, shell } from "electron";
import { ToastContainer, toast } from 'react-toastify';
import { RouteIframe, RouteWithProps } from "./components/Route";

import RadioManagerModel from "./model/RadioManager";
import MqttLogModel from "./model/MqttLog";
import BridgeModel from "./model/Bridge";


import MqttLog from "./components/MqttLog";
import Settings from "./components/Settings";
import RadioManager from "./components/RadioManager";
import Firmware from "./components/Firmware";
import Gateway from "./components/Gateway";
import Devices from "./components/Devices";
import Home from "./components/Home";
import Bridge from "./components/Bridge";

// Import SCSS
import "../assets/scss/index.scss";
import 'react-toastify/dist/ReactToastify.css';

// Import language files
const i18n = require("../utils/i18n");

function openExternal(e) {
    e.preventDefault()
    shell.openExternal(e.target.href || e.target.parentNode.href)
}

export default class extends Component {
    constructor(props) {
        super(props);
        this.state = {
            visible: true,
            gatewayStatus: "unknown",
            noderedStatus: "unknown",
            brokerStatus: "unknown",
            bridgeStatus: "disabled",
        };

        this.radiomanager = new RadioManagerModel();
        this.mqttlog = new MqttLogModel();
        this.bridge = new BridgeModel();
    }

    componentDidMount() {
        console.log("App:componentDidMount");

        ipcRenderer.on("gateway/status", (sender, payload) => {
            if (this.state.gatewayStatus != payload.status) {
                this.setState({ gatewayStatus: payload.status });
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
        ipcRenderer.on("bridge/status", (sender, payload) => {
            if (this.state.bridgeStatus != payload.status) {
                this.setState({ bridgeStatus: payload.status });
            }
        });

        ipcRenderer.on("settings/value/mqtt.ip", (sender, mqttIp) => {
            this.radiomanager.connect("mqtt://" + mqttIp);
            this.mqttlog.connect("mqtt://" + mqttIp);
        });

        ipcRenderer.send("gateway/status/get");
        ipcRenderer.send("nodered/status/get");
        ipcRenderer.send("broker/status/get");
        ipcRenderer.send("bridge/status/get");
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
        let gwOffline = this.state.gatewayStatus == "offline";
        let nodeRedOffline = this.state.noderedStatus == "offline";
        let mqttOffline = this.state.brokerStatus == "offline";
        let bridgeOffline = this.state.bridgeStatus == "offline";
        return (
            <HashRouter>
                <div id="app" >

                    <div id="navbar" key="navbar">
                        <aside className={this.state.visible ? "fade-in" : "fade-out"}>
                            <nav>
                                {/* <NavLink exact to="/">{i18n.__("home")}</NavLink> */}
                                <NavLink to="/" exact title={gwOffline ? "No Radio Dongle connected" : null}>{i18n.__("Devices")} {gwOffline ?  <i className="fa fa-warning"></i> : null}</NavLink>
                                <NavLink to="/bridge" title={bridgeOffline ? "Bridge is not connected" : null}>{i18n.__("bridge")} {bridgeOffline ?<i className="fa fa-warning"></i> : null}</NavLink>
                                <NavLink to="/messages" title={mqttOffline ? "Mqtt brouker is shut down" : null}>{i18n.__("Messages")} {mqttOffline ?<i className="fa fa-warning"></i> : null}</NavLink>
                                <NavLink to="/functions" title={nodeRedOffline ? "Node-RED is shut down": null}>{i18n.__("Functions")} {nodeRedOffline ? <i className="fa fa-warning"></i> : null}</NavLink>
                                <NavLink to="/dashboard">{i18n.__("dashboard")}</NavLink>
                                <NavLink to="/firmware">{i18n.__("firmware")}</NavLink>
                                <a href="https://developers.bigclown.com/basics/bigclown-playground" onClick={openExternal}>{i18n.__("Help")}</a>
                                {/* <NavLink to="/settings">{i18n.__("settings")}</NavLink> */}
                            </nav>

                            <nav className="bottom">

                            </nav>
                            <a href="https://www.hardwario.com/" onClick={openExternal}>
                                <img src={require("../assets/images/hw-logo-white.svg")} className="logo" />
                            </a>
                        </aside>
                    </div>

                    <main key="main">
                        {/* <Home path="/" exact/> */}
                        <Route path="/settings" component={Settings}/>
                        <RouteWithProps path="/" exact component={Devices} model={this.radiomanager} />
                        <RouteIframe path="/functions" src="http://127.0.0.1:1880/" id="node-red" />
                        <RouteIframe path="/dashboard" src="http://127.0.0.1:1880/ui" />
                        <RouteWithProps path="/messages" component={MqttLog} model={this.mqttlog}/>
                        <RouteWithProps path="/bridge" component={Bridge} model={this.bridge}/>
                        <Route path="/firmware" component={Firmware} />
                    </main>

                    <ToastContainer position="top-right" autoClose={2000} closeOnClick/>
                </div>
            </HashRouter>
        )
    };
}
