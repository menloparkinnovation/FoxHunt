
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
// Iot Application Launcher
//

//
// This version of a simple "main" program starts off making
// the application a module up front. This makes it easier to
// convert a code prototype as a simple command into a module
// that can be used in larger projects.
//
// Module discipline also works similar to a C#/Java class
// with member variables and functions, etc.
//
//
// This module not only provides simple up front command line
// processing, but allows the command and arguments to be
// passed as a json file to make automation scenarios easier to create
// such as regression tests.
//

//
// This loads the configuration class g_ApplicationConfig.
//
var applicationConfig = require('./appconfig.js');

var fs = require('fs');

//
// config - ./appconfig.js that was loaded by require() and configures
//          the application components.
//
function AppModule(config)
{
    var self = this;

    self.config = config;

    self.moduleName = config.ModuleName;

    self.trace = false;
    self.traceerrorValue = false;

    if (typeof(config.Trace) != "undefined") {
        self.trace = config.Trace;
    }

    if (typeof(config.TraceError) != "undefined") {
        self.traceerrorValue = config.TraceError;
    }

    self.appRestServerFactory = null;
    self.appRestServer = null;
}

//
// This loads the external application specific configuration
// file as json.
//
AppModule.prototype.main = function(ac, av)
{
    if (ac == 1) {
        this.usage("config.json not specified");
        return;
    }

    //
    // See if it ends with .json which is a command script with
    // arguments.
    //
    if (this.endsWith(av[1], ".json")) {
        this.processCommandFile(av[1]);
        return;
    }

    this.usage("unrecognized command " + av[1]);
    process.exit(1);
}

//
// This allows a series of commands to be placed into a json file
// to make scripting easier for particular scenarios.
//
AppModule.prototype.processCommandFile = function(appConfigFile) {
    var self = this;

    var appConfig = null;

    try {
        var jsonText = fs.readFileSync(appConfigFile);
        appConfig = JSON.parse(jsonText);
    }
    catch(e) {
        console.error("exception processing appconfig jsonfile e=" + e);
        process.exit(1);
    }

    //
    // Create an instance of the application module
    //
    self.appModuleFactory = require(self.config.ApplicationModule);

    self.appmodule = new self.appModuleFactory.Module(appConfig);

    // The appmodule is responsible for its exit status.
    self.appmodule.mainLoop();

    //
    // Setup, initialize, and start the REST server
    //
    self.SetupRestServer(appConfig, self.appmodule);
}

//
// Setup the application REST server.
//
AppModule.prototype.SetupRestServer = function(appConfig, appInstance)
{
    var self = this;

    if (self.config.RestServerModule == null) {
        console.log("No configured REST server module");
        return;
    }

    self.appRestServerFactory = require(self.config.RestServerModule);
    self.appRestServer = new self.appRestServerFactory.AppRestServer(appConfig, appInstance);
    self.appRestServer.SetupRestEndpoint();
}

AppModule.prototype.usage = function(message) {
    var self = this;

    if (message != null) {
        console.error(message);
    }

    console.error(self.config.Usage);

    process.exit(1);
}

AppModule.prototype.endsWith = function(str, ext) {

    if (ext.length > str.length) {
         return false;
    }

    offset = str.length - ext.length;
    if (str.indexOf(ext, offset) == offset) {
        return true;
    }

    return false;
}

AppModule.prototype.setTrace = function(value) {
    this.trace = value;
}

AppModule.prototype.setTraceError = function(value) {
    this.traceerrorValue = value;
}

AppModule.prototype.tracelog = function(message) {
    if (this.trace) {
        console.log(this.moduleName + ": " + message);
    }
}

AppModule.prototype.traceerror = function(message) {
    if (this.traceerrorValue) {
        console.error(this.moduleName + ": " + message);
    }
}

AppModule.prototype.errlog = function(message) {
    // console.error connects to stderr
    console.error(message);
}

// This is used when loaded as a module with require('module.js');
module.exports = {
  Module: AppModule
};

// *** Remove this for pure module use ***

//
// The following is direct execute of the script.
//
// Remove this when this file is strictly loaded as a module.
//
// Remove argv[0] to get to the base of the standard arguments.
// The first argument will now be the script name.
//
var args = process.argv.slice(1);

var module = new module.exports.Module(applicationConfig.ApplicationConfig);

// Invoke main
module.main(args.length, args);

// *** Remove this for pure module use ***
