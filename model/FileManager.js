/**
 * Created by kevin on 15-5-5.
 */
var fs = require('fs');
var async = require('async');
var path = require('path');
var utils = require('./Utils');
var PltM = require('./PlaylistModel');
var SongM = require('./SongModel');


function modefy(arr) {
    arr = arr.map(function (o) {
        var n = new PltM(o);
        n.songList = n.songList.map(function (s) {
            return new SongM(s);
        });
        return n;
    });
    return arr;
}
function toAbsolute() {
    dir = path.join.apply(null, arguments);
    if (path.isAbsolute(dir))return dir;
    return path.resolve(__dirname, '../' + dir);
}

const EXTLIST = ['.mp3', '.ogg', '.wav'];
const DEFAULTMUSICDIR = toAbsolute('music');
const DEFAULTSEARCHLIMIT = 20;
const RECURSEARCH = false;

var config = {
    path: toAbsolute('data', 'config.json'),
    content: {},
    isChanged: 0
};

var scheme = {
    path: toAbsolute('data', 'scheme.json'),
    content: [],
    isChanged: 0,
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
            fs.mkdir(toAbsolute('data'), function (e) {
                console.log('warning:', e);
            });
        } else {
            console.log('warning:', e.message);
        }
    }
}
var __ = fileManager.prototype;

__.SaveChanges = function (callback) {
    async.each([config, scheme], function (item, callback) {
        if (item.isChanged) {
            fs.writeFile(item.path, JSON.stringify(item.content), callback);
        } else callback(null);
    }, callback);
}

/*********MusicDir**********/
__.setMusicDir = function (dir) {
    dir = toAbsolute(dir);
    if (this.getMusicDir() !== dir) {
        config.content.musicDir = dir;
        config.isChanged = 1;
        return true;
    }
    return false;
}

__.getMusicDir = function () {
    return config.content.musicDir || DEFAULTMUSICDIR;
}


/*********SearchLimit**********/
__.getSearchLimit = function () {
    return config.content.searchLimit || DEFAULTSEARCHLIMIT;
}

__.setSearchLimit = function (limit) {
    if (typeof limit === 'number' && limit >= 0) {
        config.content.searchLimit = limit;
        config.isChanged = 1;
    }
}


/*********Local music file**********/
__.getLocal = function (callback) {
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

__.loadMusicDir = function (musicDir, callback) {
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
                if (EXTLIST.indexOf(ext) == -1)return;
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

__.loadMusicDirSync = function (musicDir) {
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
        for (var i = 0; i < EXTLIST.length; i++) {
            if (ext == EXTLIST[i])return true;
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


/*********Scheme inventory**********/
__.loadScheme = function (callback) {
    scheme.isChanged = 1;
    fs.readFile(scheme.path, 'utf-8', function (err, contents) {
        if (err)callback(err);
        else callback(null, modefy(JSON.parse(contents)));
    });
}

__.getScheme = function (callback) {
    if (scheme.isChanged == 0) {
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

__.addScheme = function (plt) {
    if (!(plt instanceof PltM)) {
        console.log('addScheme failed');
        return;
    }
    scheme.isChanged = 1;
    scheme.content.push(plt);
}

__.setScheme = function (plt) {
    if (!(plt instanceof PltM)) {
        console.log('setScheme failed');
        return;
    }
    scheme.isChanged = 1;
    var index = scheme.indexOf(plt);
    if (index != -1) {
        scheme.content[index] = plt;
    } else {
        console.log('setScheme failed');
    }
}

__.delScheme = function (plt) {
    if (!(plt instanceof PltM)) {
        console.log('delScheme failed');
        return;
    }
    scheme.isChanged = 1;
    var index = scheme.indexOf(plt);
    console.log(index);
    if (index != -1) {
        scheme.content.splice(index, 1);
    } else {
        console.log('setScheme failed');
    }
}


/*********Cookie*********
 * Sample:
 * 0: "__remember_me=true; Expires=Fri, 03 Jul 2015 08:02:33 GMT; Path=/; HttpOnly"
 * 1: "MUSIC_U=9ab02e8154e4b8ac0e2317425f07850b032e54d57d7b8663b2a68daf70158116752d1617f8a1f01701480fe97e495d6f8bafcdfe5ad2b092; Expires=Fri, 03 Jul 2015 08:02:33 GMT; Path=/; HttpOnly"
 * 2: "__csrf=1339cdfb0ad8a49d7db75b43c5238605; Expires=Fri, 03-Jul-2015 08:02:43 GMT; Path=/"
 * 3: "NETEASE_WDA_UID=33287225#|#1408078960514; Expires=Tue, 06 Jul 2083 11:16:40 GMT; Path=/; HttpOnly"
 * */
__.setCookie = function (cookie) {
    config.content.cookie = cookie;
    config.isChanged = 1;
}

__.getCookie = function () {
    return config.content.cookie;
}

__.getUserID = (function () {
    var userID = null;
    return function () {
        if (userID)return userID;
        var cookie = __.getCookie();
        if (cookie) {
            userID = /\d+/.exec(cookie[3]);
            if (userID) userID = userID[0];
        }
        return userID;
    }
})();

module.exports = new fileManager();
