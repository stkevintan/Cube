/**
 * Define the action of nav-sidebar and nav-plus
 *
 * Created by kevin on 15-5-8.
 */
var T = $('.list table');
var category = {
    init: function () {
        this.$ = {
            container: $('ul.nav-sidebar'),
            totSong: $("#totsong"),
            totlist: $("#totlist"),
            refresh: $('#refresh'),
            addlist: $('#addlist')
        }
        this.listen();
        this.$.refresh.trigger('click');
    },
    /**
     * Switch to "id"th playlist.
     * Throw "index out of range"
     *
     * @param id - the index of playlist to switch
     */
    setState: function (id) {
        id = id || 0;
        if (this.ID == id)return;
        if (id < 0 || id > this.name.length) throw "index out of range";
        var $playlist = this.$.container.children('li');
        if (this.ID >= 0) {
            $playlist.eq(this.ID).removeClass('active');
            this.list[this.ID].hide();
        }
        $playlist.eq(id).addClass('active');
        this.list[id].show();

        this.ID = id;
    },
    setLabel: function () {
        this.$.totSong.text("本地歌曲：" + this.data[0].length);
        this.$.totlist.text("歌单：" + category.name.length);
    },
    setbadge: function (id) {
        //更新播放列表左侧的数目标记,如果id为空，那么更新所有列表。
        var badge = this.$.container.find('.badge');
        if (typeof id === 'number') {
            if (id >= 0 && id < this.data.length)
                badge.eq(id).text(this.data[id].length);
        } else {
            for (var i = 0; i < this.data.length; i++) {
                var o = this.data[i];
                $(badge[i]).text(o.length);
            }
        }
    },
    getList: function (id) {
        if (id !== 0) {
            id = id || this.ID;
        }
        if (id < 0 || id > this.list.length) {
            throw "index out of range";
            return null;
        }
        return this.list[id];
    },
    createList: function (id) {
        //以name[id]和data[id]构建新的list对象
        var o = list.init;
        o.prototype = list;
        return new o(id);
    },
    addItem: function (name, data, id, temp) {
        //name-添加列表名
        //data-该列表代表包含的歌曲数组
        //id-如果存在，则表示为category初始化被load调用
        // temp-是否存入配置中,0-存入，1-不存入。
        var flag = true;//是否被load调用
        if (typeof id !== 'number') {
            flag = false;
            id = this.list.length;
        }
        var str = '<li><a href="javascript:void(0)">'
            + '<div class="name">' + name + '</div>'
            + '<div class="limark">'
            + (name == '本地音乐' ? '' : '<span class="glyphicon glyphicon-trash"></span>')
            + '<span class="badge">' + data.length + '</span>'
            + '</div>'
            + '</a></li>';
        this.$.container.append(str);
        var that = this;
        var newli = this.$.container.children('li:last-child');

        newli.click(function () {
            that.setState($(this).index());
        });
        newli.find('span.glyphicon-trash').click(function () {
            that.removeItem(newli.index());
        });
        T.append('<tbody style="display:none"></tbody>');
        if (!flag) {
            this.name.push(name);
            this.data.push(data);
        }
        //如果不是被load调用，则需要更新数据
        if (!temp && name != '本地音乐')this.record.push(name);
        var o = this.createList(id)
        this.list.push(o);
        this.setLabel();
        if (!flag) {
            this.setState(id);
        }
    },
    removeItem: function (id) {
        if (id < 0 || id > this.data.length) {
            throw "index out of range";
            console.log('remove play list failed!');
            return;
        }
        this.$.container.children('li').eq(id).remove();
        this.list[id].$.remove();
        if (this.getList(id) == controls.playlist) {
            controls.setState(null, -1);
            controls.playlist = null;
        }
        var index = this.record.indexOf(this.name[id]);
        if (index != -1) {
            this.record.splice(index, 1);
        }
        this.name.splice(id, 1);
        this.data.splice(id, 1);
        this.list.splice(id, 1);
        if (id == this.ID) {
            this.ID = -1;
            this.setState();
        } else if (id < this.ID) {
            this.ID--;
        }
    },
    load: function (name, value) {
        this.ID = -1;
        this.name = name;
        this.list = [];
        this.data = [];
        this.record = [];//记录要保存的列表
        for (var i = 0; i < this.name.length; i++) {
            this.data.push(value[this.name[i]]);
        }
        this.$.container.empty();
        T.children('tbody').remove();
        for (var i = 0; i < this.name.length; i++) {
            this.addItem(this.name[i], this.data[i], i);
        }
        this.setState();
    },
    getUserPlaylist: function () {
        var that = this;
        api.userPlaylist(function (err, raw) {
            if (err) {
                throw err;
            }
            for (var i = 0; i < raw.length; i++) {
                var o = raw[i];
                api.playlistDetail(o.name, o.id, function (err, res) {
                    if (err)throw err;
                    that.addItem(res.name, res.data, null, 1);
                });
            }
        })
    },
    listen: function () {
        var that = this;
        this.$.refresh.click(function () {
            var $span = $('#refresh');
            var origin = $span.text();
            $span.text(origin + '加载中...');
            fm.loadMusicDir(function () {
                category.load(fm.getSchemeNames(), fm.getScheme());
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
            else {
                for (var i = 0; i < that.name.length; i++) {
                    if (val == that.name[i]) {
                        flag = false;
                        break;
                    }
                }
            }
            if (flag) {
                //添加列表
                that.addItem(val, []);
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