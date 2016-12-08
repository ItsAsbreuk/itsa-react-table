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
require('itsa-dom');

const React = require('react'),
    ReactDom = require('react-dom'),
    PropTypes = React.PropTypes,
    async = require('itsa-utils').async,
    Button = require('itsa-react-button'),
    CLICK = 'click',
    MAIN_CLASS = 'itsa-table',
    ROW_CLASS = 'itsa-table-row',
    CELL_CLASS = 'itsa-table-cell itsa-table-col-',
    EDITABLE_CELL_CLASS_SPACED = ' itsa-table-editable-cell',
    ROW_REMOVE_ID = '__row-remove';

const Table = React.createClass({

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
        disabled: PropTypes.bool,
        editable: PropTypes.oneOfType([PropTypes.bool, PropTypes.string]),
        editDirectionDown: PropTypes.bool,
        removeableY: PropTypes.bool,
        extendableX: PropTypes.bool,
        extendableY: PropTypes.bool,
        onChange: PropTypes.func,
        rowHeader: PropTypes.bool,
        tableClass: PropTypes.string
    },

    componentDidMount() {
        const instance = this;
        instance._componentNode = ReactDom.findDOMNode(instance);
        // set outside clickHandler which watches for outside clicks that will collapse the component:
        instance.IE8_EVENTS = !instance._componentNode.addEventListener;
        if (instance.IE8_EVENTS) {
            document.attachEvent("on"+CLICK, instance._handleDocumentClick);
        }
        else {
            document.addEventListener(CLICK, instance._handleDocumentClick, true);
        }
        instance.props.autoFocus && instance.focus();
    },

    /**
     * componentWilUnmount does some cleanup.
     *
     * @method componentWillUnmount
     * @since 0.0.1
     */
    componentWillUnmount() {
        const instance = this;
        if (instance.IE8_EVENTS) {
            document.detachEvent("on"+CLICK, instance._handleDocumentClick);
        }
        else {
            document.removeEventListener(CLICK, instance._handleDocumentClick, true);
        }
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
            extendableX: false,
            extendableY: false,
            removeableY: false,
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
        let cols = [];
        const instance = this,
            props = instance.props,
            removeableY = props.removeableY,
            colums = props.columns,
            rowHeader = props.rowHeader;
        if (colums && (colums.length>0)) {
            cols = colums.map((col, i) => {
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
            });
            removeableY && cols.unshift((<th key={ROW_REMOVE_ID}></th>));
            return (
                <thead>
                    <tr>
                        {cols}
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
            disabled = props.disabled,
            colums = props.columns,
            rowHeader = props.rowHeader,
            editable = props.editable,
            removeableY = props.removeableY,
            fullEditable = (editable==='full'),
            hasColums = (colums && (colums.length>0));

        return data.map((rowdata, i) => {
            let cells;
            if (hasColums) {
                // create based upon the columns
                cells = colums.map((col, j) => {
                    const field = (typeof col==='string') ? col : col.key;
                    let classname = CELL_CLASS+field,
                        value = rowdata[field],
                        cellContent;
                    if (rowHeader && (j===0)) {
                        classname += ' itsa-table-rowheader';
                        cellContent = value;
                    }
                    else if (fullEditable || ((editable===true) && (state.editableRow===i) && (state.editableCol===j))) {
                        classname += EDITABLE_CELL_CLASS_SPACED;
                        (typeof value==='number') || value || (value='');
                        value = String(value);
                        cellContent = (
                            <textarea
                                disabled={disabled}
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
                        (typeof value==='number') || value || (value='');
                        value = String(value);
                        cellContent = (
                            <textarea
                                disabled={disabled}
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
            if (removeableY) {
                cells.unshift((
                    <td className={CELL_CLASS+ROW_REMOVE_ID} key={ROW_REMOVE_ID}>
                        <Button buttonText="-" className="remove-row controll-btn" disabled={disabled} onClick={instance.deleteRow.bind(instance, i)} />
                    </td>
                ));
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

    addRow() {
        let newData, len;
        const props = this.props,
            onChange = props.onChange;
        if (onChange) {
            newData = props.data.itsa_deepClone();
            len = newData.length;
            if (len==0) {
                newData = [{'_row0': null}];
            }
            else {
                newData[len] = newData[0].itsa_map(() => null);
            }
            onChange(newData);
        }
    },

    addCol() {
        let newData, len, size;
        const props = this.props,
            onChange = props.onChange;
        if (onChange) {
            newData = props.data.itsa_deepClone();
            len = newData.length;
            if (len==0) {
                size = 0;
            }
            else {
                size = newData[0].itsa_size();
            }
            newData.forEach(record => {
                record['_col'+size] = null;
            });
            onChange(newData);
        }
    },

    deleteRow(index) {
        let newData;
        const props = this.props,
            onChange = props.onChange;
        if (onChange) {
            newData = props.data.itsa_deepClone();
            newData.splice(index, 1);
            onChange(newData);
        }
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
            refocusByClick, refocus, addRowBtn, addColBtn;
        const instance = this,
            props = instance.props,
            editable = props.editable,
            disabled = props.disabled,
            propsClassName = props.className;

        propsClassName && (classname+=' '+propsClassName);
        if (props.extendableY) {
            addRowBtn = (<Button buttonText="+" className="add-row controll-btn" disabled={disabled} onClick={instance.addRow} />);
        }
        if (props.extendableX && !props.columns) {
            addColBtn = (<Button buttonText="+" className="controll-btn" disabled={disabled} onClick={instance.addCol} />);
        }
        if ((editable===true) || (editable==='full')) {
            refocusByClick = instance.refocusByClick;
            refocus = instance.refocus;
        }
        return (
            <div className={classname}>
                <table className={props.tableClass}>
                    {instance.generateHead()}
                    <tbody
                        onClick={refocusByClick}
                        onKeyDown={refocus}>
                        {instance.generateRows()}
                    </tbody>
                </table>
                {addColBtn}
                {addRowBtn}
            </div>
        );
    },

    /**
     * Callback for a click on the document. Is needed to close the Component when clicked outside.
     *
     * @method _handleDocumentClick
     * @private
     * @param Object e
     * @since 0.0.1
     */
    _handleDocumentClick(e) {
        const instance = this,
            targetNode = e.target;
        if ((instance.props.editable===true) && (!instance._componentNode.contains(targetNode) || (targetNode.tagName!=='TEXTAREA'))) {
            instance.setState({
                editableRow: null,
                editableCol: null
            });
        }
    }

});

module.exports = Table;
