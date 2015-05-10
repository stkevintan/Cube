/**
 * Created by kevin on 15-5-8.
 */
var T = $('.list table');
//侧栏歌单行为
var category = {
    init: function (fm) {
        this.fm = fm;
        this.self = {
            siderbar: $('ul.nav-sidebar'),
            totSong: $("#totsong"),
            totlist: $("#totlist"),
            refresh: $('#refresh'),
            addlist: $('#addlist')
        }
        this.listen();
        this.self.refresh.trigger('click');
    },
    setState: function (id) {
        id = id || 0;
        if (this.ID == id)return;
        if (id < 0 || id > this.name.length) {
            throw "index out of range";
            return;
        }
        var li = this.self.siderbar.children('li');
        if (this.ID >= 0) {
            li.eq(this.ID).removeClass('active');
            this.list[this.ID].hide();
        }
        li.eq(id).addClass('active');
        this.list[id].show();

        this.ID = id;
    },
    setLabel: function () {
        this.self.totSong.text("歌曲：" + this.data[0].length);
        this.self.totlist.text("歌单：" + category.name.length);
    },
    setbadge: function (id) {
        //更新播放列表左侧的数目标记,如果id为空，那么更新所有列表。
        var badge = this.self.siderbar.find('.badge');
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
    addItem: function (name, data, id, unsave) {
        //name-添加列表名
        //data-该列表代表包含的歌曲数组
        //id-如果存在，则表示为category初始化被load调用
        // unsave-是否存入配置中,0-存入，1-不存入。
        var flag = true;//是否被load调用
        if (typeof id !== 'number') {
            flag = false;
            id = this.list.length;
        }
        var str = '<li><a href="javascript:void(0)">'
            + '<span class="name">' + name + '</span>'
            + '<div style="float:right">'
            + (name == '本地音乐' ? '' : '<span class="glyphicon glyphicon-trash"></span>')
            + '<span class="badge">' + data.length + '</span>'
            + '</div>'
            + '<span class="clearfix"></span>'
            + '</a></li>';
        this.self.siderbar.append(str);
        var that = this;
        var newli = this.self.siderbar.children('li:last-child');

        newli.click(function () {
            that.setState($(this).index());
        });
        newli.find('span.glyphicon-trash').click(function () {
            that.removeItem(newli.index());
        })
        T.append('<tbody style="display:none"></tbody>');
        if (!flag) {
            //如果不是被load调用，则需要更新数据
            // if (!unsave)
            that.fm.setScheme(name, data);
            this.name.push(name);
            this.data.push(data);
        }
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
        this.self.siderbar.children('li').eq(id).remove();
        this.list[id].self.remove();
        if (this.getList(id) == controls.playlist) {
            controls.setState(null, -1);
            controls.playlist = null;
        }
        this.fm.removeScheme(this.name[id]);
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
        for (var i = 0; i < this.name.length; i++) {
            this.data.push(value[this.name[i]]);
        }
        this.self.siderbar.empty();
        T.children('tbody').remove();
        for (var i = 0; i < this.name.length; i++) {
            this.addItem(this.name[i], this.data[i], i);
        }
        this.setState();
    },
    getUserPlaylist: function () {
        var that = this;
        api.userPlaylist(function (err, rawdata) {
            if (err) {
                throw err;
            }
            //console.log('user playlist', data);

            for (var i = 1; i < rawdata.length; i++) {
                var o = rawdata[i];
                api.playlistDetail(o.id, function (err, res) {
                    that.addItem(o.name, res);
                });
            }
        })
    },
    listen: function () {
        var that = this;
        this.self.refresh.click(function () {
            var $span = $('#refresh');
            var origin = $span.text();
            $span.text(origin + '加载中...');
            that.fm.loadMusicDir(function () {
                category.load(that.fm.getSchemeNames(), that.fm.getScheme());
                controls.setState(null, -1);
                $span.text(origin);
            });
        });

        var model = $('#inputListName');
        var input = $('#inputListName input');
        var submit = $('#submit-name');
        this.self.addlist.click(function () {
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