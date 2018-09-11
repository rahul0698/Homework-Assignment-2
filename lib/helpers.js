/*
* helpers functions are declared here
*
*/

// Dependency
var crypto = require('crypto');
var config = require('./config');
var https = require('https');
var querystring = require('querystring');



// container for helper
var lib = {};

// hash - helper
lib.hash = function(str) {
  if(typeof(str) == 'string' && str.length > 0) {
      var hash = crypto.createHmac('sha256', config.hashingSecret).update(str).digest('hex');
      return hash;
  } else {
      return false;
  }
};


// Parse a json string to an object in all cases, without throwing
lib.parseJsonToObject = function(str) {
    try {
        var obj = JSON.parse(str);
        return obj;
    }catch (e) {
        return {};
    }
};


// generate random string
lib.generateRandomString = function(strLength) {
    strlength = typeof (strLength) == 'number' && strLength > 0? strLength : false;
    if(strLength) {
        // Define all the possible characters that could go into a string
        var possibleCharacters = 'abcdefghijklmnopqrstuvwxyz0123456789';

        // Start the final string
        var str = '';
        for(i=1; i<strLength; i++) {
            // Get a random character from the possibleCharacters string
            var randomCharacter = possibleCharacters.charAt(Math.floor(Math.random()*possibleCharacters.length));
            // Appends this character to the final string
            str += randomCharacter;
        }

        // Return the final string
        return str;
    } else {
        return false;
    }
};

// pay with stripe
// required data: amount
lib.payWithStripe = function(amount, callback) {

    // payload object
    var payload = {
        'amount': amount,
        'source': 'tok_visa',
        'description': 'Rahul\'s Pizza Restaurant order',
        'currency': 'usd'
    };

    var stringPayload = querystring.stringify(payload);

    // Build the request object

    var requestDetails = {
        'protocol': 'https:',
        'method': 'POST',
        'hostname': 'api.stripe.com',
        'path': '/v1/charges',
        'headers': {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(stringPayload)
        },
        'auth' : `Bearer ${config.stripe.key}`,
    };

    // Instantiate the request
    var req = https.request(requestDetails, function(res){
       var statusCode = res.statusCode;
       if(statusCode == 200 || statusCode == 201) {
           callback(false);
       } else {
           callback('Status code returned was ' + statusCode);
       }
    });
    req.on('error',(err)=>{
        callback(err);
    });
    req.write(stringPayload);
    req.end();
};

// send mail to user after the order is processed
lib.sendMailToUser = function(emailId, mailMessage, callback) {

    // Build the request object
    var requestDetails = {
        'protocol': 'https:',
        'method': 'POST',
        'hostname': 'api.mailgun.net',
        'path': config.mailgun.path,
        'auth': config.mailgun.auth
    };

    // build the payload object
    var payloadObject = {
      from: config.mailgun.sender,
      to: emailId,
      subject: 'Your Pizza Order',
      text: mailMessage
    };

    var stringPayload = querystring.stringify(payloadObject);

    requestDetails.headers = {
        'Content-type': 'application/x-www-form-urlencoded',
        'Content-length': Buffer.byteLength(stringPayload)
    };

    //Instantiate the request
    var req = https.request(requestDetails, function(res){
       var status = res.statusCode;
       if(status == 200 || status == 201) {
           console.log('Email sent');
           callback(false);
       } else {
           callback(status);
       }
    });

    // handle error throwback
    req.on('error', function(err) {
       callback(err);
    });

    req.write(stringPayload);

    // end the request
    req.end();
};




// export the module
module.exports = lib;