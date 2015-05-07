/**
 * Created by kevin on 15-5-4.
 */
var P = $('#progress');
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
    ID: -1,
    name: [],
    data: [],
    list: [],
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
        console.log(id, this.list);
        if (id < 0) id = 0;
        return this.list[id];
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
            var o = new list(i);
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
        S.children('li').on('click', function () {
            category.setState($(this).index());
        });
    }
}

//播放列表行为
function list(cid) {
    cid = cid || 0;
    this.self = $(T.children('tbody')[cid]);
    this.items = category.data[cid];
    this.ID = -1;
    this.addItem();
    this.listen();
    console.log(this.items);
}
list.prototype.show = function () {
    this.self.fadeIn();
}
list.prototype.hide = function () {
    this.self.fadeOut();
}
list.prototype.addItem = function () {
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
}

list.prototype.setState = function (id) {
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
}

list.prototype.next = function (type, id) {
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
}

list.prototype.listen = function () {
    var Tr = this.self.children('tr');
    $(Tr).dblclick(function () {//双击播放音乐
        var nowList = category.getList();
        var data = nowList.next(0, $(this).index());
        controls.play(data, 1);
    });
    Tr.on('selectstart', function (e) {//屏蔽选中
        e.preventDefault();
    });
}
//var list = {
//    ID: -1,
//    items: [],
//    Ob: null,
//    init: function (cid, id) {
//        this.Ob = T[cid];//得到当前列表对象
//        this.Ob.empty();
//        list.items = category.data[category.ID];
//        var len = list.items.length;
//        for (var i = 0; i < len; i++) {
//            list.addItem($.extend({id: i + 1}, list.items[i]));
//        }
//        list.listen();
//        //set id-th songs as default
//        if (typeof id === 'number') {
//            list.setState(id);
//            player.setState(list.items[id].src, 1);
//        } else {
//            list.ID = -1;
//        }
//    },
//    addItem: function (song) {
//        var str = '<tr>';
//        str += '<td>' + song.id + '</td>';
//        str += '<td>' + song.title + '</td>';
//        str += '<td>' + (song.artist ? song.artist : '未知') + '</td>';
//        str += '<td>' + (song.album ? song.album : '未知') + '</td>';
//        str += '<td><a href="javascript:void(0);"><span class="glyphicon glyphicon-heart"></span></a>';
//        str += '<a href="javascript:void(0);"><span class="glyphicon glyphicon-trash"></span></a></td>';
//        str += '</tr>';
//        this.Ob.append(str);
//    },
//    setState: function (cid, id) {
//        //list
//        if (id == list.ID)return;
//        if (id < 0 || id >= list.items.length)return;
//
//        var Tr = this.obj.children('tr');
//        var Trl = [Tr[id]];
//        var content = ['<span class="glyphicon glyphicon-play"></span>'];
//        if (list.ID != -1) {
//            Trl.push(Tr[list.ID]);
//            content.push(list.ID + 1);
//        }
//        var Tdl = $(Trl).children("td:first-child");
//        $(Trl).toggleClass('active');
//        for (var i = 0; i < Tdl.length; i++) {
//            $(Tdl[i]).html(content[i]);
//        }
//        list.ID = id;
//        // change audio title
//        $('h4.media-heading').text(list.items[id].title);
//    },
//    next: function (type, id) {
//        var len = list.items.length;
//        switch (type) {
//            case -1:
//                id = (list.ID - 1 + len) % len;
//                break;
//            case 1:
//                id = (list.ID + 1) % len;
//                break;
//            case 3:
//                id = Math.round(Math.random() * len);
//                break;
//            case 2:
//            {
//                id = list.ID + 1;
//                if (id == len) {
//                    controls.stop();
//                    return;
//                }
//            }
//        }
//        list.setState(id);
//        controls.play(list.items[id].src, 1);
//    },
//    listen: function () {
//        var Tr = this.Ob.children('tr');
//        Tr.dblclick(function () {//双击播放音乐
//            list.next(0, $(this).ID());
//        });
//        Tr.on('selectstart', function (e) {//屏蔽选中
//            e.preventDefault();
//        });
//    }
//}

//播放进度条行为
var progress = {
    ID: 0,
    init: function (start, duration) {
        start = start || 0;
        duration = duration || 0;
        progress.setState(start, duration);
        progress.listen();
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
            start = Number(P.val()) + 1;
        } else {
            start = arguments[0];
        }
        if (arguments.length >= 2) {
            duration = arguments[1];
            P.attr('max', duration);
            $('#tot-time').text(progress.format(duration));
        }
        $('#cur-time').text(progress.format(start));
        P.val(start);
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
        if (progress.ID)return;
        progress.ID = setInterval(function () {
            progress.setState();
        }, 1000);
    },
    halt: function () {
        if (progress.ID) {
            clearInterval(this.ID);
            progress.ID = 0;
        }
    },
    listen: function () {
        P.on('change', function () {//滑块定位
            controls.play(P.val());
        });
    }
}

//播放栏行为
var controls = {
    _play: $('#play'),
    _pause: $('#pause'),
    _order: $('#order span'),
    _volIcon: $('#vol-icon'),
    _volPop: $('#vol-pop'),
    orderList: ['repeat', 'refresh', 'align-justify', 'random'],
    ID: 0,
    playlist: null,
    init: function () {
        //初始化播放器
        this.ID = 0;
        player.init(document.getElementsByTagName('audio')[0]);
        this.setState(null, -1);
        controls.listen();
    },
    play: function () {
        this.playlist = category.getList();
        if (this.playlist.ID != -1) {
            controls._play.hide();
            controls._pause.show();
            if (arguments.length)
                controls.setState.apply(this, arguments);

            player.play();
        }
    },
    pause: function () {
        controls._play.show();
        controls._pause.hide();
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
        var len = controls.orderList.length;
        if (typeof mode === 'undefined') {
            controls.ID = (controls.ID + 1) % len;
            var icon = controls.orderList[controls.ID];
            controls._order.attr('class', 'glyphicon glyphicon-' + icon);
        } else {
            controls.ID = (mode - 1 + len) % len;
            controls.order();
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
            controls.setState(_data, 1);
        }
        else if (type == 1) {
            player.setSrc(data.src);
            // change audio title
            $('h4.media-heading').text(data.title);
        } else if (type == 0) {
            progress.setState(data);
            player.setTime(data);
        } else {
            $('h4.media-heading').text('未选择歌曲');
            $('#tot-time').text(progress.format(0));
            $('#cur-time').text(progress.format(0));
        }
    },
    volIcon: function () {
        var offs = controls._volIcon.offset();
        controls._volPop.css("top", (offs.top - 40) + 'px');
        controls._volPop.css("left", (offs.left - 70) + 'px');
        //controls._volPop.offset({top: offs.top - 50, left: offs.left - 70});
        controls._volPop.fadeIn(100);
        $('#volume').focus();
    },
    listen: function () {
        $('#volume').on('focusout', function () {
            controls._volPop.fadeOut(200);
        });
        $(window).resize(function () {
            if (controls._volPop.css('display') == 'block') {
                controls._volPop.fadeOut(200);
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
                    if (controls.ID) {
                        controls.play(controls.ID, 2);
                    } else {
                        controls.play(0);
                    }
                    break;
                }
                case 'play':
                {
                    progress.move();
                    break;
                }
                case 'error':
                {
                    controls.stop();
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
                controls.stop();
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



