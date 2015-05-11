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

nav.init();
userinfo.init();
login.init();
progress.init();
controls.init();
category.init(fm);
settings.init(fm);
var data = fm.getUserData();
if (data) {
    userinfo.setState(data.profile.nickname, data.profile.avatarUrl);
    category.getUserPlaylist();
}
$(document).on('selectstart', function (e) {//屏蔽选中
    e.preventDefault();
});
$('#dev').click(function () {
    win.showDevTools(0);
});

//save changes on close
win.on('close', function () {
    win.hide();
    console.log('save the config changes...');
    fm.SaveChanges(category.record, category.data, function (err) {
        if (err)console.log('save failed', err);
        else console.log('saved');
        win.close(true);
    });
});

