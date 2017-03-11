
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
// Handler for GPS units using NMEA 0183 protocol.
//
// 02/24/2017
//
//

function NmeaGps(config)
{
    var self = this;

    self.moduleName = "NmeaGPS";
    self.trace = false;
    self.traceerrorValue = false;

    if (typeof(config.trace) != "undefined") {
        self.trace = config.trace;
    }

    if (typeof(config.traceerror) != "undefined") {
        self.traceerrorValue = config.traceerror;
    }

    self.nmeaFactory = require('./nmea0183.js');

    self.gpsPrefix = "$GPRMC";

    //
    // GPS units typically send out greater message lengths than the old
    // NMEA 0183 standard 80 characters.
    //
    self.maxMessageLength = 256;

    // We don't want NMEA 0183 error reports for valid Agrello messages
    var nmeaTraceError = true;

    self.nmea = self.nmeaFactory.createInstance(self.trace, nmeaTraceError, self.gpsPrefix);

    self.nmea.setMaxLength(self.maxMessageLength);
}

//
// Parse GPS message
//
// data - line buffer with GPS message(s) in NMEA0183 format
//
// callback(error, result)
//
// result is a parsed object
//
NmeaGps.prototype.ParseMessage = function(data, callback)
{
    var self = this;

    var error = null;

    //
    // Example GPS messages:
    //
    // $GPRMC,180747.00,A,4814.67617,N,12245.53305,W,0.059,,250217,,,A*68
    // $GPRMC,180751.00,A,4814.67620,N,12245.53309,W,0.040,,250217,,,A*6F
    // $GPRMC,180754.00,A,4814.67620,N,12245.53314,W,0.026,,250217,,,A*66
    // $GPRMC,180757.00,A,4814.67618,N,12245.53320,W,0.024,,250217,,,A*6B
    // $GPRMC,180801.00,A,4814.67617,N,12245.53325,W,0.016,,250217,,,A*6C
    //

    var result = self.nmea.parse(data);

    if (result.error != null) {
        self.traceerror("NMEA parse error=" + result.error);
        callback(result.error, null);
        return;
    }

    // This should not happen as error is set above on checksum errors.
    if (!result.checksumOK) {
        throw("checkSum bad and error not set");
    }

    //
    // Dispatch each GPS message type we handle.
    //

    if (result.prefix == '$GPRMC') {
        self.processGPRMC_Message(result, callback);
        return;
    }
    else {
        self.traceerror("unknown GPS message " + result.prefix);        
        error = "unknown GPS message " + result.prefix;

        // We return the contents for the caller to parse if desired
        result.messageType = "unknown";
        result.message = null;

        callback(error, result);
        return;
    }
}

//
// Dump a parsed message
//
NmeaGps.prototype.dumpParsedMessage = function(parsed)
{
    var cmd = null;

    for (index = 0; index < parsed.commands.length; index++) {
        cmd = parsed.commands[index];

        console.log();
        console.log("command[" + index + "]=" + cmd);
    }
}

//
// callback(null, parsed_message)
//
NmeaGps.prototype.processGPRMC_Message = function(parsed, callback)
{
    var self = this;

    //self.dumpParsedMessage(parsed);

    //
    // Decode fields to make it easy on the caller:
    //

    parsed.messageType = "$GPRMC";
    parsed.message = null;

    var report = {};

    report.UTCTime = parsed.commands[0];

    report.ReceiverStatus = parsed.commands[1];

    if (report.ReceiverStatus == 'A') {
        report.readingIsGood = true;
    }
    else {
        report.readingIsGood = false;
    }

    report.latitude = parsed.commands[2] + parsed.commands[3];

    report.longitude = parsed.commands[4] + parsed.commands[5];

    report.speed = parsed.commands[6];

    report.direction = parsed.commands[7];

    report.UTCDate = parsed.commands[8];

    report.MagneticVariation = parsed.commands[9] + parsed.commands[10];

    //
    // Only NMEA 2.3 or greater receivers include Mode
    //
    if (parsed.commands.length >= 12) {
        report.Mode = parsed.commands[11];
    }

    //
    // Add it to the parsed message
    //
    parsed.message = report;

    callback(null, parsed);

    //
    // Decoding details:
    //
    // Example of a message:
    //
    // $GPRMC,192856.00,A,4814.67224,N,12245.53131,W,0.060,,250217,,,D*6A
    // 
    // result=
    // { error: null,
    //   prefix: '$GPRMC',
    //   commands: 
    //    [ '192856.00',
    //      'A',
    //      '4814.67224',
    //      'N',
    //      '12245.53131',
    //      'W',
    //      '0.060',
    //      '',
    //      '250217',
    //      '',
    //      '',
    //      'D' ],
    //   checksumOK: true,
    //   sentence: '$GPRMC,192856.00,A,4814.67224,N,12245.53131,W,0.060,,250217,,,D*6A\r',
    //   calculatedChecksum: '6A',
    //   checksumMsb: '6',
    //   checksumLsb: 'A'
    // }
    //
    // Decode:
    // 
    // $GPRMC - Recommended minimum specific GNSS Data
    //        - Time, date, position, course and speed data.
    // 
    // http://aprs.gids.nl/nmea/#rmc
    // 
    // // Note: Field 11 Mode is document in the following for NMEA0183 V2.3 or later:
    // https://www.sparkfun.com/datasheets/GPS/NMEA%20Reference%20Manual1.pdf
    // 
    // Note: Empty fields have spaces inserted for the index number to lineup.
    //       treat all spaces as empty field as received.
    // 
    //        0         1 2          3 4           5 6     7 8      9 10 11
    // $GPRMC,192856.00,A,4814.67224,N,12245.53131,W,0.060, ,250217, ,  ,D*6A
    // 
    //     [
    // 0:     '192856.00',    // UTC Time of position fix 19:28:56.00 UTC
    // 1:     'A',            // Receiver/Data status A == OK, V == invalid
    // 2:     '4814.67224',   // latitude 48 deg. 14.67 min North
    // 3:     'N',            // N or S
    // 4:     '12245.53131',  // longitude 122 deg. 45.53 min West
    // 5:     'W',            // E or W
    // 6:     '0.060',        // Speed in knots over ground
    // 7:     '',             //  Track made good in degrees true
    // 8:     '250217',       // UT date 15 Feb 2017
    // 9:     '',             // Magnetic Variation degrees (E subtracts from true course)
    // 10:     '',            // E/W
    // 11:     'D'            // Mode D == DGPS, A == Autonomous, E == DR
    //     ]
    // 
    // 0    = UTC of position fix
    // 1    = Data status (V=navigation receiver warning)
    // 2    = Latitude of fix
    // 3    = N or S
    // 4    = Longitude of fix
    // 5    = E or W
    // 6    = Speed over ground in knots
    // 7    = Track made good in degrees True
    // 8    = UT date
    // 9    = Magnetic variation degrees (Easterly var. subtracts from true course)
    // 10   = E or W
    // 11   = Mode D == DGPS, A == Autonomous, E == DR
    // 
}

NmeaGps.prototype.setTrace = function(value) {
    this.trace = value;
}

NmeaGps.prototype.setTraceError = function(value) {
    this.traceerrorValue = value;
}

NmeaGps.prototype.tracelog = function(message) {
    if (this.trace) {
        console.log(this.moduleName + ": " + message);
    }
}

NmeaGps.prototype.traceerror = function(message) {
    if (this.traceerrorValue) {
        console.error(this.moduleName + ": " + message);
    }
}

module.exports = {
  createInstance: NmeaGps
};
