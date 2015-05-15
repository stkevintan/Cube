//in
var async = require(tc.fixPath('../../lib/async.js'));
async.forEach(
    [1,2,3],
    function (value, callback) {
        callback(value + 1);
    },
    function (result) {
        tc.out(result);
        tc.finish();
    }
)
//out
2,3,4