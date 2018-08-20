import React, { Component } from "react";
import Gateway from "./Gateway";
import RadioManager from "./RadioManager";

export default class extends Component {

    constructor(props) {
        super(props);
    }

    render() {
        return (
            <div id="devices">
                <Gateway />
                <RadioManager model={this.props.model} />
            </div>
        )
    }
}
