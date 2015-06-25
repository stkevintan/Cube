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