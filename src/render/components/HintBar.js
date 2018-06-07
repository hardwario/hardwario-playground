import React, { Component } from "react";
const { ipcRenderer } = require("electron");

export default class extends Component {
    constructor(props) {
        super(props);
        this.state = { mqttLog: false };
    }
    componentDidMount() {

    }
    render() {
        return (
            <footer>WHAT HERE?</footer>
        )
    }
}