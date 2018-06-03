import React, { Component } from "react";
import { ipcRenderer } from "electron";

// Import language files
const i18n = require("../../utils/i18n");
i18n.setup();

export default class extends Component {
    constructor(props) {
        super(props);
        this.state = { settings: null };
    }

    componentDidMount() {
        ipcRenderer.on("settings:get", (sender, settings) => this.setState({ settings }));
        ipcRenderer.send("settings:get");
    }

    componentWillUnmount() {
        ipcRenderer.removeAllListeners("settings:get");
    }

    render() {
        if (this.state.settings == null) {
            return null;
        }
        return (
            <div>
                <ul>{
                    Object.keys(this.state.settings).map((item, index) => {
                        var sub = Object.keys(this.state.settings[item]);
                        return (
                            <li key={index}>
                                <header>{i18n.__(item)}</header>{
                                    sub.map((subItem, subIndex) => {
                                        var carry = this.state.settings[item][subItem];
                                        if (Array.isArray(carry)) {
                                            return (
                                                <select key={subIndex}>{
                                                    carry.map((select, selectIndex) => <option key={selectIndex} value={select}>{i18n.__(select)}</option>)
                                                }</select>
                                            )
                                        }
                                        else return "neni pole";
                                    })
                                }
                            </li>
                        )
                    })
                }</ul>
                <button className="btn">{i18n.__("save")}</button>
            </div>
        )
    }

    _createCard(item) {
        var keys = Object.keys(this.state.settings);
        return (
            <ul>
                {
                    keys.map((item, index) => {

                    })
                }
            </ul>
        )
    }
}