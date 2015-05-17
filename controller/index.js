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

//定义开发者工具
$('#dev').click(function () {
    win.showDevTools(0);
});

//关闭程序时候保存修改
win.on('close', function () {
    win.hide();
    console.log('save the config changes...');
    fm.SaveChanges(category.record, category.data, function (err) {
        if (err)console.log('save failed', err);
        else console.log('saved');
        win.close(true);
    });
});

category.init();
nav.init();
userinfo.init();
account.init();
progress.init();
controls.init();

settings.init();


//获得登录信息
var userData = fm.getUserData().profile;
account.setState(userData);

//table屏蔽选中
$('table').on('selectstart', function (e) {
    e.preventDefault();
});

