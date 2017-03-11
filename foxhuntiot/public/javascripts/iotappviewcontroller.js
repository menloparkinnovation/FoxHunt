
//
//   Openpux Internet Of Things (IOT) Framework.
//
//   Copyright (C) 2017 Menlo Park Innovation LLC
//
//   menloparkinnovation.com
//   menloparkinnovation@gmail.com
//
//   IoT application view controller logic.
//

//
// Update the style DOM for gauge size
//
function updateScaleCSS(scale) {

      var width = 180 * scale;
      var height = 180 * scale;

      var gaugeStyle = generate_gauge_css(width, height);

      var st = document.getElementById("gauge_style");
      st.innerHTML = gaugeStyle;
}

function generate_table_margin_css(width, height) {
      var str = ".class_table_margin { margin-left: " + width + "px; ";
      str += "margin-top: " + height + "px; }";
      return str;
}

// Update the style DOM for gauge size
function tableMarginCSS(width, height) {
      var tableStyle = generate_table_margin_css(width, height);

      var st = document.getElementById("table_margin_style");
      st.innerHTML = tableStyle;
}

function generate_gauge_css(width, height) {
      var str = ".class_gauge { width: " + width + "px; ";
      str += "height: " + height + "px; }";
      return str;
}
function SetElementVisibility(name, state)
{
    var el = document.getElementById(name);

    if (el != null) {
        if (state) {
            el.style.display = "block";
        }
        else {
            el.style.display = "none";
        }
    }
}

//
// *** Touch Support ***
//

//
// Touch events are available on platforms that support them.
//
// They are essentially main page events.
//

function touchStart(event) {
    var x = event.touches[0].pageX;
    var y = event.touches[0].pageY;

    var s = "touchStart x=" + x + " y=" + y;

    // This prevents HTML buttons from being activated.
    //event.preventDefault();

    updateStatusBar(s);
}

function touchMove(event) {
    var x = event.touches[0].pageX;
    var y = event.touches[0].pageY;

    var s = "touchMove x=" + x + " y=" + y;

    updateStatusBar(s);

    // This prevents HTML buttons from being activated.
    //event.preventDefault();

    tableMarginCSS(x, y);
}

function touchEnd(event) {

    var x = -1;
    var y = -1;
    var t = event.touches[0];

    if (t != null) {
        x = t.pageX;
    }

    t = event.touches[0];
    if (t != null) {
        y = t.pageY;
    }

    var s = "touchEnd x=" + x + " y=" + y;

    updateStatusBar(s);
}

function touchCancel(event) {
    var x = event.touches[0].pageX;
    var y = event.touches[0].pageY;

    var s = "touchCancel x=" + x + " y=" + y;

    updateStatusBar(s);
}

//
// Lookup the view state entry by name.
//
// config - Pointer to viewConfig[]
//
// name - State transition name to lookup
//
function getViewStateEntry(config, name)
{
    for (index = 0; index < config.length; index++) {
        if (config[index].name == name) {
            return config[index];
        }
    }

    return null;
}

//
// Set the visibility for all the elements of the given View State Entry
//
function setViewStateEntryElementsVisibility(vse, state)
{
    for (index = 0; index < vse.enableIDs.length; index++) {
        SetElementVisibility(vse.enableIDs[index], state);
    }
}

//
// Set visibility for all elements for the given view name
//
function setElementsVisibility(config, viewname, state)
{
    var vse = getViewStateEntry(config, viewname);

    setViewStateEntryElementsVisibility(vse, state);
}

//
// From:
// http://stackoverflow.com/questions/130404/javascript-data-formatting-pretty-printer
//
function DumpObjectAsJsonIndented(obj, indent)
{
  var result = "";
  if (indent == null) indent = "";

  for (var property in obj)
  {
    var value = obj[property];
    if (typeof value == 'string')
      value = "'" + value + "'";
    else if (typeof value == 'object')
    {
      if (value instanceof Array)
      {
        // Just let JS convert the Array to a string!
        value = "[ " + value + " ]";
      }
      else
      {
        // Recursive dump
        // (replace "  " by "\t" or something else if you prefer)
        var od = DumpObjectAsJsonIndented(value, indent + "  ");
        // If you like { on the same line as the key
        //value = "{\n" + od + "\n" + indent + "}";
        // If you prefer { and } to be aligned
        value = "\n" + indent + "{\n" + od + "\n" + indent + "}";
      }
    }
    result += indent + "'" + property + "' : " + value + ",\n";
  }
  return result.replace(/,\n$/, "");
}

