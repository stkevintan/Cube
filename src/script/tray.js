/**
 * Created by kevin on 15-7-26.
 */
var Tray = (function () {
// Get the current window
    var gui = require('nw.gui');
    var win = gui.Window.get();
    //icon source:http://www.easyicon.net/1185106-Cloud_Music_icon.html
    var tray = new gui.Tray({title: '网易音乐盒', icon: 'dist/assets/img/tray.png'});
    var menuItems = {
        playorPause: new gui.MenuItem({
            label: '播放/暂停',
            icon: 'dist/assets/img/play.png',
            click: function () {
                if (player.playing)player.pause();
                else player.play();
            }
        }),
        separator_1: new gui.MenuItem({
            type: 'separator'
        }),
        previous: new gui.MenuItem({
            label: '前一首',
            icon: 'dist/assets/img/previous.png',
            click: function () {
                player.playNext(-1);
            }
        }),
        next: new gui.MenuItem({
            label: '后一首',
            icon: 'dist/assets/img/next.png',
            click: function () {
                player.playNext(1);
            }
        }),
        separator_2: new gui.MenuItem({
            type: 'separator'
        }),
        exit: new gui.MenuItem({
            label: '退出',
            icon: 'dist/assets/img/close.png',
            click: function () {
                win.hide();
                tray.remove();
                fm.saveChanges();
                win.close(true);
            }
        })
    }

    function ret() {
        tray.tooltip = '网易音乐盒';
        var menu = new gui.Menu();
        for (var key in menuItems) {
            menu.append(menuItems[key]);
        }
        tray.menu = menu;
        win.setMinimumSize(560, 60);
        this.listen();
    }

    ret.prototype.listen = function () {
        win.on('close', function () {
            win.hide();
        });
        tray.on('click', function () {
            win.show();
            win.restore();
        });
    }
    return ret;

})();