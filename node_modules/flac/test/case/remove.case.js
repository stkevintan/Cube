//in
var abc = require('abc');
var flac = require(tc.fixPath('../../lib/index.js'));

abc.async.sequence(
    [
        function (callback) {
            tc.execConsole([
                'mkdir tmp/a',
                'echo a > tmp/a/mod.json',
                'mkdir tmp/b',
                'echo b > tmp/b/mod.json',
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
            tc.execConsole([
                'rm -r tmp/b'
            ].join(';'), callback)
        },
        function (callback) {
            flac.find('tmp', tc.options, function (objects) {
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
[{"filter":"m","file":"a/mod.json","text":"a\n"},{"filter":"m","file":"b/mod.json","text":"b\n"},{"filter":"p","file":"pack","text":"p\n"}]
[{"filter":"m","file":"a/mod.json","text":"a\n"},{"filter":"p","file":"pack","text":"p\n"}]