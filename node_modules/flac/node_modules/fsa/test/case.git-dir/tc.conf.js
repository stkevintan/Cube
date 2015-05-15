{
    exec:'async',
    beforeEach: function (tc, callback) {
        
        tc.callRep = function exec (method, dir, options, callback) {
            var rep = require(conf.fixPath('../../lib/rep.js'));
            rep[method](dir, options, function (err, data) {
                if (err) {
                    tc.out(err)
                }
                callback(data);
            });
        };

        tc.execConsole = function exec (command, callback) {
            require('child_process').exec(command, function (err, stdout, stderr) {
                if (err) {
                    tc.out(command + ':' + err);
                }
                callback();
            });
        }

        callback();
    }
}