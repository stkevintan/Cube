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
        if (id < 0 || id > this.name.length)return;
        var li = this.self.siderbar.children('li');
        $(li[id]).addClass('active');
        this.list[id].show();
        if (this.ID >= 0) {
            $(li[this.ID]).removeClass('active');
            this.list[this.ID].hide();
        }
        this.ID = id;
    },
    setLabel: function () {
        this.self.totSong.text("歌曲：" + this.data[0].length);
        this.self.totlist.text("歌单：" + category.name.length);
    },
    setbadge: function () {
        var badge = this.self.siderbar.find('.badge');
        for (var i = 0; i < this.data.length; i++) {
            var o = this.data[i];
            $(badge[i]).text(o.length);
        }
    },
    getList: function (id) {
        if (id !== 0) {
            id = id || this.ID;
        }
        if (id < 0) return null;
        return this.list[id];
    },
    createList: function (id) {
        var o = list.init;
        o.prototype = list;
        return new o(id);
    },
    addItem: function (name, num) {
        var str = '<li><a href="javascript:void(0)">'
            + '<span class="name">' + name + '</span>'
            + (name == '本地音乐' ? '' : '<span class="glyphicon glyphicon-trash"></span>')
            + '<span class="badge">' + num + '</span>'
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
        var o = this.createList(this.list.length)
        this.list.push(o);
    },
    removeItem: function (id) {
        if (id < 0 || id > this.data.length) {
            console.log('remove play list failed!');
            return;
        }
        this.self.siderbar.children('li').eq(id).remove();
        if (this.getList() == controls.playlist) {
            controls.setState(null, -1);
        }
        this.fm.removeScheme(this.name[id]);
        this.name.splice(id, 1);
        this.data.splice(id, 1);
        this.list.splice(id, 1);
        console.log(id, this.ID);
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
            this.addItem(this.name[i], this.data[i].length);
        }
        this.setLabel();
        this.setState();
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
                that.fm.setScheme(val, []);
                that.name.push(val);
                that.data.push([]);
                that.addItem(val, 0);
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