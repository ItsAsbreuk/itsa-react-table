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

require("itsa-jsext");
require("itsa-dom");

const React = require("react"),
  PropTypes = require("prop-types"),
  utils = require("itsa-utils"),
  async = utils.async,
  later = utils.later,
  Button = require("itsa-react-button"),
  serializeStyles = require("./serialize-styles"),
  CLICK = "click",
  RESIZE = "resize",
  MAIN_CLASS = "itsa-table",
  ROW_CLASS = "itsa-table-row",
  CELL_CLASS = "itsa-table-cell itsa-table-col-",
  EDITABLE_CELL_CLASS_SPACED = " itsa-table-editable-cell",
  ROW_REMOVE_CLASS = "__row-remove",
  ROW_ADD_CLASS = "__row-add",
  REGEXP_TRANSPARENT = /^rgba\(\d+\,( )?\d+\,( )?\d+\,( )?0\)$/,
  COPY_STYLES = [
    "width",
    "height",
    "padding-left",
    "padding-right",
    "padding-top",
    "padding-bottom",
    "border-top-color",
    "border-top-left-radius",
    "border-top-right-radius",
    "border-top-style",
    "border-top-width",
    "border-bottom-color",
    "border-bottom-left-radius",
    "border-bottom-right-radius",
    "border-bottom-style",
    "border-bottom-width",
    "border-left-color",
    "border-left-style",
    "border-left-width",
    "border-right-color",
    "border-right-style",
    "border-right-width",
    "background-color",
    "background-image",
    "background-attachment",
    "background-blend-mode",
    "background-clip",
    "background-origin",
    "background-position-x",
    "background-position-y",
    "background-repeat-x",
    "background-repeat-y",
    "background-size",
    "color",
    "font-family",
    "font-feature-settings",
    "font-kerning",
    "font-size",
    "font-stretch",
    "font-style",
    "font-variant-caps",
    "font-variant-east-asian",
    "font-variant-ligatures",
    "font-variant-numeric",
    "font-variant-settings",
    "font-weight",
    "font-smooting",
    "font-size-delta",
    "opacity",
    "overflow",
    "white-space",
    "visibility",
    "-webkit-font-smooting",
    "-webkit-font-size-delta",
    "-ms-font-smooting",
    "-ms-font-size-delta",
    "text-align",
    "text-align-last",
    "text-combine-upright",
    "text-decoration-color",
    "text-decoration-line",
    "text-decoration-skip-ink",
    "text-decoration-style",
    "text-indent",
    "text-orientation",
    "text-overflow",
    "text-rendering",
    "text-shadow",
    "text-size-adjust",
    "text-transform",
    "text-underline-position",
    "-webkit-text-align",
    "-webkit-text-combine",
    "-webkit-text-decorations-in-effect",
    "-webkit-text-emphasis-color",
    "-webkit-text-emphasis-position",
    "-webkit-text-emphasis-style",
    "-webkit-text-fill-color",
    "-webkit-text-orientation",
    "-webkit-text-security",
    "-webkit-text-stroke-color",
    "-webkit-text-stroke-width",
    "-ms-text-align",
    "-ms-text-combine",
    "-ms-text-decorations-in-effect",
    "-ms-text-emphasis-color",
    "-ms-text-emphasis-position",
    "-ms-text-emphasis-style",
    "-ms-text-fill-color",
    "-ms-text-orientation",
    "-ms-text-security",
    "-ms-text-stroke-color",
    "-ms-text-stroke-width",
  ];

const retrieveFieldName = (field) => {
  return typeof field === "object" ? field.key : field;
};

const cloneData = (arr) => {
  return arr.map((record) => {
    let newRecord = {};
    record.itsa_each((value, key) => {
      newRecord[key] = value;
    });
    return newRecord;
  });
};

class Table extends React.Component {
  constructor(props) {
    super(props);
    const instance = this;
    instance.state = {
      editableRow: null,
      editableCol: null,
      editValue: "",
    };
    instance.changeCell = instance.changeCell.bind(instance);
    instance.handleCellKeyDown = instance.handleCellKeyDown.bind(instance);
    instance.focus = instance.focus.bind(instance);
    instance._focusActiveCell = instance._focusActiveCell.bind(instance);
    instance.generateHead = instance.generateHead.bind(instance);
    instance.generateRows = instance.generateRows.bind(instance);
    instance.refocus = instance.refocus.bind(instance);
    instance.addRow = instance.addRow.bind(instance);
    instance.addCol = instance.addCol.bind(instance);
    instance.deleteRow = instance.deleteRow.bind(instance);
    instance._handleDocumentClick =
      instance._handleDocumentClick.bind(instance);
    instance._handleResize = instance._handleResize.bind(instance);
    instance.focusTextArea = instance.focusTextArea.bind(instance);
    instance.setFixedHeaderDimensions =
      instance.setFixedHeaderDimensions.bind(instance);
  }

