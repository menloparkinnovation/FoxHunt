
//
//   Openpux Internet Of Things (IOT) Framework.
//
//   Copyright (C) 2016 Menlo Park Innovation LLC
//
//   menloparkinnovation.com
//   menloparkinnovation@gmail.com
//
//   IotApp application data.
//
//   This is the "Model" file in MVC.
//
// 01/28/2017
//

//
// parameters:
//
// config = {
//    cloud_token: "12345678",
//    cloud_account: "1",
//    cloud_sensor_id: "4",
//    path: "/api/v1/applicationmame/applicationobject
// };
//
function ApplicationData(config)
{
    this.defaultAccount = config.cloud_account;
    this.defaultSensorID = config.cloud_sensor_id;

    //
    // RestExpressClient is a simple HTTP REST/JSON client.
    //

    this.opclient = new RestExpressClient(config);

    // null for host_args will load the origin from window.location
    this.defaultTicket = this.opclient.createTicket(config.cloud_token, config.path, null);
    if (this.defaultTicket == null) {
        console.log("error creating RestExpressClient ticket");
    }
    else {
        console.log("RestExpressClient client support loaded");
    }

    return;
}

//
// Get Latest Readings from backend.
//
// The backend could directly be the process under control, or a cloud/web
// service providing gateway access to the data.
//
// Either way, its expected to be accessible through HTTP/REST/JSON.
//
// Arguments:
//
// callback(error, result);
//
// Returns:
//
// result = {
//     temperature: 100,
//     humidity: 100
// };
//
ApplicationData.prototype.getLatestReading = function(callback)
{
    var self = this;

    var startdate = "2015:01:01:00:00:00";
    var enddate = "2022:01:01:00:00:00";

    var args = {
        readingcount: 1,
        startdate: startdate,
        enddate: enddate
    };

    var result = {};

    result.absoluteBearing = 0;
    result.observerDirection = 0;
    result.observerSpeed = 0;
    result.adfDirectionUncertainty = 0;
    result.observerDirectionUncertainty = 0;

    //
    // Invoke getObject REST request call to the backend.
    //

    self.opclient.getObject(self.defaultTicket, null, function(error, response) {

        if (error != null) {
            console.log("getLatestReading: error=");
            console.log(error);
            callback(error, response);
            return;
        }

        //console.log("getLatestReading: response=");
        //console.log(response);
       
        //
        // {
        //   readings: {
        //     temperatureCurrent: 70,
        //     humidityCurrent: 70
        //   }
        // }
        //

        result.absoluteBearing = response.readings.absoluteBearing;
        result.observerDirection = response.readings.observerDirection;
        result.observerSpeed = response.readings.observerSpeed;

        result.adfDirectionUncertainty = response.readings.adfDirectionUncertainty;
        result.observerDirectionUncertainty = response.readings.observerDirectionUncertainty;

        // Detailed readings
        result.readings = response.readings;

        callback(null, result);
    });
}

//
//
// Update the latest settings to the backend.
//
// The backend could directly be the process under control, or a cloud/web
// service providing gateway access to the data.
//
// Either way, its expected to be accessible through HTTP/REST/JSON.
//
// Arguments:
//
// newSettings - new settings.
//
// callback(error, result);
//
// Returns:
//
// result = {
//     temperature: 100,
//     humidity: 100
// };
//
ApplicationData.prototype.updateSettings = function(newSettings, callback)
{
    var self = this;

    //
    // Invoke updateObject REST request call to the backend.
    //

    self.opclient.updateObject(self.defaultTicket, null, newSettings, function(error, response) {

        if (error != null) {
            console.log("updateSettings: error=");
            console.log(error);
            callback(error, response);
            return;
        }

        if (response != null) {
            console.log("updateSettings: response=");
            console.log(response);
        }

        callback(null, response);
    });
}

