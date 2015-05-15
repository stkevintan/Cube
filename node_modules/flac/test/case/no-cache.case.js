//in
var abc = require('abc');
var fs = require('fs');
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
            flac.find('tmp', abc.extend({noCache: true}, tc.options), function (objects) {
                tc.printObjects(objects);
                fs.exists('tmp/.flac', function (exists) {
                    if (exists) {
                        tc.out('ERROR: cache dir is found!');
                    }
                    callback();
                })
            })
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
[{"filter":"m","file":"a/mod.json","text":"a\n"},{"filter":"m","file":"b/mod.json","text":"b\n"},{"filter":"p","file":"pack","text":"p\n"}]