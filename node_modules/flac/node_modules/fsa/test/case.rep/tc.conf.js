(function () {
    var rep = require(conf.fixPath('../../lib/rep.js'));
    var childProcess = require('child_process');
    var abc = require('abc');

    function exec (inText, tc, callback) {
        var commands;
        try {
            eval('commands=' + inText);
        } catch (e) {
            console.log('commands parse error: ' + e);
            callback();
            return;
        }

        abc.async.sequence(
            commands,
            function (command, callback) {
                try {
                    execCommand(command, tc, callback);
                } catch (e) {
                    tc.out(command + ':' + e);
                    callback();
                }
            },
            callback
        );

    }
    
    function execCommand (command, tc, callback) {
        switch (command) {
            case "INIT":
                rep.init('tmp', function (err) {
                    if (err) {
                        tc.out(command + ':' + err);
                    }
                    callback();
                })
                break;
            case "GET_CHANGES": 
                rep.getChanges('tmp', function (err, changes) {
                    if (err) {
                        tc.out(command + ':' + err);
                    } else {
                        tc.out(JSON.stringify(changes));
                    }
                    callback();
                })
                break;
            case "COMMIT": 
                rep.commit('tmp', function (err) {
                    if (err) {
                        tc.out(command + ':' + err);
                    }
                    callback();
                })
                break;
            case "GET_VERSION": 
                rep.getVersion('tmp', function (err, version) {
                    if (!version) {
                        tc.out('Empty version!')
                    }
                    tc.version = version;
                    callback();
                })
                break;
            case "CHECK_VERSION": 
                rep.getVersion('tmp', function (err, version) {
                    if (err) {
                        tc.out(command + ':' + err);
                    } else {
                        tc.out(tc.version == version ? 'same' : 'different');
                    }
                    callback();
                })
                break;
            default:
                childProcess.exec(command, function (err, stdout, stderr) {
                    if (err) {
                        tc.out(command + ':' + err);
                    }
                    callback();
                });
        }
    }

    return {
        exec: exec,
        beforeEach: function (tc, callback) {
            execCommand('mkdir tmp', tc, callback);
        },
        afterEach: function (tc, callback) {
            execCommand('rm -rf tmp', tc, callback);
        }
    };

})();