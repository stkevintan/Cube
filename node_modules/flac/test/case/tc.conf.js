{
    exec:'async',
    beforeEach: function (tc, callback) {
        tc.options = {
            filters: [
                {
                    name: 'm', 
                    test: function (file) {
                        return file === 'mod.json'
                    }
                },
                {
                    name: 'p', 
                    test: function (file) {
                        return file === 'pack'
                    }
                }
            ]
        };

        tc.printObjects = function (objects) {
            objects.sort(function (a, b) {
                return a.file > b.file ? 1 : -1
            })
          tc.out(JSON.stringify(objects))
        }

        tc.execConsole = function exec (command, callback) {
            require('child_process').exec(command, function (err, stdout, stderr) {
                console.log(command);
                if (err) {
                    tc.out(command + ':' + err);
                }
                callback();
            });
        };

        tc.execConsole('mkdir tmp', callback);
    },
    afterEach: function (tc, callback) {
        tc.execConsole('rm -rf tmp', callback);
    }
}