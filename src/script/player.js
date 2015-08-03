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
        backward: $('#backward'),
        volume: $('#volume'),
        volIcon: $('#vol-icon'),
        songPic: $('#song-pic'),
        totTime: $('#tot-time'),
        curTime: $('#cur-time'),
        title: $('h4.media-heading'),
        progress: $('.media-body input')
    }
    //初始化播放器
    this.audio = new Audio();
    //初始化进度条
    this.progress = this.$.progress.slider({
        id: 'progress',
        value: 0,
        min: 0,
        max: 0,
        step: 1,
        formatter: this.timeFormartter
    });
    this.playling = false;
    this.volume = this.$.volume.slider({
        value: 0.5,
        min: 0,
        max: 1,
        step: 0.01
    });
    this.ID = 1;
    this.stop();
    this.duration = -1;
    this.setOrder(this.ID);
    this.setVolume(0.5);
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
        if (this.playlist && this.playlist.ID != -1 || radio.state) {
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
        if (radio.state && type == 1) {
            radio.playNext();
        }
    },
    pause: function () {
        this.$.play.show();
        this.$.pause.hide();
        this.audio.pause();
    },
    stop: function (msg, noExit) {
        this.audio.pause();
        if (noExit) {
            this.audio.currentTime = 0;
            this.setCurrentTime(0);
        } else {
            msg = msg || '未选择歌曲';
            lrc.load({
                title: msg,
                album: '未知',
                artist: '未知'
            });
            if (this.playlist)
                this.playlist.setState(-1);
            this.playlist = null;
            this.$.play.show();
            this.$.pause.hide();
            this.setDuration(0);
            this.setHead(msg, '');
        }
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
//UI
    setHead: function (title, pic) {
        this.$.songPic.attr('src', pic);
        this.$.title.text(title);
    }
    ,
    setMetaData: function (songM) {
        //load lrc
        lrc.load(songM);
        this.setHead(songM.title, songM.pic);
        this.audio.src = songM.src;
        showNotify('现在播放：' + songM.title);
    },
//UI
    setCurrentTime: function (curTime) {
        if (curTime > this.duration) curTime = this.duration;
        this.$.curTime.text(this.timeFormartter(curTime));
        this.progress.slider('setValue', curTime);
    },
//UI
    setDuration: function (duration) {
        this.duration = duration;
        this.progress.slider('setAttribute', 'max', duration);
        this.$.totTime.text(this.timeFormartter(duration));
    },
    setVolume: function (val) {
        if (utils.isNumber(val) && val >= 0 && val <= 1) {
            this.volume.slider('setValue', val);
            this.audio.volume = val;
        }
    },
    toggleVolMute: function () {
        var state = this.volume.slider('isEnabled');
        if (state) {
            //mute
            this.audio.muted = true;
            this.volume.slider('disable');
            this.$.volIcon.attr('class', 'glyphicon glyphicon-volume-off');
        } else {
            //unmute
            this.audio.muted = false;
            this.volume.slider('enable');
            this.$.volIcon.attr('class', 'glyphicon glyphicon-volume-up');
        }
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
    listen: function () {
        var that = this;
        this.audio.onloadedmetadata = function () {
            that.setDuration(this.duration);
        };
        this.audio.onerror = function () {
            that.playing = false;
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
            lrc.seek(this.currentTime);
        };
        this.audio.onended = function () {
            that.playing = false;
            that.playNext();
        };
        this.audio.onpause = function () {
            that.playing = false;
        }
        this.audio.onplaying = function () {
            that.playing = true;
        }

        this.progress.slider('on', 'slideStart', function () {
            ondrag = true;
        });
        this.progress.slider('on', 'slideStop', function () {
            var nowTime = that.progress.slider('getValue');
            that.audio.currentTime = nowTime;
            that.setCurrentTime(nowTime);
            ondrag = false;
        });
        this.volume.slider('on', 'slide', function (val) {
            that.audio.volume = val
        });
        this.volume.slider('on', 'change', function (o) {
            if (o.oldValue != o.newValue) {
                that.audio.volume = o.newValue;
            }
        });
    }
}
