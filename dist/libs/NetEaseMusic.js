/**
* NetEaseMusic API based on https://github.com/darknessomi/musicbox/blob/master/NEMbox/api.py
*/
var request = require('superagent');
var async = require('async');
var crypto = require('./Crypto');
var Model = require('./Model');
var header = {
  'Accept': '*/*',
  'Accept-Encoding': 'gzip,deflate,sdch',
  'Accept-Language': 'zh-CN,en-US;q=0.7,en;q=0.3',
  'Connection': 'keep-alive',
  'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
  'Host': 'music.163.com',
  'Referer': 'http://music.163.com/',
  'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:39.0) Gecko/20100101 Firefox/39.0'
}
config.searchLimit = config.searchLimit || 20;
var httpRequest = function(method, url, data, callback) {
  var ret;
  if (method == 'post') ret = request.post(url).send(data);
  else ret = request.get(url).query(data);
  var cookie = config.cookie;
  if (cookie) ret.set('Cookie', cookie);
  ret.set(header).timeout(10000).end(callback);
}

function getUserID() {
  if (!config.cookie) return null;
  var ret = /\d+/.exec(config.cookie[3]);
  return ret ? ret[0] : null;
}

function transfer(results) {
  var songList = [];
  var idArray = [];
  var idMap = {};
  for (var i = 0; i < results.length; i++) {
    var r = results[i];
    idArray.push(r.id);
    idMap[r.id] = i;
    var o = {
      src: ''
    };
    o.id = r.id;
    o.name = r.name;
    o.album = r.album.name;
    o.artist = r.artists.map(function(v) {
      return v.name;
    }).join();
    songList.push(new Model.song(o));
  }
  process.nextTick(function() {
    // >100时分批查询
    var num = Math.ceil(idArray.length / 100);
    for (var k = 0; k < num; k++) {
      var idTmp = idArray.slice(k * 100, Math.min((k + 1) * 100, idArray.length));
      nem.songsDetail(idTmp, function(err, res) {
        if (err) {
          console.warn('Failed to Fetch Song Details', err.stack, err);
          return;
        }
        for (var i = 0; i < res.length; i++) {
          var index = idMap[res[i].id];
          songList[index].src = res[i].mp3Url;
          songList[index].pic = res[i].album.picUrl;
        }
      });
    }
  });
  return songList;
}

var nem = {
  login: function(username, password, callback) {
    var url,
      pattern = /^0\d{2,3}\d{7,8}$|^1[34578]\d{9}$/,
      body = {
        password: crypto.MD5(password),
        rememberLogin: 'true'
      };
    if (pattern.test(username)) {
      //手机登录
      body.phone = username;
      url = 'http://music.163.com/weapi/login/cellphone/';
    } else {
      //邮箱登录
      body.username = username;
      url = 'http://music.163.com/weapi/login/';
    }

    var encBody = crypto.aesRsaEncrypt(JSON.stringify(body));
    httpRequest('post', url, encBody, function(err, res) {
      if (err) { callback(err); return; }
      var doc = JSON.parse(res.text);
      if (!doc.profile) callback(new Error('Username or Password Incorrect'));
      else {
        config.cookie = res.header['set-cookie'];
        callback(null, doc.profile);
      }
    });
  },
  get: function(cb) {
    nem.userPlaylist(function(err, playlists) {
      if (err) { cb(err); return; }
      async.map(playlists, iterator, cb);
    });
    function iterator(item,cb){
      nem.playlistDetail(item.id, function(err, songList) {
        if (err) { cb(err); return; }
        //log the item object
        console.log(item);
        var entry = new Model.entry({
          name: item.name,
          songList: songList
            //To Do creator...
        });
        cb(null, entry);
      });
    }
  },
  userProfile: function(uid, callback) {
    uid = uid || getUserID();
    if (!uid) { callback(new Error('User Hasnt Logged In')); return; }
    var url = 'http://music.163.com/api/user/detail/' + uid;
    httpRequest('get', url, {'userId': uid}, function(err, res) {
      if (err) { callback(err); return; }
      var doc = res.body;
      if (doc.code != 200) callback(new Error('Http Code:' + doc.code));
      else callback(null, doc.profile);
    });
  },
  userPlaylist: function() {
    // [uid],[offset],[limit],callback
    var argv = [].slice.call(arguments);
    var callback = argv.pop();
    var uid = argv[0] || getUserID();
    if (!uid) { callback(new Error('User Hasnt Logged In')); return; }
    var url = 'http://music.163.com/api/user/playlist/';
    var params = {
      "offset": argv[1] || 0,
      "limit": argv[2] || 100,
      "uid": uid
    }
    httpRequest('get', url, params, function(err, res) {
      if (err) {callback(err); return;}
      var doc = res.body;
      if (doc.code != 200) callback(new Error('Http Code:' + doc.code));
      else callback(null, doc.playlist);
    });
  },
  playlistDetail: function(id, callback) {
    var url = 'http://music.163.com/api/playlist/detail';
    httpRequest('get', url, {id: id}, function(err, res) {
      if (err) {callback(err); return;}
      var doc = res.body;
      if (doc.code != 200) callback(new Error('Http Code: ' + doc.code));
      else callback(null, transfer(doc.result.tracks));
    });
  },
  // 搜索单曲(1)，歌手(100)，专辑(10)，歌单(1000)，用户(1002) *(type)*
  search: function() {
    //s, stype, offset, total, limit,callback;
    var argv = [].slice.call(arguments);
    var callback = argv.pop();
    var url = 'http://music.163.com/api/search/get/web';
    var params = {
      's': argv[0],
      'type': argv[1] || 1,
      'offset': argv[2] || 0,
      'total': argv[3] || 'true',
      'limit': argv[4] || config.searchLimit
    }
    httpRequest('post', url, params, function(err, res) {
      if (err) {callback(err); return;}
      var doc = JSON.parse(res.text);
      if (doc.code != 200) callback(new Error('Http Code: ' + doc.code));
      else callback(null,transfer(doc.result.songs));
    });
  },

  songsDetail: function(ids, callback) {
    var url = 'http://music.163.com/api/song/detail';
    httpRequest('get', url, {ids: '[' + ids.join() + ']'}, function(err, res) {
      if (err) {callback(err); return;}
      var doc = JSON.parse(res.text);
      if (doc.code != 200) callback(new Error('Http Code: ' + doc.code));
      else callback(null, doc.songs);
    });
  },
  lyric: function(id, callback) {
    var url = "http://music.163.com/api/song/lyric";
    var params={
      os: 'android',
      id: id,
      lv: -1,
      tv: -1
    }
    httpRequest('get', url, params, function(err, res) {
      if (err) {callback(err); return;}
      var doc = JSON.parse(res.text);
      if (doc.lrc) callback(null, doc.lrc.lyric);
      else callback(new Error('Lyric doesnt Exist'));
    });
  },
  radio: function(callback) {
    var url = 'http://music.163.com/api/radio/get';
    httpRequest('get', url, null, function(err, res) {
      if (err) {callback(err); return;}
      var doc = JSON.parse(res.text);
      if (doc.code != 200) callback('Http Code: ' + doc.code);
      else callback(null, doc.data.map(function(o) {
        return new Model.song({
          id: o.id,
          name: o.name,
          src: o.mp3Url,
          pic: o.album.picUrl,
          artist: o.artists.map(function(v) {return v.name;}).join(),
          album: o.album.name
        });
      }));
    });
  }
}
module.exports = nem;
