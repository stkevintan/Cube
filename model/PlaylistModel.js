/**
 * Created by kevin on 15-6-4.
 */
//用两位二进制表示每种播放列表的权限，3->11，第一位表示是否允许用户删除，第二位表示是否记住该列表。
var entry = {
    local: {
        mode: 1,
        name: '本地'
    },
    user: {
        mode: 3,
        name: '用户'
    },
    net: {
        mode: 2,
        name: '云音乐'
    }
}
verifyType = function (type) {
    return type in entry;
}
var model = function (raw) {
    this.timestamp = raw.timestamp;
    this.name = raw.name;
    this.type = raw.type;
    this.songList = raw.songList;
}
model.prototype.getMode = function (w) {
    var mode = verifyType(this.type) ? entry[this.type].mode : 2;
    return (1 << w) & mode;
}
model.prototype.getPrefix = function () {
    return verifyType(this.type) ? entry[this.type].name : '未知';
}
module.exports = model;