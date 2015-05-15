(function () {

    var childProcess = require('child_process');
    
    function execCommand (command, tc, callback) {
        childProcess.exec(command, function (err, stdout, stderr) {
            if (err) {
                tc.out(command + ':' + err);
            }
            callback();
        });
    }

    return {
        exec: 'async',
        beforeEach: function (tc, callback) {
            execCommand('mkdir tmp', tc, function () {
                execCommand('touch tmp/1', tc, callback);    
            });
        },
        afterEach: function (tc, callback) {
            execCommand('rm -rf tmp', tc, callback);
        }
    };
})()