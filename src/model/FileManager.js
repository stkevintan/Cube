/**
 * Created by kevin on 15-5-5.
 */
var fs = require('fs');
var utils = require('./Utils');
var PltM = require('./PlaylistModel');
var SongM = require('./SongModel');
var process = require('process');
var path = require('path');
var home = require('home');

function pack(arr) {
    if (!utils.isArray(arr))return [];
    arr = arr.map(function (o) {
        var n = new PltM(o);
        n.songList = n.songList.map(function (s) {
            return new SongM(s);
        });
        return n;
    });
    return arr;
}

const EXTS = ['.mp3', '.ogg', '.wav'];
const DEFAULTMUSICDIR = (function () {
    var choices = ['音乐', 'Music', 'music'].map(function (e) {
        return home.resolve('~/' + e);
    });
    for (var i = 0; i < choices.length; i++) {
        try {
            var stats = fs.statSync(choices[i]);
        } catch (e) {
            continue;
        }
        if (stats && stats.isDirectory()) return choices[i];
    }
    return choices[0];
})();
const DEFAULTSEARCHLIMIT = 20;

var config = {
    key: 'config',
    content: {},
    isChanged: 0
};

var scheme = {
    isChanged: 0,
    key: 'scheme',
    content: [],
    indexOf: function (pltm) {
        return utils.binarySearch(this.content, pltm.timestamp, function (o) {
            return o.timestamp;
        });
    }
}

var fm = {};
config.content = JSON.parse(storage.getItem(config.key)) || {};
module.exports = fm;

fm.saveChanges = function () {
    [config, scheme].forEach(function (o) {
        o.isChanged && storage.setItem(o.key, JSON.stringify(o.content));
    });
}

/*********MusicDir**********/
fm.setMusicDir = function (dir) {
    if (this.getMusicDir() !== dir) {
        config.content.musicDir = dir;
        config.isChanged = 1;
        return true;
    }
    return false;
}

fm.getMusicDir = function () {
    return config.content.musicDir || DEFAULTMUSICDIR;
}


/*********SearchLimit**********/
fm.getSearchLimit = function () {
    return config.content.searchLimit || DEFAULTSEARCHLIMIT;
}

fm.setSearchLimit = function (limit) {
    if (typeof limit === 'number' && limit >= 0) {
        config.content.searchLimit = limit;
        config.isChanged = 1;
    }
}


/*********Local music file**********/
fm.getLocal = function (callback) {
    var that = this;
    process.nextTick(function () {
        var ret = that.loadMusicDirSync();
        if (utils.isString(ret))callback(ret);
        else {
            callback(null, pack([{
                timestamp: 0,
                name: that.getMusicDir(),
                songList: ret,
                type: 'local'
            }]));
        }
    });
}


fm.loadMusicDirSync = function (musicDir) {
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
    files = files.map(function (src) {
        return path.join(musicDir, src);
    }).filter(function (src) {
        var stat = fs.statSync(src);
        if (stat && stat.isDirectory()) {
            ret = ret.concat(that.loadMusicDirSync(src));
            return false;
        }
        var ext = path.extname(src);
        for (var i = 0; i < EXTS.length; i++) {
            if (ext == EXTS[i])return true;
        }
        return false;
    });
    for (var i = 0; i < files.length; i++) {
        var src = files[i];
        var song = {
            "title": path.basename(src, src.substr(src.lastIndexOf('.'))),
            "artist": "",
            "album": "",
            "src": src
        };
        ret.push(song);
    }
    return ret;
}


/*********Scheme inventory**********/
fm.loadScheme = function (callback) {
    process.nextTick(function () {
        scheme.content = JSON.parse(storage.getItem(scheme.key)) || [];
        scheme.isChanged = 1;
        callback(null, pack(scheme.content));
    })
}

fm.getScheme = function (callback) {
    if (scheme.isChanged == 0) {
        this.loadScheme(function (err, content) {
            if (err) callback(err)
            else {
                scheme.content = content;
                callback(null, content);
            }
        });
        return;
    }
    callback(null, scheme.content);
}

fm.addScheme = function (plt) {
    if (!(plt instanceof PltM)) {
        console.log('AddScheme failed');
        return;
    }
    scheme.isChanged = 1;
    scheme.content.push(plt);
}

fm.setScheme = function (plt) {
    if (!(plt instanceof PltM)) {
        console.log('SetScheme failed');
        return;
    }
    scheme.isChanged = 1;
    var index = scheme.indexOf(plt);
    if (index != -1) {
        scheme.content[index] = plt;
    }
}

fm.delScheme = function (plt) {
    if (!(plt instanceof PltM)) {
        console.log('DelScheme failed');
        return;
    }
    scheme.isChanged = 1;
    var index = scheme.indexOf(plt);
    console.log(index);
    if (index != -1) {
        scheme.content.splice(index, 1);
    } else {
        console.log('SetScheme failed');
    }
}

fm.setCookie = function (cookie) {
    config.content.cookie = cookie;
    config.isChanged = 1;
}

fm.getCookie = function () {
    return config.content.cookie;
}

fm.getUserID = function () {
    if (!config.content.cookie)return null;
    var ret = /\d+/.exec(config.content.cookie[3]);
    return ret ? ret[0] : null;
};
