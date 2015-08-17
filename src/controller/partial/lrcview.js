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
