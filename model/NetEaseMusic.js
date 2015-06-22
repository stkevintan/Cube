var request = require('superagent');
//var process = require('process');
var async = require('async');
var crypto = require('crypto');
var fm = require('./FileManager');
var PltM = require('./PlaylistModel');
var SongM = require('./SongModel');
header = {
    'Accept': '*/*',
    'Accept-Encoding': 'gzip,deflate,sdch',
    'Accept-Language': 'zh-CN,zh;q=0.8,gl;q=0.6,zh-TW;q=0.4',
    'Connection': 'keep-alive',
    'Content-Type': 'application/x-www-form-urlencoded',
    'Host': 'music.163.com',
    'Referer': 'http://music.163.com/search/',
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/33.0.1750.152 Safari/537.36'
}

var httpRequest = function (method, url, data, callback) {
    var ret;
    if (method == 'post') {
        ret = request.post(url).send(data);
    } else {
        ret = request.get(url).query(data);
    }
    var cookie = fm.getCookie();
    if (cookie)ret.set('Cookie', cookie);
    ret.set(header).timeout(10000).end(callback);
}

module.exports = {
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
        var hasher = crypto.createHash('md5').update(password);
        password = hasher.digest('hex');
        var data = {
            'password': password,
            'rememberLogin': 'true'
        };
        data[name] = username;
        httpRequest('post', url, data, function (err, res) {
            if (err) {
                console.log("login request error: " + err);
                callback("http request error on login: " + err);
                return;
            }
            var data = JSON.parse(res.text);

            if (data.code != 200) {
                //登录失败
                callback("用户名或密码错误");
            } else {
                fm.setCookie(res.header['set-cookie']);
                callback(null, data.profile);
            }
        });
    },
    getNet: function (callback) {
        var that = this;
        this.userPlaylist(function (err, playlists) {
            if (err) {
                callback('load user playlist failed: ' + err);
                return;
            }
            async.map(playlists, function (item, callback) {
                that.playlistDetail(item.id, function (err, songList) {
                    if (err) {
                        callback(err);
                        return;
                    }
                    var pltm = new PltM({
                        name: item.name,
                        type: 'net',
                        songList: songList
                    });
                    callback(null, pltm);
                });
            }, function (err, results) {
                if (err) {
                    callback('load playlist detail failed: ' + err);
                } else
                    callback(null, results);
            });
        })
    },
    userProfile: function (uid, callback) {
        uid = uid || fm.getUserID();
        if (!uid) {
            callback('cannot get userProfile without uid');
        } else {
            var url = 'http://music.163.com/api/user/detail/' + uid;
            httpRequest('get', url, {'userId': uid}, function (err, res) {
                if (err) {
                    console.log('userProfile error: ', err);
                    callback('userProfile error: ' + err);
                } else if (res.body.code != 200) {
                    callback('userProfile error: code -' + res.body.code);
                } else {
                    callback(null, res.body.profile);
                }
            })
        }
    },
    userPlaylist: function () {
        // [uid],[offset],[limit],callback
        var argv = [].slice.call(arguments);
        var callback = argv.pop();
        var uid = fm.getUserID();
        if (!uid) {
            callback('user not login');
            return;
        }
        var uid = argv[0] || uid;

        var offset = argv[1] || 0;
        var limit = argv[2] || 100;
        var url = 'http://music.163.com/api/user/playlist/';
        var data = {
            "offset": offset,
            "limit": limit,
            "uid": uid
        }
        httpRequest('get', url, data, function (err, res) {
            if (err) {
                callback('http timeout');
            } else {
                if (res.body.code != 200)callback('code - ', data.code);
                else {
                    callback(null, res.body.playlist);
                }
            }
        });
    },
    playlistDetail: function (id, callback) {
        var url = 'http://music.163.com/api/playlist/detail';
        var data = {"id": id}
        var that = this;
        httpRequest('get', url, data, function (err, res) {
            if (err)callback('http timeout');
            else {
                if (res.body.code != 200)callback('code - ', res.code);
                else callback(null, that.transfer(res.body.result.tracks));
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
        httpRequest('post', url, data, function (err, res) {
            if (err) {
                callback(err);
                return;
            }
            var doc = JSON.parse(res.text);
            if (doc.code != 200)callback('code -' + doc.code);
            else {
                var results = doc.result.songs;
                var data = that.transfer(results);
                callback(null, data);
            }
        });
    },
    transfer: function (results) {
        var songList = [];
        var idArray = [];
        var idMap = {};
        for (var i = 0; i < results.length; i++) {
            var r = results[i];
            idArray.push(r.id);
            idMap[r.id] = i;
            var o = {src: ''};
            o.id = r.id;
            o.title = r.name;
            o.album = r.album.name;
            o.artist = r.artists.map(function (v) {
                return v.name;
            }).join();
            songList.push(new SongM(o));//modefy here!
        }
        var that = this;
        process.nextTick(function () {
            // >100时分批查询
            var num = Math.ceil(idArray.length / 100);
            for (var k = 0; k < num; k++) {
                var idTmp = idArray.slice(k * 100, Math.min((k + 1) * 100, idArray.length));
                that.songsDetail(idTmp, function (err, songs) {
                    if (err) {
                        console.log('songsDetail error' + err);
                        return;
                    }
                    for (var i = 0; i < songs.length; i++) {
                        var index = idMap[songs[i].id];
                        songList[index].src = songs[i].mp3Url;
                        songList[index].pic = songs[i].album.picUrl;
                    }
                });
            }
        });
        return songList;
    },
    songsDetail: function (ids, callback) {
        var url = 'http://music.163.com/api/song/detail';
        httpRequest('get', url, {ids: '[' + ids.join() + ']'}, function (err, res) {
            if (err) {
                callback(err);
                return;
            }
            var doc = JSON.parse(res.text);
            if (doc.code != 200)callback('server return a error code:' + doc.code);
            else callback(null, doc.songs);
        });
    },
    songDetail: function (id, callback) {
        var url = "http://music.163.com/api/song/detail";
        httpRequest('get', url, {id: id, ids: '[' + id + ']'}, function (err, res) {
            if (err) {
                callback(err);
                return;
            }
            var doc = JSON.parse(res.text);
            callback(null, doc);
        });
    },
    songLyric: function (id, callback) {
        var url = "http://music.163.com/api/song/lyric";
        httpRequest('get', url, {os: 'android', id: id, lv: -1, tv: -1}, function (err, res) {
            if (err) {
                callback(err);
                return;
            }
            var doc = JSON.parse(res.text);
            if (doc.lrc) {
                callback(err, doc.lrc.lyric);
            }
            else {
                callback(-1);
            }

        })
    },
    radio: function (callback) {
        var url = 'http://music.163.com/api/radio/get';
        httpRequest('get', url, null, function (err, res) {
            console.log(res);
            callback(err, res);
        })
    }
}

