import React, { Component } from "react";
const { ipcRenderer } = require("electron");

export default class extends Component {
    constructor(props) {
        super(props);
        this.state = { ports: [], selectedPort: "", gatewayStatus: false };
    }

    componentDidMount() {
        ipcRenderer.on("gateway:list", (sender, ports) => this.setState({ ports }));
        ipcRenderer.on("gateway:status", (sender, gatewayStatus) => this.setState({ gatewayStatus }));

        ipcRenderer.send("gateway:list");
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
                <select value={this.state.selectedPort} onChange={(e) => this.setState({ selectedPort: e.target.value })}>
                    <option key={-1} value=""></option>
                    {
                        this.state.ports.map((port, index) => <option value={port.comName} key={index}>{port.comName}</option>)
                    }
                </select>
                <button onClick={() => ipcRenderer.send("gateway:connect", this.state.selectedPort)}>connect</button>
            </footer>
        )
    }
}