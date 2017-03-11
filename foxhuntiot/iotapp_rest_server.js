
/*
 * Copyright (C) 2016,2017 Menlo Park Innovation LLC
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
// IoT Application REST server.
//
// Note: This is evolving to a Lambda style dispatch.
//

function AppRestServer(appConfig, appInstance)
{
    var self = this;

    // This binds the Get/Set functions to the instance self
    self.config = self.SetupRestServerConfig(appConfig, appInstance);

    // Application instance allows calls into the app.
    self.appInstance = appInstance;

    self.restexpress = null;
    self.restexpress_moduleFactory = null;

    if (typeof(appConfig.ipAddress) != "undefined") {
        self.ipAddress = appConfig.ipAddress;
    }
    else {
        self.ipAddress = null;
    }

    if (typeof(appConfig.port) != "undefined") {
        self.port = appConfig.port;
    }
    else {
        self.port = 8080;
    }

    if (typeof(appConfig.defaultHomePage) != "undefined") {
        self.defaultHomePage = appConfig.defaultHomePage;
    }
    else {
        self.defaultHomePage = "/";
    }
}

AppRestServer.prototype.SetupRestServerConfig = function(appConfig, appInstance)
{
    var self = this;

    // Get the apps config
    var config = appConfig;

    //
    // If there is an ipAddress defined expose an HTTP
    // endpoint using restexpress.
    //

    restConfig = {};

    //
    // App instance allows callbacks into the app module.
    //
    restConfig.appInstance = {};
    restConfig.appInstance.self = appInstance;

    //
    // Bind callback to the standard Get/Set interface functions
    // to the app instance.
    //
    restConfig.appInstance.get = function(event, context, callback) {

        // callback(error, readings);
        appInstance.GetReadings(callback);
    };

    restConfig.appInstance.post = function(event, context, callback) {

        // callback(error, settings);
        appInstance.SetParameters(event.settings, callback);
    };

    if (typeof(config.defaultHomePage) != "undefined") {
        restConfig.defaultHomePage = config.defaultHomePage;
    }

    if (typeof(config.ipAddress) != "undefined") {
        restConfig.ipAddress = config.ipAddress;
    }
    else {
        restConfig.ipAddress = null;
    }

    if (typeof(config.port) != "undefined") {
        restConfig.port = config.port;
    }
    else {
        restConfig.port = 8080;
    }

    if (typeof(config.restURL) != "undefined") {
        restConfig.restURL = config.restURL;
    }
    else {
        restConfig.restURL = null;
    }

    return restConfig;
}

//
// Setup the REST endpoint if ipAddress is defined.
//
AppRestServer.prototype.SetupRestEndpoint = function()
{
    var self = this;

    //
    // Application HTTP REST dispatch functions
    //

    var RestHandlers = {};

    RestHandlers.enablePublicStatic = true;

    RestHandlers.defaultHomePage = self.defaultHomePage;

    //
    // GET returns unmodified state.
    //
    RestHandlers.getUrl = self.config.restURL;

    RestHandlers.get = function(req, res, callback) {
        var responseBody = {};

        // Event provides data to the invoke
        var event = {};

        // Context contains dispatch specific resource bindings
        var context = {};
        context.req = req;
        context.res = res;

        self.config.appInstance.get(event, context, function(error, readings) {
            responseBody.readings = readings;
            callback(200, responseBody);
        });
    };

    //
    // POST is for creating new objects in rest, so we
    // reject it since the IoTApp instance already exists.
    //
    RestHandlers.postUrl = self.config.restURL;
    RestHandlers.post = function(req, res, callback) {

        // Method Not Allowed
        callback(405, null);
    }

    //
    // PUT is used to update an existing object.
    //
    RestHandlers.putUrl = self.config.restURL;
    RestHandlers.put = function(req, res, callback) {

        // Body is pre-decoded JSON into a plain old object.
        var newSettings = req.body;

        //console.log("RestHandlers: REST PUT: req.body=");
        //console.log(newSettings);

        var responseBody = {};

        if ((typeof(newSettings.settings) == "undefined") || (newSettings.settings == null)) {
            responseBody.Status = 400;
            responseBody.error = "no settings specified";
            callback(200, responseBody);
            return;
        }

        // Event provides data to the invoke
        var event = {};
        event.settings = newSettings.settings;

        // Context contains dispatch specific resource bindings
        var context = {};
        context.req = req;
        context.res = res;

        self.config.appInstance.post(event, context, function(error) {

            if (error != null) {
                responseBody.Status = 400;
                responseBody.error = error;
            }
            else {
                responseBody.Status = 200;
            }

            callback(200, responseBody);
        });
    }

    //
    // DELETE deletes objects. We don't allow the IoTApp
    // state instance to be deleted.
    //
    RestHandlers.deleteUrl = self.config.restURL;

    RestHandlers.delete = function(req, res, callback) {
        // Method Not Allowed
        callback(405, null);
    }

    self.rest_config = {
        port: self.port,
        ipAddress: self.ipAddress,

        // Handlers
        dispatch: RestHandlers,

        Trace: true,
        TraceError: true
    };

    //
    // If there is an ipAddress for a REST management endpoint
    // start the server now.
    //
    if (self.ipAddress != null) {

        console.log("Setting up REST endpoint on ipAddress=" + self.ipAddress);

        self.restexpress_moduleFactory = require('./restexpress.js');

        self.restexpress = new self.restexpress_moduleFactory.RestExpress(self.rest_config);

        // This will start the listener
        self.restexpress.Initialize();
    }
}

module.exports = {
  AppRestServer: AppRestServer
};
