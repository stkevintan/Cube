/**
 * Created by kevin on 15-5-8.
 */
//导航栏行为
var nav = {
    init: function () {
        this.ID = 0;
        this.self = {
            tabs: ['#main', '#settings', '#about'],
            search: '#search'
        };
        this.listen();
    },
    go: function (id) {
        id = id || 0;
        if (id == this.ID)return;
        var Old = this.self.tabs[this.ID];
        var New = this.self.tabs[id];
        $(Old).fadeOut(100, function () {
            $(New).fadeIn(100);
        });
        $([$(Old + '-nav'), $(New + '-nav')]).toggleClass('active');
        this.ID = id;
    },
    search: function () {
        var key = $(this.self.search).val();
        api.search(key, function (err, results) {
            if (err) {
                console.log(err);
                return;
            }
            console.log(results);
            var name = '"' + key + '"的搜索结果';
            var data = results;
            category.addItem(name, data, null, 1);
        })
    },
    MenuGo: function (index) {
        if (index == 0)login.showlogin();
    },
    listen: function () {
        var that = this;
        $(this.self.search).keydown(function (e) {
            if (e.which == 13) {
                e.preventDefault();
                that.search();
            }
        });
    }
}