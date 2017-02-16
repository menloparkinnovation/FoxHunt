
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
// . $HOME/credentials/azure_iothub_foxhunt_credentials.sh
//
// azure_iothub_foxhunt_credentials.sh:
//
// export AZURE_IOT_HUB_CONNECTION_STRING="your connection string"
//
// export AZURE_IOT_HUB_DEVICE_CONNECTION_STRING="your device connection string"
//
connectionString = process.env.AZURE_IOT_HUB_CONNECTION_STRING;

if ((typeof(connectionString) == "undefined") || (connectionString == null)) {
    throw("run . $HOME/credentials/azure_iothub_foxhunt_credentials.sh");
}

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

