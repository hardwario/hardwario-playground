import React, { Component } from "react";

export default class extends Component {

    handleMessage(event) {
        console.log("Path to firmware", event.data.path);
        window.location = "#/firmware/" + encodeURIComponent(event.data.path);
    }

    componentDidMount() {
        window.addEventListener("message", this.handleMessage);
    }

    componentWillUnmount() {
        window.removeEventListener("message", this.handleMessage);
    }

    render() {
        return (
            <iframe src="http://127.0.0.1:8000" width="100%" height="100%" />
        )
    }
}
