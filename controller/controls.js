/**
 * Created by kevin on 15-5-8.
 */
//播放栏行为
var player = require('./model/player');
var controls = {
    orderList: ['repeat', 'refresh', 'align-justify', 'random'],
    init: function () {
        //初始化播放器
        this.$ = {
            play: $('#play'),
            pause: $('#pause'),
            order: $('#order span'),
            volIcon: $('#vol-icon'),
            volPop: $('#vol-pop'),
            volume: $('#volume'),
            songPic: $('#song-pic')
        }
        this.ID = 0;
        this.playlist = null;
        player.init(document.getElementsByTagName('audio')[0]);
        this.setState(null, -1);
        this.listen();
    },
    play: function () {
        if (this.playlist == null || this.playlist.ID == -1) {
            //如果当前列表没有选中
            return;
        }
        this.$.play.hide();
        this.$.pause.show();
        if (arguments.length)
            this.setState.apply(this, arguments);
        player.play();
    },
    pause: function () {
        this.$.play.show();
        this.$.pause.hide();
        player.pause();
    },
    stop: function () {
        this.pause();
        this.setState(0);
    },
    forward: function () {
        this.play(1, 2);
    },
    backward: function () {
        this.play(-1, 2);
    },
    order: function (mode) {
        var len = this.orderList.length;
        if (typeof mode === 'undefined') {
            this.ID = (this.ID + 1) % len;
            var icon = this.orderList[this.ID];
            this.$.order.attr('class', 'glyphicon glyphicon-' + icon);
        } else {
            this.ID = (mode - 1 + len) % len;
            this.order();
        }
    },
    setState: function (data, type) {
        /*
         改变播放状态，同时协调progress
         setState(start|data,[type])
         type: -1-未选择歌曲，0-切换播放时间(默认)，1-切换播放源
         type == 2 时,data
         取-1:切换列表上一曲
         取1:切换列表下一曲(循环)
         取2:切换列表下一曲(不循环)
         取3:切换随机下一曲

         start:播放时间
         src:播放源
         */
        type = type || 0;
        if (type == 2) {
            var _data = this.playlist.next(data);
            this.setState(_data, 1);
        }
        else if (type == 1) {
            progress.setState(0, 0, data.title);
            player.setSrc(data.src);
            if (data.pic) {
                this.$.songPic.attr('src', data.pic);
            } else {
                this.$.songPic.attr('src', 'assets/img/Ever%20Eternity.jpg');
            }
        } else if (type == 0) {
            progress.setState(data);
            player.setTime(data);
        } else {
            this.stop();
            data = data || "未选择歌曲";
            this.$.songPic.attr('src', 'assets/img/Ever%20Eternity.jpg');
            progress.setState(0, 0, data);
        }
    },
    volIcon: function () {
        var offs = this.$.volIcon.offset();
        this.$.volPop.css("top", (offs.top - 40) + 'px');
        this.$.volPop.css("left", (offs.left - 70) + 'px');
        //controls._volPop.offset({top: offs.top - 50, left: offs.left - 70});
        this.$.volPop.fadeIn(100);
        this.$.volume.focus();
    },
    listen: function () {
        var that = this;
        this.$.volume.on('focusout', function () {
            that.$.volPop.fadeOut(200);
        });
        $(window).resize(function () {
            if (that.$.volPop.css('display') == 'block') {
                that.$.volPop.fadeOut(200);
            }
        });
        this.$.volume.on('change', function () {
            player.setVolume($(this).val());
        });

        player.getState(function (msg) {
            switch (msg) {
                case 'ended':
                {
                    progress.halt();
                    that.play(that.ID, that.ID ? 2 : 0);
                    break;
                }
                case 'play':
                {
                    progress.move();
                    break;
                }
                case 'error':
                {
                    that.setState('糟糕，该文件路径失效了！', -1);
                    break;
                }
                case 'pause':
                {
                    progress.halt();
                    break;
                }
                default:
                {
                    //音频元数据加载完成，初始化progress
                    progress.setState(player.getTime(), player.getDuration());
                }
            }

        });
    }
}
