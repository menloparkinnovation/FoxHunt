
//
//   Openpux Internet Of Things (IOT) Framework.
//
//   Copyright (C) 2017 Menlo Park Innovation LLC
//
//   menloparkinnovation.com
//   menloparkinnovation@gmail.com
//
//   General HTML tables library.
//

//
// Html Tables:
//
// General dynamic tables for Javascript/DOM.
//
// Tables are represented as an empty table in the HTML
// page with a name.
//
// The applications view controller code looks up this
// name with document.getElementById(), and passes the
// table to the worker routines to build and update it
// as required.
//
// Generally the application view controller will add
// a <div> element around the table to control its visibility
// state, and formatting in regards to size/style, etc. typically
// with css selectors.
//
// There are two types of tables supported:
//
// An Update Table
//
// An update table has a row for each data item that has a read-only
// name field, an updatable data field, and a submit button
// per row.
//
// A Data/Status Table
//
// A data/status table just displays values, and both name and data
// fields are read-only, and there are no submit buttons.
//
// Currently mixed tables are not supported.
//

//
// This allows the HtmlTables instance to be attached to
// a DOM table object.
//
function HtmlTablesGetInstanceByTableId(tableId)
{
    var table = document.getElementById(tableId);
    if (table == null) {
        return null;
    }

    if ((typeof(table.$_MenloHtmlTables_myInstance) == "undefined")) {
        return null;
    }

    return table.$_MenloHtmlTables_myInstance;
}

//
// Get the HtmlTables instance for a DOM table reference.
//
function HtmlTablesGetInstance(table)
{
    return table.$_MenloHtmlTables_myInstance;
}

//
// Lookup the DOM element for a table.
//
function HtmlTablesLookupTable(tableId)
{
    var table = document.getElementById(tableId);
    return table;
}

//
// May supply either tables DOM instance reference or its name.
//
// Arguments:
//
// table - If not null is the HTML table instance from the DOM.
//
// htmlTableId - If not null is the table Id to lookup in the DOM.
//
// submitCallback(table, name, value) - Function to invoke when an update item is clicked.
//
//   table - table instance the callback is registered on
//
//   name - input field name that was clicked.
//
//   value - input field value at the time it was clicked
//
function HtmlTables(table, htmlTableId, submitCallback)
{
    self = this;

    if (table != null) {
        self.table = table;
    }
    else {

        // Get the DOM object
        self.table = document.getElementById(htmlTableId);
        if (self.table == null) {
            throw("table " + htmlTableId + " not found");
        }
    }

    // Place ourselves on it.
    self.table.$_MenloHtmlTables_myInstance = self;

    self.submitCallback = submitCallback;
}

//
// Build a data table from the parameterized object.
//
// A data table has a read-only name field and a data field.
//
// On writeable tables each data field is can be updated, and has
// an individual submit button.
//
// Each fieldname in the object "ob" represent a settings name,
// while its value if != null represents its value to display.
//
// table - table to elements to.
//
// ob - Object that contains name/value pairs for each row in the table.
//
// elementClass - class id used for elements added to the table for
//   CSS style handling.
//
// readonly - If true all entries are readonly.
//
HtmlTables.prototype.BuildDataTableFromObject = function(ob, elementClass, readonly)
{
    var self = this;

    var keys = Object.keys(ob);

    for (var i = 0; i < keys.length; i++) {
        self.AddRowToTable(keys[i], ob[keys[i]], elementClass, readonly);
    }
}

//
// Update an existing update table with the latest readings data
// so that the values reflect the current state ofthe remote
// application.
//
HtmlTables.prototype.UpdateDataTableFromObject = function(ob)
{
    var self = this;

    var keys = Object.keys(ob);

    for (var i = 0; i < keys.length; i++) {
        self.UpdateRowOnTable(keys[i], ob[keys[i]]);
    }
}

//
// Internal functions
//

//
// Add a row to the table.
//
// class ids created are:
//
// "settings_item_name"
// "settings_item_input"
//
// If not readonly, then also:
//
// "settings_item_button"
//
HtmlTables.prototype.AddRowToTable = function(elementName, elementValue, elementClass, readonly)
{
    var self = this;

    self.CreateItemRow(elementName, elementValue, elementClass, readonly);
}

