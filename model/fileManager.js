/**
 * Created by kevin on 15-5-5.
 */
var fs = require('fs');
var path = require('path');
var async = require('async');

var sup = ['.mp3', '.ogg', '.wav'];

function toAbsolute(dir) {
    dir = dir || '';
    if (path.isAbsolute(dir))return dir;
    return path.resolve(__dirname, '../' + dir);
}

var DefaultMusicDir = toAbsolute('music');
console.log(toAbsolute('data/config.json'));
var config = {
    path: toAbsolute('data/config.json'),
    content: require('../data/config'),
    isChanged: 0
};

var scheme = {
    path: toAbsolute('data/scheme.json'),
    content: require('../data/scheme')
}

var fileManager = function () {
}
fileManager.prototype.SaveChanges = function (callback) {
    if (config.isChanged) {
        fs.writeFile(config.path,
            JSON.stringify(config.content),
            function (err) {
                callback(err);
            });
    }
    delete scheme.content['本地音乐'];
    fs.writeFile(scheme.path,
        JSON.stringify(scheme.content),
        function (err) {
            callback(err);
        });
}

fileManager.prototype.setMusicDir = function (dir) {
    dir = toAbsolute(dir);
    if (this.getMusicDir() !== dir) {
        config.content.musicDir = dir;
        config.isChanged = 1;
        return true;
    }
    return false;
}

fileManager.prototype.getMusicDir = function () {
    return config.content.musicDir || DefaultMusicDir;
}

fileManager.prototype.getScheme = function () {
    return scheme.content;
}

fileManager.prototype.getSchemeNames = function () {
    var ret = ['本地音乐'];
    for (var i in scheme.content) {
        if (i != '本地音乐')ret.push(i);
    }
    return ret;

}

fileManager.prototype.setScheme = function (key, val) {
    if (key != '本地音乐') {
        scheme.content[key] = val;
    }
}
fileManager.prototype.removeScheme = function (key) {
    if (key in scheme.content) {
        delete scheme.content[key];
    }
}
fileManager.prototype.loadMusicDir = function (callback) {
    var musicDir = this.getMusicDir();
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
    ], function (err, result) {
        if (err) {
            console.log('get local file failed!', err);
        } else {
            scheme.content['本地音乐'] = result;
            console.log('update success!');
        }
        callback();
    });
}

module.exports = fileManager;
