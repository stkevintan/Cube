//in
var DirCache = require(tc.fixPath('../../lib/dir-cache.js')).DirCache;
var dc = new DirCache('tmp', '.test');
dc.load(function (data, changeManager) {
    tc.out(data || 'empty');
    tc.out(JSON.stringify(changeManager.getChanges()));
    tc.finish();
});
//out
empty
{"modified":[],"added":["1"],"deleted":[]}