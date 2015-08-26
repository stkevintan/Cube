//reference: https://github.com/atom/atom/blob/master/src/storage-folder.coffee
var fs = require('fs-plus');
var path = require('path');
var _path;

function Storage(root) {
  root = root || '~/CubePlayer';
  _path = fs.normalize(root + '/storage');
}

Storage.prototype = {
  constructor: Storage,
  set: function(key, val) {
    fs.writeFileSync(pathForKey(key), JSON.stringify(val), 'utf8');
  },
  get: function(key) {
    var statePath = pathForKey(key);
    try {
      var stateString = fs.readFileSync(statePath, 'utf8');
    } catch (err) {
      if (!err.code == 'ENOENT')
        console.warn("Error reading file: ", statePath, err.stack, err);
      return;
    }
    try {
      var ret = JSON.parse(stateString);
    } catch (err) {
      console.warn("Error parsing file: ", statePath, err.stack, err);
      return;
    }
    return ret;
  }
}

function pathForKey(key) {
  return path.join(_path, key);
}
module.exports = Storage;
