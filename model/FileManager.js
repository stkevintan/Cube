/**
 * Created by kevin on 15-5-5.
 */
var fs = require('fs');
var async = require('async');
var path = require('path');
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
    content: []
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
fileManager.prototype.SaveChanges = function (recKey, plts, callback) {
    if (config.isChanged) {
        fs.writeFile(config.path,
            JSON.stringify(config.content),
            function (err) {
                callback(err);
            });
    }
    scheme.content = [];
    for (var i = 0, j = 0; i < recKey.length; i++) {
        var tmpTs = recKey[i];
        while (j < plts.length && plts[j].timestamp != tmpTs)j++;
        if (j >= plts.length)break;
        scheme.content.push(plts[j]);
    }
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

    this.loadMusicDir(null, function (err, songList) {

        if (err) {
            callback(err);
            console.log('error occur at getLocal', err);
        }
        else callback(null, modefy([{
            timestamp: 0,
            name: '本地音乐',
            songList: songList,
            type: 'local'
        }]));
    });
}
fileManager.prototype.getScheme = function (callback) {
    fs.readFile(scheme.path, 'utf-8', function (err, contents) {
        console.log('getScheme', contents);
        if (err)callback(err);
        else callback(null, modefy(JSON.parse(contents)));
    });
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
