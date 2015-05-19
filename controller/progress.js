/**
 * Created by kevin on 15-5-8.
 * @description define the progress's action
 *
 * @constructor progress.init
 *
 * @author Kevin Tan
 */
var progress = {
    init: function (start, duration) {
        this.$ = {
            progress: $('#progress'),
            totTime: $('#tot-time'),
            curTime: $('#cur-time'),
            title: $('h4.media-heading')
        };
        start = start || 0;
        duration = duration || 0;
        this.ID = null;
        this.setState(start, duration);
        this.listen(this);
        this.addGlobalEvent();
    },
    /**
     * setState([start,[duration],[title]]),set the state of progress.
     * if argument is empty, increase current time by 1.
     *
     * @param {number} [time] - current time now playing.
     * @param {number} [duration] - total time now playing.
     * @param {string} [title] - current music's title.
     */
    setState: function () {
        var start = 0, duration = 0;
        if (arguments.length == 0) {
            start = Number(this.$.progress.val()) + 1;
        } else {
            start = arguments[0];
        }
        if (arguments.length >= 2) {
            duration = arguments[1];
            this.$.progress.attr('max', duration);
            this.$.totTime.text(progress.format(duration));
        }
        if (arguments.length >= 3) {
            this.$.title.text(arguments[2]);
        }
        this.$.curTime.text(progress.format(start));
        this.$.progress.val(start);
    },
    /**
     * format 'val' (s) to 'mm:ss'
     *
     * @param {number} val - time (s)
     *
     * @return {string}
     */
    format: function (val) {
        var num = Math.ceil(val);
        var ss = num % 60;
        var mm = Math.floor(num / 60);
        var strs = (ss < 10 ? '0' : '') + ss;
        var strm = (mm < 10 ? '0' : '') + mm;
        return strm + ':' + strs;
    },
    addGlobalEvent: function () {
        global.on('progressMove', function () {
            if (this.ID) return;
            var that = this;
            this.ID = setInterval(function () {
                that.setState();
            }, 1000);
        }, this);
        global.on('progressHalt', function () {
            if (this.ID) {
                clearInterval(this.ID);
                this.ID = 0;
            }
        }, this);
    },
    listen: function () {
        var that = this;
        this.$.progress.on('click', function () {//滑块定位
            global.emit('playerPlay', 0, that.$.progress.val());
        });
    }
}