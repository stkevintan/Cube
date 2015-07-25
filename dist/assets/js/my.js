/**
 * Created by kevin on 15-5-8.
 * @description define the action of the top navigation bar
 *
 * @author Kevin Tan
 *
 * @constructor nav.init
 *
 */
var tabName = ['#main', '#radio', '#settings'];
var Nav = function () {
    this.ID = 0;
    this.$ = {
        tabBody: tabName.map(function (s) {
            return $(s);
        }),
        tabHead: tabName.map(function (s) {
            return $(s + '-nav');
        }),
        search: $('#search'),
        UserImg: $('#user-profile img'),
        UserTxt: $('#user-profile p'),
        MenuItem0: $('#menugo-0'),
        MenuItem1: $('#menugo-1')
    };
    this.WinMode = {
        isSimp: 0,
        width: null,
        height: null
    }
    this.listen(this);
}
Nav.prototype = {
    /**
     * @description switch to "id"th tab
     *
     * @param {number} id - the index of tab to switch
     */
    setState: function (id) {
        id = id || 0;
        if (id == this.ID)return;
        var that = this;
        this.$.tabBody[this.ID].fadeOut(100, function () {
            that.$.tabBody[id].fadeIn(100);
        });
        $([this.$.tabHead[this.ID], this.$.tabHead[id]]).toggleClass('active');
        this.ID = id;
        if (id == 1) {
            radio.show();
        } else {
            lrc.toggle(false);
        }
    },
    /**
     * @description search keywords from UI,add result playlist to category
     *
     * @throw search api returns an error
     */
    search: function () {
        var key = this.$.search.val();
        api.search(key, function (err, results) {
            if (err) throw 'search api returns an error:' + err;
            var name = '"' + key + '"的搜索结果';
            var songList = results;
            category.addItem(new PltM({
                name: name,
                type: 'user',
                songList: songList
            }), true);
        });
    },
    close: function () {
        win.hide();
        console.log('save the config changes...');
        fm.SaveChanges(category.recKey, category.plts, function (err) {
            if (err)console.log('save failed', err);
            else console.log('saved');
            win.close(true);
        });
    },
    minimize: function () {
        win.minimize();
    },
    maximize: function () {
        if (this.WinMode.isMaxi) {
            win.unmaximize();
        } else {
            win.maximize();
        }
        this.WinMode.isMaxi ^= 1;
    },
    /**
     * toggle Window between normal size and mini size
     * this is a bug of nw.js. temporary solution.
     * @param {boolean} [flag=false] - if true,force to normal size,vice verse.
     */
    toggleWindow: function (flag) {
        if (flag || this.WinMode.isSimp) {
            win.resizeTo(this.WinMode.width, this.WinMode.height);
        } else {
            win.unmaximize();
            this.WinMode.width = win.width;
            this.WinMode.height = win.height;
            win.resizeTo(560, 60);
        }
        this.WinMode.isSimp ^= 1;
    },
    /**
     * @description set menu display state
     *
     * @param type  0 - unsigned, 1 - signed
     */
    setMenu: function (nickname, avatarUrl) {
        if (avatarUrl) {
            this.$.MenuItem0.hide();
            this.$.MenuItem1.show();
        } else {
            this.$.MenuItem1.hide();
            this.$.MenuItem0.show();
        }
        this.$.UserImg.attr('src', avatarUrl);
        this.$.UserTxt.text(nickname);
    },
    /**
     * @description define the action after click a MenuItem
     *
     * @param index - the index of the MenuItem
     */
    clickMenu: function (index) {
        if (index == 0) {
            account.showlogin();
        } else {
            account.unsign();
        }
    },
    /**
     * @description attach handler to events
     *
     * @param {object} that - the reference of the outer object
     */
    listen: function (that) {
        $(this.$.search).keydown(function (e) {
            if (e.which == 13) {
                e.preventDefault();
                that.search();
            }
        });

    }
}

/**
 * Created by kevin on 15-6-14.
 */
