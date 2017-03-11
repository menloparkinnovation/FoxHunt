
//
// DeviceAgent for FoxHunter Application.
//
// 02/11/2017
//

//
//   FoxHunt - DeviceAgent
//
//   Copyright (C) 2017 Menlo Park Innovation LLC
//
//   menloparkinnovation.com
//   menloparkinnovation@gmail.com
//
//   Snapshot License
//
//   This license is for a specific snapshot of a base work of
//   Menlo Park Innovation LLC on a non-exclusive basis with no warranty
//   or obligation for future updates. This work, any portion, or derivative
//   of it may be made available under other license terms by
//   Menlo Park Innovation LLC without notice or obligation to this license.
//
//   There is no warranty, statement of fitness, statement of
//   fitness for any purpose, and no statements as to infringements
//   on any patents.
//
//   Menlo Park Innovation has no obligation to offer support, updates,
//   future revisions and improvements, source code, source code downloads,
//   media, etc.
//
//   This specific snapshot is made available under the following license:
//
//   Licensed under the MIT License (the "License");
//   you may not use this file except in compliance with the License.
//   You may obtain a copy of the License at
//
//       http://opensource.org/licenses/MIT
//
//   Unless required by applicable law or agreed to in writing, software
//   distributed under the License is distributed on an "AS IS" BASIS,
//   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//   See the License for the specific language governing permissions and
//   limitations under the License.
//

//
// The MIT License (MIT)
// Copyright (c) 2017 Menlo Park Innovation LLC
// 
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the "Software"),
// to deal in the Software without restriction, including without limitation
// the rights to use, copy, modify, merge, publish, distribute, sublicense,
// and/or sell copies of the Software, and to permit persons to whom the
// Software is furnished to do so, subject to the following conditions:
// 
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
// 
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
// FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
// DEALINGS IN THE SOFTWARE.
//

//
// Create DeviceAgent
//
function DeviceAgent(config)
{
    var self = this;

    self.config = config;

    self.moduleName = "DeviceAgent";

    self.trace = false;

    self.traceErrorValue = false;

    if (typeof(config.trace) != "undefined") {
        self.trace = config.trace;
    }

    if (typeof(config.traceerrorValue) != "undefined") {
        self.traceerrorValue = config.traceerrorValue;
    }

    // Load Azure IoT Hub support
    self.iotHubFactory = require('./AzureIotHub');

    self.iotHub = new self.iotHubFactory.AzureIotHub(self.config);

    self.adfHandler = null;

    //
    // This stores the last report received from the AdfHandler
    //
    self.lastAdfReport = null;

    //
    // Load GPS handler.
    //
    self.gpsParserFactory = require('./nmea_gps.js');

    self.gpsParser = null;

    var gpsConfig = {};
    gpsConfig.trace = self.trace;
    gpsConfig.traceerror = self.traceErrorValue;

    self.gpsParser = new self.gpsParserFactory.createInstance(gpsConfig);

    //
    // This stores the last report received from the GpsHandler
    //
    self.lastGpsDataReport = null;
}