  componentDidMount() {
    const instance = this,
      props = instance.props;
    instance._tableWidth = instance._tableNode.offsetWidth;
    // set outside clickHandler which watches for outside clicks that will collapse the component:
    instance.IE8_EVENTS = !instance._componentNode.addEventListener;
    if (instance.IE8_EVENTS) {
      document.attachEvent("on" + CLICK, instance._handleDocumentClick);
      window.attachEvent("on" + RESIZE, instance._handleResize);
    } else {
      document.addEventListener(CLICK, instance._handleDocumentClick, true);
      window.addEventListener(RESIZE, instance._handleResize, true);
    }
    props.autoFocus && instance.focus();
    if (props.fixedHeaders) {
      async(instance.setFixedHeaderDimensions);
      instance._timer = later(instance.setFixedHeaderDimensions, 300, true);
    }
  }

  /**
   * componentWilUnmount does some cleanup.
   *
   * @method componentWillUnmount
   * @since 0.0.1
   */
  componentWillUnmount() {
    const instance = this;
    instance._timer && instance._timer.cancel();
    instance.unmounted = true;
    if (instance.IE8_EVENTS) {
      document.detachEvent("on" + CLICK, instance._handleDocumentClick);
      window.detachEvent("on" + RESIZE, instance._handleResize);
    } else {
      document.removeEventListener(CLICK, instance._handleDocumentClick, true);
      window.removeEventListener(RESIZE, instance._handleResize, true);
    }
  }

  componentDidUpdate() {
    this.setFixedHeaderDimensions();
  }

  _handleResize() {
    const instance = this,
      newWidth = instance._tableNode.offsetWidth;
    if (instance._tableWidth !== newWidth) {
      instance._tableWidth = newWidth;
      instance.setFixedHeaderDimensions();
    }
  }

  setFixedHeaderDimensions() {
    let headNode, ths;
    const instance = this,
      props = instance.props;
    if (props.fixedHeaders && props.columns && !instance.unmounted) {
      headNode = instance._headNode;
      if (headNode) {
        ths = headNode.itsa_getAll("th");
        Array.prototype.forEach.call(ths, (thNode) => {
          let inlineStyle = {},
            fixedNode,
            fixedContainerNode,
            contStyle,
            currentLeft,
            currentTop,
            prevAttr,
            newAttr;
          COPY_STYLES.forEach((style) => {
            let nodeStyle = thNode.itsa_getStyle(style);
            if (
              style === "background-color" &&
              nodeStyle &&
              REGEXP_TRANSPARENT.test(nodeStyle)
            ) {
              nodeStyle = undefined; // fixed headers cannot be transparent -> revert to the class background-color
            }
            nodeStyle === undefined ||
              (inlineStyle[style] = nodeStyle + " !important");
          });
          fixedContainerNode = thNode.itsa_getElement(
            "div.itsa-table-header-cont"
          );
          if (fixedContainerNode) {
            currentLeft = fixedContainerNode.itsa_getInlineStyle("left");
            if (currentLeft) {
              currentLeft = parseInt(currentLeft, 10);
            } else {
              currentLeft = 0;
            }
            currentTop = fixedContainerNode.itsa_getInlineStyle("top");
            if (currentTop) {
              currentTop = parseInt(currentTop, 10);
            } else {
              currentTop = 0;
            }
            contStyle = {
              left:
                thNode.itsa_left -
                fixedContainerNode.itsa_left +
                currentLeft +
                "px",
              top:
                thNode.itsa_top -
                fixedContainerNode.itsa_top +
                currentTop +
                "px",
            };
            prevAttr = fixedContainerNode.getAttribute("style");
            newAttr = serializeStyles.serialize(contStyle);
            prevAttr === newAttr ||
              fixedContainerNode.setAttribute("style", newAttr);
          }
          fixedNode = thNode.itsa_getElement("div.itsa-table-header");
          if (fixedNode) {
            prevAttr = fixedNode.getAttribute("style");
            newAttr = serializeStyles.serialize(inlineStyle);
            prevAttr === newAttr || fixedNode.setAttribute("style", newAttr);
          }
        });
      }
    }
  }

  changeCell(e) {
    const value = e.target.value;
    this._editValueBeforeBlur = value;
    this.setState({
      editValue: value,
    });
  }

  handleCellKeyDown(e) {
    const instance = this;
    if (e.keyCode === 27) {
      instance.setState(
        (prevState) => {
          return {
            editValue: instance._editValueBeforeEdit,
            editableRow: null,
            editableCol: null,
          };
        },
        () => {
          instance._blurActiveCell();
        }
      );
    }
  }

