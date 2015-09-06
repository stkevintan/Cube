var base = require('util');

base.binarySearch = function(array, value, compare) {
    var res = -1,l = 0,r = array.length - 1;
    if (!compare) compare = function(v) {return v;};
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
};
base.queue = function() {
    this._source = new Array();
    this._front = 0;
};
base.queue.prototype = {
    size: function() {
        return this._source.length - this._front;
    },
    empty: function() {
        return this.size() == 0;
    },
    push: function(a) {
        this._source.push(a);
    },
    pop: function() {
        if (this.empty()) return undefined;
        var ret = this._source[this._front++];
        if ((this._front << 1) >= this._source.length) {
            this._source = this._source.slice(this._front);
            this._front = 0;
        }
        return ret;
    },
    front: function() {
        return this.size() ? this._source[this._front] : undefined;
    }
};

base.extend = function(src, tar) {
    for (var key in src) {
        tar[key] = src[key];
    }
};
var isType = function(name) {
    return function(v) {
        return Object.prototype.toString.call(v) === '[object ' + name + ']';
    };
};
base.isNumber = isType('Number');
base.isObject = isType('Object');
base.isFunction = isType('Function');
base.isString = isType('String');
base.isUndefined = isType('Undefined');
base.isBoolean = isType('Boolean');
//base.isArray = isType('Array');
base.isNull = isType('Null');
base.isUndefinedorNull = function(v) {
    return base.isNull(v) || base.isUndefined(v);
};

module.exports = base;
