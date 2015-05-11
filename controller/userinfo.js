/**
 * Created by kevin on 15-5-10.
 */
var userinfo = {
    init: function () {
        this.name = "未登录";
        this.src = 'assets/img/avater.jpg';
        this.self = {
            img: $('.avater img'),
            name: $('.title h4'),
            sidebar: $('.sidebar')
        }
        this.setState();
        this.self.sidebar.height($('.userinfo').height() - $('.user-head').height() - $('.nav-plus').height());
        this.listen();
    },
    setState: function (name, src) {
        this.name = name || this.name;
        this.src = src || this.src;
        this.self.name.text(name);
        this.self.img.attr('src', src);
    },
    listen: function () {
        var that = this;
        $(window).resize(function () {
            that.self.sidebar.height($('.userinfo').height() - $('.user-head').height() - $('.nav-plus').height());
        })
    }

}