//
// This builds an application specific object with the
// status field names and values that are displayed and used
// to dynamically build and update the status table.
//
// This gives the application the ability to customize what is
// show to the user display, vs. detailed data returned from
// the backend.
//
// callback(error, statusObject);
//
ApplicationData.prototype.getStatusDisplayValues = function(callback)
{
    var self = this;

    //
    // Get the latest readings.
    //
    self.getLatestReading(function (error, currentData) {

        if (error != null) {
            callback(error, null);
            return;
        }

        var readings = currentData.readings;

        //
        // Build an object with the values we want to show
        //
        var statusObject = {};

        //
        // This particular server returns both the current readings
        // along with the values of any settings. Only the dynamic
        // process data readings are shown in the status display.
        //

        statusObject.absoluteBearing = readings.absoluteBearing;
        statusObject.observerDirection = readings.observerDirection;
        statusObject.observerSpeed = readings.observerSpeed;
        statusObject.observerTime = readings.observerTime;
        statusObject.observerPosition = readings.observerPosition;

        statusObject.gpsPosition = readings.gpsPosition;
        statusObject.gpsUTCTime = readings.gpsUTCTime;

        statusObject.signalFrequency = readings.signalFrequency;
        statusObject.signalStrength = readings.signalStrength;
        statusObject.signalQuality = readings.signalQuality;

        statusObject.adfDirectionUncertainty = readings.adfDirectionUncertainty;
        statusObject.observerDirectionUncertainty = readings.observerDirectionUncertainty;

        statusObject.receiverLevel = readings.receiverLevel;

        //
        // Internal diagnostics. These can be used to update the status
        // display or pop up an alert if required.
        //

        statusObject.fatalError = readings.fatalError;
        statusObject.sensorError = readings.sensorError;
        statusObject.sensorPresent = readings.sensorPresent;

        callback(null, statusObject);
    });
}

//
// This builds an application specific object with the
// settings field names and default values that is used
// to dynamically build and update the settings table.
//
// This gives the application the ability to customize what is
// show to the user display to update, vs. detailed data returned
// from the backend. In many cases only certain fields may be
// changed based on the backend devices configuration.
//
// callback(error, settingsObject);
//
ApplicationData.prototype.getSettingsDisplayValues = function(callback)
{
    var self = this;

    //
    // Settings displays the current values so retrieve them.
    //

    self.getLatestReading(function (error, currentData) {

        if (error != null) {
            callback(error, null);
            return;
        }

        var readings = currentData.readings;

        //
        // This particular server returns both the current readings
        // along with the current values of any settings. Only the
        // settings values are displayed here.
        //
        // Note: that current settings are retrieved and used to
        // pre-populate the fields with a "default" value based
        // on the current values returned from the server.
        //

        //
        // Build an object with the settings we want to allow to be changed.
        //
        var settingsObject = {};

        settingsObject.SettingsPassword = "";

        settingsObject.adfDirectionUncertainty = readings.adfDirectionUncertainty;

        settingsObject.observerDirectionUncertainty = readings.observerDirectionUncertainty;

        settingsObject.observerPosition = readings.observerPosition;

        settingsObject.signalFrequency = readings.signalFrequency;

        settingsObject.receiverLevel = readings.receiverLevel;

        callback(null, settingsObject);
    });
}

//
// Update single setting.
//
ApplicationData.prototype.updateSingleSetting = function(settingName, settingValue, callback)
{
    var self = this;

    //
    // Application takes a JSON document as follows:
    //
    // {
    //   settings: {
    //       temperatureTarget: 70
    //   }
    // }
    //

    var settings = {};
    var updateObject = {};
    updateObject.settings = settings;

    settings[settingName] = settingValue;

    self.updateSettings(updateObject, function(error, result) {

        // HTTP transport error
        if (error != null) {
            callback(error, result);
            return;
        }

        //
        // Check application status
        //
        // {
        //   Status: HTTP_CODE,
        //   error: error message
        // }
        //
        if (result.Status != 200) {
            callback(result.error, result);
            return;
        }

        callback(null, result);
    });
}
