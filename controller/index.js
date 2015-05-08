/**
 * Created by kevin on 15-5-4.
 */
var T = $('.list table');
var S = $('ul.nav-sidebar');
var gui = require('nw.gui');
// Get the current window
var win = gui.Window.get();
var fileManager = require('./model/fileManager');
var player = require('./model/player');
var fm = new fileManager();
//侧栏歌单行为
var category = {
    init: function () {
        this.ID = -1;
        this.name = [];
        this.data = [];
        this.list = [];
        this.load();
        this.setState();
        this.listen();
    },
    setState: function (id) {
        id = id || 0;
        if (this.ID == id)return;
        if (id < 0 || id > this.name.length)return;
        var li = S.children('li');
        var lil = [li[id]];
        this.list[id].show();
        if (this.ID >= 0) {
            lil.push(li[this.ID]);
            this.list[this.ID].hide();
        }
        $(lil).toggleClass("active");
        this.ID = id;
    },
    setLabel: function () {
        var tot = 0;
        this.data.forEach(function (o) {
            tot += o.length;
        });
        $("#totsong").text("歌曲：" + tot);
        $("#totlist").text("播放列表：" + category.name.length);
    },
    getList: function (id) {
        id = id || this.ID;
        if (id < 0) id = 0;
        return this.list[id];
    },
    createList: function (id) {
        var o = list.init;
        o.prototype = list;
        return new o(id);
    },
    addItem: function () {
        S.empty();
        T.children('tbody').remove();
        for (var i = 0; i < this.name.length; i++) {
            var str = '<li><a href="javascript:void(0)">'
                + '<span class="name">' + this.name[i] + '</span>'
                + '<span class="badge">' + this.data[i].length + '</span>'
                + '<span class="clearfix"></span>'
                + '</a></li>';
            S.append(str);
            T.append('<tbody></tbody>');
            var o = this.createList(i);
            this.list.push(o);
        }
    },
    load: function () {
        this.name = fm.getSchemeNames();
        this.data = [];
        var o = fm.getScheme();
        for (var i = 0; i < this.name.length; i++) {
            this.data.push(o[this.name[i]]);
        }
        this.addItem();
        this.setLabel();
    },
    listen: function () {
        var that = this;
        S.children('li').on('click', function () {
            that.setState($(this).index());
        });
    }
}

