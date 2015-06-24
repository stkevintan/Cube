/**
 * Created by kevin on 15-5-18.
 */
module.exports = function SongModel(raw) {
    this.id = raw.id;
    this.src = raw.src;
    this.pic = raw.pic || '';
    this.artist = raw.artist || '未知';
    this.album = raw.album || '未知';
    this.title = raw.title || '未知';
}
