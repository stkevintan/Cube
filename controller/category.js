/**
 * Created by kevin on 15-5-8.
 * @constructor category.init
 *
 * @author Kevin Tan
 *
 * @description define the action of nav-sidebar and ptls-tools
 */
var category = {
    init: function () {
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
        this.domCache = [];
        this.listen(this);
        this.addEvents();
        this.$.refresh.trigger('click');
    },
    /**
     * load entries defined in source object.
     *
     * @param {object} [options] - {sourceName:true|false}
     *                             only load source which sourceName's value is true.
     *                             if null,load all the sources.
     * @param {boolean} [isClean] - if to remove all the playlist at first.
     */
    loadEntry: function (options, isClean) {
        if (isClean) {
            this.$plts = {};
            this.plts = [];
            this.pLength = 0;//playlist's length

            this.$.entry.empty();
            this.$.table.children('tbody').remove();
        }
        var schema = entry.schema;
        if (!options) {
            options = {};
            for (var key in schema) {
                if (schema.hasOwnProperty(key)) {
                    this.add$EntryFrame(key, schema[key].name);
                    options[key] = true;
                }
            }
        }
        account.setAssessable(false);
        this.$.refresh.addClass('loading');
        this.eLength = 0;
        var that = this;
        for (var key in options) {
            if (!options[key] || !options.hasOwnProperty(key)) continue;
            this.eLength++;
            var loader = schema[key].loader;
            if (utils.isFunction(loader)) {
                loader(callback);
            }
        }

        function callback(err, plts) {
            if (err || !utils.isArray(plts)) {
                console.log(err || "the source doesn't return an Array!");
                Event.emit('entryLoad');
                return;
            }

            that.plts = that.plts.concat(plts);
            for (var i = 0; i < plts.length; i++) {
                that.addItem(plts[i]);
            }
            Event.emit('entryLoad');
        }
    }
    ,
    /**
     * @description create view of the playlist
     *
     * @param {number} timestamp - timestamp of the playlist
     * @param {array} data - songs object array of the playlist
     *
     * @return {object} playlist.init
     */
    create$plt: function (timestamp, songList) {
        var o = playlist.init;
        o.prototype = playlist;
        var tbody = createDOM('tbody', {style: 'display:none', id: '_' + timestamp});
        this.$.table.append(tbody);
        this.$plts[timestamp] = new o(timestamp, songList, $(tbody));
    },
    add$EntryFrame: function (key, name) {
        var div = createDOM('div', {class: 'plts-group', id: '__' + key});
        div.appendChild(createDOM('div', {class: 'plts-title'}, name));
        div.appendChild(createDOM('ul', {class: 'nav nav-sidebar'}));
        Sortable.create(this.$.entry[0].appendChild(div).getElementsByTagName('ul')[0]);
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

        entry.getMode(pltModel.type, 1) &&
        divLimark.appendChild(createDOM('span', {class: 'glyphicon glyphicon-trash'}));
        divLimark.appendChild(createDOM('span', {class: 'badge'}, pltModel.songList.length));
        li.appendChild(a);
        a.appendChild(divName);
        a.appendChild(divLimark);

        this.domCache.push({type: pltModel.type, dom: li});
        if (this.refreshable) {//没有在loadPlt过程中
            this.plts.push(pltModel);
        }
        this.pLength++;
        this.create$plt(ts, pltModel.songList);

        if (instant) {
            this.addtoDOM();
            this.setState(this.$.lis().index(li));
        }
    },
    /**
     * @description switch to last or "id"th playlist.
     *
     * @param {number} [id=lastIndex] - the index of playlist to switch,
     *
     * @throw index out of range
     */
    setState: function (id) {
        if (id < 0 || id >= this.pLength)throw 'index out of range' + id;
        var lis = this.$.lis();
        var curli = this.$.entry.find('li.active');
        var curID = lis.index(curli);
        if (curID == id)return;
        if (curID != -1) {
            curli.removeClass('active');
            this.$plts[curli.data('target')].hide();
        }
        var newli = lis.eq(id);
        newli.addClass('active');
        this.$plts[newli.data('target')].show();
    },
    /**
     * @description remove playlist by id.
     *
     * @param {number} id - index of the playlist in category
     *
     * @throw index out of range
     */
    removeItem: function (id) {
        if (id < 0 || id >= this.pLength)throw 'index out of range';
        var li = this.$.lis().eq(id);
        var now$plt = this.$plts[li.data('target')];

        var that = this;
        li.slideUp(600, function () {
            if (li.hasClass('active')) {
                that.setState(0);
            }
            li.remove();
            now$plt.$.frame.remove();
        });
        if (now$plt == controls.playlist) {
            Event.emit('playerExit');
        }
        var index = utils.binarySearch(this.plts, now$plt.timestamp, function (o) {
            return o.timestamp;
        });
        if (index != -1) {
            if (this.plts[index].type == 'user') {
                fm.delScheme(this.plts[index]);//及时删除
            }
            this.plts.splice(index, 1);
        }

        delete now$plt;
        this.pLength--;
    },
    addUserPlt: function (name) {
        var plt = new PltM({
            name: name,
            type: 'user'
        });
        this.addItem(plt, true);
        fm.addScheme(plt);
    },
    listen: function (that) {
        //事件委托
        this.$.entry.on('click', 'li', function () {
            that.setState(that.$.lis().index(this));
        });

        this.$.entry.on('click', 'li span.glyphicon-trash', function (e) {
            var it = $(this).closest('li');
            that.removeItem(that.$.lis().index(it));
            e.stopPropagation();
        });
        this.refreshable = true;
        this.$.refresh.click(function () {
            if (!that.refreshable) return;
            that.refreshable = false;
            Event.emit('playerExit');
            //load entry
            that.loadEntry(null, true);
            Event.once('setActive', function () {
                this.setState(0);
            }, that);
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
            if (!that.refreshable) {
                return;
            }
            var val = input.val();
            val = val.trim();
            var flag = true;
            if (val == '')flag = false;
            else {
                var $name = that.$.lis().find('div.name');
                $name.each(function () {
                    if ($(this).text() == val)flag = false;
                });
            }
            if (flag) {
                model.modal('hide');
                that.addUserPlt(val);
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
    }
    ,
    addEvents: function () {
        var count = 0;
        Event.on('entryLoad', function () {
            count++;
            this.addtoDOM();
            if (count == this.eLength) {
                //All playgroup load ready! flush domCache to dom!
                this.$.refresh.removeClass('loading');
                //sort plts to fix some bugs
                if (this.plts.length > 1)
                    this.plts = this.plts.sort(function (a, b) {
                        return a.timestamp - b.timestamp;
                    });
                count = 0;
                this.refreshable = true;
                account.setAssessable(true);
            }
        }, this);
        Event.on('rfshBadge', function (id) {
            /**
             * @description refresh "id"th or all badge's number.
             *
             * @param {number} [id=-1] - the index of badge to refresh
             */
            id = id || -1;
            var badge = this.$.lis().find('.badge');
            if (id >= 0 && id < this.pLength) {
                var bo = badge.eq(id);
                var ts = bo.closest('li').data('target');
                bo.text(this.$plts[ts].length);
            } else {
                for (var i = 0; i < this.pLength; i++) {
                    var bo = badge.eq(i);
                    var ts = bo.closest('li').data('target');
                    badge.eq(i).text(this.$plts[ts].length);
                }
            }
        }, this);
    }
}
