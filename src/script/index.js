/**
 * Created by kevin on 15-5-4.
 */
//初始化
// transfer Window.localStorage to node context
global.storage = localStorage;
var fm = require('./libs/FileManager');
var api = require('./libs/NetEaseMusic');
var utils = require('./libs/Utils');
var PltM = require('./libs/PlaylistModel');
var EntryM = require('./libs/EntryModel');
var nav, account, radio, lrc, player, tray, settings, category;
var Event = (function () {
    var w = $(window);
    return {
        on: function (event, handler, _this) {
            w.on(event, function () {
                handler.apply(_this, [].slice.call(arguments, 1));
            });
        },
        once: function (event, handler, _this) {
            w.one(event, function () {
                handler.apply(_this, [].slice.call(arguments, 1));
            });
        },
        emit: function (event) {
            w.triggerHandler(event, [].slice.call(arguments, 1));
        }
    }
})();

var errorHandle = function (err) {
    if (!err) return;
    if (err.type)showNotify(err.msg);
    console.log(err.msg ? err.msg : err);
}

var showNotify = function (msg) {
    new Notification('网易音乐盒', {
        body: msg
    });
}

var createDOM = function (name, options, inner) {
    var dom = document.createElement(name);
    for (var key in options) {
        dom.setAttribute(key, options[key]);
    }
    if (!utils.isUndefinedorNull(inner))
        dom.innerText = inner;
    return dom;
}

var entry = {
    schema: {
        local: new EntryM({
            mode: 0,
            name: '本地',
            loader: function (callback) {
                fm.getLocal(callback);
            }
        }),
        user: new EntryM({
            mode: 3,
            name: '用户',
            loader: function (callback) {
                fm.getScheme(callback);
            },
            onadd: function (pltM) {
                fm.addScheme(pltM);
            },
            onremove: function (pltM) {
                fm.delScheme(pltM);
            }
        }),
        net: new EntryM({
            mode: 0,
            name: '云音乐',
            loader: function (callback) {
                api.getNet(callback);
            }
        })
    },
    //二进制表示权限，3->11，第0位表示是否保存，第1位表示是否允许修改
    getMode: function (type, w) {
        var mode = this.schema[type] ? this.schema[type].mode : 2;
        if (typeof w !== 'undefined') {
            return (1 << w) & mode;
        } else return mode;
    },
    getPrefix: function (type) {
        return this.schema[type] ? this.schema[type].name : '未知';
    }
};

window.onload = function () {
    nav = new Nav();
    account = new Account();
    radio = new Radio();
    lrc = new Lrc();
    player = new Player();
    tray = new Tray();
    settings = new Settings();
    category = new Category();
//加载用户信息
    account.loadUser();
//加载播放列表
    category.loadPlaylists(null, true);

//table屏蔽选中
    $('table').on('selectstart', function (e) {
        e.preventDefault();
    });
}


