/**
 * Define the action of the top navigation bar
 *
 * Created by kevin on 15-5-8.
 */
var nav = {
    init: function () {
        this.ID = 0;
        this.$ = {
            tabs: ['#main', '#settings', '#about'],
            search: '#search'
        };
        this.listen();
    },
    /**
     * Switch to "id"th tab
     *
     * @param id - the index of tab to switch
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
     * Search keywords from arguments or UI,add result to category
     */
    search: function () {
        var _key = [].join.call(arguments);
        var key = _key || $(this.$.search).val();
        api.search(key, function (err, results) {
            if (err) throw 'api returns an error:' + err;
            var name = '"' + key + '"的搜索结果';
            var data = results;
            category.addItem(name, data, null, 1);
        })
    },

    /**
     * Set menu state
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
     * Define the action after click a MenuItem
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
    listen: function () {
        var that = this;
        $(this.$.search).keydown(function (e) {
            if (e.which == 13) {
                e.preventDefault();
                that.search();
            }
        });
    }
}