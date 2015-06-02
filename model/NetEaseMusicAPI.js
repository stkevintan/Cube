var request = require('superagent');
var process = require('process');
var crypto = require('crypto');
var fm = require('./fileManager');
var userData = fm.getUserData();

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
        var header = this.header;
        if (method == 'post') {
            request.post(url).set(header).send(data).end(callback);

        } else {
            request.get(url).set(header).query(data).end(callback);
        }
    },
    login: function (username, password, callback) {
        var url, name, pattern = /^0\d{2,3}\d{7,8}$|^1[34578]\d{9}$/
        if (pattern.test(username)) {
            //手机登录
            name = 'phone';
            url = 'http://music.163.com/api/login/cellphone';

        } else {
            //邮箱登录
            name = 'username';
            url = 'http://music.163.com/api/login/';
        }
        //对password加密
        var hasher = crypto.createHash('md5');
        hasher.update(password);
        password = hasher.digest('hex');
        var data = {
            'password': password,
            'rememberLogin': 'true'
        };
        data[name] = username;
        this.httpRequest('post', url, data, function (err, res) {
            if (err) {
                console.log("login request error!");
                callback("http请求出错!");
            } else {
                var data = JSON.parse(res.text);
                if (data.code != 200) {
                    //登录失败
                    callback("用户名或密码错误");
                } else {
                    userData = data;
                    fm.setUserData(data);
                    callback(null, data.profile);
                }
            }
        });
    },
    userPlaylist: function () {
        // [uid],[offset],[limit],callback
        var argv = [].slice.call(arguments);
        var callback = argv.pop();
        var uid = argv[0] || userData.account.id;
        var offset = argv[1] || 0;
        var limit = argv[2] || 100;
        var url = 'http://music.163.com/api/user/playlist/';
        var data = {
            "offset": offset,
            "limit": limit,
            "uid": uid
        }
        this.httpRequest('get', url, data, function (err, res) {
            if (err) {
                console.log('user play list http get error!');
                callback('http请求出错!');
            } else {
                var data = JSON.parse(res.text);
                if (data.code != 200)callback('获取失败！');
                else {
                    callback(null, data.playlist);
                }
            }
        })
    },
    playlistDetail: function (name, id, callback) {
        var url = 'http://music.163.com/api/playlist/detail';
        var data = {
            "id": id
        }
        var that = this;
        this.httpRequest('get', url, data, function (err, res) {
            if (err)callback('http请求出错！');
            else {
                res = JSON.parse(res.text);
                if (res.code != 200)callback('playlist详情失败');
                else callback(null, {name: name, data: that.transfer(res.result.tracks)});
            }
        });
    },
    // 搜索单曲(1)，歌手(100)，专辑(10)，歌单(1000)，用户(1002) *(type)*
    search: function () {
        //s, stype, offset, total, limit,callback;
        var argv = [].slice.call(arguments);
        var callback = argv.pop();
        var s = argv[0];
        var stype = argv[1] || 1;
        var offset = argv[2] || 0;
        var total = argv[3] || 'true';
        var limit = argv[4] || fm.getSearchLimit();

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
            else {
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
        var that= this;
        process.nextTick(function(){
            // >100时分批查询
            var num = Math.ceil(idArray.length / 100);
            for (var k = 0; k < num; k++) {
                var idTmp = idArray.slice(k * 100, Math.min((k + 1) * 100, idArray.length));
                that.songsDetail(idTmp, function (err, songs) {
                    for (var i = 0; i < songs.length; i++) {
                        var index = idMap[songs[i].id];
                        data[index].src = songs[i].mp3Url;
                        data[index].pic = songs[i].album.picUrl;
                    }
                });
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
