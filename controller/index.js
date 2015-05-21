/**
 * Created by kevin on 15-5-4.
 */
//初始化
var gui = require('nw.gui');
// Get the current window
var win = gui.Window.get();
var fm = require('./model/fileManager');
var NetEaseMusicAPI = require('./model/NetEaseMusicAPI');
var api = new NetEaseMusicAPI();
var utils = require('./model/utils');

var global = (function () {
    var w = $(window);
    return {
        on: function (event, handler, _this) {
            w.on(event, function () {
                handler.apply(_this, [].slice.call(arguments, 1));
            });
        },
        emit: function (event) {
            w.triggerHandler(event, [].slice.call(arguments, 1));
        }
    }
})();
win.setMinimumSize(510,60);
nav.init();
userinfo.init();
account.init();
progress.init();
controls.init();
settings.init();
category.init();
//获得登录信息
var userData = fm.getUserData();
if (userData) {
    var profile = userData.profile;
    account.setState(profile);
} else {
    account.setState();
}

//table屏蔽选中
$('table').on('selectstart', function (e) {
    e.preventDefault();
});

