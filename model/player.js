/**
 * Created by kevin on 15-5-16.
 */
module.exports = function (howler) {
    var player = new howler({});
    var duration = -1;
    return {
        play: function () {
            player.play();
        },
        pause: function () {
            player.pause();
        },
        setSrc: function (src) {
            player.urls([src]);
        },
        getSrc: function () {
            return player.urls();
        },
        setVolume: function (v) {
            player.volume(v);
        },
        getTime: function () {
            return player.pos();
        },
        setTime: function (t) {
            player.pos(t);
        },
        getDuration: function () {
            return duration;
        },
        event: function (callback) {
            player.on('end', function () {
                console.log('player ended!');
                callback('ended');
            });
            player.on('play', function () {
                callback('play');
                console.log('player play!');
            });
            player.on('loaderror', function () {
                callback('error');
                console.log('player error!');
            });
            player.on('pause', function () {
                callback('pause');
                console.log('player pause!');
            });
            player.on('load', function () {
                duration = player._duration;
                callback('loaded');
            });
        }
    }
}