  implementCellChanges(rowIndex, field, force) {
    let changed, newData, col, secondField, x, y, columns, cells, editableCols;
    const instance = this,
      props = instance.props,
      propsData = props.data,
      state = instance.state,
      onChange = props.onChange,
      onChangeCell = props.onChangeCell,
      selectedRange = state.selectedRange,
      editValueBeforeBlur = instance._editValueBeforeBlur,
      editValueBeforeEdit = instance._editValueBeforeEdit;

    delete instance._editValueBeforeBlur;
    if (typeof field === "object") {
      field = field.key;
    }

    if (
      (editValueBeforeEdit === editValueBeforeBlur && !selectedRange) ||
      editValueBeforeBlur === undefined
    ) {
      // nothing changed
      return;
    }

    // if ((props.data[rowIndex][field]==editValueBeforeBlur) ||
    //     ((props.data[rowIndex][field]===undefined) && (editValueBeforeBlur==='')) ||
    //     ((props.data[rowIndex][field]===null) && (editValueBeforeBlur===''))) { // DO NOT tripple check -> the original value may not be a string, whereas the editvalue is!!
    //     // nothing changed
    //     return;
    // }

    if (selectedRange) {
      // editableCols: PropTypes.oneOfType([PropTypes.array, PropTypes.number]),
      if (force !== true) {
        return;
      }
      columns = props.columns;
      if (!columns || columns.length === 0) {
        columns = instance._columns;
      }
      editableCols = props.editableCols;
      if (typeof editableCols === "number") {
        editableCols = [editableCols];
      }
    }
    if (onChange) {
      changed = false;
      newData = cloneData(propsData);
      if (newData[rowIndex][field] != editValueBeforeBlur) {
        changed = true;
        newData[rowIndex][field] = editValueBeforeBlur;
      }
      // we might need to change multiple cells, in case `multiEdit` is set, which leads into a value for state.selectedRange:
      if (selectedRange) {
        // editableCols: PropTypes.oneOfType([PropTypes.array, PropTypes.number]),
        for (x = selectedRange.x1; x <= selectedRange.x2; x++) {
          if (!editableCols || editableCols.itsa_contains(x)) {
            for (y = selectedRange.y1; y <= selectedRange.y2; y++) {
              col = columns[x];
              secondField = typeof col === "string" ? col : col.key;
              if (newData[y][secondField] != editValueBeforeBlur) {
                changed = true;
                newData[y][secondField] = editValueBeforeBlur;
              }
            }
          }
        }
      }
      changed && onChange(newData);
    }
    if (onChangeCell) {
      if (!props.multiEdit) {
        if (propsData[rowIndex][field] != editValueBeforeBlur) {
          onChangeCell(rowIndex, field, editValueBeforeBlur);
        }
      } else {
        changed = false;
        cells = [{ row: rowIndex, field }];
        if (propsData[rowIndex][field] != editValueBeforeBlur) {
          changed = true;
        }
        // we might need to change multiple cells, in case `multiEdit` is set, which leads into a value for state.selectedRange:
        if (selectedRange) {
          // editableCols: PropTypes.oneOfType([PropTypes.array, PropTypes.number]),
          for (x = selectedRange.x1; x <= selectedRange.x2; x++) {
            if (!editableCols || editableCols.itsa_contains(x)) {
              for (y = selectedRange.y1; y <= selectedRange.y2; y++) {
                col = columns[x];
                secondField = typeof col === "string" ? col : col.key;
                cells.push({ row: y, field: secondField });
                if (propsData[y][secondField] != editValueBeforeBlur) {
                  changed = true;
                }
              }
            }
          }
        }
        changed && onChangeCell(cells, editValueBeforeBlur);
      }
    }
    if (selectedRange) {
      instance.setState({ selectedRange: null });
    }
  }

  focus() {
    let editableCol, columns, hasColumns, item, editValue, editableCols;
    const instance = this,
      props = instance.props,
      state = instance.state;
    editableCols = props.editableCols;
    if (state.editableRow === null || state.editableCol === null) {
      editableCol = props.rowHeader ? 1 : 0;
      if (typeof editableCols === "number") {
        editableCols = [editableCols];
      }
      if (editableCols) {
        editableCol += editableCols[0];
        if (props.rowHeader) {
          editableCol--;
        }
      }
      columns = props.columns;
      hasColumns = columns && columns.length > 0;
      item = props.data[0];
      editValue = hasColumns
        ? item[retrieveFieldName(columns[editableCol])]
        : item[retrieveFieldName(instance._columns[editableCol])];
      instance.setState({
        editableRow: 0,
        editableCol,
        editValue,
        selectedRangeStart: {
          x: editableCol,
          y: 0,
        },
      });
    }
    instance._focusActiveCell();
  }

  focusTextArea(e) {
    let length;
    const instance = this,
      node = e.target;
    instance._editValueBeforeBlur = node.value;
    if (instance.props.fullSelectOnEdit) {
      length = node.value.length;
      node.setSelectionRange(length, length);
    }
  }

  _blurActiveCell() {
    const instance = this,
      state = instance.state,
      textareaNode =
        instance["_textarea_" + state.editableRow + "_" + state.editableCol],
      componentContainerNode =
        instance["_component_" + state.editableRow + "_" + state.editableCol],
      componentNode =
        componentContainerNode &&
        componentContainerNode.itsa_getElement("button"),
      focussableNode = textareaNode || componentNode;
    if (
      focussableNode &&
      (document.activeElement === focussableNode ||
        document.activeElement.contains(focussableNode))
    ) {
      focussableNode.blur();
    }
  }

  _focusActiveCell() {
    const instance = this;
    async(() => {
      let length;
      const state = instance.state,
        textareaNode =
          instance["_textarea_" + state.editableRow + "_" + state.editableCol],
        componentContainerNode =
          instance["_component_" + state.editableRow + "_" + state.editableCol],
        componentNode =
          componentContainerNode &&
          componentContainerNode.itsa_getElement("button");
      if (textareaNode && document.activeElement !== textareaNode) {
        instance._editValueBeforeEdit = textareaNode.value || "";
        textareaNode.focus();
        if (textareaNode.setSelectionRange) {
          length = textareaNode.value.length;
          textareaNode.setSelectionRange(0, length);
        }
      } else if (componentNode) {
        componentNode.focus();
      }
    });
  }

