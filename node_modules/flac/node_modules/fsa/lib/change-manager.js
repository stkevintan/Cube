exports.ChangeManager = ChangeManager;

var path = require('path');

function ChangeManager(changes) {
    this._changes = changes;
}

ChangeManager.prototype.getChanges = function () {
    return this._changes;
}

// returned three variants - 'D' - deleted, 'M' - modified, '-' - not modifined.
ChangeManager.prototype.getFileStatus = function (file) {
    var status = '-';

    if (this._changes.modified.indexOf(file) !== -1) {
        status = 'M';
    } else if (this._changes.deleted.indexOf(file) !== -1) {
        status = 'D';
    }

    return status;
}

ChangeManager.prototype.getAddedFiles = function () {
    return this._changes.added.filter(function (line) {
        return line[line.length - 1] !== path.sep;
    })
}

ChangeManager.prototype.getAddedDirs = function () {
    return this._changes.added.filter(function (line) {
        return line[line.length - 1] === path.sep;
    })
}

ChangeManager.prototype.isEmpty = function () {
    return !(this._changes.added.length || this._changes.deleted.length || this._changes.modified.length);
}