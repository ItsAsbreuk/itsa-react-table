"use strict";

/**
 * Description here
 *
 *
 *
 * <i>Copyright (c) 2016 ItsAsbreuk - http://itsasbreuk.nl</i><br>
 * New BSD License - http://choosealicense.com/licenses/bsd-3-clause/
 *
 *
 * @module component.jsx
 * @class Component
 * @since 2.0.0
*/

import "itsa-jsext";
import React, {PropTypes} from "react";

const MAIN_CLASS = 'itsa-table',
    ROW_CLASS = 'itsa-table-row',
    CELL_CLASS = 'itsa-table-cell itsa-table-col-';

const Component = React.createClass({

    propTypes: {
        columns: PropTypes.array,
        /**
         * The Component its children
         *
         * @property children
         * @type Object
         * @since 2.0.0
        */
        data: PropTypes.array,
        rowHeader: PropTypes.bool
    },

    getInitialProps() {
        return {
            data: [],
            rowHeader: false
        };
    },

    generateHead() {
        const instance = this,
            props = instance.props,
            colums = props.columns,
            rowHeader = props.rowHeader;
        if (colums && (colums.length>0)) {
            return (
                <thead>
                    <tr>
                        {colums.map((col, i) => {
                            let colName, classname;
                            const field = (typeof col==='string') ? col : col.key;
                            classname = 'itsa-table-header itsa-table-col-'+field;
                            if ((i>0) || !rowHeader) {
                                colName = (typeof col==='string') ? col : (col.label || col.key);
                            }
                            else {
                                classname += 'itsa-table-header-rowheader';
                            }
                            return (<th className={classname} key={field}>{colName}</th>);
                        })}
                    </tr>
                </thead>
            );
        }
    },

    generateRows() {
        const instance = this,
            props = instance.props,
            data = props.data,
            colums = props.columns,
            rowHeader = props.rowHeader,
            hasColums = (colums && (colums.length>0));

        return data.map((rowdata, i) => {
            let cells;
            if (hasColums) {
                // create based upon the columns
                cells = colums.map((col, i) => {
                    const field = (typeof col==='string') ? col : col.key;
                    let classname = CELL_CLASS+field;
                    if (rowHeader && (i===0)) {
                        classname += ' itsa-table-rowheader';
                    }
                    return (<td className={classname} key={field}>{rowdata[field]}</td>);
                });
            }
            else {
                // all fields
                cells = [];
                rowdata.itsa_each((value, key) => {
                    let classname = CELL_CLASS+key;
                    if (rowHeader && (cells.length===0)) {
                        classname += ' itsa-table-rowheader';
                    }
                    cells.push((<td className={classname} key={key}>{value}</td>));
                });
            }
            return (<tr className={ROW_CLASS} data-recordid={i} key={i}>{cells}</tr>);
        });
    },

    /**
     * React render-method --> renderes the Component.
     *
     * @method render
     * @return ReactComponent
     * @since 2.0.0
     */
    render() {
        let classname = MAIN_CLASS;
        const instance = this,
            props = instance.props,
            propsClassName = props.className;
        propsClassName && (classname+=' '+propsClassName)
        return (
            <table className={classname}>
                {instance.generateHead()}
                <tbody>
                    {instance.generateRows()}
                </tbody>
            </table>
        );
    }

});

module.exports = Component;