var Lrc = function () {
    this.$ = {
        panel: $('.song-detail'),
        lyric: $('.lyric'),
        ulDOM: $('.lyric ul')[0],
        pic: $('.song-detail img'),
        title: $('#info-title'),
        album: $('#info-album'),
        artist: $('#info-artist')
    }
    this.delay = {
        time: 3000,
        id: null
    }
    this.state = false;
    this.listen();
}
Lrc.prototype = {
    toggle: function (flag) {
        if (flag === this.state)return;
        flag = flag || !this.state;
        if (flag) {
            this.$.panel.css('transform', 'none');
            this.state = true;
        } else {
            //if current tab is radio,prevent this action
            if (nav.ID == 1)return;
            this.$.panel.css('transform', 'scale(0,0)');
            this.state = false;
        }
    },
    scroll: function (type) {
        var d = 0;
        var tmp = this.$.ulDOM.style.marginTop;
        var curTop = Number(tmp.substr(0, tmp.length - 2));
        if (type > 0 && curTop < 0) {
            //scroll up
            d = Math.min(this.$.lyric[0].offsetHeight >> 1, -curTop);
        }
        var h = -this.$.ulDOM.offsetHeight + 20;
        if (type < 0 && curTop > h) {
            //scroll down
            d = Math.max(-this.$.lyric[0].offsetHeight >> 1, h - curTop);
        }
        if (d) {
            this.$.ulDOM.style.marginTop = curTop + d + 'px';
            var that = this;
            if (player.playing) {
                if (this.delay.id !== null)clearTimeout(this.delay.id);
                this.delay.id = setTimeout(function () {
                    that.delay.id = null;
                    that.autoScroll();
                }, this.delay.time);
            }

        }
    },
    setDesc: function (opt) {
        this.$.pic.attr('src', opt.pic || '');
        this.$.title.text(opt.title);
        this.$.album.text(opt.album);
        this.$.artist.text(opt.artist);
    },
    setLrc: function (msg) {
        this.$.ulDOM.innerHTML = '';
        this.$.ulDOM.style.marginTop = 0;
        this.$.liDOM = [];
        if (!this.lrcObj) {
            msg = msg || '****没有歌词****';
            this.appendline(msg);
        } else if (this.lrcObj.noTime) {
            this.appendline('****歌词无法滚动****');
            for (var i = 0; i < this.lrcObj.txt.length; i++) {
                this.appendline(this.lrcObj.txt[i]);
            }
        } else {


            for (var i = 0; i < this.lrcObj.lines.length; i++) {
                this.appendline(this.lrcObj.lines[i].txt);
            }
        }
    },
    load: function (songM) {
        this.setDesc(songM);
        this.lrcObj = null;
        this._index = -1;
        if (!songM.id) {
            this.setLrc();
        } else {
            var that = this;
            api.songLyric(songM.id, function (err, res) {
                if (!err) {
                    that.lrcObj = new that.parse(res);
                }
                that.setLrc();
            });
        }
    },
    appendline: function (txt) {
        var li = createDOM('li', null, txt);
        this.$.liDOM.push(li);
        this.$.ulDOM.appendChild(li);
    },
    autoScroll: function (target) {
        if (this.delay.id !== null)return;
        if (this._index == -1 && !target) {
            this.$.ulDOM.style.marginTop = 0;
        } else {
            target = target || this.$.liDOM[this._index];
            var top = target.offsetTop;
            var pos = this.$.lyric[0].offsetHeight >> 2;
            this.$.ulDOM.style.marginTop = top > pos ? pos - top + 'px' : 0;
        }
    },
    seek: function (time) {
        if (this.state && this.lrcObj && !this.lrcObj.noTime) {
            var index = utils.binarySearch(this.lrcObj.lines, time, function (o) {
                return o.time;
            });
            if (index != -1) {
                if (this._index !== index) {
                    if (this._index >= 0) {
                        this.$.liDOM[this._index].className = '';
                    }
                    this.$.liDOM[index].className = 'current';
                    this._index = index;
                    this.autoScroll();
                }
            } else {
                this.autoScroll();
            }
        }
    },
    parse: (function () {
        var timeExp = /\[(\d{2,})\:(\d{2})(?:\.(\d{2,3}))?\]/g
        var tagsRegMap = {
            title: 'ti'
            , artist: 'ar'
            , album: 'al'
            , offset: 'offset'
            , by: 'by'
        };
        var trim = function (lrc) {
            return lrc && lrc.replace(/(^\s*|\s*$)/m, '')
        }
        var isLrc = function (lrc) {
            return timeExp.test(lrc);
        }
        return function (lrc) {
            if (!utils.isString(lrc)) {
                console.log('invalid param');
                return;
            }
            this.lrc = trim(lrc);
            var lines = lrc.split(/\n/);
            if (!isLrc(this.lrc)) {
                this.noTime = 1;
                this.txt = lines;
                return;
            }
            this.tags = {};//ID tags. 标题, 歌手, 专辑
            this.lines = [];//详细的歌词信息
            var res, line, time, _last;

            for (var tag in tagsRegMap) {
                res = lrc.match(new RegExp('\\[' + tagsRegMap[tag] + ':([^\\]]*)\\]', 'i'));
                this.tags[tag] = res && res[1] || '';
            }
            timeExp.lastIndex = 0;
            for (var i = 0, l = lines.length; i < l; i++) {
                while (time = timeExp.exec(lines[i])) {
                    _last = timeExp.lastIndex;
                    line = trim(lines[i].replace(timeExp, ''));
                    timeExp.lastIndex = _last;
                    this.lines.push({
                        time: time[1] * 60 + 1 * time[2] + (time[3] || 0) / 1000
                        , originLineNum: i
                        , txt: line
                    });
                }
            }
            this.lines.sort(function (a, b) {
                return a.time - b.time;
            });
        }
    })(),
    listen: function () {
    }
}
/**
 * Created by kevin on 15-6-25.
 */
