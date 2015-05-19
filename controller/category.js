/**
 * Created by kevin on 15-5-8.
 * @constructor category.init
 *
 * @author Kevin Tan
 *
 * @description define the action of nav-sidebar and nav-plus
 */
var category = {
    init: function () {
        this.$ = {
            uls: $('ul.nav-sidebar'),
            lis: function () {
                return this.uls.children('li');
            },
            totSong: $("#totsong"),
            totlist: $("#totlist"),
            refresh: $('#refresh'),
            addlist: $('#addlist'),
            table: $('.list table')
        }
        this.length = 0;
        this.listen(this);
        this.addGlobalEvent();
        this.$.refresh.trigger('click');
    },
    loadPlts: {
        /**
         * @description load local playlists
         *
         * @param {Array} value - data of playlists
         */
        local: function (value) {
            category.ID = -1;
            category.$plts = {};
            //通过时间戳排序
            category.plts = value.sort(function (a, b) {
                return a.timestamp < b.timestamp;
            });
            category.recKey = [];//关闭时要保存的播放列表
            category.$.uls.empty();
            category.$.table.children('tbody').remove();
            for (var i = 0; i < category.plts.length; i++) {
                category.addItem(category.plts[i]);
            }
        },
        /**
         * @description load NetEase Account's playlist of User after login
         *
         * @throw load net playlist error
         * @throw user current not login
         */
        net: function () {
            if (!account.isLogin) throw 'user current not login';
            api.userPlaylist(function (err, raw) {
                if (err) throw 'load net playlist error:' + err;
                for (var i = 0; i < raw.length; i++) {
                    var o = raw[i];
                    api.playlistDetail(o.name, o.id, function (err, res) {
                        if (err)throw err;
                        category.addItem({
                            name: res.name,
                            data: res.data
                        }, true);
                    });
                }
            });
        }
    },
    /**
     * @description create view of the playlist
     *
     * @param {number} timestamp - timestamp of the playlist
     * @param {array} data - songs object array of the playlist
     *
     * @return {object} playlist.init
     */
    create$plt: function (timestamp, data) {
        var o = playlist.init;
        o.prototype = playlist;
        return new o(timestamp, data);
    },
    /**
     * @description add playlist
     *
     * @param {object} stuff - content of the playlist
     * @param {number} [stuff.timestamp] - timestamp of the playlist
     * @param {string} stuff.name - name of the playlist
     * @param {array} stuff.data - songs array of the playlist
     * @param {boolean} [isTemp=false]
     */
    addItem: function (stuff, isTemp) {
        //change view (html)
        var ts = stuff.timestamp;
        if (typeof ts === 'undefined') {
            //没有时间戳
            ts = stuff.timestamp = (new Date()).getTime();
            this.plts.push(stuff);
        }
        var str = '<li data-target="' + ts + '">'
            + '<a href="javascript:void(0)">'
            + '<div class="name">' + stuff.name + '</div>'
            + '<div class="limark">'
            + (ts ? '<span class="glyphicon glyphicon-trash"></span>' : '')
            + '<span class="badge">' + stuff.data.length + '</span>'
            + '</div></a></li>';
        this.$.uls.append(str);
        this.$.table.append('<tbody style="display:none" id="_'+ts+'"></tbody>');
        this.length++;
        //bind event
        (function (that) {
            var $lis = that.$.lis().last();
            $lis.click(function () {
                that.setState($(this).index());
            });
            $lis.find('span.glyphicon-trash').click(function () {
                that.removeItem($(this).index());
            });
        })(this);

        //record this item to save
        if (!isTemp && ts) {
            this.recKey.push(ts);
        }
        var $o = this.create$plt(ts, stuff.data);
        this.$plts[ts] = $o;
        global.emit('rfshLabel');
    },
    /**
     * @description switch to last or "id"th playlist.
     *
     * @param {number} [id=lastIndex] - the index of playlist to switch,
     *
     * @throw index out of range
     */
    setState: function (id) {
        if (!utils.isNumber(id)) {
            id = this.length - 1;
        }
        if (id < 0 || id >= this.length)throw 'index out of range';
        var $lis = this.$.lis();
        if (this.ID == id) return;
        if (this.ID >= 0) {
            var old$li = $lis.eq(this.ID);
            old$li.removeClass('active');
            this.$plts[old$li.data('target')].hide();
        }
        var new$li = $lis.eq(id);
        new$li.addClass('active');
        console.log(this.$plts[new$li.data('target')]);
        this.$plts[new$li.data('target')].show();
        this.ID = id;
    },
    /**
     * @description get playlist object by id
     *
     * @param {number} [id=category.ID] - index of the playlist in category
     *
     * @return {object} playlist object
     *
     * @throw index out of range
     */
    get$plt: function (id) {
        if (!utils.isNumber(id))id = this.ID;
        if (id < 0 || id >= this.length)throw 'index out of range';
        var $li = this.$.lis();
        var target = $li.eq(id).data('target');
        return this.$plts[target];
    },
    /**
     * @description remove playlist by id.
     *
     * @param {number} id - index of the playlist in category
     *
     * @throw index out of range
     */
    removeItem: function (id) {
        if (id < 0 || id >= this.length)throw 'index out of range';
        var $lis = this.$.lis();
        $lis.eq(id).remove();
        var now$plt = this.get$plt(id);
        now$plt.$.body.remove();
        if (now$plt == controls.playlist) {
            global.emit('playerExit');
        }
        var index = utils.binarySearch(this.recKey, now$plt.ts);
        if (index != -1) {
            this.recKey.splice(index, 1);
        }
        index = utils.binarySearch(this.plts, now$plt.ts, function (o) {
            return o.timestamp;
        });
        if (index != -1) {
            this.plts.splice(index, 1);
        }
        delete now$plt;
        this.length--;
        if (id == this.ID) {
            this.ID = -1;
            this.setState(0);
        } else if (id < this.ID) {
            this.ID--;
        }
    },
    listen: function (that) {
        this.$.refresh.click(function () {
            var $span = $('#refresh');
            var origin = $span.text();
            $span.text(origin + '加载中...');
            fm.loadMusicDir(function () {
                category.loadPlts.local(fm.getScheme());
                that.setState(0);
                account.isLogin && category.loadPlts.net();
                global.emit('playerExit');
                $span.text(origin);
            });
        });

        var model = $('#inputListName');
        var input = $('#inputListName input');
        var submit = $('#submit-name');
        this.$.addlist.click(function () {
            model.find('label').hide();
            model.removeClass('has-error');
            model.modal('show');
        });

        submit.click(function () {
            var val = input.val();
            val = val.trim();
            var flag = true;
            if (val == '')flag = false;
            else flag = that.$.uls.text().indexOf(val) == -1 ? false : true;
            if (flag) {
                //添加列表
                that.addItem({
                    name: val,
                    data: []
                });
                model.modal('hide');
            } else {
                model.find('label').fadeIn();
                model.addClass('has-error');
            }
        });
        input.keydown(function (e) {
            if (e.which == 13) {
                e.preventDefault();
                submit.trigger('click');
            }
        });
    },
    addGlobalEvent: function () {
        global.on('rfshLabel', function () {
            /**
             * @description refresh the Labels on userInfo
             */
            this.$.totSong.text("本地歌曲：" + this.plts[0].data.length);
            this.$.totlist.text("歌单：" + this.plts.length);
        }, this);
        global.on('rfshBadge', function (id) {
            /**
             * @description refresh "id"th or all badge's number.
             *
             * @param {number} [id=-1] - the index of badge to refresh
             */
            id = id || -1;
            var badge = this.$.uls.find('.badge');
            if (id >= 0 && id < this.plts.length) {
                badge.eq(id).text(this.plts[id].data.length);
            } else {
                for (var i = 0; i < this.data.length; i++) {
                    var o = this.data[i];
                    $(badge[i]).text(o.length);
                }
            }
        }, this);
    }
}