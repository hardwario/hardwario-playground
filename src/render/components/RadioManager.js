import React, { Component } from "react";
import { ipcRenderer } from "electron";
import clientMqtt from "../model/MQTT";

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
            editValue: ""
        };

        this.get_nodes = this.get_nodes.bind(this);
        this.pairringToggle = this.pairringToggle.bind(this);
        this.nodeRemove = this.nodeRemove.bind(this);
        this.setEditId = this.setEditId.bind(this);
        this.renameInputKeyPress = this.renameInputKeyPress.bind(this);
        this.onMqttMessage = this.onMqttMessage.bind(this);
        this.onMqttStatus = this.onMqttStatus.bind(this);
        this.onGatewayStatus = this.onGatewayStatus.bind(this);
    }

    componentDidMount() {
        ipcRenderer.on("settings:get", (sender, settings) => {
            this.client = new clientMqtt(settings.mqtt.remoteIp, this.onMqttMessage, this.onMqttStatus);
            ipcRenderer.removeAllListeners("settings:get");
        });
        ipcRenderer.on("gateway:status", this.onGatewayStatus);

        ipcRenderer.send("settings:get");
        ipcRenderer.send("gateway:status");
    }

    componentWillUnmount() {
        this.client.disconnect();
        ipcRenderer.removeListener("gateway:status", this.onGatewayStatus);
    }

    render() {
        const { gatewayStatus, mqttStatus, nodes } = this.state;

        return (
            <div id="radiomanager" >
                <div className="col-xs-12">
                    <header className="h4">{i18n.__("radioManager")}</header>
                    <div className="form-group">
                        <button disabled={!gatewayStatus || !mqttStatus} type="button" className={"btn " + (this.state.pairing ? "btn-danger" : "btn-success")} onClick={this.pairringToggle}>
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
                                nodes.map((item, index) => {
                                    return (
                                        <tr key={index}>
                                            <td>{item.id}</td>
                                            <td>
                                                {this.state.editId == item.id ?
                                                    <input type="text" className="form-control" defaultValue={item.alias} onKeyPress={this.renameInputKeyPress} /> :
                                                    item.alias}
                                            </td>
                                            <td>{this.state.editId != item.id ? <button onClick={() => this.setEditId(item)} className="btn btn-warning">{__("rename")}</button> : ""}
                                                <button onClick={() => this.nodeRemove(item)} className="btn btn-danger">{__("remove")}</button></td>
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
        let payload = JSON.parse(message).payload;
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
        if (gatewayStatus && this.gatewayStatus == false) {
            this.setState({ nodes: [], pairing: false });
        }

        this.setState({ gatewayStatus });
    }

    get_nodes() {
        this.client.publish("gateway/" + this.state.name + "/nodes/get");
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

    renameInputKeyPress(event) {
        if (event.key === "Enter") {
            if (this.state.editValue != event.target.value) {
                this.client.publish("gateway/" + this.state.name + "/alias/set", JSON.stringify({ id: this.state.editId, alias: event.target.value }));
            }
            this.setState(prev => { return { editId: null } });
        }
    }
    /* END OF EVENT HANDLERS */
}
