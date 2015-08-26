/**
 * Created by kevin on 15-5-5.
 */
var fs = require('fs');
var utils = require('./Utils');
var EntryM = require('./EntryModel');
var process = require('process');
var Database = require('nedb');
var ErrM = require('./ErrorModel');
var db = {};
const APPDIR = home.resolve('~/.CubePlayer/');
db.config = new Database({
  filename: path.join(APPDIR, '/config.db'),
  autoload: true
});
db.scheme = new Database({
  filename: path.join(APPDIR, '/scheme.db'),
  autoload: true
});

function pack(rawEntryList) {
  /**
   * normalize raw entry data in rawEntryList to the instance of EntryModel
   */
  if (!utils.isArray(rawEntryList)) return [];
  // the args of forEach(eg:val,index) are freezed!
  for (var i = 0; i < rawEntryList.length; i++) {
    rawEntryList[i] = new EntryM(rawEntryList[i]);
  }
  return rawEntryList;
}

var fm = {};

const DEFAULTSEARCHLIMIT = 20;
const EXTS = ['.mp3', '.ogg', '.wav'];
const DEFAULTMUSICDIR = (function() {
  var choices = ['音乐', 'Music', 'music'].map(function(e) {
    return home.resolve('~/' + e);
  });
  for (var i = 0; i < choices.length; i++) {
    try {
      var stats = fs.statSync(choices[i]);
    } catch (e) {
      continue;
    }
    if (stats && stats.isDirectory()) return choices[i];
  }
  return choices[0];
})();

var getDefault = function(key) {
  switch (key) {
    case 'musicdir':
      return DEFAULTMUSICDIR;
    case 'searchlimit':
      return DEFAULTSEARCHLIMIT;
    default:
      return '';
  }
}

fm.getConfig = function(key, cb) {
  db.config.findOne({
    key: key
  }, function(err, doc) {
    if (err || !doc || !doc.val) cb(getDefault(key));
    else cb(doc.val);
  });
}
fm.setConfig = function(key, val, cb) {
  fm.getConfig(function(curVal) {
    if (curVal == val) {
      cb && cb(false);
      return;
    }
    db.config.update({
      key: key
    }, {
      $set: {
        val: val
      }
    }, {
      upsert: true
    }, function(err) {
      cb && cb(!!err);
    });
  });
}


/*********Local music file**********/
fm.getLocal = function(cb) {
  fm.getMusicDir(function(dir) {
    var ret = fm.loadMusicDirSync();
    if (ret instanceof ErrM) cb(ret);
    else {
      cb(null, pack([{
        name: dir,
        songList: ret
      }]));
    }
  });
}


fm.loadMusicDirSync = function(musicDir) {
  var ret = [];
  var files = [];
  try {
    files = fs.readdirSync(musicDir);
  } catch (e) {
    try {
      fs.mkdirSync(musicDir);
    } catch (e) {
      return new ErrM(
        'failed to read or create dir, please check your permission',
        'loadMusicDir', 1);
    }
  }
  var that = this;
  files = files.map(function(src) {
    return path.join(musicDir, src);
  }).filter(function(src) {
    var stat = fs.statSync(src);
    if (stat && stat.isDirectory()) {
      ret = ret.concat(fm.loadMusicDirSync(src));
      return false;
    }
    return EXTS.indexOf(path.extname(src)) != -1;
  }).forEach(function(src) {
    ret.push({
      name: path.basename(src, src.substr(src.lastIndexOf('.'))),
      src: src
    });
  });
  return ret;
}


/*********Scheme inventory**********/
fm.getScheme = function(cb) {
  db.scheme.find({}, function(err, dos) {
    if (err) callback(new ErrM(err, 'getScheme', 1));
    else {
      callback(null, pack(docs));
    }
  });
}

fm.addScheme = function(entry, cb) {
  if (!(entry instanceof EntryM)) {
    cb && cb(false);
    return;
  }
  db.scheme.insert(entry, function(err) {
    if (!cb) return;
    if (err) cb(false);
    else cb(true);
  });
}

fm.setScheme = function(entry, cb) {
  if (!(entry instanceof EntryM)) {
    cb && cb(false);
    return;
  }
  db.scheme.update({})
}

fm.delScheme = function(plt) {
  if (!(plt instanceof PltM)) {
    console.log('DelScheme failed');
    return;
  }
  scheme.isChanged = 1;
  var index = scheme.indexOf(plt);
  console.log(index);
  if (index != -1) {
    scheme.content.splice(index, 1);
  } else {
    console.log('SetScheme failed');
  }
}

fm.setCookie = function(cookie) {
  config.content.cookie = cookie;
  config.isChanged = 1;
}

fm.getCookie = function() {
  return config.content.cookie;
}

fm.getUserID = function() {
  if (!config.content.cookie) return null;
  var ret = /\d+/.exec(config.content.cookie[3]);
  return ret ? ret[0] : null;
};
module.exports = fm;
