/*
 * Primary file for the api
 *
 */


//Dependencies

var http = require('http');
var url = require('url');
var StringDecoder = require('string_decoder').StringDecoder;
var handlers = require('./lib/handlers');
var config = require('./lib/config');
var helpers = require('./lib/helpers');


// Instantiating the http server
var httpServer = http.createServer(function(req, res) {
    unifiedServer(req, res);
});


// Start listening to http server
httpServer.listen(config.httpPort, function() {
    console.log('server listening on port '+config.httpPort);
});



// All the server logic for http sever
var unifiedServer = function(req, res) {
    // Get the url and parse it
    var parsedUrl = url.parse(req.url, true);

    // Get the path
    var path = parsedUrl.pathname;

    var trimmedPath = path.replace(/^\/+|\/+$/g, '');

    // Get the query string as an object
    var queryStringObject = parsedUrl.query;

    // Get the http method
    var method = req.method.toLowerCase();

    // Get the request header as an object
    var headers = req.headers;

    // Get the payload
    var decoder = new StringDecoder('utf-8');
    var buffer = '';
    req.on('data', function(data) {
        buffer += decoder.write(data);
    });

    req.on('end', function(){
        buffer += decoder.end();

        //Choose the handler this request should go to. If one is not found route to not found handler
        var chosenHandler = typeof(router[trimmedPath]) !== 'undefined' ? router[trimmedPath]: handlers.notFound;
        console.log(buffer);
        // Construct the data object to be send to handler.
        var data = {
            'trimmedPath': trimmedPath,
            'queryStringObject': queryStringObject,
            'method': method,
            'headers': headers,
            'payload': helpers.parseJsonToObject(buffer)
        };
        // route the request to the handler specified in the router
        chosenHandler(data, function(statusCode, payload){
            //Use the status code called back by the handler, or default to 200
            statusCode = typeof(statusCode) == 'number'? statusCode : 200;

            //Use the payload called back by the handler, or default to an empty object
            payload = typeof(payload) == 'object'? payload : {};

            //Convert the payload to a string
            var payloadString = JSON.stringify(payload);

            //return the response
            res.setHeader('Content-Type', 'application/json');
            res.writeHead(statusCode);
            res.end(payloadString);
        });
    })
};


var router = {
    'signUp': handlers.signUp,
    'login': handlers.login,
    'logout': handlers.logout,
    'addToCart': handlers.addToCart,
    'checkout': handlers.checkout,
    'proceedToPay': handlers.proceedToPay
};
