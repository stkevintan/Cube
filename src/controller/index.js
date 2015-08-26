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
