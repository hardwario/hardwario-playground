import React, { Component } from "react";
import PropTypes from 'prop-types'
import { withRouter } from "react-router-dom";
import { ipcRenderer, shell } from "electron";
import { Alert } from 'reactstrap';

class HomeComponent extends Component {
    static propTypes = {
        match: PropTypes.object.isRequired,
        location: PropTypes.object.isRequired,
        history: PropTypes.object.isRequired,
        path: PropTypes.string.isRequired,
    }

    constructor(props) {
        super(props);
        this.state = {
            hub_list : []
        }
    }

    componentDidMount() {
        console.log("Home componentDidMount");
        ipcRenderer.on("hub/list", (sender, hub_list) => {
            console.log('hub_list', hub_list);
            this.setState({ hub_list });
        });
        // ipcRenderer.send("hub/list/get");
    }

    componentWillUnmount() {
        console.log("Home componentWillUnmount");
        ipcRenderer.removeAllListeners("hub/list");
    }

    componentDidUpdate() {
        console.log("Home componentDidUpdate");
    }

    render() {
        const { location, path } = this.props;

        return (
        <div id="home" style={{display: location.pathname == path ? "block" : "none"}}>
            {this.state.hub_list.length ? <Alert color="primary">
                {this.state.hub_list.map((ip)=>{
                    return <div key={ip}>Found Raspberry PI click for open in browser <b style={{cursor:"pointer"}} onClick={()=>{shell.openExternal("http://" + ip);}}>{ip}</b></div>
                })}
            </Alert> : null}
            <iframe src="https://start.hardwario.com/" className="route" ></iframe>
        </div>)
    }
}

module.exports = withRouter(HomeComponent);
