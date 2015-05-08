/**
 * Created by kevin on 15-5-7.
 */
var Ao;//Audio对象
var player = {
    duration: -1,
    init: function (_Ao) {
        Ao = _Ao;
        this.duration = -1;
    },
    play: function () {
        Ao.play();
    },
    setSrc: function (src) {
        Ao.src = src;
    },
    getSrc: function () {
        return Ao.src;
    },
    getTime: function () {
        return Ao.currentTime;
    },
    getDuration:function(){
        return this.duration;
    },
    setTime: function (time) {
        Ao.currentTime = time;
    },
    pause: function () {
        Ao.pause();
    },
    setVolume: function (val) {
        console.log('adjust volume!');
        val = val || 0.2;
        Ao.volume = val;
    },
    getState: function (callback) {
        Ao.onended = function () {
            console.log('player ended!');
            callback('ended');

        }
        Ao.onplay = function () {
            callback('play');
            console.log('player play!');

        }
        Ao.onerror = function () {
            callback('error');
            console.log('player error!');

        }
        Ao.onpause = function () {
            callback('pause');
            console.log('player pause!');
        }
        Ao.onloadedmetadata = function () {
            player.duration = Ao.duration;
            callback('loaded');
            console.log('loadedmetadata!');
        }
    }
}

module.exports = player;