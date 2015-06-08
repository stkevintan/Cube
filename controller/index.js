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
var SongM = require('./model/SongModel');
var Player = require('./model/player_backup');
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

var createDOM = function (name, options, inner) {
    var dom = document.createElement(name);
    for (var key in options) {
        dom.setAttribute(key, options[key]);
    }
    if (!utils.isUndefinedorNull(inner))
        dom.innerText = inner;
    return dom;
}

//nav.init();
//account.init();
//progress.init();
//controls.init();
//settings.init();
//category.init();
var nav = new Nav();
var account = new Account();
var progress = new Progress();
var controls = new Controls();
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


