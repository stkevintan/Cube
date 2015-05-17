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
            container: $('ul.nav-sidebar'),
            totSong: $("#totsong"),
            totlist: $("#totlist"),
            refresh: $('#refresh'),
            addlist: $('#addlist'),
            table: $('.list table')
        }
        this.listen(this);
        this.$.refresh.trigger('click');
    },
    loadPlts: {
        /**
         * @description load local playlists
         *
         * @param {Array} value - data of playlists
         */
        local: function (value) {
            this.ID = -1;
            this.$plts = {};
            //通过时间戳排序
            this.plts = value.sort(function (a, b) {
                return a.timestamp < b.timestamp;
            });
            this.recKey = [];//关闭时要保存的播放列表
            this.$.container.empty();
            this.$.table.children('tbody').remove();
            for (var i = 0; i < this.plts.length; i++) {
                this.addItem(this.plts[i]);
            }
            this.setState();
        },
        /**
         * @description load NetEase Account's playlist of User after login
         *
         * @throw load net playlist error
         * @throw user current not login
         */
        net: function () {
            if (!account.isLogin) throw 'user current not login';
            var that = this;
            api.userPlaylist(function (err, raw) {
                if (err) throw 'load net playlist error:' + err;
                for (var i = 0; i < raw.length; i++) {
                    var o = raw[i];
                    api.playlistDetail(o.name, o.id, function (err, res) {
                        if (err)throw err;
                        that.addItem({
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
        this.$.container.append(str);
        this.$.table.append('<tbody style="display:none" id="_"+ts></tbody>');

        //bind event
        (function (that) {
            var $li = that.$.container.children('li:last-child');
            $li.click(function () {
                that.setState($(this).index());
            });
            $li.find('span.glyphicon-trash').click(function () {
                that.removeItem($(this).index());
            });
        })(this);

        //record this item to save
        if (!isTemp && ts) {
            this.recKey.push(ts);
        }

        var $o = this.create$plt(ts, stuff.data);
        this.$plts[ts] = $o;
        this.rfshLabel();
    },
    /**
     * @description switch to 0 or "id"th playlist.
     *
     * @param {number} [id=0] - the index of playlist to switch
     *
     * @throw index out of range
     */
    setState: function (id) {
        id = id || 0;
        if (this.ID == id)return;
        if (id < 0 || id > this.name.length) {
            throw "index out of range";
        }

        var $li = this.$.container.children('li');
        if (this.ID >= 0) {
            var old$li = $li.eq(this.ID);
            old$li.removeClass('active');
            this.$plts[$.data(old$li, 'target')].hide();
        }
        var new$li = $li.eq(id);
        new$li.addClass('active');
        this.$plts[$.data(new$li, 'target')].show();
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
        if (id !== 0) {
            id = id || this.ID;
        }
        if (id < 0 || id > this.list.length) {
            throw "index out of range";
        }
        var $li = this.$.container.children('li').eq(id);
        var target = $.data($li, 'target');
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
        if (id < 0 || id > this.data.length) {
            throw "index out of range";
        }
        this.$.container.children('li').eq(id).remove();
        var now$plt = this.get$plt(id);
        now$plt.$.remove();
        if (now$plt == controls.playlist) {
            controls.setState(null, -1);
            controls.playlist = null;
        }
        var index = utils.binarySearch(this.recKey, now$plt.ts);
        if (index != -1) {
            this.recKey[index] = undefined;
        }
        index = utils.binarySearch(this.plts, now$plt.ts, function (o) {
            return o.timestamp;
        });
        if (index != -1) {
            this.plts[index] = undefined;
        }
        delete now$plt;

        if (id == this.ID) {
            this.ID = -1;
            this.setState();
        } else if (id < this.ID) {
            this.ID--;
        }
    },
    /**
     * @description refresh the Labels on userInfo
     */
    rfshLabel: function () {
        this.$.totSong.text("本地歌曲：" + this.plts[0].data.length);
        this.$.totlist.text("歌单：" + this.plts.length);
    },
    /**
     * @description refresh "id"th or all badge's number.
     *
     * @param {number} [id=-1] - the index of badge to refresh
     */
    rfshBadge: function (id) {
        id = id || -1;
        var badge = this.$.container.find('.badge');
        if (id >= 0 && id < this.plts.length) {
            badge.eq(id).text(this.plts[id].data.length);
        } else {
            for (var i = 0; i < this.data.length; i++) {
                var o = this.data[i];
                $(badge[i]).text(o.length);
            }
        }
    },
    listen: function (that) {
        this.$.refresh.click(function () {
            var $span = $('#refresh');
            var origin = $span.text();
            $span.text(origin + '加载中...');
            fm.loadMusicDir(function () {
                category.loadPlts.local(fm.getScheme());
                account.isLogin && category.loadPlts.net();
                controls.setState(null, -1);
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
            else flag = that.$.container.text().indexOf(val) == -1 ? false : true;
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
        })
    }
}