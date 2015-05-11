/**
 * Created by kevin on 15-5-10.
 */
var login = {
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
        this.self.login.modal('hide');
    },
    listen: function () {
        var that = this;
        this.self.submit.click(function () {
            var phone = that.self.phone.val();
            var password = that.self.password.val();
            api.phoneLogin(phone, password, function (err, data) {
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