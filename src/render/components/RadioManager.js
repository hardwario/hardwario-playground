import React, { Component } from "react";
import { ipcRenderer } from "electron";

// Import language files
const i18n = require("../../utils/i18n");
const MqttClient = require('./MqttClient');

export default class extends Component {
    constructor(props) {
        super(props);

        this.state = {
            name: "usb-dongle",
            nodes: [],
            pairing: false,
            editId: null
        };

        this.mqttc = new MqttClient();

        this.mqttc.on('connect', () =>{
            console.log('connect on mqttc');

            this.mqttc.subscribe("gateway/" + this.state.name + "/nodes");
            this.mqttc.subscribe("gateway/" + this.state.name + "/attach");
            this.mqttc.subscribe("gateway/" + this.state.name + "/detach");
            this.mqttc.subscribe("gateway/" + this.state.name + "/alias/set/ok");
            this.mqttc.subscribe("gateway/" + this.state.name + "/alias/remove/ok");
            this.mqttc.subscribe("gateway/" + this.state.name + "/pairing-mode");

            this.get_nodes()
        });

        this.mqttc.on('message', (message) =>{
            console.log("aaaa", message.topic, message.payload);

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
        });

        this.get_nodes = this.get_nodes.bind(this);
        this.pairringToggle = this.pairringToggle.bind(this);
        this.nodeRemove = this.nodeRemove.bind(this);
        this.nodeRename = this.nodeRename.bind(this);
    }

    componentDidMount() {
        console.log("RM componentDidMount");
    }
    componentWillUpdate() {
        console.log("RM Updating");
    }
    componentWillUnmount() {
        console.log("RM componentWillUnmount");

        this.mqttc.destroy();
    }

    render() {
        return (
            <div id="gateway">
                <div className="col-xs-12">
                    <header className="h4">{i18n.__("radio_manager")}</header>

                        <button type="button" className={"btn " + (this.state.pairing ? 'btn-danger' :  'btn-success')} onClick={this.pairringToggle} >
                        {i18n.__(this.state.pairing ? "Pairing stop" : "Pairing start")}
                        </button>

                        <div></div>

                        <table className="table table-bordered table-hover">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Alias</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                            {
                                this.state.nodes.map((item, index) => {
                                    return  <tr key={index}>
                                                <td>{item.id}</td>
                                                <td>
                                                    {this.state.editId == item.id ? <input type="text" class="form-control" value={item.alias}/> : item.alias}
                                                </td>
                                                <td>
                                                    <button onClick={() => this.nodeRename(item)} className="btn btn-warning">rename</button>
                                                    <button onClick={() => this.nodeRemove(item)} className="btn btn-danger">remove</button></td>
                                            </tr>
                                })
                            }
                            </tbody>
                        </table>
                </div>
            </div>
        )
    }

    /* START OF EVENT HANDLERS */
    get_nodes(e) {
      if (e) e.preventDefault();
      this.mqttc.publish('gateway/' + this.state.name + '/nodes/get', null);
    }

    pairringToggle(e) {
        if (e) e.preventDefault();
        console.log('pairringToggle');

        if (this.state.pairing) {
            this.mqttc.publish('gateway/' + this.state.name + '/pairing-mode/stop', null);
        }
        else {
            this.mqttc.publish('gateway/' + this.state.name + '/pairing-mode/start', null);
        }
    }

    nodeRemove(item) {
        console.log('nodeRemove', item);
        this.mqttc.publish('gateway/' + this.state.name + '/nodes/remove', JSON.stringify(item.id));
    }

    nodeRename(item) {
        this.setState(prev => { return { editId: item.id } })
    }
    /* END OF EVENT HANDLERS */
}
