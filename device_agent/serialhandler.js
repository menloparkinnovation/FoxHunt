
/*
 * Copyright (C) 2015,2016,2017 Menlo Park Innovation LLC
 *
 * This is licensed software, all rights as to the software
 * is reserved by Menlo Park Innovation LLC.
 *
 * A license included with the distribution provides certain limited
 * rights to a given distribution of the work.
 *
 * This distribution includes a copy of the license agreement and must be
 * provided along with any further distribution or copy thereof.
 *
 * If this license is missing, or you wish to license under different
 * terms please contact:
 *
 * menloparkinnovation.com
 * menloparkinnovation@gmail.com
 */

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
// Handler for SerialPort npm package for node.js
//
// Updated 02/21/2017
//
// sudo npm install serialport -save
//
// package.json:
//
// "serialport": "^4.0.7"
//

function SerialHandler(config)
{
    var self = this;

    self.moduleName = "SerialHandler";
    self.trace = false;
    self.traceerrorValue = false;

    if (typeof(config.trace) != "undefined") {
        self.trace = config.trace;
    }

    if (typeof(config.traceerror) != "undefined") {
        self.traceerrorValue = config.traceerror;
    }

    //
    // This is deferred till open()
    //

    self.serialPortFactory = null;

    // Actual port instance
    self.serialport = null;
}

//
// Write data on serial port
//
// callback(error)
//
SerialHandler.prototype.write = function(data, callback) {
    var self = this;

    self.serialport.write(data, callback);
}

//
// This opens the given serial port and starts
// a serial reader.
//
// options.name - Port name to open.
//
// options.linemode - wait until full lines are received if true.
//
// callback(error, data);
//
//   error != null, error on open
//
//   data != null, data arrival indication
//
//   data type is based on linemode.
//
//   options.linemode == true
//       string data buffer with character data
//
//   options.linemode == false
//       Buffer object with byte data
//       Buffer.toString() returns string data
//
//   ((error == null) && (data == null)) - First callback on successful open
//
SerialHandler.prototype.open = function(options, callback) {
    var self = this;

    self.openWorker(options, function(error, data) {

        if (error != null) {
            callback(error, null);
            return;
        }

        //
        // The first callback without data indicates that
        // the port has opened.
        //
        if (data == null) {

            // Serial port is now opened
            self.tracelog('Serial Port Opened');

            callback(null, null);
            return;
        }

        if (data != null) {

            //
            // if linemode == false:
            //
            // http://nodejs.org/api/buffer.html
            // data is a raw Buffer type
            //
            // if linemode == true:
            //
            // data is a string. .toString() still
            // works on a string allowing either buffer
            // to be handled the same way.
            //

            callback(null, data);
            return;
        }
    });
}

//
// Open serial port. Invoked from this.startSerialReader().
//
// callback(error, data);
//
//      error != null -> error as per Node.js pattern for callbacks
//
//      data != null -> data that has arrived
//
//      error == null && data == null -> First callback on successful open
//
SerialHandler.prototype.openWorker = function(options, callback) {
    var self = this;

    self.serialPortFactory = require('serialport');

    //
    // This does any require() to lookup the proper SerialPort
    // package for the given portName.
    //

    if (options.linemode) {

	//
	// This opens the readline parser. The default without the
	// object parameter is to open raw, which returns Buffer as data
	// which does not have CharCodeAt() and other string functions.
	//

        //
        // NOTE: Since we select either the npm SerialPort or our own
        // handlers we bring in the npm SerialPort parser regardless
        // to re-use its already implemented function.
        //
        // node_modules/serialport/parsers.js
        //

	self.serialport = new self.serialPortFactory(options.name,
		{ parser: self.serialPortFactory.parsers.readline("\n")});
    }
    else {

    	//
	// This opens the serialport in raw mode, which returns
	// Buffer as data.
	//
	// Buffer does not have CharCodeAt() and other string functions.
	//
	// You must use data.toString() or String.fromCharCode() to generate
	// a string from the raw binary data received.
	//
	self.serialport = new self.serialportFactory(options.name);
    }

    self.serialport.on ('error', function(error) {
        self.traceerror("open open error=" + error);
        callback(error, null);
    });

    self.serialport.on ('open', function(error) {

        //
        // Note: In raw mode data is indicated as its
        // received from the serial port and this can cause
        // the display to be broken up vs. line mode.
        //
        self.serialport.on ('data', function(data) {

            //
            // data is a raw Buffer type
            //
            // http://nodejs.org/api/buffer.html
            //
            // data.toString() will return ASCII chars
            //

            callback(null, data);
            return;

        }); // data event

        callback(error, null);
        return;

    }); // open event
}

SerialHandler.prototype.setTrace = function(value) {
    this.trace = value;
}

SerialHandler.prototype.setTraceError = function(value) {
    this.traceerrorValue = value;
}

SerialHandler.prototype.tracelog = function(message) {
    if (this.trace) {
        console.log(this.moduleName + ": " + message);
    }
}

SerialHandler.prototype.traceerror = function(message) {
    if (this.traceerrorValue) {
        console.error(this.moduleName + ": " + message);
    }
}

module.exports = {
  SerialHandler: SerialHandler
};
