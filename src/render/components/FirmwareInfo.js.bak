import React, { Component } from "react";
import { Jumbotron, Card, CardBody, CardTitle } from 'reactstrap';

export default class extends Component {
    constructor(props) {
        super(props);

        console.log('FirmwareInfo:constructor', props);

        this.state = {
        }
    }

    render() {
        if (!this.props.firmware || !this.props.firmware.name) return null;

        return (
            <Jumbotron>
                <bold>{this.props.firmware.name}</bold>

            </Jumbotron>
        );
    }
}
