import React, { Component } from "react";

export default class extends Component {
    constructor(props) {
        super(props);
        this.state = { visible: true }
    }

    render() {
        const { children } = this.props;
        return (
            <div id="navbar" >
                <aside className={this.state.visible ? "fade-in" : "fade-out"}>
                    <nav>
                        {children}
                    </nav>
                    <img src={require("../../assets/images/logo.png")} style={{ margin: 10, width: 120, alignSelf: "center" }} />
                </aside>
            </div>

        )
    }
}
