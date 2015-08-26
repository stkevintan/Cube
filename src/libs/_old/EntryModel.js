/**
 * Created by kevin on 15-6-4.
 */
var SongM = require('SongModel');
var model = function(raw) {
  this.name = raw.name;
  this.creator = raw.creator || 'Unknown';
  this.pic = raw.pic;
  this.songList = raw.songList || [];
  // normalize song data in songList
  for (var i = 0; i < this.songList.length; i++) {
    if (!(this.songList[i] instanceof SongM))
      this.songList[i] = new SongM(this.songList[i]);
  }
}
module.exports = model;
