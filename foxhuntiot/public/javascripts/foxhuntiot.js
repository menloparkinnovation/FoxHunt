
//
//   Openpux Internet Of Things (IOT) Framework.
//
//   Copyright (C) 2017 Menlo Park Innovation LLC
//
//   menloparkinnovation.com
//   menloparkinnovation@gmail.com
//
//   FoxHunt RDF/ADF code behind page.
//

//
// Application View Controller.
//
// This must be at the top so that the variable is within view
// page functions. It is initialized at the end of the page.
//
var g_appViewController = null;

//
// *** Javascript Event Handlers for Main Page ***
//

//
// Page loaded from the <body onload="bodyPageLoaded">
//
function bodyPageLoaded() {
    g_appViewController.pageLoaded();
}

//
// Settings button is clicked
//
// <button onclick="settings_button_clicked"></button>
//
function settings_button_clicked() {
    g_appViewController.settingsToggle();
}

//
// Status button is clicked
//
// <button onclick="status_button_clicked"></button>
//
function status_button_clicked() {
    g_appViewController.statusToggle();

    //
    // Update the status bar to see the view scale
    //
    var s = "scale_factor=" + g_config.scale_factor;
    updateStatusBar("scale_factor=" + g_config.scale_factor);
}

//
// Details
//
// <button onclick="top_menu4_button_clicked"></button>
//
function top_menu4_button_clicked() {
    g_appViewController.show_current_readings_popup();
}

//
// Flip orientation
//
// <button onclick="top_menu5_button_clicked"></button>
//
function top_menu5_button_clicked() {
    g_appViewController.flipMode();
}

//
// *** Application Configuration  ***
//


//
// View Configuration describes the Single Page Web Application's
// view transitions as it switches context.
//
// The "story board" for a single page web app consists of these
// view transitions enabled by enabling/disabling the visibility
// of HTML DOM elements using their id tags.
//
// New views are added by defining new entries, and the DOM elements
// that need to be enabled when they are in view. An optional viewFunction
// is invoked when a transition occurs to allow custom handling.
//

var g_viewConfig = [];

//
// Each view has its own entry in the viewConfig[] array.
//
g_viewConfig.push({

    name: "blank",

    // enableIDs are HTML DOM elements to enable when in view
    enableIDs: [
    ],

    // viewFunction(enable) is invoked on state transitions in and out.
    viewFunction: null
});

//
// Note: For FoxHunt ADF the strip charts are currently disabled
//       until a use is found for them.
//

g_viewConfig.push({

    name: "landscape",

    enableIDs: [
        "landscape_display"
        //"landscape_stripchart"
    ],

    viewFunction: function(enable) {
        var self = g_appViewController;
        if (enable) {
            // Swap out gauges pointer and update the gauges
            self.config.current_gauges = self.config.landscape_gauges;
            self.config.updateGauges(self.config.current_gauges);
        }
    }
});

g_viewConfig.push({

    name: "portrait",

    enableIDs: [
        "portrait_display"
        //"portrait_stripchart"
    ],

    viewFunction: function(enable) {
        var self = g_appViewController;
        if (enable) {
            // Swap out gauges pointer and update the gauges
            self.config.current_gauges = self.config.portrait_gauges;
            self.config.updateGauges(self.config.current_gauges);
        }
    }
});

g_viewConfig.push({

    name: "status_landscape",

    enableIDs: [
        "status_landscape_display"
    ],

    viewFunction: function(enable) {
        var self = g_appViewController;
        if (enable) {
            // Enable status_landscape tableID
            statusTableEnable("status_landscape");
        }
    }
});

g_viewConfig.push({

    name: "settings_landscape",

    enableIDs: [
        "settings_landscape_display"
    ],

    viewFunction: function(enable) {
        var self = g_appViewController;
        if (enable) {
            // Enable settings_landscape tableID
            settingsTableEnable("settings_landscape");
        }
    }
});

