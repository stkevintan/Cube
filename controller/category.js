/**
 * Created by kevin on 15-5-8.
 *
 * @author Kevin Tan
 *
 * @description define the action of nav-sidebar and ptls-tools
 */
var loading = false;
var loadSize = 0;
function Category() {
    this.$ = {
        sidebar: $('#sidebar'),
        entry: $('#entry'),
        uls: function (key) {
            return key ? this.entry.find('#__' + key).find('ul') :
                this.entry.find('ul');
        },
        lis: function (key) {
            return key ? this.entry.find('#__' + key).find('li') :
                this.entry.find('li');
        },
        totSong: $("#totsong"),
        totlist: $("#totlist"),
        refresh: $('#refresh'),
        addlist: $('#addlist'),
        table: $('table')
    }
    this.isOpen = true;
    this.domCache = [];
    this.listen(this);
    this.addEvents();
}

Category.prototype = {
    loadPlaylists: function (options, isClean) {
        if (loading) return;
        if (isClean) {
            this.$plts = {};
            this.plts = [];
            this.pLength = 0;//playlist's length

            this.$.entry.empty();
            this.$.table.children('tbody').remove();

            player.stop();
            Event.once('setActive', function () {
                this.setActive();
            }, this);
        }
        var schema = entry.schema;
        if (!options) {
            options = {};
            for (var key in schema) {
                if (schema.hasOwnProperty(key)) {
                    options[key] = true;
                }
            }
        }

        loadSize = 0;
        var that = this;
        for (var key in options) {
            if (options.hasOwnProperty(key) && options[key]) {
                loadSize++;
                this.add$EntryFrame(key, schema[key].name);
            }
        }

        if (loadSize) {
            //enter loading state
            account.setAssessable(false);
            this.$.refresh.addClass('loading');
            loading = true;

            for (var key in options) {
                if (options.hasOwnProperty(key) && options[key]) {
                    var loader = schema[key].loader;
                    if (utils.isFunction(loader)) loader(callback);
                }
            }
        }
        function callback(err, plts) {
            if (err || !utils.isArray(plts)) {
                console.log(err || "the source doesn't return an Array!");
            } else {
                that.plts = that.plts.concat(plts);
                for (var i = 0; i < plts.length; i++) that.addItem(plts[i]);
            }
            Event.emit('entryLoad');
        }
    },
    add$EntryFrame: function (key, name) {
        var old = this.$.entry.find('#__' + key);
        if (old.length) {
            var that = this;
            old.find('li').each(function () {
                that.removeItem($(this));
            });
            return;
        }
        var div = createDOM('div', {class: 'plts-group', id: '__' + key});
        div.appendChild(createDOM('div', {class: 'plts-title'}, name));
        div.appendChild(createDOM('ul', {class: 'nav nav-sidebar'}));
        Sortable.create(this.$.entry[0].appendChild(div).getElementsByTagName('ul')[0]);
    },
    findPltIndexByTs: function (timestamp) {
        return utils.binarySearch(this.plts, timestamp, function (o) {
            return o.timestamp
        });
    },
    /**
     * @description add playlist
     *
     * @param {object} pltModel -  instance of the PlaylistModel
     * @param {boolean} [instant] - if true,instantly add to html dom without add to cache.
     */
    addItem: function (pltModel, instant) {
        //change view (html)
        var ts = pltModel.timestamp;
        if (utils.isUndefined(ts)) {
            //没有时间戳
            ts = pltModel.timestamp = (new Date()).getTime();
        }

        var li = createDOM('li', {'data-target': ts});
        var a = createDOM('a', {title: pltModel.name, href: 'javascript:void(0)'});
        var divName = createDOM('div', {class: 'name'}, pltModel.name);
        var divLimark = createDOM('div', {class: 'limark'});
        var tbody = createDOM('tbody', {style: 'display:none', id: '_' + ts});

        entry.getMode(pltModel.type, 1) &&
        divLimark.appendChild(createDOM('span', {class: 'glyphicon glyphicon-trash'}));
        divLimark.appendChild(createDOM('span', {class: 'badge'}, pltModel.songList.length));
        li.appendChild(a);
        a.appendChild(divName);
        a.appendChild(divLimark);

        this.domCache.push({type: pltModel.type, dom: li});
        if (!loading) {//not in loading process
            if (pltModel.type == 'user') {
                fm.addScheme(pltModel);
            }
            this.plts.push(pltModel);
        }
        this.pLength++;
        this.$.table.append(tbody);
        this.$plts[ts] = new Playlist(tbody, pltModel.songList);
        if (instant) {
            this.addtoDOM();
            this.setActive($(li));
        }
    },
    getActive: function () {
        return this.$.entry.find('li.active');
    },
    setActive: function (li) {
        li = li || this.$.lis().eq(0);
        if (li.length == 0) return;
        var curli = this.getActive();
        if (curli == li)return;
        if (curli.length) {
            curli.removeClass('active');
            this.$plts[curli.data('target')].hide();
        }
        li.addClass('active');
        this.$plts[li.data('target')].show();
    },
    /**
     * @description remove playlist by $li.
     *
     * @param {object} li - index of the playlist in category
     *
     * @throw index out of range
     */
    removeItem: function (li) {
        var now$plt = this.$plts[li.data('target')];
        var that = this;
        li.slideUp(600, function () {
            li.remove();
            if (li.hasClass('active')) {
                that.setActive();
            }
            now$plt.$.frame.remove();
        });
        if (now$plt == player.playlist) {
            player.stop();
        }
        var index = this.findPltIndexByTs(now$plt.timestamp);
        if (index != -1) {
            if (this.plts[index].type == 'user') {
                fm.delScheme(this.plts[index]);//及时删除
            }
            this.plts.splice(index, 1);
        }
        delete now$plt;
        this.pLength--;
    },
    toggleOpen: function () {
        var list = $('.list');
        var side = category.$.sidebar;
        if (this.isOpen) {
            list.animate({
                'padding-left': '0px'
            }, 600);
            side.animate({
                right: '100%'
            }, 600)
        } else {
            side.animate({
                right: '75%'
            }, 600);
            list.animate({
                'padding-left': '25%'
            }, 600);
        }
        this.isOpen ^= 1;

    },
    listen: function (that) {
        //事件委托
        this.$.entry.on('click', 'li', function () {
            that.setActive($(this));
        });

        this.$.entry.on('click', 'li span.glyphicon-trash', function (e) {
            var it = $(this).closest('li');
            that.removeItem(it);
            e.stopPropagation();
        });

        this.$.refresh.click(function () {
            //load entry
            that.loadPlaylists(null, true);
        });

        var model = $('#inputListName');
        var input = $('#inputListName input');
        var submit = $('#submit-name');
        this.$.addlist.click(function () {
            model.find('label').hide();
            model.removeClass('has-error');
            model.modal('show');
            input.focus();
        });
        submit.click(function () {
            var val = input.val().trim();
            var flag = true;
            if (val == '')flag = false;
            else that.$.lis().find('div.name').each(function () {
                if ($(this).text() == val)flag = false;
            });
            if (flag) {
                model.modal('hide');
                var plt = new PltM({name: val, type: 'user'});
                that.addItem(plt, true);
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
    addtoDOM: function () {
        if (this.domCache.length == 0)return;
        var tmp$ = {};
        var that = this;
        this.domCache.forEach(function (o) {
            if (!tmp$[o.type]) {
                tmp$[o.type] = that.$.entry.find('#__' + o.type).find('ul');
            }
            o.dom.style.display = 'none';
            tmp$[o.type][0].appendChild(o.dom);
            $(o.dom).slideDown(600);
        });
        //flush dom cache
        this.domCache = [];
        Event.emit('setActive');
    },
    addEvents: function () {
        var count = 0;
        Event.on('entryLoad', function () {
            count++;
            this.addtoDOM();
            if (count == loadSize) {
                //All playgroup load ready! flush domCache to dom!
                count = 0;
                this.$.refresh.removeClass('loading');
                loading = false;
                account.setAssessable(true);

                //sort plts to fix some bugs
                if (this.plts.length > 1)
                    this.plts = this.plts.sort(function (a, b) {
                        return a.timestamp - b.timestamp;
                    });
            }
        }, this);
        Event.on('rfshBadge', function () {
            /**
             * @description refresh "id"th or all badge's number.
             *
             */
            var badge = this.$.lis().find('.badge');
            for (var i = 0; i < this.pLength; i++) {
                var bo = badge.eq(i);
                var ts = bo.closest('li').data('target');
                badge.eq(i).text(this.$plts[ts].length);
            }
        }, this);
    }
}
