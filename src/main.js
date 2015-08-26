var app = require('app'); // Module to control application life.
var BrowserWindow = require('browser-window'); // Module to create native browser window.
var ipc = require('ipc');
var Storage = require('./libs/Storage');
var st = new Storage();
//set config to global
global.config = st.get('config') || {};
var mapping = require('./libs/Mapping');
var __ = require('./libs/Utils');
var async = require('async');
require('crash-reporter').start();

var win = null;
var loadSrc = (function() {
  var loading = false;
  var loadQue = new __.queue();

  function onEntryLoaded(err, entryList) {
    if (err) {
      win.webContents && win.webContents.send('entry-error', err);
      return;
    }
    if (entryList && __.isArray(entryList) && entryList.length) {
      this.entryList = entryList;
    }
    console.log('entryList',entryList);
    win.webContents && win.webContents.send('entry-loaded', this);
  }

  function onSourceLoaded() {
    console.log('source loaded');
  }

  function load(opts, cb) {
    var loadKeys = [];
    if (!opts)
      loadKeys = Object.keys(mapping);
    else
      loadKeys = Object.keys(opts).filter(function(key) {
        return (key in mapping) && opts[key];
      });
    console.log(opts,mapping,loadKeys);
    //let UI enter loading state
    win.webContents && win.webContents.send('loading-source', loadKeys);
    //load sources async
    async.each(loadKeys, function(key, cb) {
      //need bind ?
      console.log(key,__.inspect(mapping[key].loader));
      mapping[key].loader(onEntryLoaded.bind(mapping[key]));
      cb(null);
    }, function() {
      onSourceLoaded();
      cb(null);
    });
  }

  return function(opts) {
    loadQue.push(opts);
    if (loading) return;
    loading = true;
    async.whilst(function() {
      return !loadQue.empty();
    }, function(cb) {
      load(loadQue.pop(), cb);
    }, function(err) {
      loading = false;
    });
  };
})();

// Quit when all windows are closed.
app.on('window-all-closed', function() {
  if (process.platform != 'darwin') {
    app.quit();
  }
});

app.on('ready', function() {
  // Create the browser window.
  win = new BrowserWindow({width: 1200, height: 600});
  loadSrc();
  // and load the index.html of the app.
  win.loadUrl('file://' + __dirname + '/index.html');
  win.setMenu(null);
  win.openDevTools();
  // Emitted when the window is closed.
  win.on('closed', function() {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null;
  });
});