  scrollTo(amount) {
    this._componentNode.scrollTop = amount;
  }

  generateHead() {
    let cols,
      alreadyDefined,
      j = -1;
    const instance = this,
      props = instance.props,
      removeableY = props.removeableY,
      extendableY = props.extendableY,
      columns = props.columns,
      fixedHeaders = props.fixedHeaders,
      rowHeader = props.rowHeader,
      onHeaderClick = props.onHeaderClick;

    if (columns && columns.length > 0) {
      // first dedupe duplicated col-keys
      alreadyDefined = {};
      cols = columns
        .filter((col) => {
          let dupe;
          const field = typeof col === "string" ? col : col.key;
          dupe = alreadyDefined[field];
          alreadyDefined[field] = true;
          return !dupe;
        })
        .map((col, i) => {
          let colName, classname, key, cellContent, headerClick;
          const field = typeof col === "string" ? col : col.key;
          classname = "itsa-table-header itsa-table-col-" + field;
          headerClick = (e) => {
            let selectedRange;
            const state = instance.state,
              rowIndex = state.editableRow,
              colIndex = state.editableCol,
              editCol = typeof colIndex === "number" && columns[colIndex],
              editField =
                editCol &&
                (typeof editCol === "string" ? editCol : editCol.key);
            if (state.selectedRange) {
              selectedRange = state.selectedRange.itsa_deepClone();
            }
            instance.setState(
              {
                editableRow: null,
                editableCol: null,
                editValue: "",
              },
              () => {
                if (selectedRange) {
                  instance.setState({ selectedRange: null });
                }
              }
            );
            if (typeof rowIndex === "number") {
              instance.implementCellChanges(rowIndex, editField);
            }
            if (onHeaderClick) {
              async(
                onHeaderClick.call(
                  null,
                  field,
                  editField,
                  state.editValue,
                  rowIndex,
                  colIndex,
                  selectedRange,
                  e
                )
              );
            }
          };
          if (i > 0 || !rowHeader) {
            colName = typeof col === "string" ? col : col.label || col.key;
            key = typeof col === "string" ? col : col.key;
          } else {
            classname += " itsa-table-header-rowheader";
            key = j--;
          }
          if (fixedHeaders) {
            colName || (colName = "&nbsp;");
            cellContent = (
              <div>
                <div class="itsa-table-header-cont">
                  <div class="itsa-table-header">{colName}</div>
                </div>
                {colName}
              </div>
            );
            return (
              <th className={classname} key={key} onClick={headerClick}>
                {cellContent}
              </th>
            );
          }
          cellContent = <div>{colName}</div>;
          return (
            <th className={classname} key={key} onClick={headerClick}>
              {colName}
            </th>
          );
        });
      if (extendableY === "full") {
        if (fixedHeaders) {
          cols.unshift(
            <th className={"itsa-table-header " + ROW_ADD_CLASS} key={j--}>
              <div className="itsa-table-header-cont">
                <div className="itsa-table-header">&nbsp;</div>
              </div>
              &nbsp;
            </th>
          );
        } else {
          cols.unshift(
            <th className={"itsa-table-header " + ROW_ADD_CLASS} key={j--} />
          );
        }
      }
      if (removeableY) {
        if (fixedHeaders) {
          cols.unshift(
            <th className={"itsa-table-header " + ROW_REMOVE_CLASS} key={j--}>
              <div className="itsa-table-header-cont">
                <div className="itsa-table-header">&nbsp;</div>
              </div>
              &nbsp;
            </th>
          );
        } else {
          cols.unshift(
            <th className={"itsa-table-header " + ROW_REMOVE_CLASS} key={j--} />
          );
        }
      }

      return (
        <thead ref={(node) => (instance._headNode = node)}>
          <tr>{cols}</tr>
        </thead>
      );
    }
  }

