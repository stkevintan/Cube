var request = require('superagent');
var utils = require('./utils');
var fm = require('./fileManager');
var NetEaseMusicAPI = function () {
    this.header = {
        'Accept': '*/*',
        'Accept-Encoding': 'gzip,deflate,sdch',
        'Accept-Language': 'zh-CN,zh;q=0.8,gl;q=0.6,zh-TW;q=0.4',
        'Connection': 'keep-alive',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Host': 'music.163.com',
        'Referer': 'http://music.163.com/search/',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/33.0.1750.152 Safari/537.36'
    }
    this.cookies = {
        'appver': '1.5.2'
    }
}
NetEaseMusicAPI.prototype = {
    httpRequest: function (method, url, data, callback) {
        if (method == 'post') {
            var header = this.header;
            console.log(url, header, data);
            request.post(url).set(header).send(data).end(callback);

        } else {
            request.get(url).set(this.header).query(data).end(callback);
        }
    },
    // 搜索单曲(1)，歌手(100)，专辑(10)，歌单(1000)，用户(1002) *(type)*
    search: function () {
        //s, stype, offset, total, limit,callback;
        var argv = [].reverse.call(arguments);
        var callback = argv[0];
        var s = argv[1];
        var stype = argv[2] || 1;
        var offset = argv[3] || 0;
        var total = argv[4] || 'true';
        var limit = argv[5] || fm.getSearchLimit();
        var url = 'http://music.163.com/api/search/get/web';
        var data = {
            's': s,
            'type': stype,
            'offset': offset,
            'total': total,
            'limit': limit
        }
        var that = this;
        this.httpRequest('post', url, data, function (err, res) {
            if (err) {
                callback(err);
                return;
            }
            var doc = JSON.parse(res.text);
            if (doc.code != 200)callback('server return a error code:' + doc.code);
            else {//callback(null, transfer(doc.result.songs));
                var results = doc.result.songs;
                var data = that.transfer(results);
                callback(null, data);
            }
        });
    },
    transfer: function (results) {
        var data = [];
        var idArray = [];
        var idMap = {};
        for (var i = 0; i < results.length; i++) {
            var r = results[i];
            idArray.push(r.id);
            idMap[r.id] = i;
            var o = {src: ''};
            o.title = r.name;
            o.album = r.album.name;
            o.artist = r.artists.map(function (v) {
                return v.name;
            }).join();
            data.push(o);
        }
        this.songsDetail(idArray, function (err, songs) {
            for (var i = 0; i < songs.length; i++) {
                var index = idMap[songs[i].id];
                data[index].src = songs[i].mp3Url;
                data[index].pic = songs[i].album.picUrl;
            }
        });
        return data;
    },
    songsDetail: function (ids, callback) {
        var url = 'http://music.163.com/api/song/detail';
        this.httpRequest('get', url, {ids: '[' + ids.join() + ']'}, function (err, res) {
            if (err) {
                callback(err);
                return;
            }
            var doc = JSON.parse(res.text);
            if (doc.code != 200)callback('server return a error code:' + doc.code);
            else callback(null, doc.songs);
        });
    }
}
module.exports = NetEaseMusicAPI;