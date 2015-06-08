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
            launcher: $('#launcher'),
            login: $('#login'),
            submit: $('#login').find('button.submit'),
            label: $('#login').find('label'),
            phone: $('#login').find('input[name="phone"]'),
            password: $('#login').find('input[name="password"]')
        }
        this.isLogin = false;
        this.listen(this);
        this.load();
    },
    load: function () {
        //获得登录信息
        var userData = fm.getUserData();
        if (userData) {
            var profile = userData.profile;
            this.setState(profile);
        } else {
            this.setState();
        }
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
        category.loadEntry({
            net: true
        });
    },
    setAssessable: function (f) {
        if (f) {
            this.$.launcher.removeClass('disabled');
        } else {
            this.$.launcher.addClass('disabled');
        }
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
            var $btn = $(this).button('loading');
            var phone = that.$.phone.val();
            var password = that.$.password.val();
            api.login(phone, password, function (err, data) {
                if (err) {
                    that.loginErr(err);
                } else {
                    that.loginSuccess(data);
                }
            });
            $btn.button('reset');
        });
        this.$.phone.keydown(function (e) {
            if (e.which == 13) {
                that.$.password.focus();
            }
        });
        this.$.password.keydown(function (e) {
            if (e.which == 13) {
                that.$.submit.trigger('click');
            }
        })
    }
}