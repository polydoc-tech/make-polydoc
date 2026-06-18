function mergeDeep(target, source) {
    // Powers the Advanced (JSON) escape hatch: deep-merge with source winning,
    // nested plain objects merged recursively, scalars and arrays overwritten,
    // so any API field not surfaced as a control is still reachable.
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
        // The advanced JSON is user-supplied; skip prototype-pollution keys.
        if (key === '__proto__' || key === 'constructor' || key === 'prototype') continue;
        var value = source[key];
        if (isPlainObject(value) && isPlainObject(out[key])) {
            out[key] = mergeDeep(out[key], value);
        } else {
            out[key] = value;
        }
    }
    return out;
}
