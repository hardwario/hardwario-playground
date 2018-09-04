import React, { Component } from "react";
import { Button, FormGroup, Label } from 'reactstrap';
const { ipcRenderer } = require("electron");

export default class extends Component {
    constructor(props) {
        super(props);
        this.state = {
            ports: [],
            selectedPort: "",
            gatewayOnline: false
        };

        this.ipcPortListUpdate = this.ipcPortListUpdate.bind(this);
        this.ipcGatewayStatus = this.ipcGatewayStatus.bind(this);
        this.ipcGatewayDevice = this.ipcGatewayDevice.bind(this);
        this.buttonOnClick = this.buttonOnClick.bind(this);
    }

    componentDidMount() {
        ipcRenderer.on("gateway/port-list", this.ipcPortListUpdate);

        ipcRenderer.on("gateway/status", this.ipcGatewayStatus);

        ipcRenderer.on("gateway/device", this.ipcGatewayDevice);

        ipcRenderer.send("gateway/device/get");

        ipcRenderer.send("gateway/port-list/get");

        ipcRenderer.send("gateway/status/get");
    }

    componentWillUnmount() {
        ipcRenderer.removeListener("gateway/port-list", this.ipcPortListUpdate);

        ipcRenderer.removeListener("gateway/status", this.ipcGatewayStatus);

        ipcRenderer.removeListener("gateway/device", this.ipcGatewayDevice);

        if (this.timer) {
            clearTimeout(this.timer);
        }
    }

    ipcPortListUpdate(sender, ports) {
        console.log("GatewayPortList:ipcPortListUpdate", ports);

        let change = false;

        if (this.state.ports.length == ports.length){
            for (let i=0, l=ports.length; i < l; i++) {
                if (this.state.ports[i].comName != ports[i].comName) {
                    change = true;
                    break;
                }
            }
        } else {
            change = true;
        }

        if (change)
        {
            if ((this.state.selectedPort == "") && (ports.length > 0)) {
                this.setState({ selectedPort: ports[0].comName });
            }
            else if (ports.length == 0)
            {
                this.setState({ selectedPort: "" });
            }

            this.setState({ ports })
        }

        this.timer = setTimeout(() => {
            ipcRenderer.send("gateway/port-list/get");
        }, 1000);
    }

    ipcGatewayStatus(sender, status) {
        let gatewayOnline = status == "online";
        if (this.state.status != gatewayOnline) {
            this.setState({ gatewayOnline });
        }
    }

    ipcGatewayDevice(sender, device) {
        if (this.state.selectedPort != device){
            this.setState({selectedPort: device});
        }
    }

    buttonOnClick() {
        if (this.state.gatewayOnline) {
            ipcRenderer.send("gateway/disconnect");
            return;
        }

        if (this.state.selectedPort == "") return;

        ipcRenderer.send("gateway/connect", this.state.selectedPort)
    }

    render() {
        return (
            <div id="gateway" >
                <div className="gatewayPortList form-inline">
                    <FormGroup className="mb-2 mr-sm-2 mb-sm-0">
                        <Label className="mr-sm-2">Radio USB Dongle </Label>
                        <select className="form-control" value={this.state.selectedPort} onChange={(e) => this.setState({ selectedPort: e.target.value })}>
                            {this.state.ports.length == 0 ? <option>(no device available)</option> : null }
                            {
                                this.state.ports.map((port, index) => <option value={port.comName} key={index}>{port.comName}{port.serialNumber ? " " + port.serialNumber : null}</option>)
                            }
                        </select>
                    </FormGroup>
                    <Button disabled={this.state.ports.length == 0} color={this.state.gatewayOnline ? "danger": "success"} onClick={this.buttonOnClick}>{this.state.gatewayOnline ? "Disconnect" : "Connect"}</Button>
                </div>
            </div>
        )
    }
}
