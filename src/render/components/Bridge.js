import React, { Component } from "react";
import { Input, FormGroup, Label, Alert, Button } from 'reactstrap';
const { ipcRenderer } = require("electron");

export default class extends Component {

    constructor(props) {
        super(props);
        this.state = {
            isConnected: props.model.isConnect(),
            status: "disabled",
            values: props.model.getValues(),
            showUdevHint: false
        };

        this.ipcBridgeStatus = this.ipcBridgeStatus.bind(this);
        this.onConnect = this.onConnect.bind(this);
        this.onMessage = this.onMessage.bind(this);
        this.buttonOnClick = this.buttonOnClick.bind(this);
    }

    componentDidMount() {
        console.log("Bridge:componentDidMount");
        this.props.model.on('connect', this.onConnect);
        this.props.model.on('message', this.onMessage);
        ipcRenderer.on("bridge/status", this.ipcBridgeStatus);

        ipcRenderer.send("bridge/status/get");
    }
    componentWillUnmount() {
        console.log("Bridge:componentWillUnmount");
        this.props.model.removeListener('connect', this.onConnect);
        this.props.model.removeListener('message', this.onMessage);
        ipcRenderer.removeListener("bridge/status", this.ipcBridgeStatus);
    }

    ipcBridgeStatus(sender, payload) {
        console.log(payload);
        if (this.state.status != payload.status || this.state.showUdevHint != payload.showUdevHint) {
            this.setState({ status: payload.status, showUdevHint: payload.showUdevHint });
        }
    }

    onConnect(connect) {
        this.setState({ isConnected: connect });
    }

    onMessage(message) {
        console.log("Render on message", message);
        this.setState( { values: this.props.model.getValues() });
        console.log(this.state.values);
    }

    buttonOnClick() {

        if (this.state.status !== "disabled") {
            this.setState({ enable: false });
            ipcRenderer.send("settings/set", { key: 'enmon-enable', value: false });
        } else {
            this.setState({ enable: true });
            ipcRenderer.send("settings/set", { key: 'enmon-enable', value: true });
        }
    }

    render() {
        return (
            <div id="bridge" >
                <div className="form-inline">
                    <FormGroup className="mb-2 mr-sm-2 mb-sm-0">
                        <Label className="mr-sm-2"></Label>
                        <Button disabled={false} color={this.state.status != 'disabled' ? "danger": "success"} onClick={this.buttonOnClick}>{this.state.status != 'disabled' ? "Disable Bridge" : "Enable Bridge"}</Button>
                    </FormGroup>
                </div>
                    {this.state.showUdevHint ? <div><br/><Alert color="warning">
                    For work on linux without sudo you must create udev rule<br/>
                    You can use this command:<br/>
                    echo 'SUBSYSTEMS=="usb", ACTION=="add", ATTRS{'{idVendor}'}=="0403", ATTRS{'{idProduct}'}=="6030", MODE="0666"' | sudo tee /etc/udev/rules.d/99-enmon.rules
                    </Alert></div> : null}

                    <table className="table table-bordered table-hover values">
                        <thead>
                            <tr>
                                <th>Label</th>
                                <th>Value</th>
                            </tr>
                        </thead>
                        <tbody>
                            {
                                this.state.values.map((item, index) => {
                                    return (
                                        <tr key={index}>
                                            <td >
                                                {item.label}
                                            </td>
                                            <td>
                                                {item.value}
                                            </td>
                                        </tr>
                                    )
                                })
                            }
                        </tbody>
                    </table>

            </div>
        )
    }
}
