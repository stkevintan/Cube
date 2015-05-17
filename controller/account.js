/**
 * Created by kevin on 15-5-10.
 */
var account = {
    init: function () {
        this.$ = {
            login: $('#login'),
            submit: $('#login').find('button.submit'),
            label: $('#login').find('label'),
            phone: $('#login').find('input[name="phone"]'),
            password: $('#login').find('input[name="password"]')
        }
        this.listen();
    },
    unsign: function () {
        fm.setUserData(null);
        userinfo.setState();
        nav.setMenu();
        category.$.refresh.trigger('click');
    },
    showlogin: function () {
        this.$.label.hide();
        this.$.login.modal('show');
    },
    loginErr: function (msg) {
        this.$.label.text(msg);
        this.$.label.show();
    },
    loginSuccess: function (data) {

        this.$.label.text('');
        this.$.login.modal('hide');
        this.setState(data);
    },
    /**
     * Load User Profile from "data"
     *
     *@param {Object} data - include nickname && avatarUrl property
     */
    setState: function (data) {
        //设置用户头像
        var nickname = data.nickname;
        var avatarUrl = data.avatarUrl;
        userinfo.setState(nickname, avatarUrl);
        if (nickname) {
            nav.setMenu(1);
            category.getUserPlaylist();
        }
        else nav.setMenu(0);
    },
    listen: function () {
        var that = this;
        this.$.submit.click(function () {
            var phone = that.$.phone.val();
            var password = that.$.password.val();
            api.login(phone, password, function (err, data) {
                if (err) {
                    that.loginErr(err);
                } else {
                    that.loginSuccess(data);
                }
            });
        });
    }
}