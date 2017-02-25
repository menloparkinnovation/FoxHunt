
//
// Agrello Format ADF report handler.
//
// Agrello format is used by APRN and ham radio automation packages
// and is a simple RS232 serial port protocol.
//
// 02/22/2017
//
// This implementation is designed and tested against the KN2C DF 2020T
// ADF unit available from http://kn2c.us/.
//
// It should work with other Agrello format units.
//
// If a unit has slightly different message format, add it as
// an option in the options struct passed to this modules
// constructor. If it differs greatly, then create a copy
// of this module under a new name and add it as a "driver"
// for the specific unit.
//
// Another option would be to develop a translator module that
// generates Agrello Format messages and supply to this modules
// AgrelloStringToObject() function.
//

//
//   FoxHunt - AgrelloADF
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
// Load serial handler
//
var serialHandlerFactory = require('./serialhandler.js');

function AgrelloADF(config)
{
    var self = this;

    self.moduleName = "AgrelloADF";

    self.config = config;

    self.trace = false;

    self.traceErrorValue = false;

    if (typeof(config.trace) != "undefined") {
        self.trace = config.trace;
    }

    if (typeof(config.traceerror) != "undefined") {
        self.traceErrorValue = config.traceerror;
    }

    self.portName = config.portName;
    self.baudRate = config.baudRate;

    self.serialHandler = null;

    //
    // Unhandled messages are sent to this function if configured.
    //
    // For example the DF 2020 provides GPS message passthrough
    // which are handled by a separate module, but on the same
    // serial port.
    //
    self.unhandledMessageHandler = null;

    if (typeof(config.unhandledMessageHandler) != "undefined") {
        self.unhandledMessageHandler = config.unhandledMessageHandler;
    }
}

//
// Parse Agrello format String to a Javascript object.
//
// Agrello is the message format output by the serial port.
// 
// This is used by APRS software.
// 
// 4800 baud, 8N2 at 15 messages/second
// 
// %BBB/Q<cr>
// 
// Where        %  	= message start character
// 		BBB 	= signal bearing degrees ( 000-359 )
// 		Q	= signal quality ( 0-9 ) ( fixed @ 7 in this design )
// 		<cr>	= carriage return
// 
// http://www.silcom.com/~pelican2/PicoDopp/PICO_MORE.html
// 
// %240/7<CR>
//
AgrelloADF.prototype.AgrelloStringToObject = function(data)
{
    var ob = {};

    ob.error = null;

    ob.bearing = -1;
    ob.quality = -1;

    if (data.length < 6) {
        ob.error = "truncated packet length " + data.length;
        return ob;
    }

    if (data[0] != '%') {
        ob.error = "missing Agrello start character";
        return ob;
    }

    //
    // Get the three digit bearing information
    //

    var str = "";

    str += data[1];
    str += data[2];
    str += data[3];

    ob.bearing = str;

    if (data[4] != '/') {
        ob.error = "missing Agrello separator character";
        return ob;
    }

    //
    // Get the Quality indicator
    //

    str = "";
    str += data[5];

    ob.quality = str;

    return ob;
}

//
// Start the message reader from the ADF.
//
// Callback is invoked with received decoded data as
// a javascript object.
//
// dataCallback(receivedData)
//
AgrelloADF.prototype.StartReader = function(dataCallback)
{
    var self = this;

    var config = {};
    config.trace = self.trace;
    config.traceerror = self.traceErrorValue;



    self.serialHandler = new serialHandlerFactory.SerialHandler(config);

    //
    // This queues an asynchronous port open request which will
    // start indicating data through the callback.
    //
    var options = {};
    options.name = self.portName;
    options.baudRate = self.baudRate;
    options.linemode = true;

    self.serialHandler.open(options, function(error, data) {

        if (error != null) {
            self.traceerror("serialreader error: " + error);
            return;
        }

        self.DataArrivedHandler(data, dataCallback);
    });
}

//
// Handle data arrival
//
// Data arrives as ASCII lines from the serialhandler which
// providers any line handler and Javascript nodeserial npm
// binary serial data to ASCII conversions.
//
// Callback is invoked with received decoded data as
// a javascript object.
//
// dataCallback(receivedData)
//
AgrelloADF.prototype.DataArrivedHandler = function(data, dataCallback)
{
    var self = this;

    if ((data == null) || (data.length == 0)) {
        self.tracelog("zero length data arrived");
        return;
    }

    var parsedData = self.AgrelloStringToObject(data);

    if (parsedData.error == null) {
        dataCallback(parsedData);
    }
    else {

        self.tracelog("error parsing data: " + parsedData.error);

        //
        // Error parsing the message as Agrello Data. Send it on the
        // unconfigured handler if set since this could be a GPS passthrough
        // message.
        //

        if (self.unhandledMessageHandler != null) {
            self.unhandledMessageHandler(data);
        }
    }
}

AgrelloADF.prototype.tracelog = function(message)
{
    if (this.trace) {
        console.log(this.moduleName + ": " + message);
    }
}

AgrelloADF.prototype.traceerror = function(message)
{
    if (this.traceErrorValue) {
        console.error(this.moduleName + ": " + message);
    }
}

module.exports = {
  AgrelloADF: AgrelloADF
};

