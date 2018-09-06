import React, { Component } from "react";
import ReactDOM from "react-dom";
import copy from 'copy-to-clipboard';

function formatTime(time) {
    return  time.toTimeString().split(' ')[0];
}

export default class extends Component {
    constructor(props) {
        super(props);
        this.state = {
            highlighted_messages: [],
            messages: props.model.getMesages(),
            subscribed_topics: props.model.getSubscribed(),
            isConnected: props.model.isConnect(),
            highlighted_messages: props.model.getHighlightedMessages(),
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
        let el = ReactDOM.findDOMNode(this._ref_messages.current);
        el.scrollTop = el.scrollHeight;
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

    onClickCopyTopic(message) {
        copy(message.topic, {
            debug: true,
            message: 'Press #{key} to copy',
          });
    }

    componentDidUpdate() {
        let el = ReactDOM.findDOMNode(this._ref_messages.current);
        el.scrollTop = el.scrollHeight;
    }

    render() {
        let  isHighlightedMessages = this.props.model.isHighlightedMessages;
        return (
            <div id="mqttlog">
                {this.state.highlighted_messages.length > 0 ? <div className="Console">
                    <ul>
                        {
                            this.state.highlighted_messages.map((item, index) => {
                                return (
                                    <li key={item.key}>
                                        <div>{formatTime(item.time)}&nbsp;<i title="Copy topic to Clipboard" onClick={() => this.onClickCopyTopic(item)} className="fa fa-clipboard" aria-hidden="true"></i>&nbsp;<span style={{ fontWeight: "bold" }}>{item.topic}&nbsp;</span></div>
                                        <div>{item.payload}</div>
                                        <div className="ConsoleButton"><i  title="remove" onClick={() => this.onClickRemove(item)} className="fa fa-remove" aria-hidden="true"></i></div>
                                    </li>
                                )
                            })
                        }
                    </ul>
                </div> : null}

                <div className="Console" ref={this._ref_messages} style={{height: "300px"}}>
                    <ul >
                        {
                            this.state.messages.map((item, index) => {
                                return (
                                    <li key={item.key}>
                                        <div>{formatTime(item.time)}&nbsp;<i title="Copy topic to Clipboard" onClick={() => this.onClickCopyTopic(item)} className="fa fa-clipboard" aria-hidden="true"></i>&nbsp;<span style={{ fontWeight: "bold" }}>{item.topic}&nbsp;</span></div>
                                        <div>{item.payload}</div>
                                        <div className="ConsoleButton">
                                            {isHighlightedMessages(item.topic) ? null :<i title="pinned topic" onClick={() => this.onClickAdd(item)} className="fa fa-thumb-tack" aria-hidden="true"></i>}
                                        </div>
                                    </li>)
                            })
                        }
                    </ul>
                </div>
                <form>
                    <div className="form-group">
                        <label className="control-label col-xs-1">
                            {this.state.checkbox ? "Publish mode" : "Subscribe mode"}
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
                                <input className="form-control" value={this.state.pub_topic} onChange={(e) => this.setState({ pub_topic: e.target.value })} type="text" placeholder="Enter topic to publish" />
                                <input className="form-control" value={this.state.pub_payload} onChange={(e) => this.setState({ pub_payload: e.target.value })} type="text" placeholder="Enter message to publish" />
                            </div>
                            <div className="col-xs-2">
                                <button disabled={!this.state.isConnected} onClick={this.onClickPublish} className="btn btn-default">Publish</button>
                            </div>
                        </div>
                        :
                        <div className="form-group">
                            <label className="control-label col-xs-1">Topic</label>
                            <div className="col-xs-8">
                                <input className="form-control" placeholder="Enter topic to subscribe" value={this.state.sub_topic} onChange={(e) => this.setState({ sub_topic: e.target.value })} type="text" />
                            </div>
                            <div className="col-xs-2">
                                <button disabled={!this.state.isConnected} onClick={this.onClickSubscribe} className="btn btn-default">Subscribe</button>
                            </div>
                        </div>
                    }
                </form>
                <header className="h4">Subscribed topics</header>
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
                <button disabled={!this.state.isConnected} onClick={this.onClickUnsubscribeAll} className="btn btn-danger">Unsubscribe all</button>
            </div>

        )
    }
}