var Radio = function () {
    this.state = false;
    this.loadState = null;
    this.loadQue = new utils.queue();
    this.curplay = null;
    this.listen();
}
Radio.prototype = {
    load: function () {
        if (this.loadState == 'loading')return;
        var that = this;
        api.radio(function (err, songList) {
            if (err)errorHandle(err);
            else {
                Event.emit('songloaded', songList);
            }
            that.loadState = 'loaded';
        });
        this.loadState = 'loading';
    },
    show: function () {
        if (this.state == false) {
            player.stop('loading...');
            player.$.backward.hide();
            player.$.order.hide();
            this.state = true;
            this.play();
        }
        lrc.toggle(true);
    },
    close: function () {
        this.state = false;
        player.$.backward.show();
        player.$.order.show();
    },
    play: function () {
        if (this.curplay) {
            player.play(this.curplay);
        } else {
            if (this.loadQue.empty()) {
                this.load();
            } else {
                this.curplay = this.loadQue.pop();
                player.play(this.curplay);
            }
        }
    },
    playNext: function () {
        if (this.curplay == null)return;
        this.curplay = null;
        this.play();
    },
    listen: function () {
        Event.on('songloaded', function (songList) {
            for (var i = 0; i < songList.length; i++) {
                this.loadQue.push(songList[i]);
            }
            this.play();
        }, this);
    }
}
/**
 * Created by kevin on 15-6-10.
 */
/**
 * Created by kevin on 15-5-8.
 * @description define the action of control bar
 *
 * @author Kevin Tan
 *
 * @constructor controls.init
 */

