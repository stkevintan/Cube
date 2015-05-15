exports.forEach = function (array, action, callback) {
    var results = [];
    if (!callback) {
        callback = action;
        action = function (item, callback) {
            item(callback);
        };
    }
    if (!array.length) {
        callback(results);
    } else {
        var loadCounter = 0;
        array.forEach(function (item) {
            action(item, function (result) {
                results.push(result);
                if (++loadCounter === array.length) {
                    callback(results)
                }
            });
        });
    }
};

function sequence (array, action, callback) {
    if (!array.length) {
        callback();
    } else {
        var item = array.shift();
        action(item, function () {
            sequence(array, action, callback);
        })
    }
};

exports.sequence = function (array, action, callback) {
    if (!callback) {
        callback = action;
        action = function (item, callback) {
            item(callback);
        };
    }
    sequence(array, action, callback);
};