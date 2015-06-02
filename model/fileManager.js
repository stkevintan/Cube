/**
 * Created by kevin on 15-5-5.
 */
var fs = require('fs');
var path = require('path');

var sup = ['.mp3', '.ogg', '.wav'];

function toAbsolute() {
    dir = path.join.apply(null, arguments);
    if (path.isAbsolute(dir))return dir;
    return path.resolve(__dirname, '../' + dir);
}
DefaultMusicDir = toAbsolute('music');
DefaultSearchLimit = 20;

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

fileManager.prototype.getScheme = function () {
    var data = this.loadMusicDir();
    try {
        scheme.content = JSON.parse(fs.readFileSync(scheme.path), 'utf-8');
    }
    catch (e) {
        scheme.content = [];
    }
    scheme.content.push({
        timestamp: 0,
        name: '本地音乐',
        data: data
    });
    return scheme.content;
}
fileManager.prototype.setUserData = function (data) {
    config.content.userData = data;
    config.isChanged = 1;
}
fileManager.prototype.getUserData = function () {
    return config.content.userData;
}

fileManager.prototype.loadMusicDir = function (musicDir) {
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
var fm = new fileManager();//单实例
module.exports = fm;
