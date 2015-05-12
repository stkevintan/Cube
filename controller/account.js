/**
 * Created by kevin on 15-5-10.
 */
var account = {
    init: function () {
        this.self = {
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
        nav.setMenuState();
        category.self.refresh.trigger('click');
    },
    showlogin: function () {
        this.self.label.hide();
        this.self.login.modal('show');
    },
    loginErr: function (msg) {
        this.self.label.text(msg);
        this.self.label.show();
    },
    loginSuccess: function (data) {
        //设置用户头像
        userinfo.setState(data.nickname, data.avatarUrl);
        this.self.label.text('');
        nav.setMenuState(1);
        this.self.login.modal('hide');
    },
    listen: function () {
        var that = this;
        this.self.submit.click(function () {
            var phone = that.self.phone.val();
            var password = that.self.password.val();
            api.login(phone, password, function (err, data) {
                if (err) {
                    that.loginErr(err);
                } else {
                    that.loginSuccess(data);
                    category.getUserPlaylist();
                }
            });
        });
    }
}