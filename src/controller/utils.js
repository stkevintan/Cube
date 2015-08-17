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
