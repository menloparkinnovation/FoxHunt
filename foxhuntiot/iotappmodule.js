
/*
 * Copyright (C) 2017 Menlo Park Innovation LLC
 *
 * This is licensed software, all rights as to the software
 * is reserved by Menlo Park Innovation LLC.
 *
 * A license included with the distribution provides certain limited
 * rights to a given distribution of the work.
 *
 * This distribution includes a copy of the license agreement and must be
 * provided along with any further distribution or copy thereof.
 *
 * If this license is missing, or you wish to license under different
 * terms please contact:
 *
 * menloparkinnovation.com
 * menloparkinnovation@gmail.com
 */

//
// iotappmodule.js - template for an IoT App.
//

//
// Note: The contract for an IoT application module is as follows:
//
// IoTAppName(config) - Constructor accessed through module.exports.Module.
//
// IoTAppName.prototype.mainLoop = function() {};
//
// IoTAppName.prototype.GetReadings = function(callback) {};
//
// IoTAppName.prototype.SetParameters = function(params, callback) {};
//

//
// ******* Begin standard Contract for IoTApp Module *******
//

//
// Config comes from config/config.json.
//
function IoTAppModule(config) {
    var self = this;

    self.config = config;

    self.trace = false;
    self.traceerrorValue = false;

    if (typeof(config.trace) != "undefined") {
        self.trace = config.trace;
    }

    if (typeof(config.traceError) != "undefined") {
        self.traceerrorValue = config.traceError;
    }

    //
    // General state
    //

    self.fatalError = false;
    self.sensorError = false;
    self.sensorPresent = true;
    self.lastErrorStatus = null;
    self.sensorInterval = 30 * 1000; // seconds
    self.intervalObject = null;

    if (typeof(self.config.sensorInterval) != "undefined") {
        // Value in the configuration file is in seconds
        self.sensorInterval = self.config.sensorInterval * 1000;
    }

    //
    // App specific state
    //

    self.AppStateInitialize();
}

//
// GetReadings:
//
// Return readings from the process under control.
//
// This includes the current values of any application
// specific settings, or derived state values.
//
// The field names of the returned readings object become the
// names displayed in the UI.
//
// callback(error, readings)
//
IoTAppModule.prototype.GetReadings = function(callback)
{
    var self = this;

    var readings = {};

    // General Operational State
    readings.fatalError = self.fatalError;

    readings.sensorError = self.sensorError;

    readingslastErrorStatus = self.lastErrorStatus;

    readings.sensorInterval = self.sensorInterval;
    
    readings.sensorPresent = self.sensorPresent;

    // Get application specific readings
    self.AppGetReadings(readings, function(error) {
        setImmediate(callback, error, readings);
    });
}

//
// SetParameters:
//
// The field names of the returned settings object become the
// names displayed in the UI.
//
// The values returned are the current, or default values for
// the given setting.
//
// callback(error, settings)
//
// Settings.
//
IoTAppModule.prototype.SetParameters = function(params, callback)
{
    var self = this;
    var doSet = false;

    //
    // Allow the processing interval to be updated.
    //

    var newInterval = self.sensorInterval;

    if ((typeof(params.sensorInterval) != "undefined") && (params.sensorInterval != null)) {
        newInterval = params.sensorInterval;
        doSet = true;
    }

    if (doSet) {
        self.SetInterval(newInterval);
    }

    self.AppSetParameters(params, function(error) {
        setImmediate(callback, error, null);
    });
}

//
// Main loop for IoTApp application.
//
IoTAppModule.prototype.mainLoop = function()
{
    var self = this;

    //
    // Start an interval timer to simulate the
    // process control function.
    //
    // Many actual process control functions are basic
    // timer loops that update internal variables
    // from external sensor readings.
    //

    //
    // A more interrupt driven application would operate by
    // registering callbacks with a driver subsystem, etc.
    //
    // Still, many IoT applications have this timer loop
    // if only for watchdog purposes.
    //

    self.SetSensorInterval(self.sensorInterval);

    self.AppMainLoop();
}

//
// This is not an external contract, but supports the
// very common process control interval, or watchdog.
//
IoTAppModule.prototype.intervalFunction = function()
{
    var self = this;

    self.AppIntervalFunction();
}

IoTAppModule.prototype.SetSensorInterval = function(newInterval)
{
    var self = this;

    //
    // Cancel and re-arm the timers
    //

    if (self.intervalObject != null) {
        clearInterval(self.intervalObject); 
        self.intervalObject = null;
    }

    self.sensorInterval = newInterval;

    self.intervalObject = setInterval(function() {
        self.intervalFunction();
    },
    self.sensorInterval);
}

module.exports = {
  Module: IoTAppModule
};

//
// ******* End Standard Contract for IoTApp Module *******
//

