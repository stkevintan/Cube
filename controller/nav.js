/**
 * Created by kevin on 15-5-8.
 * @description define the action of the top navigation bar
 *
 * @author Kevin Tan
 *
 * @constructor nav.init
 *
 */
var nav = {
    init: function () {
        this.ID = 0;
        this.$ = {
            tabs: ['#main', '#settings', '#about'],
            search: '#search'
        };
        this.WinMode = {
            isSimp: 0,
            width: null,
            height: null
        }
        this.listen(this);
        this.addGlobalEvent();
    },
    /**
     * @description switch to "id"th tab
     *
     * @param {number} id - the index of tab to switch
     */
    setState: function (id) {
        id = id || 0;
        if (id == this.ID)return;
        var Old = this.$.tabs[this.ID];
        var New = this.$.tabs[id];
        $(Old).fadeOut(100, function () {
            $(New).fadeIn(100);
        });
        $([$(Old + '-nav'), $(New + '-nav')]).toggleClass('active');
        this.ID = id;
    },
    /**
     * @description search keywords from UI,add result playlist to category
     *
     * @throw search api returns an error
     */
    search: function () {
        var key = $(this.$.search).val();
        api.search(key, function (err, results) {
            if (err) throw 'search api returns an error:' + err;
            var name = '"' + key + '"的搜索结果';
            var data = results;
            category.addItem({
                name: name,
                data: data
            });
            category.setState();
        });
    },
    close: function () {
        win.hide();
        console.log('save the config changes...');
        fm.SaveChanges(category.recKey, category.plts, function (err) {
            if (err)console.log('save failed', err);
            else console.log('saved');
            win.close(true);
        });
    },
    minimize: function () {
        win.minimize();
    },
    maximize: function () {
        if (this.WinMode.isMaxi) {
            win.unmaximize();
        } else {
            win.maximize();
        }
        this.WinMode.isMaxi ^= 1;
    },
    //this is a bug of nw.js. temporary solution.
    simplize: function () {
        if (this.WinMode.isSimp) {
            win.setMaximumSize(10000, 10000);
            win.width = this.WinMode.width;
            win.resizeTo(this.WinMode.width, this.WinMode.height);
        } else {
            win.unmaximize();
            this.WinMode.width = win.width;
            this.WinMode.height = win.height;
            win.setMaximumSize(510, 60);
            win.width = 510;
            win.height = 60;
        }
        this.WinMode.isSimp ^= 1;
    },
    /**
     * @description set menu display state
     *
     * @param type  0 - unsigned, 1 - signed
     */
    setMenu: function (type) {
        if (type) {
            $('#menugo-0').hide();
            $('#menugo-1').show();
        } else {
            $('#menugo-1').hide();
            $('#menugo-0').show();
        }
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
        $('#dev').click(function () {
            win.showDevTools(0);
        });
        win.on('close', function () {
            win.hide();
            console.log('save the config changes...');
            fm.SaveChanges(category.recKey, category.plts, function (err) {
                if (err)console.log('save failed', err);
                else console.log('saved');
                win.close(true);
            });
        });
    },
    addGlobalEvent: function () {
    }
}