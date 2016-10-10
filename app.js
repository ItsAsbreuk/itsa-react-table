"use strict";

import "purecss";

const React = require("react"),
    ReactDOM = require("react-dom"),
    Component = require("./lib/component-styled.jsx");

var data = [
        { id: "ga-3475", name: "gadget",   price: "$6.99", cost: "$5.99" },
        { id: "sp-9980", name: "sprocket", price: "$3.75", cost: "$3.25" },
        { id: "wi-0650", name: "widget",   price: "$4.25", cost: "$3.75" }
    ],
    columns = [
        "id",
        { key: "name", label: "part name" },
        { key: "price", allowHTML: true, emptyCellValue: "<em>(not set)</em>" },
        "cost"
    ];

const props = {
    className: 'pure-table pure-table-striped',
    columns,
    data,
    rowHeader: true
};

ReactDOM.render(
    <Component {...props} />,
    document.getElementById("component-container")
);