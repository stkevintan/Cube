var Model = require('./Model');
var __ = require('./Utils');
var localMusic = require('./LocalMusic');
var netEaseMusic = require('./NetEaseMusic');
var userMusic = require('./UserMusic');
//id - SrcM object
module.exports = {
    local: new Model.source({
        type: 0,
        name: '本地',
        loader: localMusic.get
    }),
    user: new Model.source({
        type: 1,
        name: '用户',
        loader: userMusic.get
    }),
    net: new Model.source({
        type: 0,
        name: '云音乐',
        loader: netEaseMusic.get
    })
}
