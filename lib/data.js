/*
* library for storing and editing data
*
*/

// Dependencies
var path = require('path');
var fs = require('fs');
var helpers = require('./helpers');


// container for module
var lib = {};

// path for base directory
lib.baseDir = path.join(__dirname,'/../.data/');

// write data to a file
lib.create = function (dir, fileName, data, callback) {
    // Open file for writing
    fs.open(lib.baseDir + dir + '/' + fileName + '.json', 'wx', function (err, fileDescriptor) {
        if (!err && fileDescriptor) {
            // Convert data to string
            var stringData = JSON.stringify(data);

            //write data to file
            fs.writeFile(fileDescriptor, stringData, function (err) {
                if (!err) {
                    // Close the file
                    fs.close(fileDescriptor, function (err) {
                        if (!err) {
                            callback(false);
                        } else {
                            callback('Error closing file to be written');
                        }
                    })
                } else {
                    callback('Error while writing to file');
                }
            });
        } else {
            callback('Could not create file, as it may already exist');
        }
    });
};

// read data from a file
lib.read = function(dir, fileName, callback) {
    fs.readFile(lib.baseDir + dir + '/' + fileName + '.json', 'utf-8', function(err, data) {
        if(!err && data) {
            var parsedData = helpers.parseJsonToObject(data);
            callback(false, parsedData);
        } else {
            callback(err, data);
        }
    });
};

// update data inside a file

lib.update = function (dir, fileName, data, callback) {
    // look up for the file
    fs.open(lib.baseDir + dir + '/' + fileName + '.json', 'r+', function (err, fileDescriptor) {
        if (!err && fileDescriptor) {
            // convert data to string
            var stringData = JSON.stringify(data);

            // truncate the file
            fs.truncate(fileDescriptor, function (err) {
                if (!err) {
                    // write to file
                    fs.writeFile(fileDescriptor, stringData, function (err) {
                        if (!err) {
                            // close the file
                            fs.close(fileDescriptor, function (err) {
                                if (!err) {
                                    callback(false);
                                } else {
                                    callback('Error while closing file.')
                                }
                            })
                        } else {
                            callback('Error while writing file');
                        }
                    });
                } else {
                    callback('Error truncating the file');
                }
            });
        } else {
            callback('could not find the specified file to update');
        }
    });
};

// delete the file
lib.delete = function(dir, fileName , callback) {
  // unlink the file from file System
  fs.unlink(lib.baseDir + dir + '/' + fileName + '.json', function(err) {
      if(!err) {
          callback(false);
      } else {
          callback('Error deleting file');
      }
  })
};

// Export the module
module.exports = lib;

