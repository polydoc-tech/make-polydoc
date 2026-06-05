it('merges nested objects without losing sibling keys', () => {
    assert.deepEqual(mergeDeep({ a: { x: 1 }, b: 2 }, { a: { y: 2 } }), { a: { x: 1, y: 2 }, b: 2 });
});

it('overwrites scalars and arrays', () => {
    assert.deepEqual(mergeDeep({ a: 1, list: [1, 2] }, { a: 9, list: [3] }), { a: 9, list: [3] });
});

it('does not mutate the target', () => {
    var target = { a: { x: 1 } };
    mergeDeep(target, { a: { y: 2 } });
    assert.deepEqual(target, { a: { x: 1 } });
});
