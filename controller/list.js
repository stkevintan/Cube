/**
 * Created by kevin on 15-5-8.
 */
//播放列表行为

var T = $('.list table');
var list = {
    init: function (cid) {
        cid = cid || 0;
        this.self = $(T.children('tbody')[cid]);
        this.items = category.data[cid];
        this.data = [];
        this.name = category.name[cid];
        this.ID = -1;
        this.load();
        this.listen();
    },
    show: function () {
        this.self.fadeIn();
    },
    hide: function () {
        this.self.hide();
    },
    load: function () {
        this.self.empty();
        var data = this.items;
        for (var i = 0; i < data.length; i++) {
            this.addItem(data[i].title, data[i].artist, data[i].album, 1 + i);
        }
    },
    addItem: function (title, artist, album, index) {
        index = index || this.items.length;
        var str = '<tr>';
        str += '<td>' + index + '</td>';

        str += '<td>' + title + '</td>';

        str += '<td>' + (artist ? artist : '未知') + '</td>';

        str += '<td>' + (album ? album : '未知') + '</td>';

        str += '<td><span class="dropdown">'
            + '<a data-toggle="dropdown" href="javascript:0">'
            + '<span class="glyphicon glyphicon-plus"></span></a>'
            + '<ul class="dropdown-menu" role="menu">'
            + '</ul></span>'
            + '<a href="javascript:void(0);"><span class="glyphicon glyphicon-heart"></span></a>'
            + '<a href="javascript:void(0);"><span class="glyphicon glyphicon-trash"></span></a></td>';

        str += '</tr>';
        this.self.append(str);
        var that = this;
        var newo = this.self.children('tr:last-child');

        newo.dblclick(function () {//双击播放音乐
            var old = controls.playlist;
            if (old)old.setState(-1);
            var data = that.next(0, $(this).index());
            controls.play(data, 1);
        });

        newo.find('span.glyphicon-plus').click(function () {
            var menuStuff = '';
            var allName = category.name;
            var obj = newo.find('ul.dropdown-menu');
            for (var i = 0; i < allName.length; i++) {
                var cur = allName[i];
                if (cur != that.name && cur != '本地音乐') {
                    menuStuff += '<li role="presentation">'
                        + '<a role="menuitem" tabindex="-1" href="javascript:0">'
                        + cur
                        + '</a></li>';
                }
            }
            if (menuStuff == '') {
                obj.remove();
                return;
            }
            obj.html(menuStuff);

            obj.children('li').click(function () {
                var itName = $(this).text();
                var itID = category.name.indexOf(itName);
                var itList = category.getList(itID);
                if (itList != null) {
                    itList.items.push(that.items[index - 1]);
                    itList.addItem(title, artist, album);
                    category.setbadge();
                }
                console.log(itName);
            });
        });
    },
    setState: function (id) {
        //list
        if (id == this.ID)return;
        if (id >= this.items.length)return;
        var Tr = this.self.children('tr');
        var Trl = [];
        var content = [];
        if (id >= 0) {
            Trl = [Tr[id]];
            content = ['<span class="glyphicon glyphicon-play"></span>'];
        }
        if (this.ID >= 0) {
            Trl.push(Tr[this.ID]);
            content.push(this.ID + 1);
        }

        $(Trl).toggleClass('active');
        var Tdl = $(Trl).children("td:first-child");
        for (var i = 0; i < Tdl.length; i++) {
            $(Tdl[i]).html(content[i]);
        }
        this.ID = id;
    }
    ,
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
    }
}