var g_config = {

    // Set the view config
    viewConfig: g_viewConfig,

    // Set this to true for reports on screen width, height, and orientation changes.
    enableInstrumentation: false,

    // scale_factor == 1.0 == 180px
    //scale_factor: 1.0,
    
    // RaspberryPi2 with official 7" screen in landscape mode
    scale_factor: 0.75,

    // Google Nexus 7" screen portrait mode
    //scale_factor: 2.0,

    // Google Nexus 7" screen landscape mode
    //scale_factor: 1.0,

    // iPhone5 in portrait mode
    //scale_factor: 2.5,

    // iPhone 5 in landscape mode
    // 163 ppi
    //scale_factor: 0.85,

    // iPad air retina in portrait mode
    // iPad2 retina in portrait mode
    // iPad 1 in portrait mode
    //scale_factor: 2.0,

    // ipad air retina in landscape mode
    // ipad2 retina in landscape mode
    // iPad 1 in landscape mode
    //scale_factor: 1.5,

    //
    // This sets the default mode for when window.orientation is unavailable.
    //

    // Landscape
    default_orientation: 90,

    // Portrait
    //default_orientation: 0,

    // Update rate that it acquires from the server
    //update_rate: 30000,
    update_rate: 5000,

    // Runtime variables
    current_gauges: null,

    portrait_gauges: null,

    landscape_gauges: null,

    //
    // This is a function exported from a lambda scope, but
    // available globally
    //
    updateGauges: null
};

//
// Per page functions extend the AppViewController partial class
// in AppViewController.js
//

//
// This gets run when the browser page loads from bodyPageLoaded().
//
//  <body onload="bodyPageLoaded()">
//
AppViewController.prototype.pageLoaded = function()
{
    var self = this;

    //
    // Setup page local/class instance variables
    //
    self.statusPreviousView = null;
    self.settingsPreviousView = null;
    self.enableInstrumentation = self.config.enableInstrumentation;

    updateStatusBar("Initializing...");

    //
    // Defined in main .html page
    //
      
    self.appDataConfig = getAnonymousWebClientConfig();
    self.applicationData = new ApplicationData(self.appDataConfig);

    // Update CSS for gauge scale factor
    updateScaleCSS(self.config.scale_factor);

    //
    // Load Application Gauges.
    //
    // It a good idea to treat complex page elements as
    // components in a separate file and have this file
    // just handle its visibility.
    //

    self.config.landscape_gauges = new PageIoTGauges("landscape");
    self.config.portrait_gauges = new PageIoTGauges("portrait");

    //
    // We export this function to allow others functions to call it
    // by initializing its variable outside the scope of this function/closure.
    //
    self.config.updateGauges = function(gauges) {

        var data = {};

        self.applicationData.getLatestReading(function (error, opdata) {
            if (error != null) {
                updateStatusBar("Error: " + error + " at " + 
                    new Date().toISOString());
                return;
            }

            // this is hit on page load and every update.
            //debugger;

            data.absoluteBearing = opdata.absoluteBearing;
            data.adfDirectionUncertainty = opdata.adfDirectionUncertainty;

            data.observerDirection = opdata.observerDirection;
            data.observerDirectionUncertainty = opdata.observerDirectionUncertainty;

            data.observerSpeed = opdata.observerSpeed;

            data.readings = opdata.readings;

            gauges.update(data);

            updateStatusBar("Online last update " + new Date(Date.now()).toLocaleTimeString());
            //updateStatusBar("Online last update " + new Date(Date.now()).toISOString());
        });
    }

    // Read orientation, enable display
    self.updateOrientation();

    setInterval(function() {
        self.config.updateGauges(self.config.current_gauges);
    }, self.config.update_rate);
}

//
// Return the application data model
//
function getApplicationDataModel()
{
    return g_appViewController.applicationData;
}

//
// *** Executable Page Startup/Load Code ***
//

// Create View Controller
g_appViewController = new AppViewController(g_config);

g_appViewController.showResolution();

// Register touch events
document.addEventListener("touchstart", touchStart, false);
document.addEventListener("touchmove", touchMove, false);
document.addEventListener("touchend", touchEnd, false);
document.addEventListener("touchcancel", touchCancel, false);

// Set the table margin in pixels (float within the page)
tableMarginCSS(0, 0);

// Calculate scale factor based on device
g_appViewController.calculateScaleFactor();

