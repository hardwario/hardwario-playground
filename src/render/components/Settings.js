import React, { Component } from "react";
import { ipcRenderer } from "electron";

// Import language files
const i18n = require("../../utils/i18n");

export default class extends Component {
    constructor(props) {
        super(props);
        this.state = {};
        this.settings = {};
        this._handleInput = this._handleInput.bind(this);
    }

    componentDidMount() {
        ipcRenderer.on("settings/all", (sender, settings) => {
            this.setState({ ...settings });
            this.settings = settings;
        });
        ipcRenderer.send("settings/getAll");
    }

    componentWillUnmount() {
        ipcRenderer.removeAllListeners("settings/all");
    }

    save() {
        alert("Docasne nefunguje");
    }

    render() {
        if (this.state === {}) {
            return null;
        }

        return (
            <div id="settings">

            <div className="form-group">
                <label>{i18n.__("Languages")}</label>
                <select className="form-control mb-2"  value={this.state.language} onChange={(e) => this.setState({ language: e.target.value })}>
                    {
                        ["en", "cs"].map((lang, index) => <option value={lang} key={index}>{lang}</option>)
                    }
                </select>
            </div>

            <button className="btn" onClick={this.save}>{i18n.__("Save")}</button>

                {/* <ul>{
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
                                                    <input onChange={(e) => this._handleInput(item, subItem, e.target.value)} id={item + subItem} value={this.state.settings[item][subItem]} className="form-control" />
                                                </div>
                                            )
                                        };
                                    })
                                }
                            </li>
                        )
                    })
                }</ul>
                <button className="btn" onClick={() => ipcRenderer.send("settings:set", this.state.settings)}>{i18n.__("save")}</button> */}
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
        else {
            newObject[category][subCategory] = value;
        }
        this.setState(newObject);
    }
}