//播放列表行为
var list = {
    init: function (cid) {
        cid = cid || 0;
        this.self = $(T.children('tbody')[cid]);
        this.items = category.data[cid];
        this.ID = -1;
        this.addItem();
        this.listen();
    },
    show: function () {
        this.self.fadeIn();
    },
    hide: function () {
        this.self.fadeOut();
    },
    addItem: function () {
        this.self.empty();
        var data = this.items;
        for (var i = 0; i < data.length; i++) {
            var str = '<tr>';
            str += '<td>' + (i + 1) + '</td>';
            str += '<td>' + data[i].title + '</td>';
            str += '<td>' + (data[i].artist ? data[i].artist : '未知') + '</td>';
            str += '<td>' + (data[i].album ? data[i].album : '未知') + '</td>';
            str += '<td><a href="javascript:void(0);"><span class="glyphicon glyphicon-heart"></span></a>';
            str += '<a href="javascript:void(0);"><span class="glyphicon glyphicon-trash"></span></a></td>';
            str += '</tr>';
            this.self.append(str);
        }
    },
    setState: function (id) {
        //list
        if (id == this.ID)return;
        if (id < 0 || id >= this.items.length)return;

        var Tr = this.self.children('tr');
        var Trl = [Tr[id]];
        var content = ['<span class="glyphicon glyphicon-play"></span>'];
        if (this.ID != -1) {
            Trl.push(Tr[this.ID]);
            content.push(this.ID + 1);
        }
        var Tdl = $(Trl).children("td:first-child");
        $(Trl).toggleClass('active');
        for (var i = 0; i < Tdl.length; i++) {
            $(Tdl[i]).html(content[i]);
        }
        this.ID = id;
    },
    next: function (type, id) {
        var len = this.items.length;
        switch (type) {
            case -1:
                id = (this.ID - 1 + len) % len;
                break;
            case 1:
                id = (this.ID + 1) % len;
                break;
            case 3:
                id = Math.round(Math.random() * len);
                break;
            case 2:
            {
                id = this.ID + 1;
                if (id == len) {
                    controls.stop();
                    return;
                }
            }
        }
        this.setState(id);
        return this.items[id];
    },
    listen: function () {
        var Tr = this.self.children('tr');
        var that = this;
        $(Tr).dblclick(function () {//双击播放音乐
            var data = that.next(0, $(this).index());
            controls.play(data, 1);
        });
        Tr.on('selectstart', function (e) {//屏蔽选中
            e.preventDefault();
        });
    }
}
//播放进度条行为
var progress = {
    init: function (start, duration) {
        this.self = $('#progress');
        start = start || 0;
        duration = duration || 0;
        this.ID = null;
        this.setState(start, duration);
        this.listen();
    },
    setState: function () {
        /*
         setState([start,[duration]])
         进度条目前时间：start,
         总时间：duration
         如果无参数，当前时间自增1个单位
         */
        // console.log(arguments, arguments.length);
        var start = 0, duration = 0;
        if (arguments.length == 0) {
            start = Number(this.self.val()) + 1;
        } else {
            start = arguments[0];
        }
        if (arguments.length >= 2) {
            duration = arguments[1];
            this.self.attr('max', duration);
            $('#tot-time').text(progress.format(duration));
        }
        $('#cur-time').text(progress.format(start));
        this.self.val(start);
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
        var that = this;
        this.ID = !this.ID && setInterval(function () {
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
        this.self.on('click', function () {//滑块定位
            controls.play(that.self.val());
        });
    }
}

//播放栏行为
var controls = {
    orderList: ['repeat', 'refresh', 'align-justify', 'random'],
    init: function () {
        //初始化播放器
        this.self = {
            play: $('#play'),
            pause: $('#pause'),
            order: $('#order span'),
            volIcon: $('#vol-icon'),
            volPop: $('#vol-pop')
        }
        this.ID = 0;
        this.playlist = null;
        player.init(document.getElementsByTagName('audio')[0]);
        this.setState(null, -1);
        this.listen();
    },
    play: function () {
        this.playlist = category.getList();
        if (this.playlist.ID != -1) {
            this.self.play.hide();
            this.self.pause.show();
            if (arguments.length)
                this.setState.apply(this, arguments);
            player.play();
        }
    },
    pause: function () {
        this.self.play.show();
        this.self.pause.hide();
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
            var icon = this.orderList[controls.ID];
            this.self.order.attr('class', 'glyphicon glyphicon-' + icon);
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
            console.log(_data);
            this.setState(_data, 1);
        }
        else if (type == 1) {
            player.setSrc(data.src);
            // change audio title
            $('h4.media-heading').text(data.title);
        } else if (type == 0) {
            progress.setState(data);
            player.setTime(data);
        } else {
            this.stop();
            $('h4.media-heading').text('未选择歌曲');
            $('#tot-time').text(progress.format(0));
            $('#cur-time').text(progress.format(0));
        }
    },
    volIcon: function () {
        var offs = controls._volIcon.offset();
        this.self.volPop.css("top", (offs.top - 40) + 'px');
        this.self.volPop.css("left", (offs.left - 70) + 'px');
        //controls._volPop.offset({top: offs.top - 50, left: offs.left - 70});
        this.self.volPop.fadeIn(100);
        $('#volume').focus();
    },
    listen: function () {
        var that = this;
        $('#volume').on('focusout', function () {
            that.self.volPop.fadeOut(200);
        });
        $(window).resize(function () {
            if (that.self.volPop.css('display') == 'block') {
                that.self.volPop.fadeOut(200);
            }
        });
        $('#volume').on('change', function () {
            player.setVolume($('#volume').val());
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
                    that.stop();
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

//导航栏行为
var nav = {
    ID: 0,
    items: ['#main', '#settings', '#about'],
    init: function () {
        this.listen();
    },
    go: function (id) {
        id = id || 0;
        if (id == nav.ID)return;
        var Old = nav.items[nav.ID];
        var New = nav.items[id];
        $(Old).fadeOut(100, function () {
            $(New).fadeIn(100);
        });
        $([$(Old + '-nav'), $(New + '-nav')]).toggleClass('active');
        nav.ID = id;
    },
    search: function () {
        var key = $('#search').val();
        T.children('tr').each(function () {
            var word = $(this).children('td:eq(1)').text();

            if (word.indexOf(key) < 0) {
                $(this).hide();
            } else {
                $(this).show();
            }
        })
    },
    listen: function () {
        $('#refresh').click(function () {
            var $btn = $(this).button('loading');
            fm.loadMusicDir(function () {
                category.init();
                controls.setState(null, -1);
                $btn.button('reset');
            });
        });
    }
}

//设置页面行为
var settings = {
    init: function () {
        $('#music-dir').val(fm.getMusicDir());
        settings.listen();
    },
    listen: function () {
        $('button#openDialog').click(function () {
            $('#fileDialog').trigger('click');
        });
        $('#fileDialog').change(function () {
            var newDir = $(this).val();
            console.log('newDir', newDir);
            if (fm.setMusicDir(newDir)) {
                $('#music-dir').val(newDir);
                $('#refresh').trigger('click');
            }
        });
    }
}

//初始化
$(function () {
    progress.init();
    controls.init();
    settings.init();
    nav.init();
    fm.loadMusicDir(function () {
        category.init();
    });

    //save changes on close
    win.on('close', function () {
        win.hide();
        console.log('save the config changes...');
        fm.SaveChanges(function (err) {
            if (err)console.log('save failed', err);
            else console.log('saved');
            win.close(true);
        });
    });
});