//
// AppViewController is a "partial class" which implements the
// basics of a page view controller.
//
// It's expected that page specific functions extend this class
// as required.
//

//
// Application view controller.
//
function AppViewController(config)
{
    var self = this;

    self.config = config;

    self.viewConfig = config.viewConfig;

    self.viewStateCurrent = "blank";
}

//
// Main view transition function.
//

AppViewController.prototype.viewTransition = function(viewState)
{
    var self = this;

    //
    // Leave current view
    //

    self.leaveCurrentView();

    //
    // Enter the new view
    //

    self.enterView(viewState);
}

AppViewController.prototype.enterView = function(newView)
{
    var self = this;

    //
    // Enable the current view elements
    //
    var new_vse = getViewStateEntry(self.viewConfig, newView);

    setViewStateEntryElementsVisibility(new_vse, true);

    if (new_vse.viewFunction != null) {
        new_vse.viewFunction(true);
    }

    self.setCurrentViewState(newView);
}

AppViewController.prototype.leaveCurrentView = function()
{
    var self = this;

    //
    // First cancel any current view
    //
    var currentViewState = self.getCurrentViewState();

    //
    // Disable the current view elements
    //
    var current_vse = getViewStateEntry(self.viewConfig, currentViewState);

    setViewStateEntryElementsVisibility(current_vse, false);

    if (current_vse.viewFunction != null) {
        current_vse.viewFunction(false);
    }
}

AppViewController.prototype.getCurrentViewState = function()
{
    var self = this;

    return self.viewStateCurrent;
}

AppViewController.prototype.setCurrentViewState = function(state)
{
    var self = this;

    self.viewStateCurrent = state;
}

//
// Toggle status view in and out
//
// This implements a one deep stack of the current view.
//
AppViewController.prototype.statusToggle = function()
{
    var self = this;

    if (self.statusPreviousView != null) {

        // Restore the previous view
        self.viewTransition(self.statusPreviousView);
        self.statusPreviousView = null;
    }
    else {

        //
        // Enable status
        //

        // Save current view
        self.statusPreviousView = self.getCurrentViewState();

        // transition to status
        self.viewTransition("status_landscape");
    }        
}

//
// Toggle settings view in and out
//
// This implements a one deep stack of the current view.
//
AppViewController.prototype.settingsToggle = function()
{
    var self = this;

    if (self.settingsPreviousView != null) {

        // Restore the previous view
        self.viewTransition(self.settingsPreviousView);
        self.settingsPreviousView = null;
    }
    else {

        //
        // Enable settings
        //

        // Save current view
        self.settingsPreviousView = self.getCurrentViewState();

        // transition to settings
        self.viewTransition("settings_landscape");
    }        
}

//
// Returns the view mode.
//
AppViewController.prototype.flipMode = function()
{
    var self = this;

      if (self.config.current_gauges == self.config.landscape_gauges) {
          self.viewTransition("portrait");
          return "portrait";
      }
      else {
          self.viewTransition("landscape");
          return "landscape";
      }
}

