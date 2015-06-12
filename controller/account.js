/**
 * @description define the login action.
 *
 * @author Kevin Tan
 *
 * @constructor account.init
 */
var Account = function () {
    this.$ = {
        userProfile: $('#user-profile'),
        login: $('#login'),
        submit: $('#login').find('button.submit'),
        label: $('#login').find('label'),
        phone: $('#login').find('input[name="phone"]'),
        password: $('#login').find('input[name="password"]')
    }
    this.isLogin = false;
    this.listen(this);
    this.load();
}

Account.prototype = {
    load: function () {
        //获得登录信息
        var userData = fm.getUserData();
        if (userData) {
            this.setUserProfile(userData.profile);
        } else {
            this.setUserProfile();
        }
    },
    unsign: function () {
        fm.setUserData(null);
        this.setUserProfile();
        category.loadPlaylists({'net': true});
    },
    showlogin: function () {
        this.$.label.hide();
        this.$.login.modal('show');
        this.$.phone.focus();
    },
    loginErr: function (msg) {
        this.$.label.text(msg);
        this.$.label.show();
    },
    loginSuccess: function (profile) {
        this.$.label.text('');
        this.$.login.modal('hide');
        this.setUserProfile(profile);
        category.loadPlaylists({net: true});
    },
    /**
     */
    setUserProfile: function (profile) {
        profile = profile || {nickname: '未登录', avatarUrl: ''};
        nav.setMenu(profile.nickname, profile.avatarUrl);
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