var Player = function () {
    this.$ = {
        play: $('#play'),
        pause: $('#pause'),
        order: $('#order span'),
        backward: $('#backward'),
        volume: $('#volume'),
        volIcon: $('#vol-icon'),
        songPic: $('#song-pic'),
        totTime: $('#tot-time'),
        curTime: $('#cur-time'),
        title: $('h4.media-heading'),
        progress: $('.media-body input')
    }
    //初始化播放器
    this.audio = new Audio();
    //初始化进度条
    this.progress = this.$.progress.slider({
        id: 'progress',
        value: 0,
        min: 0,
        max: 0,
        step: 1,
        formatter: this.timeFormartter
    });
    this.playling = false;
    this.volume = this.$.volume.slider({
        value: 0.5,
        min: 0,
        max: 1,
        step: 0.01
    });
    this.ID = 1;
    this.stop();
    this.duration = -1;
    this.setOrder(this.ID);
    this.setVolume(0.5);
    this.listen();
}
Player.prototype = {
    orderList: [{
        name: '单曲循环',
        value: 'repeat'
    }, {
        name: '列表循环',
        value: 'refresh'
    }, {
        name: '顺序播放',
        value: 'align-justify'
    }, {
        name: '随机播放',
        value: 'random'
    }],
    play: function (songM) {
        if (this.playlist && this.playlist.ID != -1 || radio.state) {
            this.$.play.hide();
            this.$.pause.show();
            songM && this.setMetaData(songM);
            this.audio.play();
        }
    },
    playNext: function (type) {
        type = type || this.ID;
        if (this.playlist && this.playlist.ID != -1) {
            var nextSong = this.playlist.next(type);
            if (nextSong) this.play(nextSong);
            else this.stop();
        }
        if (radio.state && type == 1) {
            radio.playNext();
        }
    },
    pause: function () {
        this.$.play.show();
        this.$.pause.hide();
        this.audio.pause();
    },
    stop: function (msg, noExit) {
        if (noExit) {
            this.setCurrentTime(0);
        } else {
            this.audio.pause();
            msg = msg || '未选择歌曲';
            lrc.load({
                title: msg,
                album: '未知',
                artist: '未知'
            });
            if (this.playlist)
                this.playlist.setState(-1);
            this.playlist = null;
            this.$.play.show();
            this.$.pause.hide();
            this.setDuration(0);
            this.setHead(msg, '');
        }
    },
    /**
     * format 'val' (s) to 'mm:ss'
     *
     * @param {number} val - time (s)
     *
     * @return {string}
     */
    timeFormartter: function (val) {
        var num = Math.ceil(val);
        var ss = num % 60;
        var mm = Math.floor(num / 60);
        var strs = (ss < 10 ? '0' : '') + ss;
        var strm = (mm < 10 ? '0' : '') + mm;
        return strm + ':' + strs;
    },
//UI
    setHead: function (title, pic) {
        this.$.songPic.attr('src', pic);
        this.$.title.text(title);
    }
    ,
    setMetaData: function (songM) {
        //load lrc
        lrc.load(songM);
        this.setHead(songM.title, songM.pic);
        this.audio.src = songM.src;
        showNotify('现在播放：' + songM.title);
    },
//UI
    setCurrentTime: function (curTime) {
        if (curTime > this.duration) curTime = this.duration;
        this.$.curTime.text(this.timeFormartter(curTime));
        this.progress.slider('setValue', curTime);
    },
//UI
    setDuration: function (duration) {
        this.duration = duration;
        this.progress.slider('setAttribute', 'max', duration);
        this.$.totTime.text(this.timeFormartter(duration));
    },
    setVolume: function (val) {
        if (utils.isNumber(val) && val >= 0 && val <= 1) {
            this.volume.slider('setValue', val);
            this.audio.volume = val;
        }
    },
    toggleVolMute: function () {
        var state = this.volume.slider('isEnabled');
        if (state) {
            //mute
            this.audio.muted = true;
            this.volume.slider('disable');
            this.$.volIcon.attr('class', 'glyphicon glyphicon-volume-off');
        } else {
            //unmute
            this.audio.muted = false;
            this.volume.slider('enable');
            this.$.volIcon.attr('class', 'glyphicon glyphicon-volume-up');
        }
    },
    /**
     * set cur mode to the 'mode'th playMode:single-repeat->list-repeat->no-repeat->random
     *
     * @param {number} [mode] if no exists,set cur mode to the next mode;
     */
    setOrder: function (mode) {
        var len = this.orderList.length;
        if (utils.isNumber(mode)) {
            this.ID = (mode - 1 + len) % len;
        }
        this.ID = (this.ID + 1) % len;
        var tag = this.orderList[this.ID];
        this.$.order.attr('class', 'glyphicon glyphicon-' + tag.value);
        this.$.order.attr('title', tag.name);
    },
    listen: function () {
        var that = this;
        this.audio.onloadedmetadata = function () {
            that.setDuration(this.duration);
        };
        this.audio.onerror = function () {
            that.playing = false;
            var msg;
            switch (this.error.code) {
                case 1:
                    msg = '未选择歌曲';
                    break;
                case 2:
                    msg = '糟糕，网络貌似除了点问题';
                    break;
                case 3:
                    msg = '糟糕，缺少相应解码器';
                    break;
                case 4:
                    msg = '糟糕，文件或网络资源无法访问';
                    break;
                default:
                    msg = '未知错误，error code:' + this.error.code;
            }
            that.stop(msg);
        };
        var ondrag = false;
        this.audio.ontimeupdate = function () {
            if (!ondrag) that.setCurrentTime(this.currentTime);
            lrc.seek(this.currentTime);
        };
        this.audio.onended = function () {
            that.playing = false;
            that.playNext();
        };
        this.audio.onpause = function () {
            that.playing = false;
        }
        this.audio.onplaying = function () {
            that.playing = true;
        }

        this.progress.slider('on', 'slideStart', function () {
            ondrag = true;
        });
        this.progress.slider('on', 'slideStop', function () {
            var nowTime = that.progress.slider('getValue');
            that.audio.currentTime = nowTime;
            that.setCurrentTime(nowTime);
            ondrag = false;
        });
        this.volume.slider('on', 'slide', function (val) {
            that.audio.volume = val
        });
        this.volume.slider('on', 'change', function (o) {
            if (o.oldValue != o.newValue) {
                that.audio.volume = o.newValue;
            }
        });
    }
}

