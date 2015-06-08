/**
 * Created by kevin on 15-5-5.
 */
var fs = require('fs');
var async = require('async');
var path = require('path');
var utils = require('./Utils');
var PltM = require('./PlaylistModel');
var sup = ['.mp3', '.ogg', '.wav'];

function modefy(arr) {
    arr = arr.map(function (o) {
        return new PltM(o);
    });
    return arr;
}
function toAbsolute() {
    dir = path.join.apply(null, arguments);
    if (path.isAbsolute(dir))return dir;
    return path.resolve(__dirname, '../' + dir);
}

var DefaultMusicDir = toAbsolute('music');
var DefaultSearchLimit = 20;
var RECURSEARCH = false;

var config = {
    path: toAbsolute('data', 'config.json'),
    content: {},
    isChanged: 0
};

var scheme = {
    path: toAbsolute('data', 'scheme.json'),
    content: [],
    indexOf: function (pltm) {
        return utils.binarySearch(this.content, pltm.timestamp, function (o) {
            return o.timestamp;
        });
    }
}

var fileManager = function () {
    try {
        config.content = JSON.parse(fs.readFileSync(config.path), 'utf-8');
    } catch (e) {
        config.isChanged = 1;
        if (e.errno = -2) {//data目录不存在
            fs.mkdir(toAbsolute('data'), function (err) {
                console.log('mkdir "data" error', err);
            });
        } else {
            console.log(e, e.message);
        }
    }
}
fileManager.prototype.SaveChanges = function (callback) {
    async.parallel([
        function (callback) {
            if (config.isChanged) {
                fs.writeFile(config.path,
                    JSON.stringify(config.content),
                    callback)
            } else callback(null);
        }, function (callback) {
            fs.writeFile(scheme.path,
                JSON.stringify(scheme.content),
                callback);
        }
    ], callback);
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

fileManager.prototype.getSearchLimit = function () {
    return config.content.searchLimit || DefaultSearchLimit;
}
fileManager.prototype.setSearchLimit = function (limit) {
    if (typeof limit === 'number' && limit >= 0) {
        config.content.searchLimit = limit;
        config.isChanged = 1;
    }
}
fileManager.prototype.getLocal = function (callback) {
    var that = this;
    this.loadMusicDir(null, function (err, songList) {

        if (err) {
            callback(err);
            console.log('error occur at getLocal', err);
        }
        else callback(null, modefy([{
            timestamp: 0,
            name: that.getMusicDir(),
            songList: songList,
            type: 'local'
        }]));
    });
}
fileManager.prototype.loadScheme = function (callback) {
    fs.readFile(scheme.path, 'utf-8', function (err, contents) {
        if (err)callback(err);
        else callback(null, modefy(JSON.parse(contents)));
    });
}

fileManager.prototype.getScheme = function (callback) {
    if (scheme.content.length == 0) {
        this.loadScheme(function (err, content) {
            if (err) callback('getScheme error' + err);
            else {
                scheme.content = content;
                callback(null, content);
            }
        });
    } else {
        callback(null, scheme.content);
    }
}
fileManager.prototype.addScheme = function (plt) {
    if (!(plt instanceof PltM)) {
        console.log('addScheme failed');
        return;
    }
    scheme.content.push(plt);
}
fileManager.prototype.setScheme = function (plt) {
    if (!(plt instanceof PltM)) {
        console.log('setScheme failed');
        return;
    }
    var index = scheme.indexOf(plt);
    if (index == -1) {
        scheme.content.push(plt);
    }
}
fileManager.prototype.delScheme = function (plt) {
    if (!(plt instanceof PltM)) {
        console.log('delScheme failed');
        return;
    }
    var index = scheme.indexOf(plt);
    console.log(index);
    if (index != -1) {
        scheme.content.splice(index, 1);
    }
}
fileManager.prototype.setUserData = function (data) {
    config.content.userData = data;
    config.isChanged = 1;
}
fileManager.prototype.getUserData = function () {
    return config.content.userData;
}

fileManager.prototype.loadMusicDir = function (musicDir, callback) {
    musicDir = musicDir || this.getMusicDir();
    var ret = [];
    fs.readdir(musicDir, handleFiles);

    function handleFiles(err, files) {
        if (err) {
            callback(null, []);
            console.log("dir doesn't exist,try to create");
            fs.mkdir(musicDir, function (err) {
                err && console.log('can not create dir at', musicDir, err);
            });
            return;
        }
        var that = this;
        files = files.map(function (f) {
            return path.join(musicDir, f);
        });

        function rcSearch(f, callback) {
            if (!RECURSEARCH) {
                callback();
                return;
            }
            fs.stat(f, function (err, stat) {
                if (stat && stat.isDirectory()) {
                    that.loadMusicDir(f, function (err, tmpRet) {
                        if (err) {
                            callback(err);
                        } else {
                            ret.concat(tmpRet);
                            callback();
                        }
                    });
                }
            });
        }

        async.each(files, rcSearch, function (err) {
            if (err) {
                callback(err);
                return;
            }
            files.forEach(function (f) {
                var ext = path.extname(f);
                if (sup.indexOf(ext) == -1)return;
                var song = {
                    "title": path.basename(f, f.substr(f.lastIndexOf('.'))),
                    "artist": "",
                    "album": "",
                    "src": f
                };
                ret.push(song);
            });
            callback(null, ret);
        });
    }
}


fileManager.prototype.loadMusicDirSync = function (musicDir) {
    var musicDir = musicDir || this.getMusicDir();
    var ret = [];
    var files = [];
    try {
        files = fs.readdirSync(musicDir);
    } catch (e) {
        fs.mkdirSync(musicDir);
    }
    var that = this;
    files = files.map(function (f) {
        return path.join(musicDir, f);
    });
    files = files.filter(function (f) {
        var stat = fs.statSync(f);
        if (stat && stat.isDirectory()) {
            ret = ret.concat(that.loadMusicDir(f));
            return false;
        }
        var ext = path.extname(f);
        for (var i = 0; i < sup.length; i++) {
            if (ext == sup[i])return true;
        }
        return false;
    });
    for (var i = 0; i < files.length; i++) {
        var f = files[i];
        var song = {
            "title": path.basename(f, f.substr(f.lastIndexOf('.'))),
            "artist": "",
            "album": "",
            "src": f
        };
        ret.push(song);
    }
    return ret;
}
module.exports = new fileManager();
