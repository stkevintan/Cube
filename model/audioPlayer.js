/**
 * Created by kevin on 15-5-15.
 */
var AV = require('av');
var mp3 = require('mp3');
var player = AV.Player.fromURL('http://7xiyak.com1.z0.glb.clouddn.com/MySoul.mp3');
player.play();
player.on('error', function (err) {
    console.log('err', err);
});