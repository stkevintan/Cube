/**
 * Created by kevin on 15-5-4.
 */
var A = $('audio');
var Ao = A[0];
var P = $('#progress');
var T = $('.list table tbody');
var gui = require('nw.gui');
// Get the current window
var win = gui.Window.get();
var fm = require('./libs/fileManager')(win);
console.log(fm);
var sCatalog = {
    ID: 0,
    info: null,
    init: function () {
        sCatalog.listen();
    },
    setState: function (info, id) {
        info = info || [];
        sCatalog.info = [info];
        sCatalog.ID = id || 0;
        sCatalog.setSum();
        sList.load();
    },
    setSum: function (num) {
        num = num || sCatalog.info[sCatalog.ID].length;
        var _ = $('.nav-sidebar span.badge');
        $(_[sCatalog.ID]).text(num);
        $("#totsong").text("歌曲："+num);
    },
    listen: function () {
        $('#refresh').click(function () {
            var $btn = $(this).button('loading')
            fm.getFiles(function (err, results) {
                sCatalog.setState(results);
                $btn.button('reset');
            });
        });
    }
}

var sList = {
    ID: -1,
    items: [],
    init: function () {
        //sList.listen();
    },
    load: function (id) {
        T.empty();
        sList.items = sCatalog.info[sCatalog.ID];
        var len = sList.items.length;
        for (var i = 0; i < len; i++) {
            sList.addItem($.extend({id: i + 1}, sList.items[i]));
        }
        sList.listen();
        //set id-th songs as default
        if (typeof id === 'number') {
            sList.setState(id);
            player.setState(sList.items[id].src, 1);
        }
    },
    addItem: function (song) {
        var str = '<tr>';
        str += '<td>' + song.id + '</td>';
        str += '<td>' + song.title + '</td>';
        str += '<td>' + (song.artist ? song.artist : '未知') + '</td>';
        str += '<td>' + (song.album ? song.album : '未知') + '</td>';
        str += '<td><a href="javascript:void(0);"><span class="glyphicon glyphicon-heart"></span></a>';
        str += '<a href="javascript:void(0);"><span class="glyphicon glyphicon-trash"></span></a></td>';
        str += '</tr>';
        T.append(str);
    },
    setState: function (id) {
        //list
        if (id == sList.ID)return;
        if (id < 0 || id >= sList.items.length)return;

        var Tr = T.children('tr');
        var Trl = [Tr[id]];
        var content = ['<span class="glyphicon glyphicon-play"></span>'];
        if (sList.ID != -1) {
            Trl.push(Tr[sList.ID]);
            content.push(sList.ID + 1);
        }
        var Tdl = $(Trl).children("td:first-child");
        $(Trl).toggleClass('active');
        for (var i = 0; i < Tdl.length; i++) {
            $(Tdl[i]).html(content[i]);
        }
        sList.ID = id;
        // change audio title
        $('h4.media-heading').text(sList.items[id].title);
    },
    next: function (type, id) {
        var len = sList.items.length;
        switch (type) {
            case -1:
                id = (sList.ID - 1 + len) % len;
                break;
            case 1:
                id = (sList.ID + 1) % len;
                break;
            case 3:
                id = Math.round(Math.random() * len);
                break;
            case 2:
            {
                id = sList.ID + 1;
                if (id == len) {
                    controls.stop();
                    return;
                }
            }
        }
        sList.setState(id);
        controls.play(sList.items[id].src, 1);
    },
    listen: function () {
        var Tr = T.children('tr');
        Tr.dblclick(function () {//双击播放音乐
            sList.next(0, $(this).ID());
        });
        Tr.on('selectstart', function (e) {//屏蔽选中
            e.preventDefault();
        });
    }
}

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

var player = {
    init: function () {
        //Ao.src = sCatalog.info[sList.ID][0].src;
        this.listen();
    },
    play: function () {
        arguments.length &&
        player.setState.apply(null, arguments);
        Ao.play();
    },
    forward: function () {
        sList.next(1);
    },
    backward: function () {
        sList.next(-1);
    },
    setState: function (data, type) {
        /*
         改变播放状态，同时协调progress
         setState(start|src,[type])
         type: 0-切换播放时间(默认)，1-切换播放源
         start:播放时间
         src:播放源
         */
        if (type) {
            Ao.src = data;
        } else {
            progress.setState(data);
            Ao.currentTime = data;
        }
    },
    pause: function () {
        Ao.pause();
    },
    volume: function (val) {
        console.log('adjust volume!');
        val = val || 0.2;
        Ao.volume = val;
    },
    listen: function () {
        A.on('ended', function () {
            console.log('player ended!');
            progress.halt();
            switch (controls.ID) {
                case 0:
                    controls.play(0);
                    break;//单曲循环
                case 1:
                    sList.next(1);
                    break;//列表循环
                case 2:
                    sList.next(2);
                    break;//顺序播放
                default:
                {
                    sList.next(3);
                    //随机播放
                }
            }
        });
        A.on('play', function () {
            console.log('player play!');
            progress.move();
        });
        A.on('error', function () {
            console.log('player error!');
            controls.stop();
        })
        A.on('pause', function () {
            console.log('player pause!');
            progress.halt();
        });
        A.on('loadedmetadata', function () {
            console.log('loadedmetadata!');
            //音频元数据加载完成，初始化progress
            progress.setState(Ao.currentTime, Ao.duration);
        })
    }
}

var controls = {
    _play: $('#play'),
    _pause: $('#pause'),
    _order: $('#order span'),
    _volIcon: $('#vol-icon'),
    _volPop: $('#vol-pop'),
    orderList: ['repeat', 'refresh', 'align-justify', 'random'],
    ID: 0,
    init: function () {
        $('#vol-popover').popover();
        controls.listen();
    },
    backward: function () {
        player.backward();
    },
    play: function () {
        if (sList.ID < 0)return;
        controls._play.hide();
        controls._pause.show();
        player.play.apply(null, arguments);
    },
    pause: function () {
        controls._play.show();
        controls._pause.hide();
        player.pause();
    },
    stop: function () {
        controls.pause();
        player.setState(0);
    },
    forward: function () {
        player.forward();
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
            player.volume($('#volume').val());
        });
    }
}

var nav = {
    ID: 0,
    items: ['#main', '#settings', '#about'],
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
    search:function(){
        var key=$('#search').val();
        T.children('tr').each(function(){
            var word=$(this).children('td:eq(1)').text();

            if(word.indexOf(key)<0){
                console.log(word);
                $(this).hide();
            }else{
                $(this).show();
            }
        })
    }
}
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
$(function () {
    player.init();
    progress.init();
    controls.init();
    sCatalog.init();
    settings.init();
    $('#refresh').trigger('click');
});



