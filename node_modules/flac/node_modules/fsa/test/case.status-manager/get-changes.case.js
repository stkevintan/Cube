//in
var ChangeManager = require(tc.fixPath('../../lib/change-manager.js')).ChangeManager;

var changes = {
    added: ['a', 'b/', 'c'],
    deleted: [],
    modified: []
};
var cm = new ChangeManager(changes);
tc.out(JSON.stringify(cm.getChanges()));
//out
{"added":["a","b/","c"],"deleted":[],"modified":[]}