# version 16.7.0
Multiple cells changes will NOT be implemented anymore on refocus

# version 16.3.0
Implementation of editing mulitple cells at the same time, by the property: multiEdit.
When used, the user can `shift-select` multiple cells, edit one and all the selected cells will get this new content

# version 16.2.0
Reverted property `onChange`: gets invoked now with the complete data array
Signature: onChange(newData)

Added property `onChangeCell`: gets invoked now with just the cell that has been changed
Signature: onChangeCell(rowIndex, field, value)

# version 16.1.0
Changed property `onChange`: gets invoked now with just the cell that has been changed
Signature: onChange(rowIndex, field, value)

# version 0.1.0

Added div-wrapper and props: extendableX, extendableY, tableClass, disabled.

Compatability issues: property `className` is added to the wrapper, which is a `div` and not a `table`.
If you need classes for the table, use  the prop: `tableClass`.