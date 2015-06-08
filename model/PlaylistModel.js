/**
 * Created by kevin on 15-6-4.
 */
var model = function (raw) {
    this.timestamp = raw.timestamp;
    this.name = raw.name;
    this.type = raw.type;
    this.songList = raw.songList||[];
}
module.exports = model;