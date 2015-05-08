/**
 * Created by kevin on 15-5-4.
 */
//初始化
(function () {
    var gui = require('nw.gui');
    // Get the current window
    var win = gui.Window.get();
    //
    var fileManager = require('./model/fileManager');

    var fm = new fileManager();

    nav.init();
    progress.init();
    controls.init();
    category.init(fm);
    settings.init(fm);
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
        fm.SaveChanges(function (err) {
            if (err)console.log('save failed', err);
            else console.log('saved');
            win.close(true);
        });
    });

})();
