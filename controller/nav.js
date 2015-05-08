/**
 * Created by kevin on 15-5-8.
 */
//导航栏行为
var T = $('.list table');
var nav = {
    ID: 0,
    items: ['#main', '#settings', '#about'],
    init: function () {
        this.listen();
    },
    go: function (id) {
        id = id || 0;
        if (id == this.ID)return;
        var Old = this.items[this.ID];
        var New = this.items[id];
        $(Old).fadeOut(100, function () {
            $(New).fadeIn(100);
        });
        $([$(Old + '-nav'), $(New + '-nav')]).toggleClass('active');
        this.ID = id;
    },
    search: function () {
        var key = $('#search').val();
        T.children('tr').each(function () {
            var word = $(this).children('td:eq(1)').text();
            if (word.indexOf(key) < 0) {
                $(this).hide();
            } else {
                $(this).show();
            }
        })
    },
    listen: function () {

    }
}