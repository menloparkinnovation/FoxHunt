
//
// node CreateDeviceIdentity.js
//
// Creates device ID and outputs credentials which you need to save.
//
// Device ID:
//
// Device Key:
//
// 02/11/2017
//
// https://docs.microsoft.com/en-us/azure/iot-hub/iot-hub-node-node-getstarted
//
//

'use strict';

var iothub = require('azure-iothub');

var deviceName = 'ADFReport';

var connectionString = '{iothub connection string}';

//
// . ./setcredentials.sh
//
// setcredentials.sh: export AZURE_IOT_HUB_CONNECTION_STRING="your connection string"
//
connectionString = process.env.AZURE_IOT_HUB_CONNECTION_STRING;

var registry = iothub.Registry.fromConnectionString(connectionString);

var device = new iothub.Device(null);

device.deviceId = deviceName;

registry.create(device, function(err, deviceInfo, res) {

   if (err) {
       registry.get(device.deviceId, printDeviceInfo);
   }

   if (deviceInfo) {
       printDeviceInfo(err, deviceInfo, res)
   }
});

function printDeviceInfo(err, deviceInfo, res) {

   if (deviceInfo) {
      console.log('Device ID: ' + deviceInfo.deviceId);
      console.log('Device key: ' + deviceInfo.authentication.symmetricKey.primaryKey);
   }
}

