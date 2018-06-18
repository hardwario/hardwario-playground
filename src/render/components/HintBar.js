import React, { Component } from "react";
const { ipcRenderer } = require("electron");

const i18n = require("../../utils/i18n");

export default class extends Component {
    constructor(props) {
        super(props);
        this.state = { ports: [], selectedPort: "", gatewayStatus: false };
    }

    componentDidMount() {
        ipcRenderer.on("gateway:list", (sender, ports) => { this.setState({ ports }) });
        ipcRenderer.on("gateway:status", (sender, gatewayStatus) => { this.setState({ gatewayStatus }); });

        ipcRenderer.send("gateway:window:subscribe");
        ipcRenderer.send("gateway:status");
    }

    componentWillUnmount() {
        ipcRenderer.removeAllListeners("gateway:list");
        ipcRenderer.removeAllListeners("gateway:status");
        ipcRenderer.send("gateway:window:unsubscribe");
    }

    render() {
        return (
            <footer id="hintbar">
                <span>
                    {i18n.__("gatewayStatus")} <span className={this.state.gatewayStatus ? "online" : "offline"}>{this.state.gatewayStatus ? i18n.__("online") : i18n.__("offline")}</span>
                </span>
                <span>
                    <select value={this.state.selectedPort} onChange={(e) => this.setState({ selectedPort: e.target.value })}>
                        <option key={-1} value=""></option>
                        {
                            this.state.ports.map((port, index) => <option value={port.comName} key={index}>{port.comName}</option>)
                        }
                    </select>
                    <button disabled={this.state.gatewayStatus} onClick={() => {
                        if (this.state.selectedPort == "") return;
                        ipcRenderer.send("gateway:connect", this.state.selectedPort)
                    }
                    }>{i18n.__("connect")}</button>
                </span>
            </footer>
        )
    }
}