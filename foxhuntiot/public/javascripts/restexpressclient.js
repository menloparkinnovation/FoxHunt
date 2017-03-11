
//
//   restexpressclient.js
//
//   Openpux Internet Of Things (IOT) Framework.
//
//   Copyright (C) 2014,2015,2016,2017 Menlo Park Innovation LLC
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
//   Licensed under the Apache License, Version 2.0 (the "License");
//   you may not use this file except in compliance with the License.
//   You may obtain a copy of the License at
//
//       http://www.apache.org/licenses/LICENSE-2.0
//
//   Unless required by applicable law or agreed to in writing, software
//   distributed under the License is distributed on an "AS IS" BASIS,
//   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//   See the License for the specific language governing permissions and
//   limitations under the License.
//

//
// Configure Communications parameters, tokens, passwords, etc.:
//
// RestExpressClient.createTicket()
// RestExpressClient.updateTicket()
//
// CRUD:
//
// RestExpressClient.createObject()
// RestExpressClient.getObject()
// RestExpressClient.updateObject()
// RestExpressClient.deleteObject()
//
// RPC on existing state object:
//
// RestExpressClient.invokeObjectMethod()
//

//
// This allows the listed functions to be available from this
// module when not loaded in the browser, but run from node.js.
//
// This is used by the client.js utility, which is also used for
// unit and regression testing.
//

if (typeof window == "undefined") {

    //
    // window is undefined we are not running inside of
    // browser, but running inside of node.js so fill in
    // an exports table.
    //

    // module support available on Node.js server side.
    module.exports = {
        RestExpressClient: RestExpressClient
    };
}
else {
    // We are executing within a browser.
    // Browsers use "var client = new RestExpressClient();" directly.
}

function RestExpressClient(config) {
    var self = this;
    self.config = config;
}

RestExpressClient.prototype.createRequest = function() {
  var result = null;

  if (typeof window == "undefined") {

      //
      // If window is undefined we are not running inside a browser,
      // but as a client inside of a Node.js [test] program.
      //
      // So a local replacement for XMLHttpRequest is created.
      //
      result = this.createLocalHttpRequest();

      return result;
  }
  else if (window.XMLHttpRequest) {

    //
    // FireFox, Safari, etc.
    // https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest
    //
    result = new XMLHttpRequest();
    if (typeof result.overrideMimeType != 'undefined') {
      result.overrideMimeType('application/x-www-form-urlencoded'); // TODO: Update to JSON
    }
  }
  else if (window.ActiveXObject) {
    // MSIE
    result = new ActiveXObject("Microsoft.XMLHTTP");
  } 
  else {
    // No known mechanism -- consider aborting the application
    alert("your browser does not support AJAX/REST");
  }
  return result;
}

RestExpressClient.prototype.createLocalHttpRequest = function() {

    if (typeof window == "undefined") {
        var menlohttp = require('./menlohttprequest.js');
        return menlohttp.createHttpRequest();
    }

    return null;
}

//
// Create ticket
//
// A ticket represents an access token and a resource URL.
//
// token: string that represent authentication code.
//
// objectUrl: base URL for application REST operations.
//
// args: [optional]
//
// {
//    scheme: "http",
//    hostname: "hostname",
//    port: 80,
//    httpauthusername: "httpauthusername",
//    httpauthpassword: "httpauthpassword"
// }
//
RestExpressClient.prototype.createTicket = function(token, resource, args) {

    var scheme = "http:";
    var hostname = "localhost";
    var port = 80;

    var httpauthusername = null;
    var httpauthpassword = null;

    //
    // Optional args can override origin.
    //
    // Node.js callers must supply args unless they are only talking
    // to the localhost with its default settings.
    //
    if ((typeof(args) != "undefined") && (args != null)) {

        if ((typeof(args.scheme) != "undefined") && (args.scheme != null)) {
            scheme = args.scheme;
        }

        // Note: Host could be "host" or "host:port".
        if ((typeof(args.hostname) != "undefined") && (args.hostname != null)) {
            hostname = args.hostname;
        }

        // Note: Do not set this if port is embedded in hostname above
        if ((typeof(args.port) != "undefined") && (args.port != 0)) {
            port = args.port;
        }

        if ((typeof(args.httpauthusername) != "undefined") && (args.httpauthusername != null)) {
            httpauthusername = args.httpauthusername;
        }

        if ((typeof(args.httpauthpassword) != "undefined") && (args.httpauthpassword != null)) {
            httpauthpassword = args.httpauthpassword;
        }
    }
    else {

        //
        // If running inside the browser we must connect back to the host
        // who served the page.
        //

        if (typeof(window) != "undefined") {
            scheme = window.location.protocol;
            hostname = window.location.hostname;
            port = window.location.port;
        }
    }

    if ((port != null) && (port != 80)) {
        hostname = hostname + ":" + port;
    }

    var ticket = {
        token: token,
        url: resource,
        scheme: scheme,
        host: hostname,
        httpauthusername: null,
        httpauthpassword: null
    };

    return ticket;
}

