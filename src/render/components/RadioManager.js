import React, { Component } from "react";
import { Button, FormGroup, Label } from 'reactstrap';

export default class extends Component {
    constructor(props) {
        super(props);

        this.state = {
            gatewayStatus: props.model.isGatewayConnect(),
            mqttConnect: props.model.isMqttConnect(),
            nodes: props.model.getNodes(),
            pairing: props.model.getIsPairingModeStart(),
            editId: null,
            editValue: "",
        };

        this.textInput = React.createRef();

        this.onMqttConnect = this.onMqttConnect.bind(this);
        this.onConnect = this.onConnect.bind(this);
        this.onNodes = this.onNodes.bind(this);
        this.onPairingMode = this.onPairingMode.bind(this);
        this.onCLickPairingBtn = this.onCLickPairingBtn.bind(this);

        this.nodeRemove = this.nodeRemove.bind(this);
        this.setEditId = this.setEditId.bind(this);
        this.saveAlias = this.saveAlias.bind(this);
        this.renameInputKeyPress = this.renameInputKeyPress.bind(this);
    }

    componentDidMount() {
        console.log("RadioManager:componentDidMount");
        this.props.model.on('mqttConnect',  this.onMqttConnect);
        this.props.model.on('connect',  this.onConnect);
        this.props.model.on('nodes',  this.onNodes);
        this.props.model.on("pairing-mode", this.onPairingMode);
    }

    componentWillUnmount() {
        console.log("RadioManager:componentWillUnmount");
        this.props.model.removeListener('mqttConnect', this.onMqttConnect);
        this.props.model.removeListener('connect',  this.onConnect);
        this.props.model.removeListener('nodes', this.onNodes);
        this.props.model.removeListener("pairing-mode", this.onPairingMode);
    }

    onMqttConnect(connect) {
        this.setState({mqttConnect: connect});
    }

    onConnect(connect) {
        this.setState({gatewayStatus: connect});
    }

    onNodes(nodes) {
        if (this.state.nodes.length != nodes.length){
            return this.setState({nodes});
        }
        for (let i=0, l=nodes.length; i < l; i++) {
            if ((this.state.nodes[i].id != nodes[i].id) || (this.state.nodes[i].alias != nodes[i].alias)) {
                return this.setState({nodes});
            }
        }
    }

    onPairingMode(pairing) {
        if (this.state.pairing != pairing) {
            this.setState({pairing});
        }
    }

    onCLickPairingBtn(e) {
        if (e) e.preventDefault();

        if (this.props.model.getIsPairingModeStart()) {
            this.props.model.pairringStop();
        } else {
            this.props.model.pairringStart();
        }
    }

    render() {
        const self = this;

        return (
            <div id="radiomanager" >
                <div className="col-xs-12">
                    <div className="form-group">
                        <button disabled={!this.state.gatewayStatus} type="button" className={"btn " + (this.state.pairing ? "btn-danger" : "btn-success")} onClick={this.onCLickPairingBtn}>
                            {this.state.pairing ? "Stop pairing" : "Start pairing"}
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
                                                    <button onClick={() => self.saveAlias() } className="btn btn-success">Save</button>
                                                    &nbsp;
                                                    <button onClick={() => self.setState({ editId: null }) } className="btn btn-warning">Cancel</button>
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
                                                <button onClick={() => self.setState({ editId: item.id }) } className="btn btn-warning">Rename</button>
                                                &nbsp;
                                                <button onClick={() => this.nodeRemove(item)} className="btn btn-danger">Remove</button>
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

    nodeRemove(item) {
        this.props.model.nodeRemove(item.id);
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
            this.props.model.nodeRename(this.state.editId, value);
        }
        this.setState({ editId: null });
    }

    renameInputKeyPress(event) {
        if (event.key === "Enter") {
            this.saveAlias();
        }
    }
}
