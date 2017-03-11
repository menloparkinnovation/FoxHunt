
//
// IoT Application Configuration.
//

var ApplicationConfig = {
    ModuleName: "FoxHuntIot",
    ApplicationModule: "./iotappmodule.js",
    RestServerModule: "./iotapp_rest_server.js",
    Usage: "node foxhuntiot.js config/config.json",
    Trace: false,
    TraceError: false
};

module.exports = {
  ApplicationConfig: ApplicationConfig
};