//
// Update the ticket to the new resource/object name
//
RestExpressClient.prototype.updateTicket = function(ticket, resource) {
    ticket.url = resource;
}

//
// createObject
//
//  var ticket = {
//      token: token,
//      url: url,
//      scheme: scheme,
//      host: host,
//      httpauthusername: httpauthusername,
//      httpauthpassword: httpauthpassword
//  };
//
// url - Optional URL path to invoke such as /api/v1/application
//       Overrides any value in the ticket if not null.
//
// objectToCreate - Plain old Javascript object that will be converted to JSON
//       and sent with the request as the POST document.
//
// callback(error, objectFromParsedJsonResult)
//
RestExpressClient.prototype.createObject = function(ticket, url, objectToCreate, callback)
{
    var self = this;

    var objectUrl = null;

    if (url != null) {
        objectUrl = url;
    }    
    else {
        objectUrl = ticket.url;
    }

    // Convert to JSON document for POST
    var json_document = JSON.stringify(objectToCreate);

    var url = this.buildRestUrl(ticket.scheme, ticket.host, objectUrl);

    this.executeHttpRequest(
         {
            url: url,
            token: ticket.token,
            method: "POST",
            httpauthusername: ticket.httpauthusername,
            httpauthauthpassword: ticket.httpauthpassword,
            querystring: null,
            content_type: "application/json",
            content_document: json_document
         },

        function(error, responseDocument) {
            self.processRestServerResponse(error, responseDocument, callback);
        });
}

//
// getObject
//
// This function expects the remote server to return an application/json
// document.
//
// It is parsed by the default handler and returned as a plain-old-javascript-object
// to the caller.
//
// Currently there is no input document body.
//
//  var ticket = {
//      token: token,  // optional. Must be null if not specified.
//      url: url,      // optional. If null url must be supplied in the argument.
//      scheme: scheme,
//      host: host,
//      httpauthusername: httpauthusername, // optional, must be null if not specified.
//      httpauthpassword: httpauthpassword  // optional, must be null if not specified.
//  };
//
// url - Optional URL path to invoke such as /api/v1/application
//       Overrides any value in the ticket if not null.
//
// callback(error, objectFromParsedJsonResult)
//
RestExpressClient.prototype.getObject = function(ticket, url, callback)
{
    var self = this;

    var objectUrl = null;

    if (url != null) {
        objectUrl = url;
    }    
    else {
        objectUrl = ticket.url;
    }

    var url = this.buildRestUrl(ticket.scheme, ticket.host, objectUrl);

    this.executeHttpRequest(
        {
            url: url,
            token: ticket.token,
            method: "GET",
            httpauthusername: ticket.httpauthusername,
            httpauthpassword: ticket.httpauthpassword,
            querystring: null,
            content_type: "application/json"
        },

        function(error, responseDocument) {

            //
            // responseObject is an object with the following:
            //
            // { status: null, error: null, responseText: '{"response": "document" }'
            //
            self.processRestServerResponse(error, responseDocument, callback);
        });
}

//
// updateObject
//
//  var ticket = {
//      token: token,
//      url: url,
//      scheme: scheme,
//      host: host,
//      httpauthusername: httpauthusername,
//      httpauthpassword: httpauthpassword
//  };
//
// url - Optional URL path to invoke such as /api/v1/application
//       Overrides any value in the ticket if not null.
//
// objectToUpdate - Plain old Javascript object to be converted to JSON and sent
//      as the document to the HTTP PUT.
//
// callback(error, objectFromParsedJsonResult)
//
RestExpressClient.prototype.updateObject = function(ticket, url, objectToUpdate, callback)
{
    var self = this;

    var objectUrl = null;

    if (url != null) {
        objectUrl = url;
    }    
    else {
        objectUrl = ticket.url;
    }

    // Convert to JSON document for PUT
    var json_document = JSON.stringify(objectToUpdate);

    var url = this.buildRestUrl(ticket.scheme, ticket.host, objectUrl);

    this.executeHttpRequest(
         {
            url: url,
            token: ticket.token,
            method: "PUT",
            httpauthusername: ticket.httpauthusername,
            httpauthauthpassword: ticket.httpauthpassword,
            querystring: null,
            content_type: "application/json",
            content_document: json_document
         },

        function(error, responseDocument) {
            self.processRestServerResponse(error, responseDocument, callback);
        });
}

