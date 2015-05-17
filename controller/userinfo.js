/**
 * Created by kevin on 15-5-10.
 */
var userinfo = {
    init: function () {
        this.name = "未登录";
        this.src = 'assets/img/avater.jpg';
        this.$ = {
            img: $('.avater img'),
            name: $('.title h4'),
            sidebar: $('.sidebar')
        }
        this.setState();this.$.sidebar.height($('.userinfo').height() - $('.user-head').height() - $('.nav-plus').height());
        this.listen();
    },
    setState: function (name, src) {
        this.name = name || "未登录";
        this.src = src || 'assets/img/avater.jpg';
        this.$.name.text( this.name);
        this.$.img.attr('src', this.src);
    },
    listen: function () {
        var that = this;
        $(window).resize(function () {
           that.$.sidebar.height($('.userinfo').height() - $('.user-head').height() - $('.nav-plus').height());
        })
    }

}