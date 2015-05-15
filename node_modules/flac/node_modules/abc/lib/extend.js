/**
 * Extend origin object by values from pathes.
 *
 * @param {Object} origin Origin to be extended. It mutates during execution.
 * @param {Object} patchN One or more patch objects.
 * @param {Boolean} recurcive If true extend will be recursive: subobjects will
 *      be updated by extend function, not just by overwriting.
 * @returns {Object} Extended origin.
 */
var extend = module.exports = function (origin, patch1 /*, ..., patchN */, recursive) {
    var patches = Array.prototype.slice.call(arguments, 1);
    var isRecursive = typeof patches[patches.length - 1] == 'boolean' ?
            patches.pop() :
            false;

    patches
        .filter(Boolean)
        .forEach(function (patch) {
            Object
                .keys(patch)
                .forEach(function (key) {
                    if (isRecursive &&
                        typeof origin[key] == 'object' &&
                        typeof patch[key] == 'object'
                    ) {
                        extend(origin[key], patch[key], true);
                    } else {
                        origin[key] = patch[key];
                    }
                });
        });

    return origin;
}
