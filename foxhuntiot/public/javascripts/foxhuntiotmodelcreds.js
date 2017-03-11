
//
//   Openpux Internet Of Things (IOT) Framework.
//
//   Copyright (C) 2017 Menlo Park Innovation LLC
//
//   menloparkinnovation.com
//   menloparkinnovation@gmail.com
//
///  Generic application credentials.
//

//
// Return default credentials for read-only visitors to the site.
//
// This should be setup with your applications credential that gives read-only
// permissions and resource limits to the world.
//
// It's returned in JSONP style from a <script> tag in the page.
//

function getAnonymousWebClientConfig() {
    var config = {cloud_token: "12345678", cloud_account: "1", cloud_sensor_id: "4"};

    // Path that application_rest_server.js responds to.
    config.path = "/api/v1/foxhuntiot/state";

    return config;
}
