var Model = require('./Model');
var Storage = require('./Storage');
var st = new Storage();
var um = {};

function pack(entryList) {
    if (!entryList) return null;
    return entryList.map(function(entry) {
        var ret = new Model.entry(entry);
        for (var i = 0; i < ret.songList.length; i++)
            ret.songList[i] = new Model.song(ret.songList[i]);
        return ret;
    });
}

um.get = function(cb) {
    process.nextTick(function() {
        var entryList = pack(st.get('scheme')) || [new Model.entry({
            name: '正在播放',
            creator: process.env.USER
        })];
        cb(null, entryList);
    });
};
module.exports = um;
