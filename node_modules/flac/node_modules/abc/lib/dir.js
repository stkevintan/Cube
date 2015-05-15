var fs = require('fs');

module.exports = function (dirName, callback) {
    fs.exists(dirName, function (exists) {
        if (!exists) {
            fs.mkdir(dirName, 0777, callback);
        } else {
            callback();
        }
    })
};
