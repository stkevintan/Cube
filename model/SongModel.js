/**
 * Created by kevin on 15-5-18.
 */
module.exports = function SongModel(rawData) {
    this.id = rawData.id;
    this.src = rawData.src;
    this.pic = rawData.pic;
    this.artist = rawData.artist || '未知';
    this.album = rawData.album || '未知';
    this.title = rawData.title;
}