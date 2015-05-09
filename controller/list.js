/**
 * Created by kevin on 15-5-8.
 */
//播放列表行为

var T = $('.list table');
var list = {
    init: function (cid) {
        cid = cid || 0;
        this.index = cid;
        this.self = $(T.children('tbody')[cid]);
        this.items = category.data[cid];
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
            this.addItem(data[i], i);
        }
    },
    addItem: function (data, id) {
        var flag = true;//是否被list.load调用
        if (typeof id !== 'number') {
            id = this.items.length;
            flag = false;
        }
        var str = '<tr>';
        str += '<td>' + (1 + id) + '</td>';

        str += '<td>' + data.title + '</td>';

        str += '<td>' + (data.artist ? data.artist : '未知') + '</td>';

        str += '<td>' + (data.album ? data.album : '未知') + '</td>';

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
        if (!flag) {
            //如果不是被list.load调用，那么需要将该data添加到list.items中
            this.items.push(data);
            //更新标记
            category.setbadge(this.index);
        }

        //双击播放音乐
        newo.dblclick(function () {
            //去掉之前播放列表的播放状态
            var old = controls.playlist;
            if (old && old != that)old.setState(-1);
            //获取要播放歌曲的数据
            var data = that.next(0, $(this).index());
            controls.play(data, 1);
        });
        //单击‘+’符号，添加到其他播放列表
        newo.find('span.glyphicon-plus').click(function () {
            //形成下拉列表
            var menuStuff = '';
            var allName = category.name;
            var dropdown = newo.find('ul.dropdown-menu');
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
                dropdown.remove();
                return;
            }
            dropdown.html(menuStuff);

            //绑定新生成的菜单项的单击行为
            dropdown.children('li').click(function () {

                //获得目标播放列表对象
                var itName = $(this).text();
                var itID = category.name.indexOf(itName);
                var itList = category.getList(itID);
                if (itList != null) {
                    //添加当前歌曲到指定播放列表
                    itList.addItem(data);
                }
                console.log(itName);
            });
        });

        //单击删除符号，删除该行
        newo.find('span.glyphicon-trash').click(function () {
            that.removeItem(newo.index());//不能用id
        });
    },
    removeItem: function (id) {
        if (this.name != '本地音乐') {
            if (id == this.ID) {
                this.ID = -1;
                controls.setState(null, -1);
            }
            if (this.ID > id)this.ID--;
            this.self.children('tr').eq(id).remove();

            //将之后的歌曲编号-1
            var mark = this.self.children('tr').slice(id).children('td:first-child');
            mark.text(mark.text() - 1);
            this.items.splice(id, 1);
            category.setbadge();
        }
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
    }
}