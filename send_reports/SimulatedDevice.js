
//
// SimulatedDevice.js
//
// This generates a simulated ADF report to the Iot Hub.
//
// 02/11/2017
//
// https://docs.microsoft.com/en-us/azure/iot-hub/iot-hub-node-node-getstarted
//
// npm -y init
// npm install azure-iot-device azure-iot-device-mqtt --save
//

'use strict';

var clientFromConnectionString = require('azure-iot-device-mqtt').clientFromConnectionString;
var Message = require('azure-iot-device').Message;

var connectionString = 'HostName={youriothostname};DeviceId=myFirstNodeDevice;SharedAccessKey={yourdevicekey}';

//
// . ./setdevicecredentials.sh
//
// setdevicecredentials.sh: export AZURE_IOT_HUB_DEVICE_CONNECTION_STRING="your connection string"
//
connectionString = process.env.AZURE_IOT_HUB_DEVICE_CONNECTION_STRING;

var deviceName = 'ADFReport';

console.log("connectionString=");
console.log(connectionString);

var client = clientFromConnectionString(connectionString);

var connectCallback = function (err) {
   if (err) {
     console.log('Could not connect: ' + err);
   } else {
     console.log('Client connected');

     // Create a message and send it to the IoT Hub every second
     setInterval(function(){

         var adfReport = createADFReport(deviceName, {});

         console.log("adfReport=");
         console.log(adfReport);

         var data = JSON.stringify(adfReport);

         var message = new Message(data);

         console.log("Sending message: " + message.getData());

         client.sendEvent(message, printResultFor('send'));

     }, 1000);
   }
};

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

client.open(connectCallback);

//
// Functions
//

function printResultFor(op) {
   return function printResult(err, res) {
     if (err) console.log(op + ' error: ' + err.toString());
     if (res) console.log(op + ' status: ' + res.constructor.name);
   };
}

//
// Simulate Reading GPS time
//
function readGPSTime() {

    // Simulation: Do not report GPS time if not available.
    var gpsTimeReading = new Date(Date.now()).toISOString();

    return gpsTimeReading;
}

//
// Template to create an ADF report from its data
//
// Output is an object that can be converted to JSON
//
function createADFReport(deviceName, data) {

    //
    // Note: data argument is untouched here but would represent
    // whatever format the ADF data is in for filling in the
    // information below.
    //

    var report = {};

    // This is the Azure IotHub name/deviceid
    report.deviceId = deviceName;

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

    // This is the GPS time of the observation.
    report.gpsUTCTime = readGPSTime();

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
