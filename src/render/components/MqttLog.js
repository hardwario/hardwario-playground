import React, { Component } from "react";
import { ipcRenderer } from "electron";

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
    }

    componentDidMount() {
        ipcRenderer.send("mqtt:window:subscribe");
        //ipcRenderer.on("mqtt:client:subscribed", (topics) => this.setState({ subscribed_topics: topics }))
        //ipcRenderer.on("mqtt:client:history", (history) => this.setState({ messages: history }))
        ipcRenderer.on("mqtt:client:connected", (sender, connected) => {
            this.setState({ isConnected: connected })
        })
        ipcRenderer.on("mqtt:client:message", (sender, message) => {
            this.setState(prev => { return { messages: [...prev.messages, { ...message }] } })
        })
    }
    componentWillUpdate() {
        console.log("Updating");
    }
    componentWillUnmount() {
        ipcRenderer.send("mqtt:window:unsubscribe");
        ipcRenderer.removeAllListeners("mqtt:client:connected");
        ipcRenderer.removeAllListeners("mqtt:client:message");
    }

    render() {
        return (
            <div id="mqttlog">
                <div className="col-xs-12">
                    <header className="h4">MQTT log</header>
                    <div className="Console">
                        <ul>
                            {
                                this.state.highlighted_messages.map((item, index) => {
                                    return <li key={index}><div>{item.time}&nbsp;{item.topic}</div><div>{item.payload}</div><div><button onClick={() => this.onRemove(item)} className="btn btn-danger">-</button></div></li>
                                })
                            }
                        </ul>
                        {this.state.highlighted_messages.length > 0 ? <hr /> : null}
                        <ul >
                            {
                                this.state.messages.map((item, index) => {
                                    return <li key={index}><div>{item.time}&nbsp;{item.topic}</div><div className="col-xs-4 ConsoleOutputItem">{item.payload}</div><div >
                                        {this.state.highlighted_messages.find(x => item.topic == x.topic) == null ? <button onClick={x => this.onAdd(item)} className="btn btn-success ConsoleOutputAdd">+</button> : null}</div></li>
                                }).reverse()
                            }
                        </ul>
                    </div>
                    <form>
                        <div className="form-group">
                            <label className="control-label col-xs-1">
                                {this.state.checkbox ? "Publish mode" : "Subsribe mode"}
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
                                <label className="control-label col-xs-1">Payload</label>
                                <div className="col-xs-8">
                                    <input className="form-control" value={this.state.pub_topic} onChange={(e) => this.setState({ pub_topic: e.target.value })} type="text" placeholder="Enter topic to sub" />
                                    <input className="form-control" value={this.state.pub_payload} onChange={(e) => this.setState({ pub_payload: e.target.value })} type="text" placeholder="Enter message to pub" />
                                </div>
                                <div className="col-xs-2">
                                    <button disabled={!this.state.isConnected} onClick={this.onPublish.bind(this)} className="btn btn-default Stretch">Publish</button>
                                </div>
                            </div>
                            :
                            <div className="form-group">
                                <label className="control-label col-xs-1">Topic</label>
                                <div className="col-xs-8">
                                    <input className="form-control" placeholder="Enter topic to subscribe" value={this.state.sub_topic} onChange={(e) => this.setState({ sub_topic: e.target.value })} type="text" />
                                </div>
                                <div className="col-xs-2">
                                    <button disabled={!this.state.isConnected} onClick={this.onSubscribe.bind(this)} className="btn btn-default Stretch">Subscribe</button>
                                </div>
                            </div>
                        }
                    </form>
                </div>
                <div className="col-xs-12">
                    <header className="h4">Subscribed topics</header>
                    <div className="Console">
                        <ul>
                            {
                                this.state.subscribed_topics.map((topic, index) => {
                                    return (
                                        <li key={index}>
                                            <div className="col-xs-10">{topic}</div>
                                            <div className="col-xs-1 ConsoleOutputItem"><button onClick={() => this.onUnsubscribeOne(topic)} className="btn btn-danger ConsoleOutputAdd">-</button></div>
                                        </li>
                                    )
                                })
                            }
                        </ul>
                    </div>
                    <button disabled={!this.state.isConnected} onClick={x => this.onUnsubscribeAll(this.state.subscribed_topics)} className="btn btn-danger Stretch">Unsubscribe all</button>
                </div>
            </div>
        )
    }

    /* START OF EVENT HANDLERS */
    onSubscribe(e) {
        e.preventDefault();
        if (this.state.subscribed_topics.find(item => item == this.state.sub_topic) != null) {
            return;
        }
        this.setState(prev => { return { subscribed_topics: [...prev.subscribed_topics, this.state.sub_topic] } });
        ipcRenderer.send("mqtt:client:subscribe", this.state.sub_topic);
    }
    onPublish(e) {
        e.preventDefault();
        if (this.state.pub_topic == "") {
            return;
        }
        ipcRenderer.send("mqtt:client:publish", { topic: this.state.pub_topic, payload: this.state.pub_payload })
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
            ipcRenderer.send("mqtt:client:unsubscribe", topic);
        })
        this.setState({ subscribed_topics: [] })
    }
    onUnsubscribeOne(topic) {
        ipcRenderer.send("mqtt:client:unsubscribe", topic);
        this.setState(prev => {
            return { subscribed_topics: prev.subscribed_topics.filter((item) => item != topic) }
        })
    }
    /* END OF EVENT HANDLERS */
}
