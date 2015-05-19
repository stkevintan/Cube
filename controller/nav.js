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
        this.listen(this);
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
    }
}