// Deep-merge `source` into `target`; `source` wins. Nested plain objects are
// merged recursively, scalars and arrays overwrite. Powers the Advanced (JSON)
// escape hatch so any API field not surfaced as a control is still reachable.
function mergeDeep(target, source) {
    function isPlainObject(value) {
        return typeof value === 'object' && value !== null && !Array.isArray(value);
    }
    var out = {};
    var key;
    for (key in target) {
        if (Object.prototype.hasOwnProperty.call(target, key)) out[key] = target[key];
    }
    for (key in source) {
        if (!Object.prototype.hasOwnProperty.call(source, key)) continue;
        var value = source[key];
        if (isPlainObject(value) && isPlainObject(out[key])) {
            out[key] = mergeDeep(out[key], value);
        } else {
            out[key] = value;
        }
    }
    return out;
}
