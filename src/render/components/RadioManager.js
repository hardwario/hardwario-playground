import React, { Component } from "react";
import { ipcRenderer } from "electron";
import clientMqtt from "../model/MQTT";
import { Button, FormGroup, Label } from 'reactstrap';

// Import language files
const i18n = require("../../utils/i18n");
const { __ } = i18n;

export default class extends Component {
    constructor(props) {
        super(props);

        this.state = {
            gatewayStatus: false,
            mqttStatus: false,
            name: "usb-dongle",
            nodes: [],
            pairing: false,
            editId: null,
            editValue: "",

            ports: [],
            selectedPort: ""
        };

        this.textInput = React.createRef();

        this.get_nodes = this.get_nodes.bind(this);
        this.pairringToggle = this.pairringToggle.bind(this);
        this.nodeRemove = this.nodeRemove.bind(this);
        this.setEditId = this.setEditId.bind(this);
        this.saveAlias = this.saveAlias.bind(this);
        this.renameInputKeyPress = this.renameInputKeyPress.bind(this);
        this.onMqttMessage = this.onMqttMessage.bind(this);
        this.onMqttStatus = this.onMqttStatus.bind(this);
        this.onGatewayStatus = this.onGatewayStatus.bind(this);

        this.ipcPortListUpdate = this.ipcPortListUpdate.bind(this);
        this.ipcGatewayDevice = this.ipcGatewayDevice.bind(this);
        this.buttonOnClick = this.buttonOnClick.bind(this);
    }

    componentDidMount() {
        console.log("RadioManager:componentDidMount");

        ipcRenderer.on("settings/value/mqtt.ip", (sender, mqttIp) => {

            this.client = new clientMqtt(mqttIp, this.onMqttMessage, this.onMqttStatus);

            ipcRenderer.removeAllListeners("settings/value/mqtt.ip");
        });

        ipcRenderer.on("gateway/status", this.onGatewayStatus);

        ipcRenderer.on("gateway/port-list", this.ipcPortListUpdate);

        ipcRenderer.on("gateway/device", this.ipcGatewayDevice);

        ipcRenderer.send("gateway/device/get");

        ipcRenderer.send("gateway/status/get");

        ipcRenderer.send("settings/get", "mqtt.ip");

        ipcRenderer.send("gateway/port-list/get");
    }

    componentWillUnmount() {
        console.log("RadioManager:componentWillUnmount");

        if (this.timer) {
            clearTimeout(this.timer);
        }

        if (this.client) this.client.disconnect();

        ipcRenderer.removeListener("gateway/status", this.onGatewayStatus);

        ipcRenderer.removeListener("gateway/port-list", this.ipcPortListUpdate);

        ipcRenderer.removeListener("gateway/device", this.ipcGatewayDevice);

        ipcRenderer.removeAllListeners("settings/value/mqtt.ip");
    }

    ipcPortListUpdate(sender, ports) {
        console.log("GatewayPortList:ipcPortListUpdate", ports);

        let change = false;

        if (this.state.ports.length == ports.length){
            for (let i=0, l=ports.length; i < l; i++) {
                if (this.state.ports[i] != ports[i].comName) {
                    change = true;
                    break;
                }
            }
        } else {
            change = true;
        }

        if (change) {
            if ((this.state.selectedPort == "") && (ports.length > 0)) {
                this.setState({ selectedPort: ports[0].comName });
            }

            this.setState({ ports })
        }

        if (this.timer) {
            clearTimeout(this.timer);
        }

        this.timer = setTimeout(() => {
            ipcRenderer.send("gateway/port-list/get");
        }, 1000);
    }

    ipcGatewayDevice(sender, device) {
        if (this.state.selectedPort != device){
            this.setState({selectedPort: device});
        }
    }

    buttonOnClick() {
        if (this.state.gatewayStatus) {
            ipcRenderer.send("gateway/disconnect");
            return;
        }

        if (this.state.selectedPort == "") return;

        ipcRenderer.send("gateway/connect", this.state.selectedPort)
    }

