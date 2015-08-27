var app = require('app'); // Module to control application life.
var BrowserWindow = require('browser-window'); // Module to create native browser window.
var ipc = require('ipc');
var async = require('async');
var Storage = require('./libs/Storage');
var st = new Storage();
//set config to global
global.config = st.get('config') || {};
var MP = require('./libs/Mapping');
var __ = require('./libs/Utils');
require('crash-reporter').start();

var win = null;
var loadSrc = function(sender) {
  var loading = false;
  var loadQue = new __.queue();
  function load(opts, cb) {
    var loadKeys = [];
    if (!opts) loadKeys = Object.keys(MP);
    else loadKeys = Object.keys(opts).filter(function(key) {
        return (key in MP) && opts[key];
      });
    //load sources async
    async.each(loadKeys, function(key, callback) {
      //need bind ?
      MP[key].loader(function(err,entryList){
        if(err){
          err.name=MP[key].name;
          callback(err);
          sender.send('source-load-error', err);
        }
        else {
          MP[key].entryList=entryList;
          callback(null);
          console.log('source',__.inspect(MP[key],{depth:null}));
          sender.send('source-loaded', MP[key]);
        }
      });
    }, function(err){
      console.warn('Failed to Load Source',err.stack,err);
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
};

// Quit when all windows are closed.
app.on('window-all-closed', function() {
  if (process.platform != 'darwin') {
    app.quit();
  }
});

app.on('ready', function() {
  // Create the browser window.
  win = new BrowserWindow({width: 1200, height: 600});
  ipc.on('load-source',function(event,args){
    (loadSrc(event.sender))(args);
  });
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
