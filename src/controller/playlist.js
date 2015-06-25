/**
 * Created by kevin on 15-5-8.
 * @description define playlist's action
 *
 * @author Kevin Tan
 *
 * @constructor playlist.init
 */
var Playlist = function (frame, index) {
    this.$ = {
        frame: $(frame),
        tr: function () {
            return this.frame.find('tr');
        }
    };
    this.index = index;
    this.timestamp = category.plts[index].timestamp;
    this.songList = category.plts[index].songList;
    this.canDel = entry.getMode(category.plts[index].type, 1);
    this.domCache = [];
    this.ID = -1;
    this.length = 0;
    this.load();
    this.listen();
}

Playlist.prototype = {
    show: function () {
        var table = category.$.table;
        if (table.css('display') == 'none') {
            this.$.frame.show();
            table.fadeIn();
        } else {
            this.$.frame.fadeIn();
        }
    },
    hide: function () {
        this.$.frame.hide();
    },
    /**
     * @description load songs of the playlist
     */
    load: function () {
        this.$.frame.empty();
        for (var i = 0; i < this.songList.length; i++) {
            this.addItem(this.songList[i]);
        }
        this.addtoDOM();
    },
    /**
     * @description add song object
     *
     * @param {object} songModel - song object
     * @param {string} songModel.title - song's title
     * @param {string} [songModel.artist] - song's artist
     * @param {string} [songModel.album] - song's album
     * @param {boolean} [instant] - insert to dom instantly without cache
     */
    addItem: function (songModel, instant) {
        var id = this.length;
        var tr = createDOM('tr');
        tr.appendChild(createDOM('td', null, 1 + id));
        tr.appendChild(createDOM('td', null, songModel.title));
        tr.appendChild(createDOM('td', null, songModel.album));
        tr.appendChild(createDOM('td', null, songModel.artist));

        var td = createDOM('td', null);
        var span = createDOM('span', {class: 'dropdown'});

        var aPlus = createDOM('a', {'data-toggle': 'dropdown', href: 'javascript:0'});
        aPlus.appendChild(createDOM('span', {class: 'glyphicon glyphicon-plus'}));
        span.appendChild(aPlus);
        span.appendChild(createDOM('ul', {class: 'dropdown-menu', role: 'menu'}));

        td.appendChild(span);
        var aHeart = createDOM('a', {href: 'javascript:0'});
        aHeart.appendChild(createDOM('span', {class: 'glyphicon glyphicon-heart'}));
        td.appendChild(aHeart);

        if (this.canDel) {//check permission
            var aTrash = createDOM('a', {href: 'javascript:0'});
            aTrash.appendChild(createDOM('span', {class: 'glyphicon glyphicon-trash'}));
            td.appendChild(aTrash);
        }
        tr.appendChild(td);

        this.domCache.push(tr);
        if (instant)this.addtoDOM();
        this.length++;
        if (id >= this.songList.length) {
            this.songList.push(songModel);
            //更新标记
            Event.emit('rfshBadge');
        }
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
        if (id < 0 || id > this.length)throw 'index out of range';
        if (!this.canDel)throw 'insufficient permission to remove';
        if (id == this.ID) {
            this.ID = -1;
            player.stop();
        }
        if (this.ID > id) this.ID--;
        var Tr = this.$.tr();
        Tr.eq(id).remove();
        //将之后的歌曲编号-1 ,注意不要覆盖正在播放那一项
        var mark = Tr.slice(id + 1);
        mark.each(function () {
            var o = $(this).children('td').first();
            var t = o.text();
            if (t)o.text(Number(t) - 1);
        });
        this.songList.splice(id, 1);
        this.length--;
        Event.emit('rfshBadge');

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
        id = id || 0;
        if (id == this.ID)return;
        if (id >= this.length)throw 'index out of range';
        var Tr = this.$.tr();
        var Trl = [];
        var content = [];
        if (id >= 0) {
            Trl = [Tr[id]];
            content = ['<span class="glyphicon glyphicon-music"></span>'];
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
        switch (type) {
            case -1:
                id = (this.ID - 1 + this.length) % this.length;
                break;
            case 1:
                id = (this.ID + 1) % this.length;
                break;
            case 2:
                id = this.ID + 1;
                if (id == this.length) {
                    return;
                }
                break;
            case 3:
                id = Math.round(Math.random() * this.length);
                break;
            default:
                if (!utils.isNumber(id))id = this.ID;
        }
        this.setState(id);
        return this.songList[id];
    },
    addtoDOM: function () {
        if (this.domCache.length == 0)return;
        //this.$.frame.append(this.domCache);
        var $frame = this.$.frame;
        this.domCache.forEach(function (o) {
            $frame.append(o);
        });
        this.domCache = [];//flush
    },
    create$DropDownMenus: function () {
        //形成下拉列表
        var menuDOM = [];
        for (var i = 0; i < category.plts.length; i++) {
            var cur = category.plts[i];
            if (cur.timestamp != this.timestamp && entry.getMode(cur.type, 1)) {
                var li = createDOM('li', {role: "presentation", "data-target": cur.timestamp});
                var a = createDOM('a', {role: "menuitem", tabindex: -1, href: "javascript:0"}, cur.name);
                li.appendChild(a);
                menuDOM.push(li);
            }
        }
        return menuDOM;
    },
    listen: function () {
        var that = this;
        this.$.frame.on('dblclick', 'tr', function () {
            //去掉之前播放列表的播放状态
            var old = player.playlist;
            if (old && old != that)old.setState(-1);
            //close radio
            radio.close();
            //获取要播放歌曲的数据
            var songModel = that.next(0, $(this).index());
            player.playlist = that;
            player.play(songModel);
        });
        this.$.frame.on('click', 'span.glyphicon-plus', function (e) {
            var menuDOM = that.create$DropDownMenus();
            if (menuDOM.length == 0) e.stopPropagation();
            else $(this).closest('tr').find('.dropdown-menu').html(menuDOM);
        });
        this.$.frame.on('dblclick', 'span.glyphicon-plus', function (e) {
            //to avoid trigger
            e.stopPropagation();
        });
        this.$.frame.on('click', '.dropdown-menu li', function () {
            var index = $(this).closest('tr').index();
            var ts = $(this).data('target');
            category.$plts[ts].addItem(that.songList[index], true);
        });
        this.$.frame.on('click', '.glyphicon-trash', function () {
            that.removeItem($(this).closest('tr').index());//不能用id
        });
    }
}