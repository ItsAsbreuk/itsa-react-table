'use strict';

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

require('itsa-jsext');

const React = require('react'),
    ReactDom = require('react-dom'),
    PropTypes = React.PropTypes,
    async = require('itsa-utils').async,
    MAIN_CLASS = 'itsa-table',
    ROW_CLASS = 'itsa-table-row',
    CELL_CLASS = 'itsa-table-cell itsa-table-col-',
    EDITABLE_CELL_CLASS_SPACED = ' itsa-table-editable-cell';

const Component = React.createClass({

    propTypes: {
        autoFocus: PropTypes.bool,
        columns: PropTypes.array,
        /**
         * The Component its children
         *
         * @property children
         * @type Object
         * @since 2.0.0
        */
        data: PropTypes.array,
        editable: PropTypes.oneOfType([PropTypes.bool, PropTypes.string]),
        editDirectionDown: PropTypes.bool,
        onChange: PropTypes.func,
        rowHeader: PropTypes.bool
    },

    componentDidMount() {
        this.props.autoFocus && this.focus();
    },

    changeCell(rowIndex, field, e) {
        let newData;
        const props = this.props,
            onChange = props.onChange;
        if (onChange) {
            newData = props.data.itsa_deepClone();
            newData[rowIndex][field] = e.target.value;
            onChange(newData);
        }
    },

    focus() {
        const instance = this,
            state = instance.state;
        if ((state.editableRow===null) || (state.editableRow===null)) {
            instance.setState({
                editableRow: 0,
                editableCol: instance.props.rowHeader ? 1 : 0
            });
        }
        instance._focusActiveCell();
    },

    _focusActiveCell() {
        const instance = this;
        async(() => {
            let textareaNode, length;
            const state = instance.state,
                textarea = instance.refs['textarea_'+state.editableRow+'_'+state.editableCol];
            if (textarea) {
                textareaNode = ReactDom.findDOMNode(textarea);
                if (textareaNode && (document.activeElement!==textareaNode)) {
                    textareaNode.focus();
                    if (textareaNode.setSelectionRange) {
                        length = textareaNode.value.length;
                        textareaNode.setSelectionRange(length, length);
                    }
                }
            }
        });
    },

    getDefaultProps() {
        return {
            autoFocus: false,
            data: [],
            editable: false,
            editDirectionDown: true,
            rowHeader: false
        };
    },

    getInitialState() {
        return {
            editableRow: null,
            editableCol: null
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
            state = instance.state,
            data = props.data,
            colums = props.columns,
            rowHeader = props.rowHeader,
            editable = props.editable,
            fullEditable = (editable==='full'),
            hasColums = (colums && (colums.length>0));

        return data.map((rowdata, i) => {
            let cells;
            if (hasColums) {
                // create based upon the columns
                cells = colums.map((col, j) => {
                    const field = (typeof col==='string') ? col : col.key,
                        value = rowdata[field];
                    let classname = CELL_CLASS+field,
                        cellContent;
                    if (rowHeader && (j===0)) {
                        classname += ' itsa-table-rowheader';
                        cellContent = value;
                    }
                    else if (fullEditable || ((editable===true) && (state.editableRow===i) && (state.editableCol===j))) {
                        classname += EDITABLE_CELL_CLASS_SPACED;
                        cellContent = (
                            <textarea
                                onChange={instance.changeCell.bind(instance, i, field)}
                                ref={'textarea_'+i+'_'+j}
                                rows={1}
                                value={value} />
                        );
                    }
                    else {
                        cellContent = value;
                    }
                    return (<td className={classname} data-colid={j} key={field}>{cellContent}</td>);
                });
            }
            else {
                // all fields
                cells = [];
                rowdata.itsa_each((value, key) => {
                    let classname = CELL_CLASS+key,
                        cellContent,
                        colCount = cells.length;
                    if (rowHeader && (colCount===0)) {
                        classname += ' itsa-table-rowheader';
                        cellContent = value;
                    }
                    else if (fullEditable || ((editable===true) && (state.editableRow===i) && (state.editableCol===colCount))) {
                        classname += EDITABLE_CELL_CLASS_SPACED;
                        cellContent = (
                            <textarea
                                onChange={instance.changeCell.bind(instance, i, key)}
                                ref={'textarea_'+i+'_'+colCount}
                                rows={1}
                                value={value} />
                        );
                    }
                    else {
                        cellContent = value;
                    }
                    cells.push((<td className={classname} data-colid={colCount} key={key}>{cellContent}</td>));
                });
            }
            return (<tr className={ROW_CLASS} data-rowid={i} data-recordid={i} key={i}>{cells}</tr>);
        });
    },

    refocus(e) {
        let focusRow, focusCol, match, maxRow, maxCol, firstItem, colChangedByRow;
        const instance = this,
            props = instance.props,
            state = instance.state,
            keyCode = e.keyCode,
            editDirectionDown = props.editDirectionDown,
            shiftKey = e.shiftKey,
            data = props.data,
            lowestColIndex = props.rowHeader ? 1 : 0,
            columns = props.columns;

        if (keyCode===13) {
            if (shiftKey) {
                return;
            }
        }
        match = ((keyCode===9) || (keyCode===13));
        if (match) {
            e.preventDefault();
            maxRow = data.length - 1;
            if (columns) {
                maxCol = columns.length - 1;
            }
            else {
                firstItem = data[0];
                maxCol = firstItem ? firstItem.itsa_size()-1 : 0;
            }
            focusRow = state.editableRow;
            focusCol = state.editableCol;
            if ((keyCode===9) && shiftKey) {
                // backwards
                if (editDirectionDown) {
                    focusRow--;
                }
                else {
                    focusCol--;
                }
            }
            else {
                // forewards
                if (editDirectionDown) {
                    focusRow++;
                }
                else {
                    focusCol++;
                }
            }
            // now we might need to adjust the values when out of range
            if (focusRow<0) {
                focusRow = maxRow;
                focusCol--;
                colChangedByRow = true;
            }
            else if (focusRow>maxRow) {
                focusRow = 0;
                focusCol++;
                colChangedByRow = true;
            }
            if (focusCol<lowestColIndex) {
                colChangedByRow || focusRow--;
                (focusRow<0) && (focusRow=maxRow);
                focusCol = maxCol;
            }
            else if (focusCol>maxCol) {
                colChangedByRow || focusRow++;
                focusCol = lowestColIndex;
                (focusRow>maxRow) && (focusRow=0);
            }
            this.setState({
                editableRow: focusRow,
                editableCol: focusCol
            });
            instance._focusActiveCell();
        }
    },

    refocusByClick(e) {
        let node = e.target,
            colId, rowId;
        (node.tagName==='TD') || (node=node.parentNode);
        colId = parseInt(node.getAttribute('data-colid'), 10);
        node = node.parentNode;
        rowId = parseInt(node.getAttribute('data-rowid'), 10);
        this.setState({
            editableRow: rowId,
            editableCol: colId
        });
        this._focusActiveCell();
    },

    /**
     * React render-method --> renderes the Component.
     *
     * @method render
     * @return ReactComponent
     * @since 2.0.0
     */
    render() {
        let classname = MAIN_CLASS,
            refocusByClick, refocus;
        const instance = this,
            props = instance.props,
            editable = props.editable,
            propsClassName = props.className;

        propsClassName && (classname+=' '+propsClassName);
        if ((editable===true) || (editable==='full')) {
            refocusByClick = instance.refocusByClick;
            refocus = instance.refocus;
        }
        return (
            <table className={classname}>
                {instance.generateHead()}
                <tbody
                    onClick={refocusByClick}
                    onKeyDown={refocus}>
                    {instance.generateRows()}
                </tbody>
            </table>
        );
    }

});

module.exports = Component;
