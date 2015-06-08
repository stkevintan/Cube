var entry = {
    schema: {
        local: {
            mode: 0,
            name: '本地',
            loader: function (callback) {
                fm.getLocal(callback);
            }
        },
        user: {
            mode: 3,
            name: '用户',
            loader: function (callback) {
                fm.getScheme(callback);
            }
        },
        net: {
            mode: 0,
            name: '云音乐',
            loader: function (callback) {
                api.getNet(callback);
            }
        }
    },
    //二进制表示权限，3->11，第0位表示是否保存，第1位表示是否允许修改
    getMode: function (type, w) {
        var mode = this.schema[type] ? this.schema[type].mode : 2;
        if (typeof w !== 'undefined') {
            return (1 << w) & mode;
        } else return mode;
    },
    getPrefix: function (type) {
        return this.schema[type] ? this.schema[type].name : '未知';
    }
};