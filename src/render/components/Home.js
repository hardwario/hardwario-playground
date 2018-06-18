import React, { Component } from "react";
const { __ } = require("../../utils/i18n");

export default () => {
    return (
        <div id="home">
            <h1>{__("Welcome to the Playground")}</h1>
        </div>
    )
};