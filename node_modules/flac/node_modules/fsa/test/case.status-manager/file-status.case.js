//in
var ChangeManager = require(tc.fixPath('../../lib/change-manager.js')).ChangeManager;

var cm = new ChangeManager({
    added: ['a', 'b/', 'c'],
    deleted: ['d', 'sub/a'],
    modified: ['sub2/a', 'f', 'g']
});

tc.out(cm.getFileStatus('file'));
tc.out(cm.getFileStatus('b'));
tc.out(cm.getFileStatus('a'));
tc.out(cm.getFileStatus('sub/a'));
tc.out(cm.getFileStatus('sub2/a'));
tc.out(cm.getFileStatus('d'));
tc.out(cm.getFileStatus('f'));
tc.out(cm.getFileStatus('g'));
//out
-
-
-
D
M
D
M
M