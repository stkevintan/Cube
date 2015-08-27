exports.source = function(raw) {
    this.type = raw.type || 0;
    this.name = raw.name || 'Unknown';
    this.entryList = raw.entryList || [];
    this.loader = raw.loader || function(callback) {
        callback(null, null);
    }
}

exports.entry = function(raw) {
    this.name = raw.name;
    this.creator = raw.creator || 'Unknown';
    this.pic = raw.pic;
    this.songList = raw.songList || [];
}

function song(raw) {
    this.name = raw.name || 'Unknown';
    this.id = raw.id;
    this.src = raw.src;
    this.pic = raw.pic;
    this.artist = raw.artist || 'Unknown';
    this.album = raw.album || 'Unknown';
    this.duration = raw.duration || 0;
}

song.prototype.check = function() {
    /**
     * check the type of this song
     * @return {number} - 0:invalid
     * @return {number} - 1:local file
     * @return {number} - 2:net file with parsed url
     * @return {number} - 3:net file with id
     */
    if (this.src) {
        return this.src[0] == 'h' ? 2 : 1;
    } else {
        return this.id ? 3 : 0;
    }
}
exports.song = song;
