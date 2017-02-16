
'use strict';

var Client = require('azure-iothub').Client;
var Message = require('azure-iot-common').Message;

var connectionString = '{iot hub connection string}';

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

var targetDevice = 'ADFReport';

var serviceClient = Client.fromConnectionString(connectionString);

function printResultFor(op) {
   return function printResult(err, res) {
     if (err) console.log(op + ' error: ' + err.toString());
     if (res) console.log(op + ' status: ' + res.constructor.name);
   };
}

function receiveFeedback(err, receiver){
   receiver.on('message', function (msg) {
     console.log('Feedback message:')
     console.log(msg.getData().toString('utf-8'));
   });
}

serviceClient.open(function (err) {
   if (err) {
     console.error('Could not connect: ' + err.message);
   } else {
     console.log('Service client connected');
     serviceClient.getFeedbackReceiver(receiveFeedback);
     var message = new Message('Cloud to device message.');
     message.ack = 'full';
     message.messageId = "My Message ID";
     console.log('Sending message: ' + message.getData());
     serviceClient.send(targetDevice, message, printResultFor('send'));
   }
});


