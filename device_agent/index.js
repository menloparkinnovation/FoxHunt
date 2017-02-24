
//
// FoxHunter Application Launcher.
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

var fs = require('fs');

//
// . $HOME/credentials/azure_iothub_foxhunt_credentials.sh
//
// azure_iothub_foxhunt_credentials.sh:
//
// export AZURE_IOT_HUB_CONNECTION_STRING="your connection string"
//
// export AZURE_IOT_HUB_DEVICE_CONNECTION_STRING="your device connection string"
//
var g_connectionString = process.env.AZURE_IOT_HUB_DEVICE_CONNECTION_STRING;

if ((typeof(g_connectionString) == "undefined") || (g_connectionString == null)) {
    throw("run . $HOME/credentials/azure_iothub_foxhunt_credentials.sh");
}

var g_deviceName = 'ADFReport';

function MainApp(ac, av)
{
    var self = this;

    if (ac != 2) {
        console.log("device_agent config.json");
        process.exit(1);
    }

    var filename = av[1];

    //
    // Read the JSON configuration file
    //

    var config = null;

    try {
        var jsonText = fs.readFileSync(filename);
        config = JSON.parse(jsonText);
    }
    catch(e) {
        console.error("exception processing jsonfile e=" + e);
        process.exit(1);
    }

    // Add the IoT Hub connection string
    config.connectionString = g_connectionString;

    self.deviceAgentFactory = require('./DeviceAgent.js');

    self.deviceAgent = new self.deviceAgentFactory.DeviceAgent(config);

    self.deviceAgent.Initialize(function(error) {

        if (error != null) {
            console.log("DeviceAgent: AzureIotHub reported error=" + error);
            process.exit(1);
        }

        if ((typeof(config.simulation) != "undefined") && config.simulation) {
            self.deviceAgent.StartSimulation();
        }
    });
}

//
// Remove argv[0] to get to the base of the standard arguments.
// The first argument will now be the script name.
//
var args = process.argv.slice(1);

// Invoke main
var main = new MainApp(args.length, args);

