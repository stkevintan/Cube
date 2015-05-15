//in
var async = require(tc.fixPath('../../lib/async.js'));
var result = [];
var arr = [
    function (callback) {
        setTimeout(function () {
            result.push(1);
            callback()
        }, 200);
    },
    function (callback) {
        result.push(2);
        callback()
    },
    function (callback) {
        result.push(3);
        callback()
    }
];
async.forEach(
    arr,
    function () {
        tc.out(result);
        tc.finish();
    }
)
//out
2,3,1