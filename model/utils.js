exports.binarySearch = function (array, value, compare) {
    var res = -1, l = 0, r = array.length;
    if (!compare)compare = function (v) {
        return v
    }
    while (l <= r) {
        var mid = (l + r) >> 1;
        if (compare(array[mid]) <= value) {
            l = mid + 1;
            res = mid;
        } else {
            r = mid - 1;
        }
    }
    return res;
}
var isType = function (name) {
    return function (v) {
        return typeof v === name;
    }
}

exports.isNumber = isType('number');
exports.isObject = isType('object');
exports.isFunction = isType('function');
exports.isString = isType('string');
exports.isUndefined = isType('undefined');
exports.isBoolean = isType('boolean');