/**
 * Created by kevin on 15-6-18.
 */
var request = require('superagent');
var crypto = require('crypto');
var tkw = function () {
    this.header = {
        'Accept': '*/*',
        'Accept-Encoding': 'gzip,deflate,sdch',
        'Accept-Language': 'zh-CN,zh;q=0.8,gl;q=0.6,zh-TW;q=0.4',
        'Connection': 'keep-alive',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Host': 'music.163.com',
        'Cookie': '',
        'Referer': 'http://music.163.com/search/',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/33.0.1750.152 Safari/537.36'
    }
}
var url = 'http://music.163.com/api/user/detail/33287225';
tkw.prototype = {
    httpRequest: function (method, url, data, callback) {
        var ret;
        if (method == 'post') {
            ret = request.post(url).send(data);
        } else {
            ret = request.get(url).query(data);
        }
        ret.set(this.header).timeout(10000).end(callback);
    }
}
var t = new tkw();

login('18267912632', 'tkw930812', function (err, res) {
    console.log(err, res);
    t.httpRequest('get', 'http://music.163.com/api/user/detail/64619830', {userId: 64619830, all: true}, function (err, ress) {
        if (err)console.log(err);
        else {
            console.log('ress',ress.text);
        }
    });
});


function login(username, password, callback) {
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
    t.httpRequest('post', url, data, function (err, res) {
        if (err) {
            console.log("login request error: " + err);
            callback("http error: " + err);
            return;
        }
        var data = JSON.parse(res.text);

        if (data.code != 200) {
            //登录失败
            callback("用户名或密码错误");
        } else {
            t.header.Cookie = res.header['set-cookie'];
            // fm.setCookie(res.header['set-cookie']);
            callback(null, res.header['set-cookie']);
        }
    });
}

/*

 */