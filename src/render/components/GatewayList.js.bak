import React, { Component } from "react";
const { ipcRenderer } = require("electron");

const i18n = require("../../utils/i18n");

export default class extends Component {
    constructor(props) {
        super(props);
        this.state = {
            ports: []
        };

        this.ipcPortListUpdate = this.ipcPortListUpdate.bind(this);
    }

    componentDidMount() {
        ipcRenderer.on("gateway/port-list", this.ipcPortListUpdate);
        ipcRenderer.send("gateway/port-list/get");
    }

    componentWillUnmount() {
        ipcRenderer.removeListener("gateway/port-list", this.ipcPortListUpdate);
    }

    ipcPortListUpdate(sender, ports) {
        this.setState({ ports })
    }

    render() {
        return (
            <div id="gatewayList">
                {
                    this.state.ports.map((port, index) => {
                        return <div className="port" key={port.path} onClick={() => {
                            ipcRenderer.send("gateway/connect", port.path)
                        }} >{port.path}</div>
                    })
                }
                <div className="port" onClick={() => {
                    ipcRenderer.send("gateway/disconnect")
                }} > Disconnect </div>

            </div>
        )
    }
}