  generateRows() {
    let rowclass, editableColsArray;
    const instance = this,
      props = instance.props,
      state = instance.state,
      data = props.data,
      disabled = props.disabled,
      columns = props.columns,
      selectedRange = state.selectedRange,
      editableCols = props.editableCols,
      rowClassRenderer = props.rowClassRenderer,
      rowHeader = props.rowHeader,
      editable = props.editable,
      removeableY = props.removeableY,
      extendableY = props.extendableY,
      fullEditable = editable === "full",
      hasColumns = columns && columns.length > 0;

    const colIsEditable = (colIndex) => {
      if (disabled) {
        return false;
      }
      if (!editableCols) {
        return true;
      }
      if (typeof editableCols === "number") {
        return editableCols === colIndex;
      }
      return editableCols.itsa_contains(colIndex);
    };

    if (editableCols) {
      editableColsArray =
        typeof editableCols === "number" ? [editableCols] : editableCols;
    }

    return data.map((rowdata, i) => {
      let cells, extraClass;
      if (hasColumns) {
        // create based upon the columns
        cells = columns.map((col, j) => {
          const field = typeof col === "string" ? col : col.key;
          let classname = CELL_CLASS + field,
            value = rowdata[field],
            cellContent,
            onBlur,
            textAreaValue;
          if (rowHeader && j === 0) {
            classname += " itsa-table-rowheader";
            if (value === null) {
              value = "";
            }
            cellContent = String(value);
            return (
              <td
                className={classname}
                dangerouslySetInnerHTML={{ __html: cellContent }}
                data-colid={j}
                key={field}
              />
            );
          } else if (Object.itsa_isObject(value)) {
            return (
              <td
                className={classname}
                data-colid={j}
                key={field}
                ref={(node) => (instance["_component_" + i + "_" + j] = node)}
              >
                {value}
              </td>
            );
          } else if (
            fullEditable ||
            (editable === true &&
              state.editableRow === i &&
              state.editableCol === j &&
              colIsEditable(j))
          ) {
            classname += EDITABLE_CELL_CLASS_SPACED;
            typeof value === "number" || value || (value = "");
            value = String(value);
            if (
              state.editableRow === i &&
              state.editableCol === j &&
              typeof instance._editValueBeforeBlur === "string"
            ) {
              textAreaValue = state.editValue;
            } else {
              textAreaValue = value;
            }
            if (textAreaValue === null || textAreaValue === undefined) {
              textAreaValue = "";
            }
            fullEditable &&
              (onBlur = instance.implementCellChanges.bind(instance, i, field));
            cellContent = (
              <textarea
                disabled={disabled}
                onBlur={onBlur}
                onChange={instance.changeCell}
                onFocus={instance.focusTextArea}
                onKeyDown={instance.handleCellKeyDown}
                ref={(node) => (instance["_textarea_" + i + "_" + j] = node)}
                rows={1}
                value={textAreaValue}
              />
            );
            return (
              <td className={classname} data-colid={j} key={field}>
                <span>{textAreaValue}</span>
                {cellContent}
              </td>
            );
          }
          typeof value === "number" || value || (value = "");
          // we may need to add an 'selected' class:
          if (
            selectedRange &&
            j >= selectedRange.x1 &&
            j <= selectedRange.x2 &&
            i >= selectedRange.y1 &&
            i <= selectedRange.y2 &&
            (!editableCols || editableColsArray.itsa_contains(j))
          ) {
            classname += " selected-range";
          }
          if (typeof value !== "object") {
            value = String(value);
            value.itsa_trim() === "" && (value = "&nbsp;");
            cellContent = value.itsa_replaceAll("\n", "<br />");
            return (
              <td
                className={classname}
                dangerouslySetInnerHTML={{ __html: cellContent }}
                data-colid={j}
                key={field}
              />
            );
          }
          // else
          return (
            <td
              className={classname}
              data-colid={j}
              key={field}
              ref={(node) => (instance["_component_" + i + "_" + j] = node)}
            >
              {value}
            </td>
          );
        });
      } else {
        // all fields
        cells = [];
        let j = -1;
        instance._columns = [];
        rowdata.itsa_each((value, key) => {
          const field = typeof key === "string" ? key : key.key;
          let classname = CELL_CLASS + key,
            cellContent,
            onBlur,
            textAreaValue,
            colCount = cells.length;
          j++;
          instance._columns[j] = key;
          if (rowHeader && colCount === 0) {
            classname += " itsa-table-rowheader";
            if (value === null) {
              value = "";
            }
            cellContent = value;
            cells.push(
              <td
                className={classname}
                dangerouslySetInnerHTML={{ __html: cellContent }}
                data-colid={colCount}
                key={key}
              />
            );
          } else if (Object.itsa_isObject(value)) {
            return (
              <td
                className={classname}
                data-colid={j}
                key={field}
                ref={(node) => (instance["_component_" + i + "_" + j] = node)}
              >
                {value}
              </td>
            );
          } else if (
            fullEditable ||
            (editable === true &&
              state.editableRow === i &&
              state.editableCol === colCount)
          ) {
            classname += EDITABLE_CELL_CLASS_SPACED;
            typeof value === "number" || value || (value = "");
            value = String(value);
            if (state.editableRow === i && state.editableCol === j) {
              textAreaValue = state.editValue;
            } else {
              textAreaValue = value;
            }
            if (textAreaValue === null || textAreaValue === undefined) {
              textAreaValue = "";
            }
            fullEditable &&
              (onBlur = instance.implementCellChanges.bind(instance, i, field));
            cellContent = (
              <textarea
                disabled={disabled}
                onBlur={onBlur}
                onChange={instance.changeCell}
                onFocus={instance.focusTextArea}
                onKeyDown={instance.handleCellKeyDown}
                ref={(node) =>
                  (instance["_textarea_" + i + "_" + colCount] = node)
                }
                rows={1}
                value={textAreaValue}
              />
            );
            cells.push(
              <td className={classname} data-colid={colCount} key={key}>
                {cellContent}
                <span>{textAreaValue}</span>
              </td>
            );
          } else {
            typeof value === "number" || value || (value = "");
            // we may need to add an 'selected' class:
            if (
              selectedRange &&
              j >= selectedRange.x1 &&
              j <= selectedRange.x2 &&
              i >= selectedRange.y1 &&
              i <= selectedRange.y2 &&
              (!editableCols || editableColsArray.itsa_contains(j))
            ) {
              classname += " selected-range";
            }
            if (typeof value !== "object") {
              value = String(value);
              value.itsa_trim() === "" && (value = "&nbsp;");
              cellContent = value.itsa_replaceAll("\n", "<br />");
              cells.push(
                <td
                  className={classname}
                  dangerouslySetInnerHTML={{ __html: cellContent }}
                  data-colid={colCount}
                  key={key}
                />
              );
            } else {
              cells.push(
                <td
                  className={classname}
                  data-colid={colCount}
                  key={key}
                  ref={(node) => (instance["_component_" + i + "_" + j] = node)}
                >
                  {value}
                </td>
              );
            }
          }
        });
      }
      if (extendableY === "full") {
        cells.unshift(
          <td className={CELL_CLASS + ROW_ADD_CLASS} key={ROW_ADD_CLASS}>
            <Button
              buttonText="+"
              className="controll-btn"
              disabled={disabled}
              onClick={instance.addRow.bind(instance, i)}
            />
          </td>
        );
      }
      if (removeableY) {
        cells.unshift(
          <td className={CELL_CLASS + ROW_REMOVE_CLASS} key={ROW_REMOVE_CLASS}>
            <Button
              buttonText="-"
              className="controll-btn"
              disabled={disabled}
              onClick={instance.deleteRow.bind(instance, i)}
            />
          </td>
        );
      }
      rowclass = ROW_CLASS;
      if (rowClassRenderer) {
        extraClass = rowClassRenderer(i, rowdata);
        extraClass && (rowclass += " " + extraClass);
      }
      return (
        <tr className={rowclass} data-recordid={i} data-rowid={i} key={i}>
          {cells}
        </tr>
      );
    });
  }

