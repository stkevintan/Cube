var titlebar = require('titlebar')();
var __ = require('./libs/Utils');
var EventEmitter = require('events').EventEmitter;
var emitter = new EventEmitter();
var ipc = require('ipc');
var nowOpenedDropdown = null;
window.onload = function() {
  console.log('render process initialization');
  console.log('start load sources');
  ipc.send('load-source');
  ipc.on('source-loaded',function(source){
    console.log('render-process',source);
  })
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
