/**
 * Created by kevin on 15-5-5.
 */
var fs = require('fs');
var path = require('path');
var async = require('async');
var root = path.resolve(__dirname, '..');
var config = require('../data/config');
var sup = ['.mp3', '.ogg', '.wav'];
var win;
var fileManager=function (_win) {
    win = _win;
}

fileManager.prototype.setMusicDir = function (dir) {
    if (path.isAbsolute(dir) && this.getMusicDir() !== dir) {
        config.musicDir = dir;
        //save changes on close
        win && win.on('close', function () {
            win.hide();
            console.log('save the config changes...');
            fs.writeFile(path.resolve(root, 'data/config.json'), JSON.stringify(config), function () {
                console.log('saved! exit now!');
                win.close(true);
            });
        });
        return true;
    }
    return false;
}

fileManager.prototype.getMusicDir = function () {
    return config.musicDir || path.join(root, 'music/');
}

fileManager.prototype.getFiles = function (callback) {
    var musicDir = this.getMusicDir();
    console.log('musicDir', musicDir);
    async.waterfall([
        function (callback) {
            fs.exists(musicDir, function (ok) {
                callback(null, ok);
            });
        },
        function (ok, callback) {
            if (ok)callback();
            else {
                fs.mkdir(musicDir, function (err) {
                    callback(err);
                });
            }
        },
        function (callback) {
            fs.readdir(musicDir, function (err, files) {
                err && callback(err);
                files = files.filter(function (f) {
                    var ext = path.extname(f);
                    for (var i = 0; i < sup.length; i++) {
                        if (ext == sup[i])return true;
                    }
                    return false;
                });
                var songList = [];
                for (var i = 0; i < files.length; i++) {
                    var file = files[i];
                    var song = {
                        "title": file.split('.')[0],
                        "artist": "",
                        "album": "",
                        "src": path.join(musicDir, file)
                    };
                    songList.push(song);
                }
                callback(null, songList);
            });
        }
    ], callback);
}

module.exports = function(win){
    return new fileManager(win);
}
