import React, { Component } from "react";
import ReactDOM from "react-dom";
const i18n = require("../../utils/i18n");

function formatTime(time) {
    return time.getHours() + ":" + time.getMinutes() + ":" + time.getSeconds();
}

export default class extends Component {
    constructor(props) {
        super(props);
        this.state = {
            highlighted_messages: [],
            messages: props.model.getMesages(),
            subscribed_topics: props.model.getSubscribed(),
            isConnected: props.model.isConnect(),
            checkbox: false,
            sub_topic: "",
            pub_topic: "",
            pub_payload: ""
        };

        this._ref_messages = React.createRef();

        this.onClickSubscribe = this.onClickSubscribe.bind(this);
        this.onClickUnsubscribeAll = this.onClickUnsubscribeAll.bind(this);
        this.onClickPublish = this.onClickPublish.bind(this);
        this.onClickUnsubscribe = this.onClickUnsubscribe.bind(this);
        this.onConnect = this.onConnect.bind(this);
        this.onMessage = this.onMessage.bind(this);
        this.onSubscribeChange = this.onSubscribeChange.bind(this);
    }

    componentDidMount() {
        console.log("RadioManager:componentDidMount");
        this.props.model.on('connect', this.onConnect);
        this.props.model.on('message', this.onMessage);
        this.props.model.on('subscribe', this.onSubscribeChange);
        this.props.model.on('unsubscribe', this.onSubscribeChange);
    }
    componentWillUnmount() {
        console.log("RadioManager:componentWillUnmount");
        this.props.model.removeListener('connect', this.onConnect);
        this.props.model.removeListener('message', this.onMessage);
        this.props.model.removeListener('subscribe', this.onSubscribeChange);
        this.props.model.removeListener('unsubscribe', this.onSubscribeChange);
    }

    onConnect(connect) {
        this.setState({isConnected: connect});
    }

    onMessage(message) {
        this.setState({
            messages: this.props.model.getMesages(),
            highlighted_messages: this.props.model.getHighlightedMessages()
        });
    }

    onSubscribeChange(topic) {
        this.setState({subscribed_topics: this.props.model.getSubscribed()});
    }

    onClickSubscribe(e) {
        e.preventDefault();
        this.props.model.subscribe(this.state.sub_topic);
    }

    onClickUnsubscribe(topic) {
        this.props.model.unsubscribe(topic);
    }

    onClickUnsubscribeAll() {
        this.props.model.unSubscribeAll();
    }

    onClickPublish(e) {
        e.preventDefault();
        if (this.state.pub_topic == "") {
            return;
        }
        this.props.model.publish(this.state.pub_topic, this.state.pub_payload);
    }

    onClickAdd(message) {
        if (this.props.model.addHighlightedMessages(message)) {
            this.setState({
                highlighted_messages: this.props.model.getHighlightedMessages()
            });
        }
    }

    onClickRemove(message) {
        if (this.props.model.removeHighlightedMessages(message.topic)) {
            this.setState({
                highlighted_messages: this.props.model.getHighlightedMessages()
            });
        }
    }

    componentDidUpdate() {
        let el = ReactDOM.findDOMNode(this._ref_messages.current);
        el.scrollTop = el.scrollHeight;
    }

    render() {
        let  isHighlightedMessages = this.props.model.isHighlightedMessages;
        return (
            <div id="mqttlog">
                <div className="Console" ref={this._ref_messages}>
                    <ul>
                        {
                            this.state.highlighted_messages.map((item, index) => {
                                return (
                                    <li key={item.key}>
                                        <div>{formatTime(item.time)}&nbsp;<span style={{ fontWeight: "bold" }}>{item.topic}&nbsp;</span></div>
                                        <div>{item.payload}</div>
                                        <div className="ConsoleButton"><button onClick={() => this.onClickRemove(item)}>-</button></div>
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
                                    <li key={item.key}>
                                        <div>{formatTime(item.time)}&nbsp;<span style={{ fontWeight: "bold" }}>{item.topic}&nbsp;</span></div>
                                        <div>{item.payload}</div>
                                        <div className="ConsoleButton">
                                            {isHighlightedMessages(item.topic) ? null :<button onClick={() => this.onClickAdd(item)}>+</button>}
                                        </div>
                                    </li>)
                            })
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
                                <button disabled={!this.state.isConnected} onClick={this.onClickPublish} className="btn btn-default">{i18n.__("publish")}</button>
                            </div>
                        </div>
                        :
                        <div className="form-group">
                            <label className="control-label col-xs-1">{i18n.__("topic")}</label>
                            <div className="col-xs-8">
                                <input className="form-control" placeholder={i18n.__("enterTopicToSubscribe")} value={this.state.sub_topic} onChange={(e) => this.setState({ sub_topic: e.target.value })} type="text" />
                            </div>
                            <div className="col-xs-2">
                                <button disabled={!this.state.isConnected} onClick={this.onClickSubscribe} className="btn btn-default">{i18n.__("subscribe")}</button>
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
                                        <div className="ConsoleButton"><button onClick={() => this.onClickUnsubscribe(topic)}>-</button></div>
                                    </li>
                                )
                            })
                        }
                    </ul>
                </div>
                <button disabled={!this.state.isConnected} onClick={this.onClickUnsubscribeAll} className="btn btn-danger">{i18n.__("unSubscribeAll")}</button>
            </div>

        )
    }
}