//
// callback(error, readings)
//
DeviceAgent.prototype.GetReadings = function(callback)
{
    var self = this;

    if (self.lastAdfReport != null) {
        callback(null, self.lastAdfReport);
        return;
    }

    //
    // See if we have GPS data and generate a GPS only report
    //
    if (self.lastGpsDataReport != null) {
        var report = self.CreateGpsReport()
        callback(null, report);
    }
    else {
        callback("no report", null);
    }

    return;
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
DeviceAgent.prototype.SetParameters = function(params, callback)
{
    var self = this;

    //
    // Set operational parameters that can be changed at runtime.
    //

    if ((typeof(params.trace) != "undefined") && (params.trace != null)) {
        self.trace = params.trace;
    }

    if ((typeof(params.traceerror) != "undefined") && (params.traceerror != null)) {
        self.traceErrorValue = params.traceerror;
    }

    callback(null, null);
}

//
// Load the ADF handler
//
DeviceAgent.prototype.LoadAdfHandler = function(callback)
{
    var self = this;

    self.adfHandlerFactory = require(self.config.adfHandler);

    //
    // This is the AgrelloADF module configuration.
    //
    var config = {};
    config.trace = self.trace;
    config.traceerror = self.trace;

    // sudo npm install serialport -save
    config.portName = self.config.port;
    config.baudRate = self.config.baudRate;

    //
    // Pass through simulation mode from the DeviceAgent config
    // in self.config.
    //
    config.simulationMode = self.config.simulationMode;

    //
    // Setup a handler for unhandled messages since they could be
    // embedded GPS messages.
    //
    config.unhandledMessageHandler = function(data) {
        self.unhandledMessageHandler(data);
    };

    self.adfHandler = new self.adfHandlerFactory.AgrelloADF(config);

    self.adfHandler.StartReader(function(data) {

        var report = self.CreateDataReport(data)
    
        self.lastAdfReport = report;

        console.log("ADFHandler: Got report, sending to Cloud: report=");
        console.log(report);

        self.iotHub.SendReport(report, function(error) {
            if (error != null) {
                console.log("iotHub.SendReport error=" + error);
            }
        });
    });

    callback(null);
}

//
// Process an unhandled message from the ADF unit.
//
// Many ADF units will pass through GPS messages to be handled
// by the GPS parser.
//
DeviceAgent.prototype.unhandledMessageHandler = function(data)
{
    var self = this;

    //
    // Attempt to parse as a potential GPS message
    //
    self.gpsParser.ParseMessage(data, function(gpsError, gpsData) {

        if (gpsError != null) {
            self.traceerror("error parsing GPS message error=" + gpsError);
            self.traceerror("DeviceAgent: Unhandled Message");
            if (self.traceErrorValue) {
                console.log(data);
            }
            return;
        }

        self.tracelog("Received Valid GPS Data: parsed GPS data=");
        if (self.trace) {
            console.log(gpsData);
        }

        self.lastGpsDataReport = gpsData;
    });
}

//
// Handle Cloud to Device Messages.
//
DeviceAgent.prototype.CloudToDeviceMessage = function(msg)
{
    var self = this;

    self.tracelog("CloudToDeviceMessage received!");

    self.tracelog('Id: ' + msg.messageId + ' Body: ' + msg.data);
}

DeviceAgent.prototype.Initialize = function(callback)
{
    var self = this;

    //
    // Need to bind our local "this" to the callback so
    // it runs in this modules context, and not our callers.
    //
    // We could supply our "this" to the caller, but closures
    // handle this nicely in the language itself.
    //
    var cloudToDeviceClosure = function(msg) {
        self.CloudToDeviceMessage(msg);
    };

    //
    // Initialize the ADF unit
    //
    self.LoadAdfHandler(function(error) {

        if (error != null) {
            callback(error);
            return;
        }

        //
        // Initialize the IoT Hub
        //
        // Note: Cloud to Device messages may already have been enqueued
        // for this device so we must be ready to receive them.
        //
        self.iotHub.Initialize(cloudToDeviceClosure, function(error) {
            callback(error);
        });
    });
}

//
// TraceLog
//
DeviceAgent.prototype.tracelog = function(message)
{
    var self = this;

    if (self.trace) {
        console.log(message);
    }
}

//
// Start a Simulation
//
DeviceAgent.prototype.StartSimulation = function()
{
    var self = this;

    setInterval(function(){
    
        var report = CreateSimulatedDataReport()
    
        self.lastAdfReport = report;

        self.iotHub.SendReport(report, function(error) {
            if (error != null) {
                console.log("Simulation: error=" + error);
            }
        });
    
    }, 10000);
}

//
// Create a GPS Report after receiving GPS data.
//
DeviceAgent.prototype.CreateGpsReport = function()
{
    var self = this;

    var config = self.config;

    var report = {};

    // This is what ever name your group uses for the ADF report hardware.
    report.deviceAlias = config.deviceAlias;

    report.observer = config.observer;

    report.equipment = config.equipment;

    //
    // GPS data
    //
    // Note: GPS time is more accurate and should be provided if possible.
    //

    // This allows the caller to decode
    report.gpsNMEAMessage = self.lastGpsDataReport.sentence;

    var m = self.lastGpsDataReport.message;

    if (m.readingIsGood) {
        report.observerPosition = m.latitude + " " + m.longitude;
        report.gpsPosition = report.observerPosition;

        // This is the GPS time of the observation.
        report.gpsUTCTime = m.UTCTime;

        // Observer direction
        report.observerDirection = m.direction;

        // Observer speed
        report.observerSpeed = m.speed;
    }
    else {
        report.observerPosition = null;
        report.gpsPosition = null;
        report.gpsUTCTime = null;
    }

    // This is the devices time of the observation, and may not be as accurate as GPS time
    report.deviceUTCTime = new Date(Date.now()).toISOString();

    //
    // This is an optional time when the device is sending the report
    // not the observation times which are reported above.
    //
    report.deviceReportingUTCTime = new Date(Date.now()).toISOString();

    // In Mhz. This would be updated dynamically by a scanner.
    report.signalFrequency = config.signalFrequency;

    // String
    report.modulationType = config.modulationType;

    report.reportType = "GPS Only";

    return report;
}

//
// Create a Data Report after receiving AdfAgent data.
//
DeviceAgent.prototype.CreateDataReport = function(data)
{
    var self = this;

    var config = self.config;

    var report = {};

    // This is what ever name your group uses for the ADF report hardware.
    report.deviceAlias = config.deviceAlias;

    report.observer = config.observer;

    report.equipment = config.equipment;

    //
    // GPS data
    //
    // Note: GPS time is more accurate and should be provided if possible.
    //
    if (self.lastGpsDataReport != null) {

        // This allows the caller to decode
        report.gpsNMEAMessage = self.lastGpsDataReport.sentence;

        var m = self.lastGpsDataReport.message;

        if (m.readingIsGood) {
            report.observerPosition = m.latitude + " " + m.longitude;
            report.gpsPosition = report.observerPosition;

            // This is the GPS time of the observation.
            report.gpsUTCTime = m.UTCTime;

            // Observer direction
            report.observerDirection = m.direction;

            // Observer speed
            report.observerSpeed = m.speed;
        }
        else {
            report.observerPosition = null;
            report.gpsPosition = null;
            report.gpsUTCTime = null;
            report.observerDirection = null;
            report.observerSpeed = null;
        }
    }
    else {
        report.observerPosition = null;
        report.gpsPosition = null;
        report.gpsUTCTime = null;
        report.observerDirection = null;
        report.observerSpeed = null;
    }

    // This is the devices time of the observation, and may not be as accurate as GPS time
    report.deviceUTCTime = new Date(Date.now()).toISOString();

    //
    // This is an optional time when the device is sending the report
    // not the observation times which are reported above.
    //
    report.deviceReportingUTCTime = new Date(Date.now()).toISOString();

    //
    // Bearing reports from True North are preferred.
    //

    // Bearing from True North
    report.absoluteBearing = data.bearing;

    report.directionQuality = data.quality;

    // Relative to the unit.
    report.relativeBearing = null;

    // Bearing from Magnetic North
    report.absoluteMagneticBearing = null;

    // In Mhz. This would be updated dynamically by a scanner.
    report.signalFrequency = config.signalFrequency;

    // In db. An SDR or radio control link can report this.
    report.signalStrength = null;

    // String
    report.modulationType = config.modulationType;

    //
    // reportType could be:
    //
    // ADF
    // Manual RDF
    // Human Observer
    // GPS Only
    //

    report.reportType = config.reportType;

    // Scale of 1 - 10 based on your equipment confidence, signal quality.
    report.confidence = data.quality;

    return report;
}

//
// This is a data report that comes in from the ADF
// unit and GPS receiver.
//
function CreateSimulatedDataReport()
{
    var report = {};

    // This is what ever name your group uses for the ADF report hardware.
    report.deviceAlias = "Tiger Mountain Repeater";

    report.observer = "FoxHunter Test Simulator";

    report.equipment = "Simulated Test ADF";

    // Tiger Mountain, WA State
    report.observerPosition = "47.4425, -121.9776";

    // This is the devices time of the observation, and may not be as accurate as GPS time
    report.deviceUTCTime = new Date(Date.now()).toISOString();

    //
    // Note: GPS time is more accurate and should be provided if possible.
    //
    // Simulation: Do not report GPS time if not available.
    //

    // This is the GPS time of the observation.
    report.gpsUTCTime = new Date(Date.now()).toISOString();

    //
    // This is an optional time when the device is sending the report
    // not the observation times which are reported above.
    //
    report.deviceReportingUTCTime = new Date(Date.now()).toISOString();

    //
    // Bearing reports from True North are preferred.
    //

    // Bearing from True North
    report.absoluteBearing = 180;

    // Relative to the unit.
    report.relativeBearing = 90;

    // Bearing from Magnetic North
    report.absoluteMagneticBearing = 160;

    // In Mhz
    report.signalFrequency = 146.52;

    // In db
    report.signalStrength = 21.4;

    // String
    report.modulationType = "FM";

    //
    // reportType could be:
    //
    // ADF
    // Manual RDF
    // Human Observer
    // 

    report.reportType = "Test Machine Simulation";

    // Scale of 1 - 10 based on your equipment confidence, signal quality.
    report.confidence = 10;

    return report;
}

DeviceAgent.prototype.tracelog = function(message) {
    if (this.trace) {
        console.log(this.moduleName + ": " + message);
    }
}

DeviceAgent.prototype.traceerror = function(message) {
    if (this.traceerrorValue) {
        console.error(this.moduleName + ": " + message);
    }
}

module.exports = {
  DeviceAgent: DeviceAgent
};
