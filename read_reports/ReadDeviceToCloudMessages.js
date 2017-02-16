
//
// node ReadDeviceToCloudMessages.js
//
// 02/11/2017
//
// https://docs.microsoft.com/en-us/azure/iot-hub/iot-hub-node-node-getstarted
//

'use strict';

var EventHubClient = require('azure-event-hubs').Client;

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

//
// Time you want report to start from:
//
var reportStartTime = {

    // All messages after current time
    'startAfterTime': Date.now()

    // All messages from a time in the past
    //'startAfterTime': Date.parse("01/01/2017 00:00:00")
};

var printError = function (err) {
    console.log(err.message);
};

var printMessage = function (message) {
    console.log('Message received: ');
    console.log(JSON.stringify(message.body));
    console.log('');
};

var client = EventHubClient.fromConnectionString(connectionString);

client.open()
     .then(client.getPartitionIds.bind(client))
     .then(function (partitionIds) {

         return partitionIds.map(function (partitionId) {

             return client.createReceiver('$Default', partitionId, reportStartTime).then(function(receiver) {

                 console.log('Created partition receiver: ' + partitionId)
                 receiver.on('errorReceived', printError);
                 receiver.on('message', printMessage);
             });
         });
     })
     .catch(printError);
