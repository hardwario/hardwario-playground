import React, { Component } from "react";
const { ipcRenderer } = require("electron");

export default class extends Component {
    constructor(props) {
        super(props);
        this.state = { ports: [], gatewayStatus: false };
    }

    componentDidMount() {
        ipcRenderer.on("gateway:list", (sender, ports) => this.setState({ ports }));
        ipcRenderer.on("gateway:status", (sender, gatewayStatus) => this.setState({ gatewayStatus }));

        ipcRenderer.send("gateway:list");
        ipcRenderer.send("gateway:connect");
        ipcRenderer.send("gateway:status");
    }

    componentWillUnmount() {
        ipcRenderer.removeAllListeners("gateway:list");
    }

    render() {
        console.log(this.state)
        return (
            <footer>
                GATEWAY STATUS: {this.state.gatewayStatus ? "ONLINE" : "OFFLINE"}
            </footer>
        )
    }
}