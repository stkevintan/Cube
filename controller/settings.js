/**
 * Created by kevin on 15-5-8.
 */
//设置页面行为
var settings = {
    init: function (fm) {
        this.fm = fm;
        this.self = {
            musicDir: $('#music-dir'),
            dialog: $('#dialog'),
            btnOpen: $('button#openDialog'),
            searchLimit: $('#search-limit')
        };
        console.log('dialog', this.self.dialog);
        this.self.searchLimit.val(fm.getSearchLimit());
        this.self.musicDir.val(fm.getMusicDir());
        this.listen();
    },
    listen: function () {
        var that = this;
        this.self.btnOpen.click(function () {
            that.self.dialog.trigger('click');
        });

        this.self.dialog.change(function () {
            var newDir = $(this).val();
            console.log('newDir', newDir);
            if (that.fm.setMusicDir(newDir)) {
                that.self.musicDir.val(newDir);
                category.self.refresh.trigger('click');
            }
        });
        this.self.searchLimit.change(function () {
            var limit = $(this).val();
            limit = limit.trim();
            //判断limit是否是数字
            console.log('limit', limit);
            var regex = /^[1-9]\d*$/;
            if (regex.test(limit)) {
                $(this).parent().removeClass('has-error');
                that.fm.setSearchLimit(Number(limit) || 0);
            } else {
                $(this).parent().addClass('has-error');
                return;
            }

        });

    }
}