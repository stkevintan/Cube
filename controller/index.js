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

var sources = {
    local: function (callback) {
        fm.getLocal(callback);
    },
    user: function (callback) {
        fm.getScheme(callback);
    },
    net: function (callback) {
        api.getNet(callback);
    }
}
nav.init();
userinfo.init();
account.init();
progress.init();
controls.init();
settings.init();
category.init();
//table屏蔽选中
$('table').on('selectstart', function (e) {
    e.preventDefault();
});
win.setMinimumSize(510, 60);