var fs = require('fs');

IoTAppModule.prototype.AppMainLoop = function()
{
    var self = this;

    //
    // Initialize the DeviceAgent
    //

    self.LoadDeviceAgent(self.config.deviceAgentConfig, function(error) {

        if (error != null) {
            console.log("failed to initialize DeviceAgent error=");
            console.log(error);
            process.exit(1);
        }
    });
}

//
// Load the device agent the handles the ADF device.
//
IoTAppModule.prototype.LoadDeviceAgent = function(configFileName, callback)
{
    var self = this;
    var msg = null;

    //
    // Read the DeviceAgent's JSON configuration file
    //

    var deviceAgentConfig = null;

    try {
        var jsonText = fs.readFileSync(configFileName);
        deviceAgentConfig = JSON.parse(jsonText);
    }
    catch(e) {
        msg = "exception processing jsonfile e=" + e;
        console.log(msg);
        callback(msg, null);
        return;
    }

    //
    // Add the IoT Hub connection string
    //
    // . $HOME/credentials/azure_iothub_foxhunt_credentials.sh
    //
    // azure_iothub_foxhunt_credentials.sh:
    //
    // export AZURE_IOT_HUB_CONNECTION_STRING="your connection string"
    //
    // export AZURE_IOT_HUB_DEVICE_CONNECTION_STRING="your device connection string"
    //
    self.connectionString = process.env.AZURE_IOT_HUB_DEVICE_CONNECTION_STRING;

    if ((typeof(self.connectionString) == "undefined") || (self.connectionString == null)) {
        msg = "run . $HOME/credentials/azure_iothub_foxhunt_credentials.sh";
        console.log(msg);
        callback(msg, null);
        return;
    }

    // Pass the connection string to the DeviceAgent
    deviceAgentConfig.connectionString = self.connectionString;

    // Pass through the simulation mode from the master config.
    deviceAgentConfig.simulationMode = self.config.simulationMode;

    // The main application config file specifies the DeviceAgent
    self.deviceAgentFactory = require(self.config.deviceAgent);

    self.deviceAgent = new self.deviceAgentFactory.DeviceAgent(deviceAgentConfig);

    self.deviceAgent.Initialize(function(error) {

        if (error != null) {
            msg = "DeviceAgent: AzureIotHub reported error=" + error;
            console.log(msg0);
            callback(msg, null);
            return;
        }

        if ((typeof(deviceAgentConfig.simulation) != "undefined") && deviceAgentConfig.simulation) {
            self.deviceAgent.StartSimulation();
        }
    });
}

//
// Application specific worker functions are here to allow
// easy customization to a new application without having
// to edit with the boilerplate.
//

//
// Initialize application specific state variables.
//
IoTAppModule.prototype.AppStateInitialize = function()
{
    var self = this;

    self.latestDataReading = null;

    //
    // We just initialize the essential readings which must
    // always be present and reported.
    //
    // optional readings may be present depending on the
    // ADF device and its configuration.
    //

    self.absoluteBearing = -1;
    self.observerTime = "unknown";

    //
    // Settings.
    //
    // These are settings we want to display to the remote
    // agent/UI which can allow a change of configuration.
    //

    self.observerPosition = "unknown";

    self.signalFreqency = null;

    self.adfDirectionUncertainty = 20;

    self.observerDirectionUncertainty = 10;

    self.receiverLevel = -1;

    // The process control server returns live state data.
    self.liveData = false;
}

IoTAppModule.prototype.AppIntervalFunction = function()
{
    //
    // This is normally a watchdog or polls for data.
    //
    // Currently the Adf and Gps handlers are event driven.
    //
}

