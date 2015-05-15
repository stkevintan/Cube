//in
var DirCache = require(tc.fixPath('../../lib/dir-cache.js')).DirCache;
var dc = new DirCache('tmp', '.test');
dc.load(function (data, status) {
    dc.save('test', function () {
        var dc2 = new DirCache('tmp', '.test');
        dc2.load(function (data, changeManager) {
            tc.out(data);
            tc.finish();    
        });
    })
});
//out
test