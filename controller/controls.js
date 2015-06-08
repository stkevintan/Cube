/**
 * Created by kevin on 15-5-8.
 * @description define the action of control bar
 *
 * @author Kevin Tan
 *
 * @constructor controls.init
 */
state = 1;
var Player = require('./model/player_backup');
var controls = {
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
    init: function () {
        //初始化播放器
        this.player = Player;
        Player.init($('audio')[0]);
        this.$ = {
            play: $('#play'),
            pause: $('#pause'),
            order: $('#order span'),
            volPanel: $('#vol-icon'),
            volPop: $('#vol-pop'),
            volume: $('#volume'),
            songPic: $('#song-pic')
        }
        this.WinMode = {
            isSimp: 0,
            width: null,
            height: null
        }
        this.ID = 1;
        this.order(this.ID);
        this.playlist = null;
        this.setState(-1);
        this.listen(this);
        this.addEvents();
    },
    addEvents: function () {
        Event.on('playerPlay', function () {
            if (this.playlist == null || this.playlist.ID == -1) {
                //如果当前列表没有选中
                return;
            }

            if (arguments.length)
                this.setState.apply(this, arguments);
            this.$.play.hide();
            this.$.pause.show();
            this.player.play();
        }, this);
        Event.on('playerPause', function () {
            this.$.play.show();
            this.$.pause.hide();
            this.player.pause();
        }, this);
        Event.on('playerStop', function () {
            Event.emit('playerPause');
            this.setState(0, 0);
        }, this);
        Event.on('playerExit', function (msg) {
            Event.emit('playerStop');
            this.setState(-1, msg);
            this.playlist = null;
        }, this);
    },
    openSide: function () {
        var list = $('.list');
        var side = category.$.sidebar;
        //if (!state) {
        //    list.animate({
        //        width: '75%'
        //    }, 400);
        //} else {
        //    list.animate({
        //        width: '100%'
        //    }, 400);
        //}
        //state ^= 1;
        if (state) {
            list.animate({
                'padding-left': '0px'
            }, 600);
            side.animate({
                right: '100%'
            }, 600)
        } else {
            side.animate({
                right: '75%'
            }, 600);
            list.animate({
                'padding-left': '25%'
            }, 600);
        }
        state ^= 1;

    },
    /**
     * play next music on the playlist
     */
    forward: function () {
        Event.emit('playerPlay', 2, 1);
    },
    /**
     * play pre music on the playlist
     */
    backward: function () {
        Event.emit('playerPlay', 2, -1);
    },
    /**
     * set cur mode to the 'mode'th playMode:single-repeat->list-repeat->no-repeat->random
     *
     * @param {number} [mode] if no exists,set cur mode to the next mode;
     */
    order: function (mode) {
        var len = this.orderList.length;
        if (!utils.isNumber(mode)) {
            this.ID = (this.ID + 1) % len;
            var tag = this.orderList[this.ID];
            this.$.order.attr('class', 'glyphicon glyphicon-' + tag.value);
            this.$.order.attr('title', tag.name);
        } else {
            this.ID = (mode - 1 + len) % len;
            this.order();
        }
    },
    /**
     * change the play state and control progress
     *
     * @param {number} type - type of operation,
     * 0:play current music at 'data' second,
     * 1:play song in 'data',
     * 2:play song in "playlist.next('data')".
     * @param {number|object} [data]
     */
    setState: function (type, data) {
        switch (type) {
            case 0:
                progress.setState(data);
                this.player.setTime(data);
                break;
            case 1:
                progress.setState(0, 0, data.title);
                this.player.setSrc(data.src);
                if (data.pic) {
                    this.$.songPic.attr('src', data.pic);
                } else {
                    this.$.songPic.attr('src', 'assets/img/Ever%20Eternity.jpg');
                }
                break;
            case 2:
                var _data = this.playlist.next(data);
                this.setState(1, _data);
                break;
            default:
                Event.emit('playerStop');
                data = data || "未选择歌曲";
                this.$.songPic.attr('src', 'assets/img/Ever%20Eternity.jpg');
                progress.setState(0, 0, data);
        }
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
    /**
     * toggle Window between normal size and mini size
     * this is a bug of nw.js. temporary solution.
     * @param {boolean} [flag=false] - if true,force to normal size,vice verse.
     */
    toggleWindow: function (flag) {
        if (flag || this.WinMode.isSimp) {
            win.resizeTo(this.WinMode.width, this.WinMode.height);
        } else {
            win.unmaximize();
            this.WinMode.width = win.width;
            this.WinMode.height = win.height;
            win.resizeTo(560, 60);
        }
        this.WinMode.isSimp ^= 1;
    },
    listen: function (that) {
        this.$.volume.on('focusout', function () {
            that.$.volPop.fadeOut(200);
        });
        $(window).resize(function () {
            if (that.$.volPop.css('display') == 'block') {
                that.$.volPop.fadeOut(200);
            }
        });
        this.$.volume.on('change', function () {
            that.player.setVolume($(this).val());
        });

        this.player.event(function (msg) {
            switch (msg) {
                case 'ended':
                    Event.emit('progressHalt');
                    Event.emit('playerPlay', that.ID ? 2 : 0, that.ID);
                    break;
                case 'play':
                    Event.emit('progressMove');
                    break;
                case 'error':
                    Event.emit('playerExit', '糟糕，该文件路径失效了！');
                    break;
                case 'pause':
                    Event.emit('progressHalt');
                    break;
                default:
                    //音频元数据加载完成，初始化progress
                    progress.setState(that.player.getTime(), that.player.getDuration());
            }
        });
    }
}
