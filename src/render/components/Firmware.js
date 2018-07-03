import React, { Component, RaisedButton } from "react";
import { Button, Alert } from 'reactstrap';
const { ipcRenderer } = require("electron");
const { dialog } = require('electron').remote;

export default class extends Component {

    constructor(props) {
        super(props);

        console.log('firmware:constructor');

        this.state = {
            file: null,
            port: "",
            ports: [],
            erasse: 0,
            write: 0,
            verify: 0,
            error: null,
            done: false,
            isRun: false
        };

        this.ipcProgressUpdate = this.ipcProgressUpdate.bind(this);
        this.ipcPortsUpdate = this.ipcPortsUpdate.bind(this);
        this.ipcError = this.ipcError.bind(this);
        this.ipcDone = this.ipcDone.bind(this);
        this.openDialogBin = this.openDialogBin.bind(this);
        this.flash = this.flash.bind(this);
    }

    componentDidMount() {
        console.log('firmware:componentDidMount');

        ipcRenderer.addListener("firmware:progress", this.ipcProgressUpdate);

        ipcRenderer.addListener("firmware:port-list", this.ipcPortsUpdate);

        ipcRenderer.addListener("firmware:error", this.ipcError);

        ipcRenderer.addListener("firmware:done", this.ipcDone);

        ipcRenderer.send("firmware:get-port-list");
    }

    componentWillUnmount() {
        console.log('firmware:componentWillUnmount');

        ipcRenderer.removeListener("firmware:progress", this.ipcProgressUpdate);

        ipcRenderer.removeListener("firmware:port-list", this.ipcPortsUpdate);

        ipcRenderer.removeListener("firmware:error", this.ipcError);

        ipcRenderer.removeListener("firmware:done", this.ipcDone);
    }

    ipcProgressUpdate(sender, payload) {
        this.setState(payload);
    }

    ipcPortsUpdate(sender, ports) {

        console.log('ipcPortsUpdate',  ports);

        this.setState({ports:ports});

        if ((this.state.port === "") && (ports.length > 0)) {
            this.setState({port:ports[0].comName});
        }
    }

    ipcError(sender, error) {
        this.setState({error: error, isRun: false});
    }

    ipcDone(sender, payload) {
        this.setState({done: true, isRun: false});
    }

    openDialogBin(e) {
        e.preventDefault();
        e.stopPropagation();

        dialog.showOpenDialog({properties: ['openFile']}, function (file) {
            console.log(file);
            if (file !== undefined) {
                this.setState({ file: file[0] });
            }
        }.bind(this));
    }

    flash() {
        this.setState({ erasse: 0, write: 0, verify: 0, error: null, done: false, isRun: true });

        ipcRenderer.send("firmware:run-flash", {file: this.state.file, port: this.state.port});
    }

    render() {
        return (
            <div id="firmware">

    <div className="form-group">
        <label htmlFor="formDeviceSelect">Device</label>
        <select className="form-control" id="formDeviceSelect" value={this.state.port} onChange={(e) => this.setState({ port: e.target.value })}>
        <option key={-1} value=""></option>
        {
            this.state.ports.map((port, index) => <option value={port.comName} key={index}>{port.comName}</option>)
        }
        </select>
    </div>

    <div className="form-group">
        <label htmlFor="formFileInput">Firmware</label>
        <button type="file" className="form-control-file" id="formFileInput" onClick={this.openDialogBin}>
            {(this.state.file ? this.state.file : "Choose File")}
        </button>
    </div>

     <Button color="primary" disabled={this.state.isRun || (!this.state.file)} onClick={this.flash}>Flash</Button>


<br />
<br />

{( this.state.error ?
<Alert color="danger">
    {this.state.error}
</Alert> : null )}

<div className="row">

    <div className="col-1">
    Erasse
    </div>

    <div className="col-9">
    <div className="progress">
        <div className="progress-bar progress-bar-striped" role="progressbar" style={{width: this.state.erasse + "%"}} aria-valuenow="10" aria-valuemin="0" aria-valuemax="100"></div>
    </div>
    </div>

</div>

<div className="row">
    <div className="col-1">
    Write
    </div>

    <div className="col-9">
    <div className="progress">
        <div className="progress-bar progress-bar-striped" role="progressbar" style={{width: this.state.write + "%"}} aria-valuenow="10" aria-valuemin="0" aria-valuemax="100"></div>
    </div>
    </div>

</div>

<div className="row">
    <div className="col-1">
    Verify
    </div>

    <div className="col-9">
    <div className="progress">
        <div className="progress-bar progress-bar-striped" role="progressbar" style={{width: this.state.verify + "%"}} aria-valuenow="10" aria-valuemin="0" aria-valuemax="100"></div>
    </div>
    </div>
</div>

{( this.state.done ?
<Alert color="success">
    Done
</Alert> : null )}

            </div>
        )
    }

}
