/**
 * Created by kevin on 15-5-16.
 */
//var AV = require('av');
//require('mp3');
////var player = AV.Player.fromURL('http://m1.music.126.net/TBoKsx7h2bI3nNjHsATcLw==/2064882836976747.mp3');
////var player = AV.Player.fromFile('/home/kevin/EverEternity.mp3');
//player.play();
//player.on('error', function (err) {
//    console.log(err);
//});
var http = require('http');
http.get('http://m1.music.126.net/TBoKsx7h2bI3nNjHsATcLw==/2064882836976747.mp3', function(res) {
    res.on('data', function(chunk) {
        console.log(chunk.toString());
    });
});