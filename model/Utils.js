var base = require('util');

base.binarySearch = function (array, value, compare) {
    var res = -1, l = 0, r = array.length - 1;
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
base.isNumber = isType('Number');
base.isObject = isType('Object');
base.isFunction = isType('Function');
base.isString = isType('String');
base.isUndefined = isType('Undefined');
base.isBoolean = isType('Boolean');
base.isArray = isType('Array');
base.isNull = isType('Null');
base.isUndefinedorNull = function (v) {
    return base.isNull(v) || base.isUndefined(v);
}
module.exports = base;