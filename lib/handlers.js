/*
*All the handlers will be here
*
*/

// Dependency
var _data = require('./data');
var helpers = require('./helpers');


// Container for all the handlers
var handlers = {};




// SignUp - handler
// Required data: name, address, emailId, phone, password
// Optional data: none
handlers.signUp = function (data, callback) {
    console.log(data);
    // sanity checking
    var name = typeof(data.payload.name) == 'string' && data.payload.name.trim().length > 0 ? data.payload.name.trim() : false;
    var address = typeof(data.payload.address) == 'string' && data.payload.address.trim().length > 0 ? data.payload.address.trim() : false;
    var emailId = typeof(data.payload.emailId) == 'string' && data.payload.emailId.trim().length > 0 ? data.payload.emailId.trim() : false;
    var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

    if (name && address && emailId && password) {
        // look for the file and if it does not exist and throw error we are ready to go

        var fileName = emailId.substring(0,emailId.lastIndexOf('@'));

        _data.read('users', fileName, function (err, userData) {
            if (err) {
                // hash the password
                var hashedPassword = helpers.hash(password);

                if (hashedPassword) {
                    // create userObject
                    var userObject = {
                        'name': name,
                        'address': address,
                        'emailId': emailId,
                        'password': hashedPassword
                    }

                    // save data
                    _data.create('users', fileName, userObject, function (err) {
                        if (!err) {
                            callback(200);
                        } else {
                            callback(400, {'Error': 'Could not create the new user'});
                        }
                    });
                } else {
                    calback(500, {'Error': 'Could not hash the password'});
                }
            } else {
                callback(400, {'Error': 'User already exist with this email.'});
            }
        });
    } else {
        callback(400, {'Error': 'Missing required fields.'});
    }
};


// handler for login
handlers.login = function(data, callback) {
    var password = typeof(data.payload.password.trim()) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim(): false;
    var emailId = typeof(data.payload.emailId.trim()) == 'string' && data.payload.emailId.trim().length > 0 ? data.payload.emailId.trim() : false;

    if(emailId && password) {
        var fileName = emailId.substring(0, emailId.lastIndexOf('@'));

        // lookup for user
        _data.read('users', fileName, function(err, userData) {
            if (!err && userData) {
                // hash the password
                var hashedPassword = helpers.hash(password);
                if (hashedPassword == userData.password) {
                    handlers.generateToken(emailId, callback)
                } else {
                    callback(400, {'Error': 'password does not match the stored password'});
                }
            } else {
                callback(400, {'Error': 'could not find the user!'})
            }
        });
    } else {
        callback(400, {'Error': 'Missing required fields'});
    }

};

// add cart handler
handlers.addToCart = function(data, callback) {
    var itemName = typeof data.payload.itemName == 'string' ? data.payload.itemName.trim(): false;
    var price = typeof data.payload.price == 'number' ? data.payload.price : false;

    if(itemName && price) {
        // check for the token
        var tokenId = typeof data.headers.token == 'string'? data.headers.token: false;
        handlers.verifyToken(tokenId, function(isValid, data){
            if(isValid && data) {
                var user = data.emailId.substring(0, data.emailId.lastIndexOf('@'));
                // search for user
                _data.read('users', user, function(err, userData){
                    if(!err && userData) {
                        var userOrders = typeof(userData.orders) == 'object' && userData.orders instanceof Array ? userData.orders : [];

                        // order object
                        var orderobject = {
                            'item': itemName,
                            'price': price
                        }

                        userData.orders = userOrders;
                        userOrders.push(orderobject);
                        // update the user
                        _data.update('users', user, userData, function(err){
                            if(!err){
                                callback(200);
                            } else {
                                callback(400, {'Error': 'Could not add to user cart'});
                            }
                        });
                    } else {
                        callback(400)
                    }
                });
            } else {
                callback(400, data);
            }
        });
    } else {
        callback(400, {'Error': 'Nothing to add to cart'});
    }
};

