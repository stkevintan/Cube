var abc = require('abc');
var path = require('path');
var fsa = require('fsa');

var CACHE_DIR = '.flac';

exports.find = function (dir, options, callback) {
    var filters = options.filters;
    var noCache = !!options.noCache;
    var cacheDir = options.cacheDir || CACHE_DIR;

    if (noCache) {
        findInDir(dir, '', filters, callback);
    } else {
        var cache = new fsa.DirCache(dir, cacheDir);
        var saveResult = function (newObjects) {
            cache.save(newObjects, function () {
                callback(newObjects);
            })        
        };

        cache.load(function (cachedObjects, changeManager) {
            if (cachedObjects) {
                if (!changeManager.isEmpty()) {
                    loadWithCache(dir, filters, cachedObjects, changeManager, saveResult);
                } else {
                    callback(cachedObjects);
                }
            } else {
                findInDir(dir, '', filters, saveResult);
            }        
        });    
    }
}

exports.clearCache = function (dir, options, callback) {
    if (arguments.length === 2) {
        callback = options;
        options = {};
    }

    var cacheDir = options.cacheDir || CACHE_DIR;

    var cache = new fsa.DirCache(dir, cacheDir);
    cache.remove(callback);
}

function loadWithCache (dir, filters, cachedObjects, changeManager, callback) {
    var newObjects = [];

    abc.async.forEach(
        [
            // check each cached object
            function (callback) {
                checkCachedObjects(dir, cachedObjects, changeManager, function (objects) {
                    newObjects = newObjects.concat(objects);
                    callback();
                });
            },
            // load new modules
            function (callback) {
                loadObjectsFromFiles(dir, changeManager.getAddedFiles(), filters, function (objects) {
                    newObjects = newObjects.concat(objects);
                    callback();
                });
            },
            // find in new directories
            function (callback) {
                abc.async.forEach(
                    changeManager.getAddedDirs(),
                    function (addedDir, callback) {
                        findInDir(dir, addedDir, filters, function (objects) {
                            newObjects = newObjects.concat(objects);
                            callback();
                        })
                    },
                    callback
                );
            }
        ], 
        function () {
            callback(newObjects);
        }
    );
}

function checkCachedObjects (dir, cachedObjects, changeManager, callback) {
    var objects = [];

    abc.async.forEach(
        cachedObjects,
        function (cachedObject, callback) {
            var objectStatus = changeManager.getFileStatus(cachedObject.file);
            /* 
                status can be equals to three value: 
                  'M' - modified, 
                  'D' - deleted, 
                  '-' - not changed.
            */
            if (objectStatus === 'M') {
                // reload modified objects
                loadText(dir, cachedObject.file,
                    function (text) {
                        cachedObject.text = text;
                        objects.push(cachedObject)
                        callback();
                    }
                )
            } else if (objectStatus === '-') {
                // copy unchanged objects
                objects.push(cachedObject);
                callback();
            } else {
                // ignore deleted objects
                callback();
            }
        },
        function () {
            callback(objects);
        }
    );
}

function loadObjectsFromFiles (dir, newFiles, filters, callback) {
    var objects = [];
    abc.async.forEach(
        newFiles,
        function (filePath, callback) {
            var file = path.basename(filePath);
            var isObject = filters.some(function (filter) {

                if (filter.test(file, filePath)) {

                    loadText(dir, filePath, function (text) {
                        objects.push({
                            filter: filter.name,
                            file: filePath,
                            text: text
                        });
                        callback();
                    })                                
                    return true;
                }
            });

            if (!isObject) {
                callback();
            }
        },
        function () {
            callback(objects);
        }
    );
}

function findInDir (rootDir, dir, filters, callback) {
    var objects = [];
    abc.find(
        path.join(rootDir, dir),
        function (file, dirPath) {
            var filePath = path.join(path.relative(rootDir, dirPath), file);
            filters.some(function (filter) {
                if (filter.test(file, filePath)) {
                    objects.push({
                        filter: filter.name,
                        file: filePath
                    });
                    return true;
                }
            })
        },
        function () {
            abc.async.forEach(
                objects, 
                function (object, callback) {
                    loadText(rootDir, object.file, function (text) {
                        object.text = text;
                        callback();
                    });
                }, 
                function () {
                    callback(objects);
                }
            );
        }
    );
}

function loadText (dir, file, callback) {
    var filePath = path.join(dir, file);
    abc.file.read(filePath, callback);
}