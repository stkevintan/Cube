/**
 * Created by kevin on 15-5-4.
 */
//初始化
var gui = require('nw.gui');
// Get the current window
var win = gui.Window.get();
var fm = require('./model/FileManager');
var api = require('./model/NetEaseMusic');
var utils = require('./model/Utils');
var PltM = require('./model/PlaylistModel');
var EntryM = require('./model/EntryModel');
//var lrcParser = require('./model/LrcParser');
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
var showNotify = function (msg) {
    var notification = new Notification('nw_musicbox', {
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

var nav = new Nav();
var account = new Account();
var lrc = new Lrc();
var player = new Player();
var settings = new Settings();
var category = new Category();

category.loadPlaylists(null, true);

//table屏蔽选中
$('table').on('selectstart', function (e) {
    e.preventDefault();
});

win.setMinimumSize(560, 60);

win.on('close', function () {
    win.hide();
    console.log('save the config changes...');
    fm.SaveChanges(function (err) {
        if (err)console.log('save failed', err);
        else console.log('saved');
        win.close(true);
    });
    //5s to save changes or close directly.
    setTimeout(function () {
        console.log('errors may be occurred , exit');
        win.close(true);
    }, 5000);
});


