var fs = require('fs');

var moduleMethods = {
    write : function (fileName, text, callback) {
        fs.writeFile(fileName, text, 'utf8', function (err) {
            if (err) {
                throw err;
            }
            if (callback) {
                callback()
            }
        });
    },

    read : function (fileName, callback) {
        fs.readFile(fileName, 'utf8', function (err, data) {
            if (err) {
                throw err;
            }
            callback(data)
        });
    },

    copy : function (sourceFileName, destinationFileName, callback) {
        var _this = this;
        this.read(sourceFileName, function (data) {
            _this.write(destinationFileName, data, callback);
        })
    },


    binCopy : function (sourceFileName, destinationFileName, callback) {
        fs.readFile(sourceFileName, function (err, data) {
            if (err) {
                throw err;
            }
            fs.writeFile(destinationFileName, data, function (err) {
                if (err) {
                    throw err;
                }
                if (callback) {
                    callback()
                }
            });
        });
    },

    binRead : function (fileName, callback) {
        fs.readFile(fileName, function (err, data) {
            if (err) {
                throw err;
            }
            callback(data)
        });
    },

    binWrite : function (fileName, data, callback) {
        fs.writeFile(fileName, data, function (err) {
            if (err) {
                throw err;
            }
            if (callback) {
                callback()
            }
        });
    }

};

// Ограничивает количество параллельно исполняемых действий
var executer = new (require('./executer.js'))(100);


exports.write = function (fileName, text, callback) {
    executer.add(function (completeCallback) {
        moduleMethods.write(fileName, text, function () {
            completeCallback();
            if (callback) {
                callback.apply(null, arguments);
            }
        })
    });
};

exports.read = function (fileName, callback) {
    executer.add(function (completeCallback) {
        moduleMethods.read(fileName, function () {
            completeCallback();
            if (callback) {
                callback.apply(null, arguments);
            }
        })
    });
};

exports.copy = function (sourceFileName, destinationFileName, callback) {
    executer.add(function (completeCallback) {
        moduleMethods.copy(sourceFileName, destinationFileName, function () {
            completeCallback();
            if (callback) {
                callback.apply(null, arguments);
            }
        })
    });
};

exports.binCopy = function (sourceFileName, destinationFileName, callback) {
    executer.add(function (completeCallback) {
        moduleMethods.binCopy(sourceFileName, destinationFileName, function () {
            completeCallback();
            if (callback) {
                callback.apply(null, arguments);
            }
        })
    });
};

exports.binRead = function (fileName, callback) {
    executer.add(function (completeCallback) {
        moduleMethods.binRead(fileName, function () {
            completeCallback();
            if (callback) {
                callback.apply(null, arguments);
            }
        })
    });
};

exports.binWrite = function (fileName, data, callback) {
    executer.add(function (completeCallback) {
        moduleMethods.binWrite(fileName, data, function () {
            completeCallback();
            if (callback) {
                callback.apply(null, arguments);
            }
        })
    });
};
