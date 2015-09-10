//var titlebar = require('titlebar')();
var __ = require('./libs/Utils');
var ipc = require('ipc');
//component
var Sidebar = require('./assets/js/partial/sidebar');
//var Footer  = require('./assets/js/partial/footer');
window.nowOpenedDropdown = null;
window.onload = function() {
    console.log('render process initialization');
    ipc.send('load-source');
    console.log(document.querySelector('#body .sidebar'));
    //load component
    console.log(Sidebar);
    React.render(Sidebar,document.querySelector('#body .sidebar'));
    //React.render(Footer,document.querySelector('#footer'));
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
