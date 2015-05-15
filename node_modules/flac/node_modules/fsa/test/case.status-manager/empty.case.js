//in
var ChangeManager = require(tc.fixPath('../../lib/change-manager.js')).ChangeManager;

var cm = new ChangeManager({
    added: [],
    deleted: [],
    modified: []
});
tc.out(cm.isEmpty());

var cm2 = new ChangeManager({
    added: [],
    deleted: ['a'],
    modified: []
});
tc.out(cm2.isEmpty());
//out
true
false