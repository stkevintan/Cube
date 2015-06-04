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
        return Object.prototype.toString.call(v) === '[object ' + name + ']';
    }
}
exports.isNumber = isType('Number');
exports.isObject = isType('Object');
exports.isFunction = isType('Function');
exports.isString = isType('String');
exports.isUndefined = isType('Undefined');
exports.isBoolean = isType('Boolean');
exports.isArray = isType('Array');