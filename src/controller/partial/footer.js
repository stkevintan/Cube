var footer = (function() {
    var self = document.querySelector('#footer');
    var $ = self.querySelector.bind(self);
    var $$ = self.querySelectorAll.bind(self);
    var ret = {};
    var duration = null;
    var dom = {
        playinfo: $('.playinfo'),
        playTrackWrap: $('.playtrack'),
        playTrack: $('.playtrack .track'),
        trackPlayed: $('.track-played'),
        trackBuffered: $('.track-buffered'),
        previous: $('li.previous'),
        play: $('li.play'),
        pause: $('li.pause'),
        next: $('li.next'),
        loop: $('li.loop'),
        loopIcons: $$('li.loop > a'),
        volTrack: $('.voltrack .track'),
        volCover: $('.voltrack .track-cover')
    };
    emitter.on('play-change', function() {
    });
    emitter.on('lrcview-toggle', function(state) {
        if (__.isUndefined(state))
            state = !self.classList.contains('active');
        if (state) {
            self.classList.add('active');
        } else {
            self.classList.remove('active');
        }
    });

  emitter.on('play', function() {
    //To Do [call player]
    dom.play.style.display = 'none';
    dom.pause.style.display = 'inline-block';
  });

  emitter.on('pause', function() {
    //To Do [call player]
    dom.pause.style.display = 'none';
    dom.play.style.display = 'inline-block';
  });

  emitter.on('loop-update', function(index) {
    dom.loop.classList.remove('open');
    nowOpenedDropdown = null;
    //NodeList 没有forEach方法
    for (var i = 0; i < dom.loopIcons.length; i++) {
      var icon = dom.loopIcons[i];
      if (i == index) icon.classList.remove('hidden');
      else icon.classList.add('hidden');
    }
    console.log('switch to loop mode:', index);
    //To Do
  });
  var playSlider = new slider({
    track: dom.playTrack,
    cover: dom.trackPlayed,
    onUpdate: function(scale) {
      dom.playTrackWrap.dataset.curtime = timeStr(duration * scale);
    },
    onChange: function(scale) {
      //To Do
      emitter.emit('time-update', ~~(duration * scale));
    }
  });
  var volSlider = new slider({
    track: dom.volTrack,
    cover: dom.volCover,
    dir: 'vertial',
    onUpdate: function(scale) {
      emitter.emit('volume-update', scale);
    }
  })
  ret.setCurTime = function(scale, update) {
    return playSlider.setThumb(null, scale, update);
  }
  ret.setDuration = function(time) {
    duration = time;
    dom.playTrackWrap.dataset.duration = timeStr(time);
  }

  ret.setVolume = function(scale) {
    return volSlider.setThumb(null, scale, false);
  }

  function timeStr(time) {
    if (isNaN(time)) return '??:??';
    var m = Math.floor(time / 60);
    var s = Math.floor(time) % 60;
    if (m < 10) m = '0' + m;
    if (s < 10) s = '0' + s;
    return m + ':' + s;
  }

  ret.setDuration(10);
  ret.setCurTime(0);
  ret.setVolume(0);
  return ret;
})();
