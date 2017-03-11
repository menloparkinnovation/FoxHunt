
//
// The MIT License (MIT)
// Copyright (c) 2016 John Richardson
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
// The Rest Express
//
// Module to add HTTP REST JSON endpoints to an application.
//
// Author: MenloPark Innovation LLC
//
// 01/24/2017
//

'use strict';

//
// http://expressjs.com/en/api.html#express
//
const express = require('express');

//
// config.port
// config.ipAddress
//
// config.Trace
// config.TraceError
//
// config.dispatch - Caller supplied object with handlers for the different requests
//
// dispatch.lambda(event, context, callback);
//
//   Follows the Amazon Lambda pattern for on demand events.
//
//   // This is pre-decoded from the HTTP request
//   event.httpMethod
//   event.path
//   event.pathParameters
//   event.queryStringParameters
//   event.headers
//   event.body
//    - event.body is JSON text, use JSON.parse(event.body)
//   event.requestContext
//   event.stageVariables
//
//   // These tend to be application specific bindings to the Lambda
//   context.accountId
//   context.resourceId
//   context.stage
//   context.requestId
//
//   callback(error, responseBodyAsJSON);
//
//   Note: If dispatch.lambda is specified, get,post,put,delete must
//   be null or undefined.
//
// // These support Express style handling, with a JSON body-parser loaded.
//
//   config.dispatch.get(req, res, callback);
//   config.dispatch.post(req, res, callback);
//   config.dispatch.put(req, res, callback);
//   config.dispatch.delete(req, res, callback);
//
//    req.body - pre-parsed body as a plain old object.
//
//    callback(HttpStatus, responseBody);
//      - responseBody is a plain old object, converted to JSON
//        by the caller on response.
//
function RestExpress(config) {

    var self = this;

    //
    // Caller supplied dispatch object handles requests.
    //
    self.dispatch = config.dispatch;

    self.moduleName = "RestExpress";
    self.config = config;

    self.trace = false;
    self.traceerrorValue = false;

    if (typeof(config.Trace) != "undefined") {
        self.trace = config.Trace;
    }

    if (typeof(config.TraceError) != "undefined") {
        self.traceerrorValue = config.TraceError;
    }

    self.port = config.port;

    self.ipAddress = config.ipAddress;

    //
    // http://expressjs.com/en/api.html#app
    //
    self.app = express();

    //
    // Configure use of a body parse for application/json
    //

    //
    // Configure body-parser for JSON so that req.body
    //is set automatically with the parsed content.
    //
    // https://www.npmjs.com/package/body-parser
    //
    // npm install body-parser --save
    //
    self.bodyParser = require('body-parser');

    // for parsing application/json
    self.app.use(self.bodyParser.json());
}

RestExpress.prototype.Initialize = function() {

    var self = this;

    //
    // See if the sharing of public, static web pages
    // are enabled by the caller.
    //

    if ((typeof(self.dispatch.enablePublicStatic) != "undefined") &&
        (self.dispatch.enablePublicStatic)) {

        self.tracelog("RestExpress Initialize: sharing public static content");

        self.app.use(express.static(__dirname + '/public'));

        // This will fall back to the various directories.
        self.app.use(express.static(__dirname + '/public/javascripts'));
        self.app.use(express.static(__dirname + '/public/html'));
        self.app.use(express.static(__dirname + '/public/css'));
        self.app.use(express.static(__dirname + '/public/images'));
    }

    if ((typeof(self.dispatch.defaultHomePage) != "undefined") &&
        (self.dispatch.defaultHomePage != null)) {

        self.app.get('/', function(req, res){
            res.sendfile(__dirname + "/public" + self.dispatch.defaultHomePage);
        });
    }

    //
    // Express Request + Response objects:
    //
    //   http://expressjs.com/en/api.html#req
    //   http://expressjs.com/en/api.html#res
    //
    self.app.get(self.dispatch.getUrl, function(req, res) {

        self.tracelog("RestExpress GET: json");

        if (req.body != null) {
            self.tracelog("body=");
            self.jsonlog(req.body);
        }
        else {
            self.tracelog("no body supplied");
        }

        self.dispatch.get(req, res, function(status, responseBody) {

            //
            // http://expressjs.com/en/api.html#res
            //
            // Object is converted to JSON with JSON.stringify(), and content-type
            // is set to application/json
            //
            if (responseBody != null) {
                self.tracelog("responseBody=");
                self.jsonlog(responseBody);

                res.status(status).json(responseBody);
            }
            else {
                res.sendStatus(status);
            }
        });
    });

    self.app.post(self.dispatch.postUrl, function(req, res) {

        self.tracelog("RestExpress POST: json");

        if (req.body != null) {
            self.tracelog("body=");
            self.jsonlog(req.body);
        }
        else {
            self.tracelog("no body supplied");
        }

        self.dispatch.post(req, res, function(status, responseBody) {

            if (responseBody != null) {
                self.tracelog("responseBody=");
                self.jsonlog(responseBody);

                res.status(status).json(responseBody);
            }
            else {
                res.sendStatus(status);
            }
        });
    });

    self.app.put(self.dispatch.putUrl, function(req, res) {

        self.tracelog("RestExpress PUT: json");

        if (req.body != null) {
            self.tracelog("body=");
            self.jsonlog(req.body);
        }
        else {
            self.tracelog("no body supplied");
        }

        self.dispatch.put(req, res, function(status, responseBody) {

            if (responseBody != null) {
                self.tracelog("responseBody=");
                self.jsonlog(responseBody);

                res.status(status).json(responseBody);
            }
            else {
                res.sendStatus(status);
            }
        });
    });

    self.app.delete(self.dispatch.deleteUrl, function(req, res) {

        self.tracelog("RestExpress DELETE: json");

        if (req.body != null) {
            self.tracelog("body=");
            self.jsonlog(req.body);
        }
        else {
            self.tracelog("no body supplied");
        }

        self.dispatch.delete(req, res, function(status, responseBody) {

            if (responseBody != null) {
                self.tracelog("responseBody=");
                self.jsonlog(responseBody);

                res.status(status).json(responseBody);
            }
            else {
                res.sendStatus(status);
            }
        });
    });

    // This kicks off the listen
    self.app.listen(self.port, self.ipAddress, function() {
        self.tracelog("RestExpress: listening on port " + self.port + " interface " + self.ipAddress);
    });
}

RestExpress.prototype.tracelog = function(message) {
    if (this.trace) {
        console.log(this.moduleName + ": " + message);
    }
}

RestExpress.prototype.jsonlog = function(obj) {
    if (this.trace) {
        console.log(JSON.stringify(obj));
    }
}

module.exports = {
    RestExpress: RestExpress
};
