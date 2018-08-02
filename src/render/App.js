import React, { Component } from "react";
import { HashRouter, Route, Switch, NavLink } from "react-router-dom";
import { ipcRenderer } from "electron";

import { RouteIframe } from "./components/Route";

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
            gatewayListVisble: false,

            gatewayStatus: false,
            noderedStatus: false,
            brokerStatus: false
        };


        this.clickOnGateway = this.clickOnGateway.bind(this);
        this.clickOnMain = this.clickOnMain.bind(this);
    }

    componentDidMount() {
        ipcRenderer.on("gateway/status", (sender, gatewayStatus) => { this.setState({ gatewayStatus }); });
        ipcRenderer.on("nodered:status", (sender, noderedStatus) => { this.setState({ noderedStatus }); });
        ipcRenderer.on("broker:status", (sender, brokerStatus) => { this.setState({ brokerStatus }); });

        ipcRenderer.send("gateway:status");
        ipcRenderer.send("nodered:status");
        ipcRenderer.send("broker:status");
    }

    componentWillUnmount() {

    }

    clickOnGateway(e) {
        e.preventDefault();
        e.stopPropagation();

        this.setState({gatewayListVisble: !this.state.gatewayListVisble})
    }

    clickOnMain(e) {
        this.setState({gatewayListVisble: false})
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
                                    Status:
                                    <ul>
                                        <li className={this.state.noderedStatus ? "online" : "offline"}>
                                            {i18n.__("node-red")}
                                        </li>

                                        <li className={this.state.brokerStatus ? "online" : "offline"}>
                                            {i18n.__("mqtt")}
                                        </li>
                                    </ul>
                                </div>
                                <a href="#" className={this.state.gatewayStatus ? "online" : "offline"} onClick={this.clickOnGateway} >Gateway</a>
                            </nav>
                        </aside>
                    </div>

                    <main onClick={this.clickOnMain}>
                        <Route path="/settings" component={Settings} />
                        <Route path="/radiomanager" component={RadioManager} />
                        <Route path="/mqttlog" component={MqttLog} />
                        <RouteIframe path="/node-red" src="http://localhost:1880/" id="node-red" />
                        <RouteIframe path="/dashboard" src="http://localhost:1880/ui" />
                        <Route path="/firmware" component={Firmware} />
                        <RouteIframe path="/" exact src="https://www.bigclown.com/doc/" />


                        {this.state.gatewayListVisble ? <GatewayList /> : null}
                    </main>
                </div>
            </HashRouter>
        )
    };
}
