

//
// AzureIotHub.js
//
// 02/11/2017
//
// https://docs.microsoft.com/en-us/azure/iot-hub/iot-hub-node-node-getstarted
//
// npm -y init
// npm install azure-iot-device azure-iot-device-mqtt --save
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

'use strict';

//
// . ./setdevicecredentials.sh
//
// setdevicecredentials.sh: export AZURE_IOT_HUB_DEVICE_CONNECTION_STRING="your connection string"
//
// 'HostName={youriothostname};DeviceId=myFirstNodeDevice;SharedAccessKey={yourdevicekey}'
//
var g_connectionString = process.env.AZURE_IOT_HUB_DEVICE_CONNECTION_STRING;

var g_deviceName = 'ADFReport';

var clientFromConnectionString = require('azure-iot-device-mqtt').clientFromConnectionString;
var Message = require('azure-iot-device').Message;

//
// Create an Azure Iot Hub client.
//
function AzureIotHub(config)
{
    var self = this;

    self.config = config;

    self.trace = config.trace;

    self.connectionString = config.connectionString;

    self.deviceName = config.deviceName;

    self.client = null;
}

//
// callback(error) - invoked when connected
//
AzureIotHub.prototype.Initialize = function(callback)
{
    var self = this;

    self.client = clientFromConnectionString(self.connectionString);

    //
    // Open connection to the IoT Hub and start sending messages.
    //
    // Note: See example for transient fault handling
    //
    // https://msdn.microsoft.com/library/hh680901(v=pandp.50).aspx
    //
    // Note: A production reporting application will log locally observations
    // until they can be transmitted to the IoT Hub to allow for disconnected
    // operation.
    //

    self.client.open(callback);
}

//
// Send Report
//
AzureIotHub.prototype.SendReport = function(data, callback)
{
    var self = this;

    //
    // Generate ADF report formatted for Azure IoT Hub
    //
    var adfReport = self.createADFReport(self.deviceName, data);
    
    self.tracelog("adfReport=");
    self.tracelog(adfReport);

    var data = JSON.stringify(adfReport);

    var message = new Message(data);

    self.tracelog("Sending message: " + message.getData());

    self.client.sendEvent(message, self.printResultFor('send'));

    callback(null);
}

//
// Template to create an ADF report from its data
//
// Output is an object that can be converted to JSON
//
AzureIotHub.prototype.createADFReport = function(deviceName, data)
{
    var report = {};

    // This is the Azure IotHub name/deviceid
    report.deviceId = deviceName;

    // This is what ever name your group uses for the ADF report hardware.
    report.deviceAlias = data.deviceAlias;

    report.observer = data.observer;

    report.equipment = data.equipment;

    // Tiger Mountain, WA State
    report.observerPosition = data.observerPosition;

    // This is the devices time of the observation, and may not be as accurate as GPS time
    report.deviceUTCTime = data.deviceUTCTime;

    //
    // Note: GPS time is more accurate and should be provided if possible.
    //

    // This is the GPS time of the observation.
    report.gpsUTCTime = data.gpsTime;

    //
    // This is an optional time when the device is sending the report
    // not the observation times which are reported above.
    //
    report.deviceReportingUTCTime = data.deviceReportingUTCTime;

    //
    // Bearing reports from True North are preferred.
    //

    // Bearing from True North
    report.absoluteBearing = data.absoluteBearing;

    // Relative to the unit.
    report.relativeBearing = data.relativeBearing;

    // Bearing from Magnetic North
    report.absoluteMagneticBearing = data.absoluteMagneticBearing;

    // In Mhz
    report.signalFrequency = data.signalFrequency;

    // In db
    report.signalStrength = data.signalStrength;

    // String
    report.modulationType = data.modulationType;

    //
    // reportType could be:
    //
    // ADF
    // Manual RDF
    // Human Observer
    // 

    report.reportType = data.reportType;

    // Scale of 1 - 10 based on your equipment confidence, signal quality.
    report.confidence = data.confidence;

    return report;
}

//
// Print result
//
AzureIotHub.prototype.printResultFor = function(op) {
    var self = this;

    return function printResult(err, res) {

        if (err) {
            self.tracelog(op + ' error: ' + err.toString());
        }

        if (res) {
            self.tracelog(op + ' status: ' + res.constructor.name);
        }
    };
}

//
// TraceLog
//
AzureIotHub.prototype.tracelog = function(message)
{
    var self = this;

    if (self.trace) {
        console.log(message);
    }
}

module.exports = {
  AzureIotHub: AzureIotHub
};
