
//
// DeviceAgent for FoxHunter Application.
//
// 02/11/2017
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

    self.trace = config.trace;

    // Load Azure IoT Hub support
    self.iotHubFactory = require('./AzureIotHub');

    self.iotHub = new self.iotHubFactory.AzureIotHub(self.config);

    //
    // TODO: Load ADF unit report channel handler.
    //
    self.adfHandler = null;

    //
    // TODO: Load optional GPS report channel handler.
    //
    self.gpsHandler = null;
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
    // Initialize the IoT Hub
    //
    // Note: Cloud to Device messages may already have been enqueued
    // for this device so we must be ready to receive them.
    //
    self.iotHub.Initialize(cloudToDeviceClosure, function(error) {
        callback(error);
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
    
        self.iotHub.SendReport(report, function(error) {
            if (error != null) {
                console.log("Simulation: error=" + error);
            }
        });
    
    }, 10000);
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

module.exports = {
  DeviceAgent: DeviceAgent
};