/**
 * @description define the login action.
 *
 * @author Kevin Tan
 *
 * @constructor account.init
 */
var Account = function () {
    this.$ = {
        userProfile: $('#user-profile'),
        login: $('#login'),
        submit: $('#login').find('button.submit'),
        label: $('#login').find('label'),
        phone: $('#login').find('input[name="phone"]'),
        password: $('#login').find('input[name="password"]')
    }
    this.listen(this);
}

Account.prototype = {
    loadUser: function (uid) {
        //获得登录信息
        uid = uid || fm.getUserID();
        var that = this;
        if (uid) {
            api.userProfile(uid, function (err, res) {
                if (err) {
                    errorHandle(err);
                    that.setUserProfile();
                } else {
                    that.setUserProfile(res);
                }
            });
        } else {
            that.setUserProfile();
        }
    },
    unsign: function () {
        fm.setCookie(null);
        this.setUserProfile();
        category.loadPlaylists({'net': true});
    },
    showlogin: function () {
        this.$.label.hide();
        this.$.login.modal('show');
        this.$.phone.focus();
    },
    loginErr: function (msg) {
        this.$.label.text(msg);
        this.$.label.show();
    },
    loginSuccess: function (profile) {
        this.$.label.text('');
        this.$.login.modal('hide');
        this.setUserProfile(profile);
        category.loadPlaylists({net: true});
    },
    /**
     */
    setUserProfile: function (profile) {
        profile = profile || {nickname: '未登录', avatarUrl: ''};
        nav.setMenu(profile.nickname, profile.avatarUrl);
    },
    listen: function (that) {
        this.$.submit.click(function () {
            var $btn = $(this).button('loading');
            var phone = that.$.phone.val();
            var password = that.$.password.val();
            api.login(phone, password, function (err, data) {
                if (err) {
                    errorHandle(err);
                    that.loginErr(err.msg);
                } else {
                    that.loginSuccess(data);
                }
                $btn.button('reset');
            });

        });
        this.$.phone.keydown(function (e) {
            if (e.which == 13) {
                that.$.password.focus();
            }
        });
        this.$.password.keydown(function (e) {
            if (e.which == 13) {
                that.$.submit.trigger('click');
            }
        })
    }
}
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
/**
 * Created by kevin on 15-5-8.
 */
//设置页面行为
var Settings = function () {
    this.$ = {
        musicDir: $('#music-dir'),
        dialog: $('#dialog'),
        btnOpen: $('button#openDialog'),
        searchLimit: $('#search-limit')
    };
    this.$.searchLimit.val(fm.getSearchLimit());
    this.$.musicDir.val(fm.getMusicDir());
    this.listen();
};
Settings.prototype = {
    listen: function () {
        var that = this;
        this.$.btnOpen.click(function () {
            that.$.dialog.trigger('click');
        });

        this.$.dialog.change(function () {
            var newDir = $(this).val();
            console.log('newDir', newDir);
            if (fm.setMusicDir(newDir)) {
                that.$.musicDir.val(newDir);
                //reload localdir
                category.loadPlaylists({'local': true});
            }
        });
        this.$.searchLimit.change(function () {
            var limit = $(this).val();
            limit = limit.trim();
            //判断limit是否是数字
            console.log('limit', limit);
            var regex = /^[1-9]\d*$/;
            if (regex.test(limit)) {
                $(this).parent().removeClass('has-error');
                fm.setSearchLimit(Number(limit) || 0);
            } else {
                $(this).parent().addClass('has-error');
            }
        });
    }
}
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
    this.loadQue = new utils.queue();//队列
    this.listen(this);
    this.addEvents();
}