//
// Device specific scale factors experimentally determined
//
// Mode: scale 1.0 == 180px per gauge.
//
// Landscape mode is two rows of three gauge columns, fit within the client area.
//
// Portrait mode is three rows of two gauge columns, fit within the client area.
//
// Popular Devices:
//
// ipad1 1024x768 pixels, 132 ppi, 9.56 inches diagonal
// 
// ipad2 1024x768 pixels, 132 ppi, 9.56 inches diagonal
// 
// ipad air (retina) 2048x1536 pixels, 264 ppi, 9.7 inch diagonal
//   - screen.width reports 768, screen.height reports 1024
//     - This is half of spec.
// 
// ipad mini (retina) 2048x1536 pixels, 326 ppi
// 
// iphone6 1134 x 750 pixels, 326 ppi, 16:9 aspect ratio, 4.7 inch diagonal
// 
// iphone5 1136 x 640 pixels, 326 ppi, 16:9 aspect ratio, 4.0 inch diagonal
//   - screen.width reports 320, screen.height reports 568
//     - This is half of spec.
// 
// iphone4 960 x 640 pixels, 326 ppi, 16:9 aspect ratio, 3.5 inch diagonal
// 
// iphone3GS 320 x 480 pixels, 163 ppi, 3.5 inch diagonal
// 
// Google Nexus 7 (Asus) 800x1280 pixels, 216 ppi, 7.0 inches diagonal
// 
AppViewController.prototype.calculateScaleFactor = function()
{
    var self = this;

    var height = screen.height;
    var width = screen.width;
    var orientation = window.orientation;
    var landscape = false;
    var scaleFactor = 1.0;

    if ((typeof(orientation) == "undefined") || (orientation == null)) {
        if (self.config.enableInstrumentation) {
            alert("window.orientation undefined, default to landscape");
        }
        landscape = true;
    }
    else {

        switch(orientation) {
        case 0:
        case 180:
            // portrait
            landscape = false;
            break;
     
        case -90:
        case 90:
        default:
            // landscape
            landscape = true;
            break;
        }
    }

    if ((width >= 300) && (width < 370)) {

        if (self.config.enableInstrumentation) {
            alert("iphone detected width=" + width + " height=" + height);
        }

        // iphones 3, 4, 5
        if (landscape) {
            scaleFactor = 0.85;
        }
        else {
            scaleFactor = 2.5;
        }
    }
    else if ((width >= 370) && (width <= 750)) {

        if (self.config.enableInstrumentation) {
            alert("iphone6 detected width=" + width + " height=" + height);
        }

        // iphone 6
        if (landscape) {
            scaleFactor = 0.85;
        }
        else {
            scaleFactor = 2.5;
        }
    }
    else if ((width == 768) && (height == 1024)) {

        if (self.config.enableInstrumentation) {
            alert("ipad detected width=" + width + " height=" + height);
        }

        // ipad 1, 2, air retina
        if (landscape) {
            scaleFactor = 1.5;
        }
        else {
            scaleFactor = 2.0;
        }
    }
    else {

        if (self.config.enableInstrumentation) {
            alert("unknown device detected width=" + width + " height=" + height);
        }

        scaleFactor = 1.0;
    }

    self.config.scale_factor = scaleFactor;

    return;
}

AppViewController.prototype.showResolution = function()
{
    var self = this;

    if (!self.config.enableInstrumentation) return;

    //
    // Note: On iPhone the screen width and height report remains the
    // same regardless of orientation.
    //
    var orientation = "orientation: " + window.orientation;

    var str = "width=" + screen.width + " height=" + screen.height;

    var str2 = "availwidth=" + screen.availWidth + " availheight=" + screen.availHeight;

    alert(orientation + " resolution:" + str + " " + str2);
}

//
// This is invoked from the HTML range control
//
AppViewController.prototype.scale_changed = function()
{
  var self = this;

  var s = document.getElementById("scale_input");
   //alert("slider value " + s.value);

   var range = s.value / 100; // .25 - 2

   self.config.scale_factor = range;

   if (self.config.enableInstrumentation) {
       alert("scale_factor " + self.config.scale_factor);
   }

   updateScaleCSS(self.config.scale_factor);

    if (self.config.current_gauges == null) {
        return;
    }

    // Clear the gauges, and force a redraw
    self.config.current_gauges.sizeChanged(self.onfig.scale_factor);

    self.config.updateGauges(self.config.current_gauges);
}

AppViewController.prototype.updateOrientation = function()
{
    var self = this;

    // Note: window.orientation is undefined in Chrome on Mac
    var orientation = window.orientation;
    if ((typeof(orientation) == "undefined") || (orientation == null)) {
        orientation = self.config.default_orientation;
    }

    self.showResolution();

    switch(orientation)
    {
        // Portrait
        case 0:

            // fallthrough

        // Portrait (upside-down portrait)
        case 180:
            self.viewTransition("portrait");
            break;

        // Landscape (right, screen turned clockwise)
        case -90:

            // fallthrough

        // Landscape (left, screen turned counterclockwise)
        case 90:

            // fallthrough

        default:

            self.viewTransition("landscape");
            break;
    }

    // Change scale
    self.calculateScaleFactor();
}

//
// Show a pop up with current readings
//
// This allows diagnosis of the data source, as well as
// seeing details not normally shown on the web page.
//
AppViewController.prototype.show_current_readings_popup = function()
{
    var self = this;

    if (self.applicationData == null) {
        alert("no application data binding");
        return;
    }

    self.applicationData.getLatestReading(function (error, opdata) {
        //var readings = JSON.stringify(opdata.readings);

        if (opdata === null) {
            alert("null return from getLatestReading");
            return;
        }

        if (opdata.readings === null) {
            var opdata_as_json = DumpObjectAsJsonIndented(opdata, null);

            alert("opdata.readings=null opdata=" + opdata_as_json);
            return;
        }

        var readings = DumpObjectAsJsonIndented(opdata.readings, null);
        alert(readings);
        return;
    });
}

