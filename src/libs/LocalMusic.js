var fs = require('fs-plus');
var path = require('path');
var Model = require('./Model');
var async = require('async');
var __ = require('./Utils');
const EXTS = ['.mp3', '.ogg', '.wav'];
global.config.musicDirs = global.config.musicDirs || (function() {
    var choices = ['音乐', 'Music', 'music'].map(function(e) {
        return fs.normalize('~/' + e);
    });
    for (var i = 0; i < choices.length; i++) {
        try {
            var stats = fs.statSync(choices[i]);
        } catch (e) {
            continue;
        }
        if (stats && stats.isDirectory()) return [choices[i]];
    }
    //create a music dir
    fs.mkdir(choices[0], function(err) {
        console.warn('failed to create music dir', err.stack,
            err);
    });
    return [choices[0]];
})();

global.config.searchLimit = global.config.searchLimit || 20;

module.exports = {
    add: function(newPath, cb) {
        if (config.musicDirs.indexOf(newPath) == -1) return;
        config.musicDirs.push(newPath);
        this.get([newPath], cb);
    },
    remove: function(path) {
        var i = config.musicDirs.indexOf(path);
        if (i == -1) return;
        config.musicDirs.splice(i, 1);
    },
    get: function(dirs, cb) {
        /**
         * get entrylist from local file system.
         * @param {array} [dirs=config.musicDirs] - directories to search music files
         * @param {function} cb - callback(err,entryList)
         */
        if (arguments.length == 1) {
            cb = dirs;
            dirs = config.musicDirs;
        }
        var entryList = [];
        async.each(dirs, function(dir, callback) {
            var songList = [];
            fs.traverseTree(dir, onFile, onDirectory,
                function(err) {
                    if (err) {
                        //test the arguments
                        console.log(
                            'test fs.traverseTree arguments',
                            arguments);
                        callback(err);
                        return;
                    }
                    entryList.push(new Model.entry({
                        name: dir,
                        creator: process.env.USER,
                        songList: songList
                    }));
                    callback(null);
                });

            function onFile(src) {
                if (EXTS.indexOf(path.extname(src)) == -1)
                    return;
                songList.push(new Model.song({
                    name: path.basename(src, path.extname(
                        src)),
                    src: src
                }));
            }

            function onDirectory(src) {
                return true;
            }
        }, function(err) {
            cb(err, entryList);
        });
    }
}
