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
            try {
                fs.mkdirSync(toAbsolute('data'));
            } catch (e) {
                console.log(e);
            }
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
    var ret = this.loadMusicDirSync();
    if (utils.isString(ret))callback(ret);
    else
        callback(null, modefy([{
            timestamp: 0,
            name: that.getMusicDir(),
            songList: ret,
            type: 'local'
        }]));
}


__.loadMusicDirSync = function (musicDir) {
    var musicDir = musicDir || this.getMusicDir();
    var ret = [];
    var files = [];
    try {
        files = fs.readdirSync(musicDir);
    } catch (e) {
        try {
            fs.mkdirSync(musicDir);
        } catch (e) {
            return {msg: '[loadMusicDir]failed to read or create dir, please try another one.', type: 1}
        }
    }
    var that = this;
    files = files.map(function (f) {
        return path.join(musicDir, f);
    });
    files = files.filter(function (f) {
        var stat = fs.statSync(f);
        if (stat && stat.isDirectory()) {
            ret = ret.concat(that.loadMusicDirSync(f));
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
        if (err) callback({msg: '[loadScheme]read file failed ' + err, type: 0});
        else callback(null, modefy(JSON.parse(contents)));
    });
}

__.getScheme = function (callback) {
    if (scheme.isChanged == 0) {
        this.loadScheme(function (err, content) {
            if (err) callback(err)
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

__.setCookie = function (cookie) {
    config.content.cookie = cookie;
    config.isChanged = 1;
}

__.getCookie = function () {
    return config.content.cookie;
}

__.getUserID = function () {
    if (!config.content.cookie)return null;
    var ret = /\d+/.exec(config.content.cookie[3]);
    return ret ? ret[0] : null;
};

module.exports = new fileManager();
