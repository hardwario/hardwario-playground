import React, { Component } from "react";
import { ipcRenderer } from "electron";
import { withRouter } from "react-router-dom";
import PropTypes from 'prop-types'

class RouteIframeComponent extends Component {
    static propTypes = {
        match: PropTypes.object.isRequired,
        location: PropTypes.object.isRequired,
        history: PropTypes.object.isRequired,
        path: PropTypes.string.isRequired,
        src: PropTypes.string.isRequired
    }

    constructor(props) {
        super(props);

        this.state = {visible: true};
    }

    componentDidMount() {
        if (this.props.id) {
            ipcRenderer.on("iframe:" + this.props.id + ":visible", (sender, visible)=>{ console.log("iframe:" + this.props.id + ":visible", visible); this.setState({visible}); });
        }
    }

    componentWillUnmount() {
        if (this.props.id) {
            ipcRenderer.removeAllListeners("iframe:" + this.props.id + ":visible");
        }
    }

    render() {
        const { location, path, src } = this.props

        return (this.state.visible ?
            <iframe src={src} style={{display: location.pathname == path ? "block" : "none"}} className="route" id={this.props.id} ></iframe>
            : null
        )
    }
}

export const RouteIframe = withRouter(RouteIframeComponent);

export const RouteWithProps = ({path, exact, strict, location, sensitive, component: Component, ...rest}) => (
	<Route
		path={path}
		exact={exact}
		strict={strict}
		location={location}
		sensitive={sensitive}
		render={props => <Component {...props} {...rest}/>}
	/>
);