  refocus(e) {
    let focusRow,
      focusCol,
      match,
      maxRow,
      maxCol,
      firstItem,
      item,
      editValue,
      colChangedByRow,
      isSelectComponent,
      less,
      prevRowIndex,
      prevColIndex,
      field,
      editDirectionDown,
      arrowDown,
      arrowUp,
      node,
      trNode,
      trParentNode,
      tds,
      trs;
    const instance = this,
      props = instance.props,
      state = instance.state,
      keyCode = e.keyCode,
      shiftKey = e.shiftKey,
      ctrlKey = e.metaKey || e.ctrlKey,
      data = props.data,
      loop = props.loop,
      editableCols = props.editableCols,
      cursorNav = props.cursorNav,
      lowestColIndex = props.rowHeader ? 1 : 0,
      highestColIndex = data.itsa_keys().length - (props.rowHeader ? 0 : 1),
      columns = props.columns,
      hasColumns = columns && columns.length > 0;

    const implementChanges = (keepFocus) => {
      if (props.editable === true || state.selectedRange) {
        // NOT 'full' for that would take care of itself
        field = hasColumns
          ? columns[prevColIndex]
          : instance._columns[prevColIndex];
        instance.implementCellChanges(prevRowIndex, field, true);
        keepFocus &&
          (instance._editValueBeforeEdit = instance._editValueBeforeBlur);
      }
    };
    editDirectionDown =
      keyCode === 9 || keyCode === 37 || keyCode === 39
        ? false
        : props.editDirectionDown;
    if (keyCode === 13) {
      if (shiftKey) {
        return;
      }
    }

    match =
      keyCode === 9 ||
      keyCode === 13 ||
      (cursorNav && (keyCode === 40 || keyCode === 38)) ||
      (cursorNav && ctrlKey && (keyCode === 37 || keyCode === 39)); // 40=arrowDown, 38=arrowUp

    // we need to ignore MOVING DOWN in case the focus lies on a button component
    if (document.activeElement.tagName === "BUTTON" && keyCode === 13) {
      match = false;
    }

    isSelectComponent =
      document.activeElement.itsa_hasClass("itsa-select") ||
      document.activeElement.itsa_inside(".itsa-select");
    if (
      isSelectComponent &&
      (keyCode === 13 || (cursorNav && (keyCode === 38 || keyCode === 40)))
    ) {
      match = false;
    }

    if (match) {
      e.preventDefault();
      arrowDown = keyCode === 40;
      arrowUp = keyCode === 38;
      maxRow = data.length - 1;
      if (columns) {
        maxCol = columns.length - 1;
      } else {
        firstItem = data[0];
        maxCol = firstItem ? firstItem.itsa_size() - 1 : 0;
      }

      if (isSelectComponent) {
        // we need to catch editableRow and editableCol because thay are not set
        less = 0;
        if (props.removeableY) {
          less++;
        }
        if (props.extendableY === "full") {
          less++;
        }

        node = document.activeElement;
        while (node && node.tagName !== "TD") {
          node = node.parentNode;
        }
        trNode = node.parentNode;
        tds = trNode.childNodes;
        prevColIndex = Array.prototype.indexOf.call(tds, node) - less;
        trParentNode = trNode.parentNode;
        trs = trParentNode.childNodes;
        prevRowIndex = Array.prototype.indexOf.call(trs, trNode);
      } else {
        prevRowIndex = state.editableRow;
        prevColIndex = state.editableCol;
      }
      focusRow = prevRowIndex;
      focusCol = prevColIndex;

      if (
        (keyCode === 9 && shiftKey) ||
        (keyCode === 37 && ctrlKey) ||
        arrowUp
      ) {
        // backwards
        if (editDirectionDown || arrowUp) {
          focusRow--;
        } else {
          do {
            focusCol--;
            if (focusCol < lowestColIndex) {
              break;
            }
          } while (!editableCols || !editableCols.itsa_contains(focusCol));
        }
      } else {
        // forewards
        if (editDirectionDown || arrowDown) {
          focusRow++;
        } else {
          do {
            focusCol++;
            if (focusCol > highestColIndex) {
              break;
            }
          } while (!editableCols || !editableCols.itsa_contains(focusCol));
        }
      }
      // now we might need to adjust the values when out of range
      if (focusRow < 0) {
        if (!loop) {
          implementChanges(true);
          return;
        }
        focusRow = maxRow;
        do {
          focusCol--;
          if (focusCol < lowestColIndex) {
            focusCol = highestColIndex;
          }
        } while (!editableCols || !editableCols.itsa_contains(focusCol));
        colChangedByRow = true;
      } else if (focusRow > maxRow) {
        if (!loop) {
          implementChanges(true);
          return;
        }
        focusRow = 0;
        do {
          focusCol++;
          if (focusCol > highestColIndex) {
            focusCol = lowestColIndex;
          }
        } while (!editableCols || !editableCols.itsa_contains(focusCol));
        colChangedByRow = true;
      }
      if (focusCol < lowestColIndex) {
        if (!loop) {
          implementChanges(true);
          return;
        }
        colChangedByRow || focusRow--;
        focusRow < 0 && (focusRow = maxRow);
        focusCol = maxCol;
      } else if (focusCol > maxCol) {
        if (!loop) {
          implementChanges(true);
          return;
        }
        colChangedByRow || focusRow++;
        focusCol = lowestColIndex;
        focusRow > maxRow && (focusRow = 0);
      }
      item = props.data[focusRow];
      if (item) {
        editValue = hasColumns
          ? item[retrieveFieldName(columns[focusCol])]
          : item[retrieveFieldName(instance._columns[focusCol])];
        this.setState({
          editableRow: focusRow,
          editableCol: focusCol,
          editValue,
          selectedRangeStart: {
            x: focusCol,
            y: focusRow,
          },
          selectedRange: null,
        });
        instance._focusActiveCell();
        implementChanges();
      }
    }
  }

