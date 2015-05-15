/**
 * Created by kevin on 15-5-15.
 */
exports.module = function () {
    this.artist = ['未知'];
    this.album = '未知';
    this.title = '';
    this.picture = null;
    this.duration = 0;
    this.src = null;
}

/*
 { artist : ['Spor'],
 album : 'Nightlife, Vol 5.',
 albumartist : [ 'Andy C', 'Spor' ],
 title : 'Stronger',
 year : '2010',
 track : { no : 1, of : 44 },
 disk : { no : 1, of : 2 },
 genre : ['Drum & Bass'],
 picture : [ { format : 'jpg', data : <Buffer> } ],
 duration : 302 // in seconds
 }
 */