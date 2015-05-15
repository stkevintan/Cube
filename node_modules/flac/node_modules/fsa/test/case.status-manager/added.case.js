//in
var ChangeManager = require(tc.fixPath('../../lib/change-manager.js')).ChangeManager;

var cm = new ChangeManager({
    added: ['a', 'b/', 'c'],
    deleted: [],
    modified: []
});

tc.out(cm.getAddedFiles());
tc.out(cm.getAddedDirs());
//out
a,c
b/