Category.prototype = {
    loadPlaylists: function (options, isClean) {
        if (loading) {
            this.loadQue.push([options, isClean]);
            return;
        }
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
            if (err) errorHandle(err);
            else if (!utils.isArray(plts)) {
                errorHandle("the source doesn't return an Array!");
            } else {
                var offset = that.plts.length;
                that.plts = that.plts.concat(plts);
                for (var i = 0; i < plts.length; i++) that.addItem(offset + i);
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
            old.slideUp(600);
            return;
        }
        var div = createDOM('div', {class: 'plts-group', id: '__' + key, style: 'display:none'});
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
     */
    addItem: function (opt, instant) {
        var pltModel = opt;
        var index = opt;
        if (utils.isNumber(opt) && opt >= 0 && opt < this.plts.length) {
            pltModel = this.plts[opt];
        } else {//plt don't have this model,push it in
            index = this.plts.length;
            this.plts.push(pltModel);
            entry.schema[pltModel.type].onadd(pltModel);
        }
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
        this.pLength++;
        this.$.table.append(tbody);
        this.$plts[ts] = new Playlist(tbody, index);
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
            entry.schema[this.plts[index].type].onremove(this.plts[index]);
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
                var $group = that.$.entry.find('#__' + o.type);
                $group.slideDown(600);
                tmp$[o.type] = $group.find('ul');
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
                loading = false;
                this.$.refresh.removeClass('loading');
                //sort plts to fix some bugs
                if (this.plts.length > 1)
                    this.plts = this.plts.sort(function (a, b) {
                        return a.timestamp - b.timestamp;
                    });

                //load rest task in queue
                if (!this.loadQue.empty()) {
                    console.log('load task in queue');
                    var task = this.loadQue.front();
                    this.loadQue.pop();
                    if (utils.isArray(task)) {
                        this.loadPlaylists.apply(this, task);
                    }
                }
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

/**
 * Created by kevin on 15-5-4.
 */
//初始化
var gui = require('nw.gui');
// Get the current window
var win = gui.Window.get();
var fm = require('./libs/FileManager');
var api = require('./libs/NetEaseMusic');
var utils = require('./libs/Utils');
var PltM = require('./libs/PlaylistModel');
var EntryM = require('./libs/EntryModel');

var Event = (function () {
    var w = $(window);
    return {
        on: function (event, handler, _this) {
            w.on(event, function () {
                handler.apply(_this, [].slice.call(arguments, 1));
            });
        },
        once: function (event, handler, _this) {
            w.one(event, function () {
                handler.apply(_this, [].slice.call(arguments, 1));
            });
        },
        emit: function (event) {
            w.triggerHandler(event, [].slice.call(arguments, 1));
        }
    }
})();

var errorHandle = function (err) {
    if (!err)return;
    if (utils.isString(err)) {
        console.log(err);
    } else if (err.type) {
        showNotify(err.msg);
    } else {
        console.log(err.msg);
    }
}

var showNotify = function (msg) {
    new Notification('网易音乐盒', {
        body: msg
    });
}

var createDOM = function (name, options, inner) {
    var dom = document.createElement(name);
    for (var key in options) {
        dom.setAttribute(key, options[key]);
    }
    if (!utils.isUndefinedorNull(inner))
        dom.innerText = inner;
    return dom;
}

var entry = {
    schema: {
        local: new EntryM({
            mode: 0,
            name: '本地',
            loader: function (callback) {
                fm.getLocal(callback);
            }
        }),
        user: new EntryM({
            mode: 3,
            name: '用户',
            loader: function (callback) {
                fm.getScheme(callback);
            },
            onadd: function (pltM) {
                fm.addScheme(pltM);
            },
            onremove: function (pltM) {
                fm.delScheme(pltM);
            }
        }),
        net: new EntryM({
            mode: 0,
            name: '云音乐',
            loader: function (callback) {
                api.getNet(callback);
            }
        })
    },
    //二进制表示权限，3->11，第0位表示是否保存，第1位表示是否允许修改
    getMode: function (type, w) {
        var mode = this.schema[type] ? this.schema[type].mode : 2;
        if (typeof w !== 'undefined') {
            return (1 << w) & mode;
        } else return mode;
    },
    getPrefix: function (type) {
        return this.schema[type] ? this.schema[type].name : '未知';
    }
};

var nav = new Nav();
var account = new Account();
var radio = new Radio();
var lrc = new Lrc();
var player = new Player();
var settings = new Settings();
var category = new Category();

//加载用户信息
account.loadUser();
//加载播放列表
category.loadPlaylists(null, true);

//table屏蔽选中
$('table').on('selectstart', function (e) {
    e.preventDefault();
});

win.setMinimumSize(560, 60);

win.on('close', function () {
    win.hide();
    console.log('save the config changes...');
    fm.SaveChanges(function (err) {
        if (err)console.log('save failed', err);
        else console.log('saved');
        win.close(true);
    });
    //5s to save changes or close directly.
    setTimeout(function () {
        console.log('errors may be occurred , exit');
        win.close(true);
    }, 5000);
});