    render() {
        const self = this;

        return (
            <div id="radiomanager" >
                <div className="col-xs-12">

                    <div className="gatewayPortList form-inline">
                        <FormGroup className="mb-2 mr-sm-2 mb-sm-0">
                            <Label className="mr-sm-2">Radio USB Dongle </Label>
                            <select className="form-control" value={this.state.selectedPort} onChange={(e) => this.setState({ selectedPort: e.target.value })}>
                                {
                                    this.state.ports.map((port, index) => <option value={port.comName} key={index}>{port.comName}</option>)
                                }
                            </select>
                        </FormGroup>
                        <Button disabled={this.state.ports.length == 0} color={this.state.gatewayStatus ? "danger": "success"} onClick={this.buttonOnClick} >{this.state.gatewayStatus ? "Disconnect" : "Connect"}</Button>
                    </div>

                    <div className="form-group">
                        <button disabled={!this.state.gatewayStatus || !this.state.mqttStatus} type="button" className={"btn " + (this.state.pairing ? "btn-danger" : "btn-success")} onClick={this.pairringToggle}>
                            {i18n.__(this.state.pairing ? "pairingStop" : "pairingStart")}
                        </button>
                    </div>
                    <table className="table table-bordered table-hover">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Alias</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {
                                this.state.nodes.map((item, index) => {
                                    if (this.state.editId == item.id)
                                    {
                                        return (
                                            <tr key={index}>
                                                <td>{item.id}</td>
                                                <td>
                                                    <input type="text" autoFocus className="form-control" defaultValue={item.alias} ref={this.textInput} onKeyPress={this.renameInputKeyPress} />
                                                </td>
                                                <td>
                                                    <button onClick={() => self.saveAlias() } className="btn btn-success">{__("save")}</button>
                                                    <button onClick={() => self.setState({ editId: null }) } className="btn btn-warning">{__("cancel")}</button>
                                                </td>
                                            </tr>
                                        )
                                    }

                                    return (
                                        <tr key={index}>
                                            <td>{item.id}</td>
                                            <td>
                                                {item.alias}
                                            </td>
                                            <td>
                                                <button onClick={() => self.setState({ editId: item.id }) } className="btn btn-warning">{__("rename")}</button>
                                                <button onClick={() => this.nodeRemove(item)} className="btn btn-danger">{__("remove")}</button>
                                            </td>
                                        </tr>
                                    )
                                })
                            }
                        </tbody>
                    </table>
                </div>
            </div>
        )
    }

    /* START OF EVENT HANDLERS */
    onMqttMessage(message) {
        //console.log("Carry", message);
        let payload = JSON.parse(message.payload);
        if (message.topic == "gateway/" + this.state.name + "/nodes") {
            this.setState(prev => { return { nodes: payload } })
        }
        else if (message.topic == "gateway/" + this.state.name + "/pairing-mode") {
            this.setState(prev => { return { pairing: payload == "start" } })
        }
        else {
            this.get_nodes();
        }
    }

    onMqttStatus(status) {
        console.log("onMqttStatus", status);

        if (this.state.mqttStatus == status) {
            return;
        }

        this.setState({ mqttStatus: status });

        if (status) {
            this.client.subscribe("gateway/" + this.state.name + "/nodes");
            this.client.subscribe("gateway/" + this.state.name + "/attach");
            this.client.subscribe("gateway/" + this.state.name + "/detach");
            this.client.subscribe("gateway/" + this.state.name + "/alias/set/ok");
            this.client.subscribe("gateway/" + this.state.name + "/alias/remove/ok");
            this.client.subscribe("gateway/" + this.state.name + "/pairing-mode");
            this.get_nodes();
        }
    }

    onGatewayStatus(sender, gatewayStatus) {

        gatewayStatus = gatewayStatus == "online";

        if (this.state.gatewayStatus == gatewayStatus) {
            return;
        }

        if (gatewayStatus && this.state.gatewayStatus == false) {
            this.setState({ nodes: [], pairing: false });

            setTimeout(this.get_nodes, 500);
        }
        else if (!gatewayStatus)
        {
            this.setState({ nodes: [], pairing: false });
        }

        this.setState({ gatewayStatus });
    }

    get_nodes() {
        if (this.client) {
            this.client.publish("gateway/" + this.state.name + "/nodes/get");
        }
    }

    pairringToggle(e) {
        if (e) e.preventDefault();
        const { pairing } = this.state;

        if (this.state.pairing) {
            this.setState({ pairing: !pairing }, () => this.client.publish("gateway/" + this.state.name + "/pairing-mode/stop"));
        }
        else {
            this.setState({ pairing: !pairing }, () => this.client.publish("gateway/" + this.state.name + "/pairing-mode/start"));
        }
    }

    nodeRemove(item) {
        this.client.publish("gateway/" + this.state.name + "/nodes/remove", JSON.stringify(item.id));
    }

    setEditId(item) {
        this.setState(prev => { return { editId: item.id, editValue: item.alias } })
    }

    inputOnChange(event) {
        this.setState(prev => { return { editValue: event.target.value } });
    }

    saveAlias() {
        let value = this.textInput.current.value;

        if (this.state.editValue != value) {
            this.client.publish("gateway/" + this.state.name + "/alias/set", JSON.stringify({ id: this.state.editId, alias: value }));
        }
        this.setState({ editId: null });
    }

    renameInputKeyPress(event) {
        if (event.key === "Enter") {
            this.saveAlias();
        }
    }
}