// checkout handler
handlers.checkout = function (data, callback) {
    // check for token
    var tokenId = typeof data.headers.token == 'string' ? data.headers.token.trim() : false;
    if (tokenId) {
        // verify token
        handlers.verifyToken(tokenId, function (isValid, data) {
            if (isValid && data) {
                var user = data.emailId.substring(0, data.emailId.lastIndexOf('@'));

                // look for user
                _data.read('users', user, function (err, userData) {
                    if (!err && userData) {
                        var orders = typeof userData.orders == 'object' && userData.orders instanceof Array && userData.orders.length > 0 ? userData.orders : false;
                        if (orders) {
                            var totalAmount = 0;
                            orders.forEach(function(order) {
                                totalAmount += order.price;
                            });

                            callback(200, {'orders':orders, totalAmount: totalAmount});
                        } else {
                            callback(400, {'Error': 'User does not have anything to order!'});
                        }
                    } else {
                        callback(500);
                    }
                });
            } else {
                callback(400,data);
            }
        });
    } else {
        callback(400, {'Error': 'Token does not exist'});
    }
};


// Required data: token
// Optional data: none
handlers.proceedToPay = function(data, callback) {
    var token = typeof  data.headers.token == 'string' ? data.headers.token : false;

    if(token) {
        // validate the token
        handlers.verifyToken(token, function(isValid, tokenData){
           if(isValid && tokenData) {
               var user = tokenData.emailId.substring(0, tokenData.emailId.lastIndexOf('@'));

               // look for the user
               _data.read('users', user, function(err, userData) {
                  if(!err && userData) {
                      if(userData.orders && userData.orders.length > 0) {
                          var totalAmount = 0;
                          var mailMessage = 'Welcome to Pizzeria, you have ordered'
                        userData.orders.forEach(function(order) {
                          totalAmount += order.price;
                          mailMessage += ` ${order.item} (${order.price}) `
                        });
                          mailMessage += ` And your total amount will be ${totalAmount}`;
                        //pay with stripe
                          helpers.payWithStripe(totalAmount, function(err){
                             if(!err) {
                                // send mail to user with order
                                 helpers.sendMailToUser(tokenData.emailId, mailMessage, function(err) {
                                    if(!err) {
                                        // lookup for user and empty the cart
                                        _data.read('users',user, function(err, userObject){
                                            if(!err && userObject){
                                                userObject.orders = [];

                                                // update the user
                                                _data.update('users', user, userObject, function(err) {
                                                   if(!err) {
                                                       callback(200, {'Message': 'Order placed Successfully'});
                                                   } else {
                                                       callback(400, {'Error': 'Error updating user'});
                                                   }
                                                });
                                            } else {
                                                callback(400, {'Error': 'Could not find user to empty cart'});
                                            }
                                        });
                                    } else {
                                        callback(400, err);
                                    }
                                 });
                             } else {
                                callback(500, err);
                             }
                          });
                      } else {
                        callback(400, {'Error': 'Nothing in the user cart to checkout'});
                      }
                  } else {
                      callback(400, {'Error': 'Could not find the specified user for checkout'});
                  }
               });
           } else {
               callback(400, tokenData);
           }
        });
    }
};

// handler to create token
handlers.generateToken = function (emailId, callback) {
    // create a random string as token Id
    var tokenId = helpers.generateRandomString(20);
    var expires = Date.now() + 1000 * 60 * 60;

    // create token Object
    var token = {
        'emailId': emailId,
        'expires': expires,
        'id': tokenId
    };
    // store the token
    _data.create('tokens', tokenId, token, function (err) {
        if (!err) {
            callback(200, token);
        } else {
            callback(400, {'Error': 'Could not generate token'});
        }
    });
};

// Logout handler
handlers.logout = function(data, callback) {
    //sanity check
    var tokenId = typeof data.headers.token == 'string' ? data.headers.token : false;

    if(tokenId) {
        // check for token
        _data.read('tokens', tokenId, function(err, tokenData){
           if(!err && tokenData) {
               // delete the token
               _data.delete('tokens', tokenId, function(err) {
                  if(!err) {
                      callback(200,{'success': 'Logout successfully'});
                  } else {
                      callback(400);
                  }
               });
           } else {
               callback(400);
           }
        });
    } else {
        callback(400, {'Error': 'Token does not exist'});
    }
};


// verify token coming through request is valid for that user or not
handlers.verifyToken = function(token, callback){
    // lookup for token
    _data.read('tokens', token, function(err, tokenData){
       if(!err && tokenData) {
           //check that the token is valid
           if (tokenData.expires > Date.now()){
               callback(true, tokenData);
           } else {
               callback(false, {'Message': 'Token expired!'});
           }
       } else {
           callback(false, {'Message': 'Token does not exist'});
       }
    });
};



//Not found handler
handlers.notFound = function(data, callback) {
    callback(404);
};








// Export the module
module.exports =  handlers;