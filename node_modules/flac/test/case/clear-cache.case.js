//in
var abc = require('abc');
var flac = require(tc.fixPath('../../lib/index.js'));

abc.async.sequence(
    [
        function (callback) {
            tc.execConsole([
                'mkdir tmp/a',
                'echo a > tmp/a/mod.json',
                'echo p > tmp/pack'
            ].join(';'), callback)
        },
        function (callback) {
            flac.find('tmp', tc.options, function (objects) {
                tc.printObjects(objects);
                callback();
            })
        },
        function (callback) {
            flac.find('tmp', {filters: []}, function (objects) {
                tc.printObjects(objects);
                callback();
            })
        },
        function (callback) {
            flac.clearCache('tmp', callback);
        },
        function (callback) {
            flac.find('tmp', {filters: []}, function (objects) {
                tc.printObjects(objects);
                callback();
            })
        }

    ],
    function () {
        tc.finish();
    }
);
//out
[{"filter":"m","file":"a/mod.json","text":"a\n"},{"filter":"p","file":"pack","text":"p\n"}]
[{"filter":"m","file":"a/mod.json","text":"a\n"},{"filter":"p","file":"pack","text":"p\n"}]
[]