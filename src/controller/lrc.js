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
        flag = flag || !this.state;
        if (flag) {
            this.$.panel.css('transform', 'none');
            this.state = true;
        } else {
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
            if (this.delay.id !== null)clearTimeout(this.delay.id);
            this.delay.id = setTimeout(function () {
                that.delay.id = null;
                that.autoScroll();
            }, this.delay.time);

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