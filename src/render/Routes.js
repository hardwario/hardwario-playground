import React from "react";
import { Provider } from "react-redux";
import { createStore, applyMiddleware } from "redux";
import { HashRouter, Route, Switch, NavLink } from "react-router-dom";

import reducers from "./reducers";
import Home from "./components/Home";
import First from "./components/First";

const createStoreWithMiddleware = applyMiddleware()(createStore);


export default (
    <Provider store={createStoreWithMiddleware(reducers)}>
        <HashRouter>
            <div>
                <Route path="/" exact component={Home} />
                <Route path="/test" component={First} />
            </div>
        </HashRouter>
    </Provider>
);