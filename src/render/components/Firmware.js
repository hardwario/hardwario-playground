import React, { Component, RaisedButton } from "react";
import { Button, Alert, Progress } from 'reactstrap';
const { ipcRenderer, shell } = require("electron");
const { dialog } = require('electron').remote;
import Select from 'react-select';

const youtubeUrlRegex = /^(?:(?:https?:)?\/\/)?(?:www\.)?(?:m\.)?(?:youtu(?:be)?\.com\/(?:v\/|embed\/|watch(?:\/|\?v=))|youtu\.be\/)((?:\w|-){11})(?:\S+)?$/;

function isYoutubeUrl(url) {
    return !!String(url).match(youtubeUrlRegex);
}

function getYoutubeVideoUrl(url) {
    var match = youtubeUrlRegex.exec(url);

    if (match) {
        return "https://www.youtube.com/embed/" + match[1];
    }

    return null;
}

function openExternal(e) {
    e.preventDefault()
    shell.openExternal(e.target.href)
}

export default class extends Component {

    constructor(props) {
        super(props);

        console.log('firmware:constructor');

        this.state = {
            file: null,
            port: "",
            ports: [],
            erase: 0,
            write: 0,
            verify: 0,
            error: null,
            done: false,
            isRun: false,
            list: [],
            firmware: null,
            download: 0,
            version: null,
            custom: {name:null}
        };

        this.ipcProgressUpdate = this.ipcProgressUpdate.bind(this);
        this.ipcPortsUpdate = this.ipcPortsUpdate.bind(this);
        this.ipcError = this.ipcError.bind(this);
        this.ipcDone = this.ipcDone.bind(this);
        this.openDialogBin = this.openDialogBin.bind(this);
        this.flash = this.flash.bind(this);
        this.ipcList = this.ipcList.bind(this);
        this.ipcDownload = this.ipcDownload.bind(this);
        this.formFirmwareSelectOnChange = this.formFirmwareSelectOnChange.bind(this);
        this.formVersionSelectOnChange = this.formVersionSelectOnChange.bind(this);
        this.formFirmwareSelectonInputChange = this.formFirmwareSelectonInputChange.bind(this);
    }

    componentDidMount() {
        console.log('firmware:componentDidMount');

        ipcRenderer.addListener("firmware:progress", this.ipcProgressUpdate);

        ipcRenderer.addListener("firmware:port-list", this.ipcPortsUpdate);

        ipcRenderer.addListener("firmware:error", this.ipcError);

        ipcRenderer.addListener("firmware:done", this.ipcDone);

        ipcRenderer.addListener("firmware:list", this.ipcList);

        ipcRenderer.addListener("firmware:download", this.ipcDownload);

        ipcRenderer.send("firmware:get-port-list");

        ipcRenderer.send("firmware:get-list");
    }

    componentWillUnmount() {
        console.log('firmware:componentWillUnmount');

        ipcRenderer.removeListener("firmware:progress", this.ipcProgressUpdate);

        ipcRenderer.removeListener("firmware:port-list", this.ipcPortsUpdate);

        ipcRenderer.removeListener("firmware:error", this.ipcError);

        ipcRenderer.removeListener("firmware:done", this.ipcDone);

        ipcRenderer.removeListener("firmware:list", this.ipcList);

        ipcRenderer.removeListener("firmware:download", this.ipcDownload);

        if (this.timer) {
            clearTimeout(this.timer);
        }
    }

    ipcDownload(sender, payload) {
        this.setState({download: payload.percent});
    }

    ipcList(sender, list) {
        // console.log(list);
        this.setState({list});
    }

    ipcProgressUpdate(sender, payload) {
        console.log("ipcProgressUpdate", payload);
        this.setState(payload);
    }

    ipcPortsUpdate(sender, ports) {

        console.log('ipcPortsUpdate',  ports);

        this.setState({ports:ports});

        if ((this.state.port === "") && (ports.length > 0)) {
            this.setState({port:ports[0].path});
        }

        this.timer = setTimeout(() => {
            ipcRenderer.send("firmware:get-port-list");
        }, 1000);
    }

    ipcError(sender, error) {
        this.setState({error: error, isRun: false});

        ipcRenderer.send("firmware:get-port-list");
    }

    ipcDone(sender, payload) {
        this.setState({done: true, isRun: false});

        ipcRenderer.send("firmware:get-port-list");
    }

    openDialogBin(e) {
        e.preventDefault();
        e.stopPropagation();

        dialog.showOpenDialog({properties: ['openFile'], filters: [{name: '.bin', extensions: ['bin']}]}, function (file) {
            console.log(file);
            if (file !== undefined) {
                // this.setState({ file: file[0] });
                this.setState({ custom: {name: file[0] } });
                this.setState({ firmware: this.state.custom });
            }
        }.bind(this));
    }

    flash() {
        if (this.state.isRun) {
            return;
        }

        if (this.timer) {
            clearTimeout(this.timer);
        }

        let params = {firmware: this.state.firmware.name, port: this.state.port};

        if (this.state.version) {
            params.version = this.state.version.name;
        }

        this.setState({ erase: 0, write: 0, verify: 0, error: null, done: false, isRun: true, download: 0 });

        ipcRenderer.send("firmware:run-flash", params);
    }

    formFirmwareSelectOnChange(firmware) {
        console.log(firmware);
        this.setState({ firmware, version: {name: "latest"} });
    }

    formFirmwareSelectonInputChange(input) {
        if (!input || input.startsWith("https://") || (input.endsWith(".bin") && input != ".bin")) {
            this.setState({ custom: {name: input} });
        }
    }

    formVersionSelectOnChange(version) {
        this.setState({ version });
    }

