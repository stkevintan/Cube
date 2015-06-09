/**
 * Created by kevin on 15-5-8.
 * @description define the action of the top navigation bar
 *
 * @author Kevin Tan
 *
 * @constructor nav.init
 *
 */
var Nav = function () {
    this.ID = 0;
    var tabName = ['#main', '#settings', '#about'];
    this.$ = {
        tabBody: tabName.map(function (s) {
            return $(s);
        }),
        tabHead: tabName.map(function (s) {
            return $(s + '-nav');
        }),
        search: $('#search'),
        UserImg: $('#user-profile img'),
        UserTxt: $('#user-profile p'),
        MenuItem0: $('#menugo-0'),
        MenuItem1: $('#menugo-1')
    };
    this.listen(this);
}
Nav.prototype = {
    /**
     * @description switch to "id"th tab
     *
     * @param {number} id - the index of tab to switch
     */
    setState: function (id) {
        id = id || 0;
        if (id == this.ID)return;
        var that=this;
        this.$.tabBody[this.ID].fadeOut(100, function () {
            that.$.tabBody[id].fadeIn(100);
        });
        $([this.$.tabHead[this.ID], this.$.tabHead[id]]).toggleClass('active');
        this.ID = id;
    }
    ,
    /**
     * @description search keywords from UI,add result playlist to category
     *
     * @throw search api returns an error
     */
    search: function () {
        var key = this.$.search.val();
        api.search(key, function (err, results) {
            if (err) throw 'search api returns an error:' + err;
            var name = '"' + key + '"的搜索结果';
            var songList = results;
            category.addItem(new PltM({
                name: name,
                type: 'user',
                songList: songList
            }), true);
        });
    }
    ,
    close: function () {
        win.hide();
        console.log('save the config changes...');
        fm.SaveChanges(category.recKey, category.plts, function (err) {
            if (err)console.log('save failed', err);
            else console.log('saved');
            win.close(true);
        });
    }
    ,
    minimize: function () {
        win.minimize();
    }
    ,
    maximize: function () {
        if (this.WinMode.isMaxi) {
            win.unmaximize();
        } else {
            win.maximize();
        }
        this.WinMode.isMaxi ^= 1;
    }
    ,
    /**
     * @description set menu display state
     *
     * @param type  0 - unsigned, 1 - signed
     */
    setMenu: function (nickname, avatarUrl) {
        if (avatarUrl) {
            this.$.MenuItem0.hide();
            this.$.MenuItem1.show();
        } else {
            this.$.MenuItem1.hide();
            this.$.MenuItem0.show();
        }
        this.$.UserImg.attr('src', avatarUrl);
        this.$.UserTxt.text(nickname);
    },
    /**
     * @description define the action after click a MenuItem
     *
     * @param index - the index of the MenuItem
     */
    clickMenu: function (index) {
        if (index == 0) {
            account.showlogin();
        } else {
            account.unsign();
        }
    },
    /**
     * @description attach handler to events
     *
     * @param {object} that - the reference of the outer object
     */
    listen: function (that) {
        $(this.$.search).keydown(function (e) {
            if (e.which == 13) {
                e.preventDefault();
                that.search();
            }
        });

    }
}
