import React, { Component } from "react";
import { Input, FormGroup, Label, Alert, Button } from 'reactstrap';
const { ipcRenderer } = require("electron");

export default class extends Component {

    constructor(props) {
        super(props);
        this.state = {
            isConnected: props.model.isConnect(),
            bridgeStatus: "disabled",
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
        if (this.state.bridgeStatus != payload.status) {
            this.setState({ bridgeStatus: payload.status });
        }
    }

    onConnect(connect) {
        this.setState({ isConnected: connect });
    }

    onMessage(message) {
        console.log("Render on message", message);
    }

    buttonOnClick() {

        if (this.state.bridgeStatus !== "disabled") {
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
                        <Button disabled={false} color={this.state.bridgeStatus != 'disabled' ? "danger": "success"} onClick={this.buttonOnClick}>{this.state.bridgeStatus != 'disabled' ? "Disable Bridge" : "Enable Bridge"}</Button>
                    </FormGroup>
                </div>
            </div>
        )
    }
}
