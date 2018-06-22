import React, { Component } from "react";
import { ipcRenderer } from "electron";
import clientMqtt from "../model/MQTT";

// Import language files
const i18n = require("../../utils/i18n");

export default class extends Component {
    constructor(props) {
        super(props);
        this.state = {
            highlighted_messages: [],
            messages: [],
            subscribed_topics: [],
            isConnected: false,
            checkbox: false,
            sub_topic: "",
            pub_topic: "",
            pub_payload: ""
        };
        this.onAdd = this.onAdd.bind(this);
        this.onRemove = this.onRemove.bind(this);
        this.onSubscribe = this.onSubscribe.bind(this);
        this.onUnsubscribeAll = this.onUnsubscribeAll.bind(this);
        this.onUnsubscribeOne = this.onUnsubscribeOne.bind(this);
        this.updateLocalState = this.updateLocalState.bind(this);
        this.onMqttMessage = this.onMqttMessage.bind(this);
        this.onMqttStatus = this.onMqttStatus.bind(this);
    }

    componentDidMount() {
        console.log("test");
        ipcRenderer.on("settings:get", (sender, settings) => {
            console.log("Konfigurace");
            this.client = new clientMqtt(settings.mqtt.remoteIp, this.onMqttMessage, this.onMqttStatus);
            ipcRenderer.removeAllListeners("settings:get");
        });
        ipcRenderer.send("settings:get");
    }
    componentWillUnmount() {
        this.client.disconnect();
    }

    render() {
        return (
            <div id="mqttlog">
                <div className="Console">
                    <ul>
                        {
                            this.state.highlighted_messages.map((item, index) => {
                                return (
                                    <li key={index}>
                                        <div>{item.time}&nbsp;<span style={{ fontWeight: "bold" }}>{item.topic}&nbsp;</span></div>
                                        <div>{item.payload}</div>
                                        <div className="ConsoleButton"><button onClick={() => this.onRemove(item)}>-</button></div>
                                    </li>
                                )
                            })
                        }
                    </ul>
                    {this.state.highlighted_messages.length > 0 ? <hr /> : null}
                    <ul >
                        {
                            this.state.messages.map((item, index) => {
                                return (
                                    <li key={index}>
                                        <div>{item.time}&nbsp;<span style={{ fontWeight: "bold" }}>{item.topic}&nbsp;</span></div>
                                        <div>{item.payload}</div>
                                        <div className="ConsoleButton">
                                            {this.state.highlighted_messages.find(x => item.topic == x.topic) == null ? <button onClick={x => this.onAdd(item)}>+</button> : null}
                                        </div>
                                    </li>)
                            }).reverse()
                        }
                    </ul>
                </div>
                <form>
                    <div className="form-group">
                        <label className="control-label col-xs-1">
                            {this.state.checkbox ? i18n.__("publishMode") : i18n.__("subscribeMode")}
                        </label>
                        <div className="col-xs-2">
                            <label className="switch">
                                <input type="checkbox" onChange={(event) => this.setState({ checkbox: event.target.checked })} />
                                <span className="slider round"></span>
                            </label>
                        </div>
                    </div>
                    {this.state.checkbox ?
                        <div className="form-group">
                            <label className="control-label col-xs-1">{i18n.__("payload")}</label>
                            <div className="col-xs-8">
                                <input className="form-control" value={this.state.pub_topic} onChange={(e) => this.setState({ pub_topic: e.target.value })} type="text" placeholder={i18n.__("enterTopicToPublish")} />
                                <input className="form-control" value={this.state.pub_payload} onChange={(e) => this.setState({ pub_payload: e.target.value })} type="text" placeholder={i18n.__("enterMessageToPublish")} />
                            </div>
                            <div className="col-xs-2">
                                <button disabled={!this.state.isConnected} onClick={this.onPublish.bind(this)} className="btn btn-default">{i18n.__("publish")}</button>
                            </div>
                        </div>
                        :
                        <div className="form-group">
                            <label className="control-label col-xs-1">{i18n.__("topic")}</label>
                            <div className="col-xs-8">
                                <input className="form-control" placeholder={i18n.__("enterTopicToSubscribe")} value={this.state.sub_topic} onChange={(e) => this.setState({ sub_topic: e.target.value })} type="text" />
                            </div>
                            <div className="col-xs-2">
                                <button disabled={!this.state.isConnected} onClick={this.onSubscribe.bind(this)} className="btn btn-default">{i18n.__("subscribe")}</button>
                            </div>
                        </div>
                    }
                </form>
                <header className="h4">{i18n.__("subscribedTopics")}</header>
                <div className="Console">
                    <ul>
                        {
                            this.state.subscribed_topics.map((topic, index) => {
                                return (
                                    <li key={index}>
                                        <div>{topic}</div>
                                        <div className="ConsoleButton"><button onClick={() => this.onUnsubscribeOne(topic)}>-</button></div>
                                    </li>
                                )
                            })
                        }
                    </ul>
                </div>
                <button disabled={!this.state.isConnected} onClick={x => this.onUnsubscribeAll(this.state.subscribed_topics)} className="btn btn-danger">{i18n.__("unSubscribeAll")}</button>
            </div>

        )
    }

    /* START OF EVENT HANDLERS */
    onMqttMessage(message) {
        console.log("new message", message);
        this.updateLocalState(message);
        this.setState(prev => { return { messages: [...prev.messages, { ...message }] } });
    }
    onMqttStatus(status) {
        console.log(status);
        this.setState({ isConnected: status })
    }

    onSubscribe(e) {
        e.preventDefault();
        if (this.state.subscribed_topics.find(item => item == this.state.sub_topic) != null) {
            return;
        }
        this.setState(prev => { return { subscribed_topics: [...prev.subscribed_topics, this.state.sub_topic] } });
        this.client.subscribe(this.state.sub_topic);
        //ipcRenderer.send("mqtt:client:subscribe", this.state.sub_topic);
    }
    onPublish(e) {
        e.preventDefault();
        if (this.state.pub_topic == "") {
            return;
        }
        //ipcRenderer.send("mqtt:client:publish", { topic: this.state.pub_topic, payload: this.state.pub_payload })
        this.client.publish(this.state.pub_topic, this.state.pub_payload);
    }
    onAdd(item) {
        this.setState((prevState) => { return { highlighted_messages: [...prevState.highlighted_messages, item] } });
    }
    onRemove(item) {
        this.state.highlighted_messages.findIndex((data) => data == item);
        this.setState((prevState) => { return { highlighted_messages: prevState.highlighted_messages.filter(x => x != item) } });
    }
    onUnsubscribeAll() {
        this.state.subscribed_topics.forEach((topic) => {
            //ipcRenderer.send("mqtt:client:unsubscribe", topic);
            this.client.unsubscribe(topic);
        })
        this.setState({ subscribed_topics: [] })
    }
    onUnsubscribeOne(topic) {
        //ipcRenderer.send("mqtt:client:unsubscribe", topic);
        this.client.unsubscribe(topic);
        this.setState(prev => {
            return { subscribed_topics: prev.subscribed_topics.filter((item) => item != topic) }
        })
    }
    /* END OF EVENT HANDLERS */

    /* START OF CARRY METHODS */
    updateLocalState(data) {
        var carryMessages = this.state.highlighted_messages.map((item) => {
            if (item.topic == data.topic) { return item = { ...data }; }
            return item;
        });

        this.setState({ highlighted_messages: carryMessages });
    }
    /* END OF CARRY METHODS */
}
