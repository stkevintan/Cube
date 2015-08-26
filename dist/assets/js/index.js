var titlebar = require('titlebar')();
var __ = require('./libs/Utils');
var EventEmitter = require('events').EventEmitter;
var emitter = new EventEmitter();
var ipc = require('ipc');
var nowOpenedDropdown = null;
ipc.on('loading-source',function(){
  console.log('loading-source',arguments);
});
ipc.on('entry-loaded',function(){
  console.log('entry-loaded',arguments);
});
ipc.on('entry-error',function(){
  console.log('entry-error',arguments);
});
window.onload = function() {
  console.log('render process initialization');
  //titlebar.appendTo('#titlebar');
  //事件委托
  document.addEventListener('click', function(e) {
    var stack = e.path, target;
    for (var i = 0; i < stack.length - 1; i++) { // no need to check document
      if (stack[i].classList && stack[i].classList.contains('dropdown')) {
        target = stack[i];
        break;
      }
    }
    if (target == nowOpenedDropdown) return;
    if (nowOpenedDropdown) {
      nowOpenedDropdown.classList.remove('open');
      nowOpenedDropdown = null;
    }
    if (target) {
      target.classList.add('open');
      nowOpenedDropdown = target;
    }
  });
}

var showNotice = function(msg) {
  new Notification('网易音乐盒', {
    body: msg
  });
}

var createDOM = function(name, options, inner) {
  var dom = document.createElement(name);
  for (var key in options) {
    dom.setAttribute(key, options[key]);
  }
  if (!__.isUndefinedorNull(inner))
    dom.innerText = inner;
  return dom;
}

var prevent = function(e) {
  if (e && e.preventDefault) {
    e.preventDefault();
    e.stopPropagation();
  }
}

//scrollbar https://github.com/gera2ld/h5player/blob/master/src/player.js
//options:{track:dom,cover:dom,onChange:function,dir:[vertial,horizon(default)]}
function slider(options) {
  this.track = options.track;
  this.cover = options.cover;
  if (options.dir == 'vertial') this.dir = 1;
  this.onChange = options.onChange || new Function();
  this.onUpdate = options.onUpdate || new Function();
  this.track.addEventListener('mousedown', this.startMovingThumb.bind(this));
}
var that = slider.prototype;
slider.prototype.setThumb = function(e, scale, finish) {
  if (e) {
    var rect = this.track.getBoundingClientRect();
    if (this.dir) {
      scale = 1 - (e.clientY - rect.top) / rect.height
    } else scale = (e.clientX - rect.left) / rect.width
  }
  if (scale < 0) scale = 0;
  else if (scale > 1) scale = 1;
  if (this.dir) this.cover.style.height = scale * 100 + '%'
  else this.cover.style.width = scale * 100 + '%';
  this.onUpdate(scale);
  if (finish) this.onChange(scale);
}
slider.prototype.stopMovingThumb = function(e) {
  prevent(e);
  this.setThumb(e, null, true);
  this.track.classList.remove('noAnimate');
  document.removeEventListener('mousemove', this.MovingThumb);
  document.removeEventListener('mouseup', this.stopMovingThumb);
}

slider.prototype.movingThumb = function(e) {
  prevent(e);
  this.setThumb(e);
}
slider.prototype.startMovingThumb = function(e) {
  prevent(e);
  if (e.which == 1) {
    this.track.classList.add('noAnimate');
    this.setThumb(e);
    this.MovingThumb = this.movingThumb.bind(this);
    this.stopMovingThumb = this.stopMovingThumb.bind(this);
    document.addEventListener('mousemove', this.MovingThumb);
    document.addEventListener('mouseup', this.stopMovingThumb);
  }
}

var footer = (function() {
  var self = document.querySelector('#footer');
  var $ = self.querySelector.bind(self);
  var $$ = self.querySelectorAll.bind(self);
  var ret = {};
  var duration = null;
  var dom = {
    playinfo: $('.playinfo'),
    trackWrap: $('.track-wrap'),
    track: $('.track'),
    trackPlayed: $('.track-played'),
    trackBuffered: $('.track-buffered'),
    previous: $('li.previous'),
    play: $('li.play'),
    pause: $('li.pause'),
    next: $('li.next'),
    loop: $('li.loop'),
    loopIcons: $$('li.loop > a'),
    volTrack: $('.vol-track'),
    volCover: $('.vol-cover')
  }
  emitter.on('play-change', function() {

  })
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
    track: dom.track,
    cover: dom.trackPlayed,
    onUpdate: function(scale) {
      dom.trackWrap.dataset.curtime = timeStr(duration * scale);
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
    dom.trackWrap.dataset.duration = timeStr(time);
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

var lrcview = (function() {
  var ret = {};
  var self = document.querySelector('#body .lrcview');
  emitter.on('lrcview-toggle', function(state) {
    if (__.isUndefined(state))
      state = !self.classList.contains('active');
    if (state) {
      self.classList.add('active');
    } else {
      self.classList.remove('active');
    }
  })
})();
