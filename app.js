"use strict";

import "purecss";

const React = require("react"),
    ReactDOM = require("react-dom"),
    Component = require("./lib/component-styled.jsx");

var data = [
        { id: "ga-3475", name: "gadget",   price: "$6.99", cost: 5.99 },
        { id: "sp-9980", name: "sprocket", price: "$3.75", cost: 0 },
        { id: "wi-0650", name: "widget",   price: "$4.25", cost: 3.75 }
    ],
    columns = [
        "id",
        { key: "name", label: "part name" },
        "price",
        "cost"
    ];

const changeData = newData => {
    props.data = newData.itsa_deepClone();
    renderTable(props);
};

const onChangeCell = (cells, editValueBeforeBlur) => {
    console.warn('app onchangecells', cells, editValueBeforeBlur);
    let newData = props.data.itsa_deepClone();
    cells.forEach(obj => {
        newData[obj.row][obj.field] = editValueBeforeBlur;
    });
    props.data = newData;
    renderTable(props);
};

let props = {
    autoFocus: true,
    disabled: false,
    tableClass: 'pure-table pure-table-striped',
    extendableX: true,
    extendableY: "full",
    removeableY: true,
    cursorNav: true,
    loop: false,
    columns,
    data,
    rowHeader: true,
    editable: "full",
    fixedHeaders: true,
    // editableCols: [1, 3],
    onChange: changeData,
    onChangeCell: onChangeCell,
    multiEdit: true
};

const renderTable = props => {
    ReactDOM.render(
        <Component {...props} />,
        document.getElementById("component-container")
    );
};

renderTable(props);