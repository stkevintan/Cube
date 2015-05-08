/**
 * Created by kevin on 15-5-8.
 */
//播放进度条行为
var progress = {
    init: function (start, duration) {
        this.self = {
            progress: $('#progress'),
            totTime: $('#tot-time'),
            curTime: $('#cur-time'),
            title: $('h4.media-heading')
        };
        start = start || 0;
        duration = duration || 0;
        this.ID = null;
        this.setState(start, duration);
        this.listen();
    },
    setState: function () {
        /*
         setState([start,[duration],[title]])
         进度条目前时间：start,
         总时间：duration
         标题:title
         如果无参数，当前时间自增1个单位
         */
        var start = 0, duration = 0;
        if (arguments.length == 0) {
            start = Number(this.self.progress.val()) + 1;
        } else {
            start = arguments[0];
        }
        if (arguments.length >= 2) {
            duration = arguments[1];
            this.self.progress.attr('max', duration);
            this.self.totTime.text(progress.format(duration));
        }
        if (arguments.length >= 3) {
            this.self.title.text(arguments[2]);
        }
        this.self.curTime.text(progress.format(start));
        this.self.progress.val(start);
    },
    format: function (val) {
        var num = Math.ceil(val);
        var ss = num % 60;
        var mm = Math.floor(num / 60);
        var strs = (ss < 10 ? '0' : '') + ss;
        var strm = (mm < 10 ? '0' : '') + mm;
        return strm + ':' + strs;
    },
    move: function () {
        if (this.ID)return;
        var that = this;
        this.ID = setInterval(function () {
            that.setState();
        }, 1000);
    },
    halt: function () {
        if (this.ID) {
            clearInterval(this.ID);
            this.ID = 0;
        }
    },
    listen: function () {
        var that = this;
        this.self.progress.on('click', function () {//滑块定位
            controls.play(that.self.progress.val());
        });
    }
}