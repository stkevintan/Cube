/**
 * Created by kevin on 15-6-10.
 */
/**
 * Created by kevin on 15-5-8.
 * @description define the action of control bar
 *
 * @author Kevin Tan
 *
 * @constructor controls.init
 */

var Player = function () {
    this.$ = {
        play: $('#play'),
        pause: $('#pause'),
        order: $('#order span'),
        volPanel: $('#vol-icon'),
        volPop: $('#vol-pop'),
        volume: $('#volume'),
        songPic: $('#song-pic'),
        totTime: $('#tot-time'),
        curTime: $('#cur-time'),
        title: $('h4.media-heading')
    }
    //初始化播放器
    this.audio = new Audio();
    //初始化进度条
    this.progress = $('.media-body').find('input').slider({
        id: 'progress',
        value: 0,
        min: 0,
        max: 0,
        step: 1,
        formatter: this.timeFormartter
    });
    this.ID = 1;
    this.playlist = null;
    this.duration = -1;
    this.setOrder(this.ID);
    this.listen();
}
Player.prototype = {
    orderList: [{
        name: '单曲循环',
        value: 'repeat'
    }, {
        name: '列表循环',
        value: 'refresh'
    }, {
        name: '顺序播放',
        value: 'align-justify'
    }, {
        name: '随机播放',
        value: 'random'
    }],
    play: function (songM) {
        if (this.playlist && this.playlist.ID != -1) {
            this.$.play.hide();
            this.$.pause.show();
            songM && this.setMetaData(songM);
            this.audio.play();
        }
    },
    playNext: function (type) {
        type = type || this.ID;
        if (this.playlist && this.playlist.ID != -1) {
            var nextSong = this.playlist.next(type);
            if (nextSong) this.play(nextSong);
            else this.stop();
        }
    },
    pause: function () {
        this.$.play.show();
        this.$.pause.hide();
        this.audio.pause();
    },
    stop: function (msg) {
        msg = msg || '未选择歌曲';
        this.audio.pause();
        this.$.play.show();
        this.$.pause.hide();
        this.setDuration(0);
        this.setMetaData({
            title: msg,
            pic: ''
        });
    },
    /**
     * format 'val' (s) to 'mm:ss'
     *
     * @param {number} val - time (s)
     *
     * @return {string}
     */
    timeFormartter: function (val) {
        var num = Math.ceil(val);
        var ss = num % 60;
        var mm = Math.floor(num / 60);
        var strs = (ss < 10 ? '0' : '') + ss;
        var strm = (mm < 10 ? '0' : '') + mm;
        return strm + ':' + strs;
    },

    setMetaData: function (songM) {
        console.log(songM);
        //set Song's Metadata tags with songModel
        this.$.songPic.attr('src', songM.pic);
        this.$.title.text(songM.title);
        if (songM.src) {
            this.audio.src = songM.src;
        }
    },

    setCurrentTime: function (curTime) {
        if (curTime > this.duration) curTime = this.duration;
        this.$.curTime.text(this.timeFormartter(curTime));
        this.progress.slider('setValue', curTime);
    },

    setDuration: function (duration) {
        this.duration = duration;
        this.progress.slider('setAttribute', 'max', duration);
        this.$.totTime.text(this.timeFormartter(duration));
    },
    /**
     * set cur mode to the 'mode'th playMode:single-repeat->list-repeat->no-repeat->random
     *
     * @param {number} [mode] if no exists,set cur mode to the next mode;
     */
    setOrder: function (mode) {
        var len = this.orderList.length;
        if (utils.isNumber(mode)) {
            this.ID = (mode - 1 + len) % len;
        }
        this.ID = (this.ID + 1) % len;
        var tag = this.orderList[this.ID];
        this.$.order.attr('class', 'glyphicon glyphicon-' + tag.value);
        this.$.order.attr('title', tag.name);
    },
    /**
     * figure out the position of volume panel before display
     */
    volPanel: function () {
        var offs = this.$.volPanel.offset();
        this.$.volPop.css("top", (offs.top - 40) + 'px');
        this.$.volPop.css("left", (offs.left - 70) + 'px');
        //controls._volPop.offset({top: offs.top - 50, left: offs.left - 70});
        this.$.volPop.fadeIn(100);
        this.$.volume.focus();
    },
    listen: function () {
        var that = this;
        this.audio.onloadedmetadata = function () {
            console.log('audio loaded,duration:', this.duration);
            that.setDuration(this.duration);
        };
        this.audio.onerror = function () {
            console.log('audio loaded failed');
            var msg;
            switch (this.error.code) {
                case 1:
                    msg = '未选择歌曲';
                    break;
                case 2:
                    msg = '糟糕，网络貌似除了点问题';
                    break;
                case 3:
                    msg = '糟糕，缺少相应解码器';
                    break;
                case 4:
                    msg = '糟糕，文件或网络资源无法访问';
                    break;
                default:
                    msg = '未知错误，error code:' + this.error.code;
            }
            that.stop(msg);
        };
        var ondrag = false;
        this.audio.ontimeupdate = function () {
            if (!ondrag) that.setCurrentTime(this.currentTime);
        };
        this.audio.onended = function () {
            console.log('at the end');
            that.playNext();
        };
        this.progress.slider('on', 'slideStart', function () {
            ondrag = true;
        });
        this.progress.slider('on', 'slideStop', function () {
            var nowTime = that.progress.slider('getValue');
            that.audio.currentTime = nowTime;
            that.setCurrentTime(nowTime);
            ondrag = false;
        });
    }
}
