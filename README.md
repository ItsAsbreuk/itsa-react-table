[![Build Status](https://travis-ci.org/ItsAsbreuk/itsa-react-table.svg?branch=master)](https://travis-ci.org/ItsAsbreuk/itsa-react-table)

Editable React.js table.

This is the very first setup (0.0.1). It is working well, but there will probably be many updates.

Key features:
* editable
* focusable
* extendable


## How to use:

```js
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
        "price",
        "cost"
    ];

const changeData = newData => {
    props.data = newData;
    renderTable(props);
};

let props = {
    autoFocus: true,
    disabled: false,
    tableClass: 'pure-table pure-table-striped',
    extendableY: true,
    columns,
    data,
    rowHeader: true,
    editable: 'full',
    onChange: changeData
};

const renderTable = props => {
    ReactDOM.render(
        <Component {...props} />,
        document.getElementById("component-container")
    );
};

renderTable(props);
```

## About the css

You need the right css in order to make use of `itsa-react-table`. There are 2 options:

1. You can use the css-files inside the `css`-folder.
2. You can use: `Component = require("itsa-react-table/lib/component-styled.jsx");` and build your project with `webpack`. This is needed, because you need the right plugin to handle a requirement of the `scss`-file.


[View live example](http://projects.itsasbreuk.nl/react-components/itsa-table/component.html)

[API](http://projects.itsasbreuk.nl/react-components/itsa-react-table/api/)