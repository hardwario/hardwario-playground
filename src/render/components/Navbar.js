import React, { Component } from "react";

export default class extends Component {
    constructor(props) {
        super(props);
        this.state = { visible: true }
    }
    render() {
        const { children } = this.props;

        console.log(this.state);

        return (
            <div id="navbar" >
                <navbar className={this.state.visible ? "fade-in" : "fade-out"}>
                    {children}
                </navbar>
                <div onClick={() => this.setState(prev => { return { visible: !prev.visible } })}>
                    <img src={ this.state.visible ? require("../../assets/images/arrow-left.jpg") : require("../../assets/images/arrow-right.jpg") } />
                </div>
            </div>

        )
    }
}