  handleClick(editable, e) {
    const instance = this,
      props = instance.props,
      onClick = instance.props.onClick,
      state = instance.state,
      shiftClick = e.shiftKey;
    let node = e.target,
      editableCols = props.editableCols,
      colId,
      rowId,
      columns,
      hasColumns,
      item,
      editValue,
      newState,
      prevRowId,
      prevColId,
      selectedRangeStart;
    node.tagName === "TD" || (node = node.parentNode);
    colId = parseInt(node.getAttribute("data-colid"), 10);
    node = node.parentNode;
    rowId = parseInt(node.getAttribute("data-rowid"), 10);
    if (typeof editableCols === "number") {
      editableCols = [editableCols];
    }
    if (editable && (!editableCols || editableCols.itsa_contains(colId))) {
      columns = props.columns;
      hasColumns = columns && columns.length > 0;
      item = props.data[rowId];
      editValue = hasColumns
        ? item[retrieveFieldName(columns[colId])]
        : item[retrieveFieldName(instance._columns[colId])];
      newState = {
        editableRow: rowId,
        editableCol: colId,
        editValue,
      };
      if (props.editable && props.multiEdit) {
        if (shiftClick) {
          selectedRangeStart = state.selectedRangeStart;
          if (selectedRangeStart) {
            prevRowId = selectedRangeStart.y;
            prevColId = selectedRangeStart.x;
            if (
              typeof prevRowId === "number" &&
              typeof prevColId === "number" &&
              (prevColId !== colId || prevRowId !== rowId)
            ) {
              newState.selectedRange = {
                x1: Math.min(prevColId, colId),
                y1: Math.min(prevRowId, rowId),
                x2: Math.max(prevColId, colId),
                y2: Math.max(prevRowId, rowId),
              };
            }
          } else {
            newState.selectedRange = null;
          }
        } else {
          newState.selectedRange = null;
          newState.selectedRangeStart = {
            x: colId,
            y: rowId,
          };
        }
      }
      instance.setState(newState);
      instance._focusActiveCell();
    }
    onClick && onClick(rowId, colId);
  }

  addRow(index) {
    let newData, len, newRecord;
    const props = this.props,
      onChange = props.onChange;
    if (onChange) {
      newData = cloneData(props.data);
      len = newData.length;
      if (len == 0) {
        newData = [{ __row0: null }];
      } else {
        newRecord = newData[0].itsa_map(() => null);
        if (typeof index === "number") {
          newData.itsa_insertAt(newRecord, index);
        } else {
          newData[props.extendableY === "begin" ? "unshift" : "push"](
            newRecord
          );
        }
      }
      onChange(newData);
    }
  }

