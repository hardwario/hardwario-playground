import React, { Component } from "react";
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
    }

    render() {
        const { location, path, src } = this.props

        return (
            <iframe src={src} style={{display: location.pathname == path ? "block" : "none"}} className="route"></iframe>
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
