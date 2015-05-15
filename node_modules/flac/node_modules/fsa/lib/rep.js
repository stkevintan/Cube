var exec = require('child_process').exec;
var path = require('path');

var GIT_DIR = '.fsa';

/**
 * @param {String} dir
 * @param {Object} [options]
 * @param {Function} callback
 */
exports.init = function (dir, options, callback) {
    this.execGitCommand('init', dir, options, getCallback(options, callback));
};

/**
 * @param {String} dir
 * @param {Object} [options]
 * @param {Function} callback
 */
exports.getChanges = function (dir, options, callback) {
    this.execGitCommand('status --porcelain ' + getFileMask(), dir, options, function (err, response) {
        getCallback(options, callback)(err, parseStatusResponse(response));
    });
};

/**
 * @param {String} dir
 * @param {Object} [options]
 * @param {Function} callback
 */
exports.commit = function (dir, options, callback) {
    callback = getCallback(options, callback);

    var _this = this;
    this.execGitCommand('add -A ' + getFileMask(), dir, options, function (err) {
        if (err) {
            callback();
        } else {
            _this.execGitCommand('commit -m \"' + new Date() + '\"', dir, options, callback);
        }
    });
};

/**
 * @param {String} dir
 * @param {Object} [options]
 * @param {Function} callback
 */
exports.getVersion = function (dir, options, callback) {
    this.execGitCommand('rev-parse HEAD', dir, options, function (err, version) {
        getCallback(options, callback)(err, version.trim());
    });
};

/**
 * @param {String} path
 * @param {String} command
 * @param {Object} options
 * @param {Function} callback
 */
exports.execGitCommand = function (command, dir, options, callback) {
    var gitConsoleCommand = getConsoleCommand(dir, command, options);
    exec(gitConsoleCommand, callback);
}

function getCallback (options, callback) {
    if (!callback && typeof options === 'function') {
        callback = options;
    }
    if (!callback) {
        callback = function () {}
    }
    return callback;
}

function getFileMask () {
    return '\\[^.]*';
}

function getConsoleCommand (dir, command, options) {
    return 'git --git-dir=' + path.join(dir, getGitDir(options)) + ' --work-tree=' + dir + ' ' + command;
}

function getGitDir (options) {
    return options && options.gitDir || GIT_DIR;
}

function parseStatusResponse (response) {
    var lines = response.split('\n');
    var changes = {
        modified: [],
        added: [],
        deleted: []
    };

    lines.forEach(function (line) {
        if (line) {
            var type = line.substr(0, 2);
            var file = line.substr(3);
            switch(type) {
                case " M":
                    changes.modified.push(file);
                    break;
                case "??":
                    changes.added.push(file);
                    break;
                case " D":
                    changes.deleted.push(file);
                    break;
            }
        }
    })
    return changes;
}