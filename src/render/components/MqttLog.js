import React, { Component } from "react";
import ReactDOM from "react-dom";
import copy from 'copy-to-clipboard';
import { ToastContainer, toast } from 'react-toastify';

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
        this.onClickClear = this.onClickClear.bind(this);
        this._handleKeyDownPub = this._handleKeyDownPub.bind(this);
        this._handleKeyDownSub = this._handleKeyDownSub.bind(this);
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

    onClickClear() {
        this.props.model.clear();
    }

    onClickCopyTopic(message) {
        copy(message.topic, {
            debug: true,
            message: 'Press #{key} to copy',
          });
        toast.success("Copied to clipboard: " + message.topic);
    }

    _handleKeyDownPub(event) {
        if (event.key === 'Enter') {
            this.onClickPublish(event);
        }
    }

    _handleKeyDownSub() {
        if (event.key === 'Enter') {
            this.onClickSubscribe(event);
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

                <div className="messagesLog" ref={this._ref_messages}>
                    <ul >
                        {
                            this.state.messages.map((item, index) => {
                                return (
                                    <li key={item.key}>
                                        <div>
                                            {formatTime(item.time)}&nbsp;
                                            <i title="Copy topic to Clipboard" onClick={() => this.onClickCopyTopic(item)} className="fa fa-clipboard" aria-hidden="true"></i>&nbsp;
                                            <span onClick={() => this.onClickCopyTopic(item)} style={{ fontWeight: "bold" }}>{item.topic}&nbsp;</span>
                                        </div>
                                        <div>{item.payload}</div>
                                        <div className="ConsoleButton">
                                            {isHighlightedMessages(item.topic) ? null :<i title="pinned topic" onClick={() => this.onClickAdd(item)} className="fa fa-thumb-tack" aria-hidden="true"></i>}
                                        </div>
                                    </li>)
                            })
                        }
                    </ul>
                </div>

                {this.state.highlighted_messages.length > 0 ? <div className="highlightedMessages">
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

                <button onClick={this.onClickClear} className="btn btn-secondary btn-sm float-right btnClear" >Clear all messages</button>

                <div className="bottomLog">

                <header className="h4">Publish message</header>
                <div className="input-group mb-3 input-group-sm">
                    <input className="form-control" value={this.state.pub_topic} onChange={(e) => this.setState({ pub_topic: e.target.value })} onKeyDown={this._handleKeyDownPub} type="text" placeholder="Enter topic to publish" />
                    <input className="form-control" value={this.state.pub_payload} onChange={(e) => this.setState({ pub_payload: e.target.value })} onKeyDown={this._handleKeyDownPub} type="text" placeholder="Enter payload to publish" />
                    <button disabled={!this.state.isConnected} onClick={this.onClickPublish} className="btn btn-primary btn-sm">Publish</button>
                </div>

                <header className="h4">Subscribed topics</header>
                <div className="input-group input-group-sm">
                    <input type="text" className="form-control" placeholder="Enter topic to subscribe" value={this.state.sub_topic} onChange={(e) => this.setState({ sub_topic: e.target.value })} onKeyDown={this._handleKeyDownSub} type="text" />
                    <div className="input-group-append">
                        <button type="submit" className="btn btn-primary mb-2" disabled={!this.state.isConnected} onClick={this.onClickSubscribe} >Subscribe</button>
                    </div>
                </div>
                <div className="subTable">
                    <ul>
                        {
                            this.state.subscribed_topics.map((topic, index) => {
                                return (
                                    <li key={index}>
                                        <div>{topic}</div>
                                        <div className="ConsoleButton"><i  title="remove" onClick={() => this.onClickUnsubscribe(topic)} className="fa fa-remove" aria-hidden="true"></i></div>
                                    </li>
                                )
                            })
                        }
                    </ul>
                </div>
                </div>
            </div>

        )
    }
}
