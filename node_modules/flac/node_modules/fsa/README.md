# fsa
File system auditor. Shows changes after previous audit session. Works over git.

## Example
Get hash for each file in current directory.
```javascript
var fsa = require('fsa');
var abc = require('abc');
var crypto = require('crypto');
var path = require('path');

var startDate = new Date();
var dc = new fsa.DirCache('.', '.exmpl');

dc.load(function (data, changeManager) {
    processDir(data, changeManager, function (newData) {
        dc.save(newData, function () {
            console.log(JSON.stringify(newData, null, '  '))
            console.log('Done. Time - ' + (new Date() - startDate));
        })
    });
});    

function processDir (cachedData, changeManager, callback) {
    var newData = [];
    abc.async.forEach(
        [
            function (callback) {
                if (cachedData) {
                    checkCachedFiles(cachedData, changeManager, newData, callback)
                } else {
                    callback();
                }
            },
            function (callback) {
                readFiles(changeManager.getAddedFiles(), newData, callback)
            },
            function (callback) {
                readDirs(changeManager.getAddedDirs(), newData, callback)
            }
        ], 
        function () {
            callback(newData);
        }
    );    
}

function checkCachedFiles (cachedData, changeManager, newData, callback) {
    abc.async.forEach(
        cachedData,
        function (file, callback) {
            var fileStatus = changeManager.getFileStatus(file.name);
            if (fileStatus === 'M') {
                readFile(file.name, function (rereadFile) {
                    newData.push(rereadFile);
                    callback();
                })
                return;
            } else if (fileStatus === '-') {
                newData.push(file);
            }
            callback();
        },
        callback
    );
}

function readFile (file, callback) {
    abc.file.read(file, function (text) {
        callback({
            name: file,
            hash: crypto.createHash('md5').update(text).digest('hex')
        });
    })
}

function readFiles (files, newData, callback) {
    abc.async.forEach(
        files,
        function (file, callback) {
            readFile(file, function (readedFile) {
                newData.push(readedFile);
                callback();
            })
        },
        callback
    );
}

function readDirs (dirs, newData, callback) {
    abc.async.forEach(
        dirs,
        function (dir, callback) {
            readDir(dir, newData, callback);
        },
        callback
    );
}

function readDir (dir, newData, callback) {
    var newFiles = []
    abc.find(
        dir,
        function (file, dirPath) {
            newFiles.push(path.join(dirPath, file))
        },
        function () {
            readFiles(newFiles, newData, callback);
        }
    );
}
```