/**
 * Created by kevin on 15-5-8.
 * @description define playlist's action
 *
 * @author Kevin Tan
 *
 * @constructor playlist.init
 */
var playlist = {
    /**
     * @description init the playlist object
     *
     * @param {number} ts - timestamp of this playlist
     * @param {array} data - songs object array
     */
    init: function (ts, data) {
        this.ts = ts;
        this.$ = $(category.$.table.children('tbody#_' + ts)[0]);
        this.data = data;
        this.ID = -1;
        this.load();
    },
    show: function () {
        this.$.fadeIn();
    },
    hide: function () {
        this.$.hide();
    },
    /**
     * @description load songs of the playlist
     */
    load: function () {
        this.$.empty();
        for (var i = 0; i < this.data.length; i++) {
            this.addItem(this.data[i]);
        }
    },
    /**
     * @description add song object
     *
     * @param {object} dataItem - song object
     * @param {string} dataItem.title - song's title
     * @param {string} [dataItem.artist] - song's artist
     * @param {string} [dataItem.album] - song's album
     */
    addItem: function (dataItem) {
        var id = this.$.children('tr').length;
        var str = '<tr data-target="' + id + '">';
        str += '<td>' + (1 + id) + '</td>';
        str += '<td>' + dataItem.title + '</td>';
        str += '<td>' + (dataItem.artist ? dataItem.artist : '未知') + '</td>';
        str += '<td>' + (dataItem.album ? dataItem.album : '未知') + '</td>';
        str += '<td><span class="dropdown">'
        + '<a data-toggle="dropdown" href="javascript:0">'
        + '<span class="glyphicon glyphicon-plus"></span></a>'
        + '<ul class="dropdown-menu" role="menu">'
        + '</ul></span>'
        + '<a href="javascript:void(0);"><span class="glyphicon glyphicon-heart"></span></a>'
        + '<a href="javascript:void(0);"><span class="glyphicon glyphicon-trash"></span></a></td>';
        str += '</tr>';
        this.$.append(str);
        if (id >= this.data.length) {
            this.data.push(dataItem);
            //更新标记
            category.rfshBadge();
        }
        this.listen(this);

    },
    /**
     * @description remove "id"th song from the playlist
     *
     * @param {number} id
     *
     * @throw index out of range
     * @throw local file cannot remove
     */
    removeItem: function (id) {
        if (id < 0 || id > this.items.length)throw 'index out of range';
        if (!this.ts)throw 'local file cannot remove';

        if (id == this.ID) {
            this.ID = -1;
            controls.setState(null, -1);
        }
        if (this.ID > id)this.ID--;
        var Tr = this.$.children('tr');
        var realID = $.data(Tr.eq(id), 'target');
        Tr.eq(id).remove();
        //将之后的歌曲编号-1 ,注意不要覆盖正在播放那一项
        var mark = Tr.slice(id + 1);
        mark.each(function () {
            var o = $(this).children('td').first();
            var t = o.text();
            if (t)o.text(Number(t) - 1);
        });

        this.data[realID] = undefined;
        category.rfshBadge();
    },
    /**
     * @description switch current playing song to "id"th
     *
     * @param id
     *
     * @throw index out of range
     */
    setState: function (id) {
        //list
        if (id == this.ID)return;
        if (id >= this.data.length)throw 'index out of range';
        var Tr = this.$.children('tr');
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
    /**
     * @description get song's data next to play
     *
     * @param {number} type = 0 - return "id"th song's data
     * @param {number} type = 1 - return "id+1"th song's data (cycle)
     * @param {number} type = -1 - return "id-1"th song's data (cycle)
     * @param {number} type = 2 - return "id+1"th song's data (no cycle)
     * @param {number} type = 3 - return a random index song's data
     * @param {number} id
     *
     * @return {object|string} - song data or a msg of playlist state
     */
    next: function (type, id) {
        var len = this.data.length;
        switch (type) {
            case -1:
                id = (this.ID - 1 + len) % len;
                break;
            case 1:
                id = (this.ID + 1) % len;
                break;
            case 2:
                id = this.ID + 1;
                if (id == len)return 'End';
                break;
            case 3:
                id = Math.round(Math.random() * len);
                break;
        }
        this.setState(id);
        //获得真实的序号
        var $tr = this.$.children('tr').eq(id);
        var realID = $.data($tr, 'target');
        return this.data[realID];
    },

    listen: function (that) {
        var $tr = this.$.children('tr:last-child');
        //双击播放音乐
        $tr.dblclick(function () {
            //去掉之前播放列表的播放状态
            var old = controls.playlist;
            if (old && old != that)old.setState(-1);
            //获取要播放歌曲的数据
            var dataItem = that.next(0, $(this).index());
            //更新controls的playlist
            controls.playlist = that;
            controls.play(dataItem, 1);
        });
        //单击‘+’符号，添加到其他播放列表
        $tr.find('span.glyphicon-plus').click(function (e) {
            //形成下拉列表
            var menuStuff = '';
            var dropdown = $tr.find('ul.dropdown-menu');
            for (var i = 0; i < category.plts.length; i++) {
                var cur = category.plts[i];
                if (cur.ts && cur.ts != that.ts) {
                    menuStuff += '<li role="presentation">'
                    + '<a role="menuitem" tabindex="-1" href="javascript:0">'
                    + cur.name
                    + '</a></li>';
                }
            }
            if (menuStuff == '') {
                e.stopPropagation();
                return;
            }
            dropdown.html(menuStuff);
            //绑定新生成的菜单项的单击行为
            var it = $(this);
            dropdown.children('li').click(function () {
                //获得目标播放列表对象
                var itName = $(this).text();
                var itID = -1;
                category.$.container.find('li a').each(function (i) {
                    if ($(this).text() == itName) {
                        itID = i;
                    }
                });
                var itList = category.get$plt(itID);
                var realID = $.data(it, 'target');
                if (itList != null) {
                    //添加当前歌曲到指定播放列表
                    itList.addItem(that.data[realID]);
                }
            });
        });

        //单击删除符号，删除该行
        $tr.find('span.glyphicon-trash').click(function () {
            that.removeItem($tr.index());//不能用id
        });
    }
}