  addCol() {
    let newData, len, size;
    const props = this.props,
      onChange = props.onChange;
    if (onChange) {
      newData = cloneData(props.data);
      len = newData.length;
      if (len == 0) {
        size = 0;
      } else {
        size = newData[0].itsa_size();
      }
      newData.forEach((record) => {
        record["__col" + size] = null;
      });
      onChange(newData);
    }
  }

  deleteRow(index) {
    let newData;
    const props = this.props,
      onChange = props.onChange;
    if (onChange) {
      newData = cloneData(props.data);
      newData.splice(index, 1);
      onChange(newData);
    }
  }

  /**
   * React render-method --> renderes the Component.
   *
   * @method render
   * @return ReactComponent
   * @since 2.0.0
   */
  render() {
    let classname = MAIN_CLASS,
      handleClick,
      refocus,
      addRowBtn,
      addColBtn,
      tableClassName,
      addRowClass;
    const instance = this,
      props = instance.props,
      editable = props.editable,
      disabled = props.disabled,
      propsClassName = props.className;

    tableClassName = props.tableClass;
    propsClassName && (classname += " " + propsClassName);
    if (props.extendableY) {
      addRowClass = "add-row controll-btn";
      if (props.removeableY && props.extendableY === "full") {
        addRowClass += " add-row-indent";
      }
      addRowBtn = (
        <Button
          buttonText="+"
          className={addRowClass}
          disabled={disabled}
          onClick={instance.addRow}
        />
      );
    }
    if (props.extendableX && !props.columns) {
      addColBtn = (
        <Button
          buttonText="+"
          className="controll-btn"
          disabled={disabled}
          onClick={instance.addCol}
        />
      );
    }
    if (editable === true || editable === "full") {
      handleClick = instance.handleClick.bind(instance, true);
      refocus = instance.refocus;
    } else {
      handleClick = instance.handleClick.bind(instance, false);
    }
    if (props.fixedHeaders) {
      tableClassName += " fixed-headers";
      classname += " scrollable-y";
      // fixedHeadertable = (
      //     <table className={props.tableClass+' fixed-headers'}>
      //         {instance.generateHead()}
      //         <tbody>
      //             {instance.generateRows()}
      //         </tbody>
      //     </table>
      // );
    }
    // classname+='flex-container-vertical';
    return (
      <div
        className={classname}
        onScroll={props.onScroll}
        ref={(node) => (instance._componentNode = node)}
      >
        <table
          className={tableClassName}
          ref={(node) => (instance._tableNode = node)}
        >
          {instance.generateHead()}
          <tbody onClick={handleClick} onKeyDown={refocus}>
            {instance.generateRows()}
          </tbody>
        </table>
        {addColBtn}
        {addRowBtn}
      </div>
    );
  }

  /**
   * Callback for a click on the document. Is needed to close the Component when clicked outside.
   *
   * @method _handleDocumentClick
   * @private
   * @param Object e
   * @since 0.0.1
   */
  _handleDocumentClick(e) {
    let rowIndex, field, colIndex, columns, hasColumns;
    const instance = this,
      targetNode = e.target;
    if (
      instance.props.editable === true &&
      (!instance._componentNode.contains(targetNode) ||
        (targetNode.tagName !== "TEXTAREA" &&
          !instance._headNode.contains(targetNode)))
    ) {
      rowIndex = instance.state.editableRow;
      colIndex = instance.state.editableCol;
      columns = instance.props.columns;
      hasColumns = columns && columns.length > 0;
      field = hasColumns ? columns[colIndex] : instance._columns[colIndex];
      instance.setState(
        {
          editableRow: null,
          editableCol: null,
          editValue: "",
        },
        () => {
          typeof rowIndex === "number" &&
            instance.implementCellChanges(rowIndex, field);
        }
      );
    }
  }
}

Table.propTypes = {
  autoFocus: PropTypes.bool,
  columns: PropTypes.array,
  /**
   * The Component its children
   *
   * @property children
   * @type Object
   * @since 2.0.0
   */
  cursorNav: PropTypes.bool,
  data: PropTypes.array,
  disabled: PropTypes.bool,
  editable: PropTypes.oneOfType([PropTypes.bool, PropTypes.string]),
  editableCols: PropTypes.oneOfType([PropTypes.array, PropTypes.number]),
  editDirectionDown: PropTypes.bool,
  extendableX: PropTypes.bool,
  extendableY: PropTypes.oneOfType([PropTypes.bool, PropTypes.string]), // true, "begin" or "all"
  fixedHeaders: PropTypes.bool,
  fullSelectOnEdit: PropTypes.bool,
  loop: PropTypes.bool,
  multiEdit: PropTypes.bool,
  onChange: PropTypes.func,
  onChangeCell: PropTypes.func,
  onClick: PropTypes.func,
  onHeaderClick: PropTypes.func,
  onScroll: PropTypes.func,
  removeableY: PropTypes.bool,
  rowClassRenderer: PropTypes.func,
  rowHeader: PropTypes.bool,
  tableClass: PropTypes.string,
};

Table.defaultProps = {
  autoFocus: false,
  cursorNav: false,
  data: [],
  editable: false,
  editDirectionDown: true,
  extendableX: false,
  extendableY: false,
  fullSelectOnEdit: true,
  loop: true,
  multiEdit: false,
  removeableY: false,
  rowHeader: false,
};

module.exports = Table;
