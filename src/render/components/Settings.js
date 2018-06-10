import React, { Component } from "react";
import { ipcRenderer } from "electron";

// Import language files
const i18n = require("../../utils/i18n");

export default class extends Component {
    constructor(props) {
        super(props);
        this.state = { settings: null };
        this._handleInput = this._handleInput.bind(this);
    }

    componentDidMount() {
        ipcRenderer.on("settings:get", (sender, settings) => {
            this.setState({ settings });
        });
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
            <div id="settings">
                <ul>{
                    Object.keys(this.state.settings).map((item, index) => {
                        var sub = Object.keys(this.state.settings[item]);
                        return (
                            <li key={index} >
                                <header>{i18n.__(item)}</header>{
                                    sub.map((subItem, subIndex) => {
                                        var carry = this.state.settings[item][subItem];
                                        if (Array.isArray(carry)) {
                                            return (
                                                <div key={item + subItem} className="form-group">
                                                    <label htmlFor={item + subItem}>{i18n.__(subItem)}</label>
                                                    <select
                                                        className="form-control"
                                                        id={item + subItem}
                                                        onChange={(e) => this._handleInput(item, subItem, e.target.value)}
                                                        value={this.state.settings[item][subItem][0]}>{
                                                            carry.map((select, selectIndex) => <option key={selectIndex} value={select}>{i18n.__(select)}</option>)
                                                        }</select>
                                                </div>
                                            )
                                        }
                                        else {
                                            return (
                                                <div key={item + subItem} className="form-group">
                                                    <label htmlFor={item + subItem}>{i18n.__(subItem)}</label>
                                                    <input id={item + subItem} value={this.state.settings[item][subItem][0]} className="form-control" />
                                                </div>
                                            )
                                        };
                                    })
                                }
                            </li>
                        )
                    })
                }</ul>
                <button className="btn" onClick={() => ipcRenderer.send("settings:set", this.state.settings)}>{i18n.__("save")}</button>
            </div>
        )
    }

    _handleInput(category, subCategory, value) {
        var newObject = { ...this.state.settings };
        var element = newObject[category][subCategory]
        if (Array.isArray(element)) {
            element.splice(element.indexOf(value), 1);
            element.unshift(value);
        }
        this.setState(newObject);
    }
}
