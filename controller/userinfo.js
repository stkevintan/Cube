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
            navSidebar: $('.nav-sidebar')
        }
        this.setState();
        this.listen(this);
        this.adjust();
    },
    adjust: function () {
        this.$.navSidebar.height($('.sidebar').height() - $('.userinfo').height() - $('.nav-plus').height());
    },
    setState: function (name, src) {
        this.name = name || "未登录";
        this.src = src || 'assets/img/avater.jpg';
        this.$.name.text(this.name);
        this.$.img.attr('src', this.src);
    },
    listen: function (that) {
        $(window).resize(function () {
            that.adjust();
        });
    }
}