//
// deleteObject
//
//  var ticket = {
//      token: token,
//      url: url,
//      scheme: scheme,
//      host: host,
//      httpauthusername: httpauthusername,
//      httpauthpassword: httpauthpassword
//  };
//
// url - Optional URL path to invoke such as /api/v1/application
//       Overrides any value in the ticket if not null.
//
// callback(error, objectFromParsedJsonResult)
//
RestExpressClient.prototype.deleteObject = function(ticket, url, callback)
{
    var self = this;

    var objectUrl = null;

    if (url != null) {
        objectUrl = url;
    }    
    else {
        objectUrl = ticket.url;
    }

    var url = this.buildRestUrl(ticket.scheme, ticket.host, objectUrl);

    this.executeHttpRequest(
        {
            url: url,
            token: ticket.token,
            method: "DELETE",
            httpauthusername: ticket.httpauthusername,
            httpauthpassword: ticket.httpauthpassword,
            querystring: null,
            content_type: "application/json"
        },

        function(error, responseDocument) {
            self.processRestServerResponse(error, responseDocument, callback);
        });
}

//
// invokeObjectMethod
//
// Arguments:
//
// ticket - access ticket to use
//
//  var ticket = {
//      token: token,
//      url: url,
//      scheme: scheme,
//      host: host,
//      httpauthusername: httpauthusername,
//      httpauthpassword: httpauthpassword
//  };
//
// args - arguments object
//  {
//      url: "objectUrl",      // optional URL. If null its taken from the ticket.
//      method:  "methodName", // Method name to invoke as string
//      params:  parameters,   // optional parameters, may be object or value type
//      timeout: 10000         // optional timeout in milliseconds
//  }
//
// callback(error, result) 
//  - if error != null, error status as string.
//  - if error == null, return from remote method as an object, or value
//
// POST document content:
//
// { method: "method" }
// { method: "method", params: object/value }
//
// POST return document content:
//
// { error: "error" }
// { result: "result" }
//
RestExpressClient.prototype.invokeObjectMethod = function(ticket, args, callback)
{
    var self = this;

    // Format the request object
    var obj = {};

    var timeout = 0;

    var objectUrl = null;

    if ( (typeof(args.url) != "undefined") && (args.url != null)) {
        objectUrl = args.url;
    }    
    else {
        objectUrl = ticket.url;
    }

    // Only define params entry if supplied.
    if ( (typeof(args.params) != "undefined") && (args.params != null)) {
        obj.params = args.params;
    }

    if ( (typeof(args.timeout) != "undefined") && (args.url != timeout)) {
        timeout = args.timeout;
    }    

    obj.method = args.method;

    //
    // This qualifies the invokeObjectMethod POST from an objectCreate
    // The JSON document contains the controlling method for the invoke,
    // the method here is only informative for logs.
    // 
    var querystring = "?invokeObjectMethod=" + args.method;

    var json_document = JSON.stringify(obj);

    var requestUrl = this.buildRestUrl(ticket.scheme, ticket.host, objectUrl);

    this.executeHttpRequest(
         {
            url: requestUrl,
            token: ticket.token,
            method: "POST",
            httpauthusername: ticket.httpauthusername,
            httpauthauthpassword: ticket.httpauthpassword,
            querystring: querystring,
            content_type: "application/json",
            content_document: json_document,
            timeout: timeout
         },

         function(error, responseDocument) {
            
            if (error != null) {
                // Error from the transport
                callback(error, null);
                return;
            }

            try {
                var res = JSON.parse(responseDocument);
                if (res.error != null) {
                    // remote method response indicated an error
                    callback(res.error, null);
                }
                else {
                    callback(null, res.result);
                }
                return;
            } catch(e) {
                // Badly formatted response message
                callback(e.toString(), null);
                return;
            }
         }
    );
}

//
// Worker functions for JSON exchanges
//

