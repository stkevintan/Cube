/**
 * Created by kevin on 15-5-10.
 */
var userinfo = {
    init: function () {
        this.name = "未登录";
        this.src = 'assets/img/avater.jpg';
        this.self = {
            img: $('.avater img'),
            name: $('.title h4')
        }
        this.setState();
    },
    setState: function (name, src) {
        this.name = name || this.name;
        this.src = src || this.src;
        this.self.name.text(name);
        this.self.img.attr('src', src);
    }
}