//
// Create an an optionally updateable row in the table.
//
// It consists of a fixed name field, an input field.
//
// If not readonly, the input field is editable, and there is
// a submit button.
//
// class ids created are:
//
// rowClass + "_name"
// rowClass + "_input"
//
// If no readonly:
//
// button id + name
//   rowClass + "_button"
//
// button Javascript event function:
//
//   className_clicked(tableName_rowName_input)
//
HtmlTables.prototype.CreateItemRow = function(rowName, rowValue, rowClass, readonly)
{
    var self = this;

    var input = null;
    var args = null;
    var inputs = [];
    var inputField = null;

    //
    // Create the entry for the input name
    //
    args = {};
    args.readOnly = true;
    args.type = "text";
    args.id = self.GenerateInputElementName(rowName);
    args.name = args.id;
    args.className = rowClass + "_name";
    args.value = rowName;
    args.onclick = null;
    args.autocomplete = "off";

    input = self.CreateInputByArgs(args);
    inputs.push(input);

    //
    // Create the entry for the input field
    //
    args = {};
    args.readOnly = false;
    args.type = "text";
    args.id = self.GenerateInputElementInputName(rowName);
    args.name = args.id;
    args.className = rowClass + "_input";
    args.value = rowValue;
    args.onclick = null;
    args.autocomplete = "off";

    input = self.CreateInputByArgs(args);

    // This is remembered so it can be used in the on click scope
    inputField = input;

    inputs.push(input);

    if (!readonly) {

        //
        // Create Submit Button
        //
        var button = document.createElement("BUTTON");
        button.type = "button";
        button.className = rowClass + "_button";
        button.id = self.GenerateInputElementButtonName(rowName);
        button.name = button.id;

        var t = document.createTextNode("Submit");
        button.appendChild(t);

        inputName = self.GenerateInputElementInputName(rowName);

        //
        // Build an on click worker function
        //
        button.onclick = function() {
    
            if (self.submitCallback != null) {

                //
                // self, rowName, inputField reference captured by lambda
                //
                self.submitCallback(self, rowName, inputField.value);
            }
            else {
                alert("missing submit callback for table");
            }
        };

        inputs.push(button);
    }

    self.CreateTableRow(inputs);
}

//
// Update value row on table.
//
HtmlTables.prototype.UpdateRowOnTable = function(elementName, elementValue)
{
    var self = this;

    self.UpdateItemRow(elementName, elementValue);
}

//
// Update a row in the table.
//
HtmlTables.prototype.UpdateItemRow = function(rowName, rowValue)
{
    var self = this;

    var inputElementName = self.GenerateInputElementInputName(rowName);

    var items = document.getElementsByName(inputElementName);

    if (items.length == 0) {
        alert("page error, readonly item name not found " + inputElementName);
        return;    
    }

    if (items.length != 1) {
        alert("page error, multiple items by name=" + inputElementName + " length=" + items.length);
        return;    
    }

    var item = items[0];

    item.value = rowValue;
}

//
// Create an <input> element.
//
// args.type - type of input control
// args.name
// args.className - class of <input> element
// args.id    - id of element
// args.value - Default value to place into control. Can be null.
// args.onclick - function to execute when submit/click occurs.
// args.autocomplete
//
HtmlTables.prototype.CreateInputByArgs = function(args)
{
    var self = this;

    var input = document.createElement("INPUT");
    input.type = args.type;
    input.name = args.name;

    if (args.readOnly) {
        input.readOnly = true;
    }

    if (args.className != null) {
        input.className = args.className;
    }

    if (args.id != null) {
        input.id = args.id;
    }

    if (args.value != null) {
        input.value = args.value;
    }

    if (args.autocomplete != null) {
        input.autocomplete = args.autocomplete;
    }

    if (args.onclick != null) {
        input.onclick = args.onclick;
    }

    return input;
}

//
// table - The table to append the row entry as <TR></TR>
//
// childElements - Each child element that will be in the table row
//          as a separate <TD></TD> item.
//
HtmlTables.prototype.CreateTableRow = function(childElements)
{
    var self = this;

    // create <TR>
    var tr = document.createElement("TR");

    for (var child in childElements) {

        // create <TD>
        var td = document.createElement("TD");

        td.appendChild(childElements[child]);

        tr.appendChild(td);

        td = null;
    }

    // Append to the DOM table
    self.table.appendChild(tr);
}

//
// Generate input elements with the table name as a prefix
// in order to prevent collisions when they are looked up
// by document.getElementsByName()
//
HtmlTables.prototype.GenerateInputElementName = function(rowName)
{
    var self = this;
    var inputElementName = self.table.id + "_" + rowName + "_name";
    return inputElementName;
}

HtmlTables.prototype.GenerateInputElementInputName = function(rowName)
{
    var self = this;
    var inputElementName = self.table.id + "_" + rowName + "_input";
    return inputElementName;
}

HtmlTables.prototype.GenerateInputElementButtonName = function(rowName)
{
    var self = this;
    var inputElementName = self.table.id + "_" + rowName + "_button";
    return inputElementName;
}