function updateStatusBar(status) {
    document.getElementById("status_bar_input").value = status;
}

//
// Build or update the settings table specified by Id.
//
function settingsTableEnable(tableId)
{
    var settingsPageInitialized = false;

    //
    // See if we have initialized the table yet
    //
    var table = HtmlTablesGetInstanceByTableId(tableId);
    if (table == null) {

        //
        // The template for the table is on the main HTML page.
        //
        // The main page view controller invokes this routine
        // with its name.
        //
        table = new HtmlTables(null, tableId, settings_item_clicked);
        settingsBuildTable(table);
    }
    else {

        //
        // Update the existing table
        //
        settingsUpdateTable(table);
    }
}

//
// Build a new settings table from current readings.
//
function settingsBuildTable(table)
{
    var appData = getApplicationDataModel();

    //
    // Get the latest readings to fill in the default values.
    //
    appData.getSettingsDisplayValues(function (error, settingsObject) {

        if (error != null) {
            updateStatusBar("Error: " + error + " at " + new Date().toISOString());
            return;
        }

        //
        // An updatable table has a read-only name field, an editable input
        // field,  and a submit button for each item.
        //
        // settings_item is the CSS selector for each row in the table
        // and expands into "settings_item_name", "settings_item_input", and
        // "settings_item_button".
        //
        table.BuildDataTableFromObject(settingsObject, "settings_item", false);
    });
}

//
// Update the table with the latest values from the remote application.
//
function settingsUpdateTable(table)
{
    var appData = getApplicationDataModel();

    //
    // Get the latest readings to fill in the default values.
    //
    appData.getSettingsDisplayValues(function (error, settingsObject) {

        if (error != null) {
            updateStatusBar("Error: " + error + " at " + new Date().toISOString());
            return;
        }

        table.UpdateDataTableFromObject(settingsObject);
    });
}

//
// A settings item submit button was clicked to update the value
// to the remote server/application.
//
// table - HtmlTables instance
//
// name - Item name from BuildDataTabelFromObject
//
// value - Current value of selected item
//
function settings_item_clicked(table, name, value)
{
    var appData = getApplicationDataModel();

    //
    // Update the setting.
    //

    appData.updateSingleSetting(name, value, function(error, result) {

        if (error != null) {
            var error_message = DumpObjectAsJsonIndented(error);
            alert("Error updating setting " + name + " error=" + error_message);
            return;
        }

        alert("settings " + name + " updated to new value " + value);
    });
}

//
// Build or update the settings table specified by name.
//
function statusTableEnable(tableId)
{
    //
    // See if we have initialized the table yet
    //
    var table = HtmlTablesGetInstanceByTableId(tableId);
    if (table == null) {

        //
        // The template for the table is on the main HTML page.
        //
        // The main page view controller invokes this routine
        // with its name.
        //
        table = new HtmlTables(null, tableId);
        statusBuildTable(table);
    }
    else {

        //
        // Update the existing table
        //
        statusUpdateTable(table);
    }
}

//
// Build a new status table from current readings.
//
function statusBuildTable(table)
{
    var appData = getApplicationDataModel();

    //
    // Get the latest readings
    //
    appData.getStatusDisplayValues(function (error, statusObject) {

        if (error != null) {
            updateStatusBar("Error: " + error + " at " + new Date().toISOString());
            return;
        }

        //
        // A regular table has a read-only name field, and a read-only
        // value field for each item.
        //
        // settings_item is the CSS selector for each row in the table.
        //
        // status_item is the CSS selector for each row in the table
        // and expands into "status_item_name", "status_item_input".
        //
        table.BuildDataTableFromObject(statusObject, "status_item", true);
    });
}

//
// Update the table with the latest values from the remote application.
//
function statusUpdateTable(table)
{
    var appData = getApplicationDataModel();

    //
    // Get the latest readings to fill in the values.
    //
    appData.getStatusDisplayValues(function (error, readingsObject) {

        if (error != null) {
            updateStatusBar("Error: " + error + " at " + new Date().toISOString());
            return;
        }

        table.UpdateDataTableFromObject(readingsObject);
    });
}

