/**
 * @description define the login action.
 *
 * @author Kevin Tan
 *
 * @constructor account.init
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
        this.isLogin = false;
        this.listen(this);
    },
    unsign: function () {
        fm.setUserData(null);
        this.setState();
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
        category.loadPlts.net();
    },
    /**
     * @description set the User Profile by "data"
     *
     * @param {object} [data] - contains nickname && avatarUrl property
     */
    setState: function (data) {
        data = data || {};
        //设置用户头像
        var nickname = data.nickname;
        var avatarUrl = data.avatarUrl;
        userinfo.setState(nickname, avatarUrl);
        if (nickname) {
            this.isLogin = true;
            nav.setMenu(1);
        }
        else {
            this.isLogin = false;
            nav.setMenu(0);
        }
    },
    listen: function (that) {
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