    render() {
        return (
            <div id="firmware">

    <div className="row">
        <div className="form-group col-10">
            <label htmlFor="formFirmwareSelect">Firmware</label>
            <Select
            labelKey="name"
            options={[...this.state.list, this.state.custom]}
            placeholder="Choose firmware ..."
            searchable={true}
            onChange={this.formFirmwareSelectOnChange}
            value={this.state.firmware}
            optionRenderer={(item, index)=>{
                return (<span> {item.name} </span>);
            }}
            onInputChange={this.formFirmwareSelectonInputChange}
            style={{"paddingLeft":"-10px"}}
            />
            <button color="primary" size="sm" className="openDialogBtn" onClick={this.openDialogBin} >...</button>
        </div>

        <div className="form-group col-2">
            <label htmlFor="formFirmwareSelect">Version</label>
            <Select
                labelKey="name"
                placeholder="Choose version ..."
                options={this.state.firmware && this.state.firmware.versions ? [{name: "latest"}, ...(this.state.firmware.versions)] : []}
                value={this.state.version}
                onChange={this.formVersionSelectOnChange}
                disabled={!this.state.firmware}
                clearable={false}
            />
        </div>
    </div>

    {/* <div className="form-group">
        <label htmlFor="formFileInput">Firmware</label>
        <button type="file" className="form-control-file" id="formFileInput" onClick={this.openDialogBin}>
            {(this.state.file ? this.state.file : "Choose File")}
        </button>
    </div> */}

<div className="row">
    <div className="col-3">
        <label>Device</label>

        <select className="form-control mb-2" id="formDeviceSelect" disabled={this.state.isRun} value={this.state.port} onChange={(e) => this.setState({ port: e.target.value })}>
            {this.state.ports.length == 0 ? <option>(no device available)</option> : null }
            {
                this.state.ports.map((port, index) => <option value={port.path} key={index}>{port.path}{port.serialNumber ? " " + port.serialNumber : null}</option>)
            }
        </select>

        <Button color="danger" className="col-12" disabled={!this.state.ports.length || this.state.isRun || (!this.state.file && !this.state.firmware)} onClick={this.flash}>Flash firmware</Button>
    </div>

    <div className="col-9">

    {this.state.download ?
    (<div className="row">
        <div className="col-2">
        <label>Download</label>
        </div>
        <div className="col-10">
            <Progress value={this.state.download} striped color="info"/>
        </div>
    </div>
    ): <label>&nbsp;</label>}

    <div className="row">
        <div className="col-2">
        <label>Erase</label>
        </div>
        <div className="col-10">
            <Progress value={this.state.erase}  striped striped color="danger"/>
        </div>
    </div>

    <div className="row">
        <div className="col-2">
        <label>Write</label>
        </div>
        <div className="col-10">
            <Progress value={this.state.write} striped color="warning"/>
        </div>
    </div>

    <div className="row">
        <div className="col-2">
        <label>Verify</label>
        </div>
        <div className="col-10">
            <Progress value={this.state.verify} striped color="success"/>
        </div>
    </div>

    </div>
</div>

    {this.state.error ?
    <Alert color="danger">
        {this.state.error}
    </Alert> : null }

    {this.state.done ?
    <Alert color="success">
        Done
    </Alert> : null }

    {this.state.firmware ?
    <div className="row firmware-detail">

        <div className="form-group col-6">

            {this.state.firmware.description ? <div>
            <label>Description</label>
            <p>{this.state.firmware.description}</p>
            </div> : null }

            {this.state.firmware.article ? <div>
            <label>Article</label>
            <p><a href={this.state.firmware.article} onClick={openExternal}>{this.state.firmware.article}</a></p>
            </div> : null }

            {this.state.firmware.video ? <div>
            <label>Video</label>
            <p><a href={this.state.firmware.video} onClick={openExternal}>{this.state.firmware.video}</a></p>
            </div> : null }

            {this.state.firmware.repository ? <div>
            <label>Repository</label>
            <p><a href={this.state.firmware.repository} onClick={openExternal}>{this.state.firmware.repository}</a></p>
            </div> : null }

        </div>

        <div className="form-group col-6">
            {this.state.firmware.images ? <img src={this.state.firmware.images[0].url} alt={this.state.firmware.images[0].title} /> : null}

            {this.state.firmware.video ? <div>
                {isYoutubeUrl(this.state.firmware.video) ?
                <iframe src={getYoutubeVideoUrl(this.state.firmware.video)} frameBorder="0" allow="encrypted-media" allowFullScreen="1"></iframe>
                : <a href={this.state.firmware.video} onClick={openExternal}>{this.state.firmware.video}</a>}
            </div> : null}
        </div>

        { (this.state.firmware.articles && this.state.firmware.articles.length > 0) ?
        <div className="row col-12">
            <div className="col-12">
            <label>Articles</label>
            </div>
            <ul className="list-unstyled col-12">
            {
                this.state.firmware.articles.map((article, index) => {
                    return (
                        <li class="media">
                        { (article.video && article.video.length > 0) ?
                            isYoutubeUrl(article.video) ?
                                <iframe class="mr-3" src={getYoutubeVideoUrl(article.video)} frameBorder="0" allow="encrypted-media" allowFullScreen="1"></iframe>
                                : <video class="mr-3" src={article.video} controls preload="metadata"></video>

                        : (article.images && article.images.length > 0) ?
                            <img class="mr-3" src={article.images[0].url} alt="{article.images[0].title}"/>
                            : null
                        }
                        <div class="media-body">
                            <h5 class="mt-0"><a href={article.url} onClick={openExternal}>{article.title}</a></h5>
                            {article.description}
                        </div>
                        </li>
                    )
                })
            }
            </ul>
        </div> : null}

    </div> : null}

        </div>)
    }

}