//
// This updates the IotApp state variables according to the
// latest readings from the DeviceAgent or GpsHandler.
//
// Process readings and update IotApp state variables.
//
IoTAppModule.prototype.AppProcessLatestReading = function(error, data, readings)
{
    var self = this;

    if (error != null) {

        //
        // If there is an error, we reset dynamic values as we don't
        // have any data.
        //
        // Note: We can just change self.liveData to false to indicate
        // a bad report and keep old readings, but would make old data
        // stick around on an ADF malfunction.
        //
    
        self.liveData = false;
        self.latestDataReading = null;

        self.absoluteBearing = -1;
        self.observerTime = "unknown";

        readings.liveData = self.liveData;
        readings.absoluteBearing = self.absoluteBearing;
        readings.observerTime = self.observerTime;
        readings.signalFrequency = self.signalFrequency;
        readings.adfDirectionUncertainty = self.adfDirectionUncertainty;
        readings.observerDirectionUncertainty = self.observerDirectionUncertainty;
        readings.receiverLevel = self.receiverLevel;

        return;
    }

    self.liveData = true;

    self.latestDataReading = data;

    readings.reportType = self.reportType;

    //
    // This could be a GPS only report.
    //

    if ((typeof(data.absoluteBearing) != "undefined") && (data.absoluteBearing != -1)) {
        self.absoluteBearing = data.absoluteBearing;
        readings.absolutBearing = self.absoluteBearing;
    }

    self.observerTime = data.deviceReportingUTCTime;

    readings.observerTime = self.observerTime;

    //
    // These conditional values could be static settings from the
    // configuration or remote management interface (SetParameters),
    // or provided dynamically by the DeviceAgent.
    //
    // So we only update the local settings if present in a DeviceAgent
    // report which has that capability.
    //

    if ((typeof(data.observerPosition) != "undefined") && (data.observerPosition != null)) {
        self.observerPosition = data.observerPosition;
    }

    if ((typeof(data.signalFrequency) != "undefined") && (data.signalFrequency != null)) {
        self.signalFrequency = data.signalFrequency;
    }

    if ((typeof(data.adfDirectionUncertainty) != "undefined") &&
        (data.adfDirectionUncertainty != null)) {

        self.adfDirectionUncertainty = data.adfDirectionUncertainty;
    }

    if ((typeof(data.observerDirectionUncertainty) != "undefined") &&
        (data.observerDirectionUncertainty != null)) {

        self.observerDirectionUncertainty = data.observerDirectionUncertainty;
    }

    if ((typeof(data.receiverLevel) != "undefined") && (data.receiverLevel != null)) {
        self.receiverLevel = data.receiverLevel;
    }

    //
    // These required values could be set, or reported dynamically
    //
    // If a dynamic version is in the data report, it will be overwritten.
    //
    readings.signalFrequency = self.signalFrequency;
    readings.adfDirectionUncertainty = self.adfDirectionUncertainty;
    readings.observerDirectionUncertainty = self.observerDirectionUncertainty;
    readings.receiverLevel = self.receiverLevel;

    //
    // Now process optional values from the dynamic data report
    // into readings.
    //
    // This will add entries, over write previous values with
    // 

console.log("*******************************");
console.log("***** DeviceAgent Report= *****");
console.log("*******************************");
console.log(data);
console.log("*******************************");
console.log("*******************************");
console.log("*******************************");

    var keys = Object.keys(data);

    for (var i = 0; i < keys.length; i++) {

        var fieldName = keys[i];

        //
        // Ensure its a valid entry.
        //
        // If undefined, it will not be in keys[]
        // 
        if ((data[fieldName] != null) && (data[fieldName] != -1)) {
            readings[fieldName] = data[fieldName];
        }
    }

    // readings has been updated
    return;

}


//
// readings - Pre-filled in readings for general use.
//
// callback - Invoke when done. Errors are reported in
//            readings structure itself to the client of
//            the process control app.
//
// callback(error, readings)
//
IoTAppModule.prototype.AppGetReadings = function(readings, callback)
{
    var self = this;

    if (self.deviceAgent == null) {
        callback("no device agent", null);
        return;
    }

    //
    // Get latest report from DeviceAgent
    //
    self.deviceAgent.GetReadings(function(error, data) {

        //
        // Note: There may have been an error getting the
        // latest readings. If so we can still do a partial
        // report from settings.
        //

        // This updates the current IoTApp state variables referenced below.
        self.AppProcessLatestReading(error, data, readings);

        // Readings were filled in
        callback(null);
    });
}

//
// Set application specific parameters
//
// callback(error)
//
IoTAppModule.prototype.AppSetParameters = function(params, callback)
{
    var self = this;

    //
    // Only if a value is present in the settings structure is it used
    // to change the operational state.
    //

    if ((typeof(params.adfDirectionUncertainty) != "undefined") &&
        (params.adfDirectionUncertainty != null)) {

        self.adfDirectionUncertainty = params.adfDirectionUncertainty;
    }

    if ((typeof(params.observerDirectionUncertainty) != "undefined") &&
        (params.observerDirectionUncertainty != null)) {

        self.observerDirectionUncertainty = params.observerDirectionUncertainty;
    }

    if ((typeof(params.receiverLevel) != "undefined") &&
        (params.receiverLevel != null)) {

        self.receiverLevel = params.receiverLevel;
    }

    if ((typeof(params.signalFrequency) != "undefined") &&
        (params.signalFrequency != null)) {

        self.signalFrequency = params.signalFrequency;
    }

    if ((typeof(params.observerPosition) != "undefined") &&
        (params.observerPosition != null)) {

        self.observerPosition = params.observerPosition;
    }

    //
    // Invoke device agent to set any of its parameters.
    //

    if (self.deviceAgent != null) {
        self.deviceAgent.SetParameters(params, function(error) {
            callback(error);
        });
    }
    else {
        callback(null);
    }
}