//
// General handler for server response.
//
// Handles error case if set. If not an error attempts to
// parse the returned JSON document.
//
// Returns the parsed object, or an error object.
//
// Arguments:
//
// error - Object from executeHttpRequest() in the form of:
//
//    {
//      httpstatus: HTTP_STATUS_CODE,
//      error: "error details",
//      responseDocument: "response document if present"
//    }
//
//    - Will be null if http status is 200 or 201.
//
//    - Other HTTP status will return this error object, with
//      an optional responseDocument if the remote server sent one.
//
// responseDocument - The raw document returned from the HTTP request.
//
//   - may be null, even on success.
//
//   - May be an empty document "", even on success.
//
//   - May be present, even on an error.
//     - If so, may offer details from the remote server.
//
//   - Should be JSON text by default if application/json is specified.
//
//   - But may be any document the server chose to return, so parse under
//     an exception handler.
//
RestExpressClient.prototype.processRestServerResponse = function(error, responseDocument, callback)
{
    if (error != null) {
        callback(error, responseDocument);
        return;
    }

    // It's valid to have no response document, no error.
    if (responseDocument == null) {
        callback(null, responseDocument);
        return;
    }

    //
    // Attempt to parse the responseDocument as JSON.
    //

    var obj = null;
    
    try {
        obj = JSON.parse(responseDocument);

        callback(null, obj);

    } catch(e) {
        obj = { httpstatus: "415", error: "exception processing server response" };
        obj.message = "responseDocument may be corrupt or incorrect JSON format";
        obj.responseDocument = responseDocument;
        obj.exception = e.toString();
        obj.stack = e.stack.toString();
        callback(obj, null);
    }
}

//
// Execute an HTTP request.
//
// args:
//         {
//            url: requestUrl,
//            token: ticket.token,
//            method: "POST",
//            httpauthusername: ticket.httpauthusername,
//            httpauthauthpassword: ticket.httpauthpassword,
//            querystring: querystring,
//            content_type: "application/json",
//            content_document: json_document,
//            timeout: timeout
//         }
//
// Returns:
// 
//  callback(null, returnDocument) - success
//     - Success. If there is a return document its != null.
// 
//  callback(error, returnDocument) - HTTP returned an error status
//  but may optionally still provide information.
//
//    error is an object with the following information:
//
//    {
//      httpstatus: HTTP_STATUS_CODE,
//      error: "error details",
//      responseDocument: "response document if present"
//    }
//
RestExpressClient.prototype.executeHttpRequest = function(args, callback)
{
    var errorBlock = { httpstatus: 400, error: null, responseDocument: null };

    // Create browser independent request
    var req = this.createRequest();
    if (req == null) {
        errorBlock.error = "NULL HTTPXmlRequest. Unsupported Browser";
        callback(errorBlock, null);
        return;
    }

    if (typeof(args.timeout) != "undefined") {
        // timeout is in milliseconds
        req.timeout = args.timeout;
    }

    // Create the callback function and register it on the request object
    req.onreadystatechange = function() {

        if (req.readyState != 4) {
            return; // Not there yet
        }

        //
        // Done processing request
        //

        if ((req.status != 200) && (req.status != 201)) {
            errorBlock.httpstatus = req.status;
            errorBlock.responseDocument = req.responseText;
            callback(errorBlock, req.responseText);
        }
        else {
            callback(null, req.responseText);
        }
    }

    var fullUrl = args.url;

    if (args.querystring != null) {
        fullUrl += args.querystring;
    }

    // Now send it to the cloud server
    // open(method, url, async, user, password);
    req.open(args.method, fullUrl, true, args.httpauthusername, args.httpauthpassword);

    req.setRequestHeader("Content-Type", args.content_type);

    //
    // Set the token as a Bearer token in an Authorization header
    //
    // http://self-issued.info/docs/draft-ietf-oauth-v2-bearer.html#authz-header
    // http://self-issued.info/docs/draft-ietf-oauth-v2-bearer.html
    // https://en.wikipedia.org/wiki/Basic_access_authentication
    //
    if (args.token != null) {
        req.setRequestHeader("Authorization", "Bearer " + args.token);
    }

    if (args.content_document != null) {
        req.send(args.content_document);
    }
    else {
        req.send();
    }

    // The above anonymous/lambda function will execute with the request results
}

//
// Simplify the state machine of starting, or adding to a querystring
//
RestExpressClient.prototype.appendQueryString = function(querystring, newitem) {

    if (querystring == null) {
        querystring = "?" + newitem;
    }
    else {
        querystring = querystring + "&" + newitem;
    }

    return querystring;
}

//
// Build URL handling scheme and host path
//
RestExpressClient.prototype.buildRestUrl = function(scheme, host, url) {
    var url = scheme + "//" + host + url;
    return url;
}
