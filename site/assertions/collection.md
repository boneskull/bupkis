---
title: Collections Assertions
category: Assertions
---

## Collection Assertions

These assertions test collections like arrays, Maps, Sets, and their properties.

### {unknown} to be an array

> ✏️ Aliases:
>
>     {unknown} to be an array
>     {unknown} to be array

**Success**:

```js
expect([], 'to be an array');
expect([1, 2, 3], 'to be an array');
expect(new Array(5), 'to be an array');
```

**Failure**:

```js
expect('hello', 'to be an array');
// AssertionError: Expected 'hello' to be an array
```

**Negation**:

```js
expect('hello', 'not to be an array');
```

### {arraylike} to be empty

**Success**:

```js
expect([], 'to be empty');
```

**Failure**:

```js
expect([1, 2, 3], 'to be empty');
// AssertionError: Expected [1, 2, 3] to be empty
```

**Negation**:

```js
expect([1, 2, 3], 'not to be empty');
```

### {array} to have length {nonnegative-integer}

> ✏️ Aliases:
>
>     {array} to have length {nonnegative-integer}
>     {array} to have size {nonnegative-integer}

**Success**:

```js
expect([1, 2, 3], 'to have length', 3);
```

**Failure**:

```js
expect([1, 2], 'to have length', 3);
// AssertionError: Expected [1, 2] to have length 3
```

**Negation**:

```js
expect([1, 2], 'not to have length', 3);
```

### {arraylike} to be non-empty

Functionally equivalent to [`not to be empty`](#arraylike-to-be-empty).

**Success**:

```js
expect([1, 2, 3], 'to be non-empty');
expect('hello', 'to be non-empty');
```

**Failure**:

```js
expect([], 'to be non-empty');
// AssertionError: Expected [] to be non-empty
```

**Negation**:

```js
expect([], 'not to be non-empty');
```

### {array} to contain {any}

> ✏️ Aliases:
>
>     {array} to contain {any}
>     {array} to include {any}

**Success**:

```js
expect([1, 2, 3], 'to contain', 2);
expect(['a', 'b', 'c'], 'to include', 'b');
```

**Failure**:

```js
expect([1, 2, 3], 'to contain', 5);
// AssertionError: Expected [1, 2, 3] to contain 5
```

**Negation**:

```js
expect([1, 2, 3], 'not to contain', 5);
```

### {array} to deep equal {array}

See [{unknown} to deep equal {any}](equality.md#unknown-to-deep-equal-any) in Equality & Comparison Assertions.

### {array} to satisfy {any}

See [{unknown} to satisfy {any}](equality.md#unknown-to-satisfy-any) in Equality & Comparison Assertions.

### {Map} to contain {any}

> ✏️ Aliases:
>
>     {Map} to contain {any}
>     {Map} to include {any}

**Success**:

```js
const map = new Map([
  ['key1', 'value1'],
  ['key2', 'value2'],
]);
expect(map, 'to contain', 'key1');
expect(map, 'to include', 'key2');
```

**Failure**:

```js
const map = new Map([['key1', 'value1']]);
expect(map, 'to contain', 'key3');
// AssertionError: Expected Map to contain 'key3'
```

**Negation**:

```js
expect(map, 'not to contain', 'key3');
```

### {Map} to have size {nonnegative-integer}

**Success**:

```js
const map = new Map([
  ['a', 1],
  ['b', 2],
]);
expect(map, 'to have size', 2);
```

**Failure**:

```js
const map = new Map([['a', 1]]);
expect(map, 'to have size', 2);
// AssertionError: Expected Map to have size 2
```

**Negation**:

```js
expect(map, 'not to have size', 2);
```

### {Map} to be empty

**Success**:

```js
expect(new Map(), 'to be empty');
```

**Failure**:

```js
const map = new Map([['a', 1]]);
expect(map, 'to be empty');
// AssertionError: Expected Map to be empty
```

**Negation**:

```js
expect(map, 'not to be empty');
```

### {Map} to deep equal {Map}

See [{unknown} to deep equal {any}](equality.md#unknown-to-deep-equal-any) in Equality & Comparison Assertions.

### {Map} to satisfy {any}

See [{unknown} to satisfy {any}](equality.md#unknown-to-satisfy-any) in Equality & Comparison Assertions.

### {Set} to contain {any}

> ✏️ Aliases:
>
>     {Set} to contain {any}
>     {Set} to include {any}

**Success**:

```js
const set = new Set([1, 2, 3]);
expect(set, 'to contain', 2);
expect(set, 'to include', 3);
```

**Failure**:

```js
const set = new Set([1, 2, 3]);
expect(set, 'to contain', 5);
// AssertionError: Expected Set to contain 5
```

**Negation**:

```js
expect(set, 'not to contain', 5);
```

### {Set} to have size {nonnegative-integer}

**Success**:

```js
const set = new Set([1, 2, 3]);
expect(set, 'to have size', 3);
```

**Failure**:

```js
const set = new Set([1, 2]);
expect(set, 'to have size', 3);
// AssertionError: Expected Set to have size 3
```

**Negation**:

```js
expect(set, 'not to have size', 3);
```

### {Set} to be empty

**Success**:

```js
expect(new Set(), 'to be empty');
```

**Failure**:

```js
const set = new Set([1, 2, 3]);
expect(set, 'to be empty');
// AssertionError: Expected Set to be empty
```

**Negation**:

```js
expect(set, 'not to be empty');
```

### {Set} to deep equal {Set}

See [{unknown} to deep equal {any}](equality.md#unknown-to-deep-equal-any) in Equality & Comparison Assertions.

### {Set} to satisfy {any}

See [{unknown} to satisfy {any}](equality.md#unknown-to-satisfy-any) in Equality & Comparison Assertions.

### {unknown} to be a Set

**Success**:

```js
expect(new Set(), 'to be a Set');
expect(new Set([1, 2, 3]), 'to be a Set');
```

**Failure**:

```js
expect([1, 2, 3], 'to be a Set');
// AssertionError: Expected [1, 2, 3] to be a Set
```

**Negation**:

```js
expect([1, 2, 3], 'not to be a Set');
```

### {WeakMap} to contain {object | symbol}

> ✏️ Aliases:
>
>     {WeakMap} to contain {object | symbol}
>     {WeakMap} to include {object | symbol}

**Success**:

```js
const obj = {};
const wm = new WeakMap([[obj, 'value']]);
expect(wm, 'to contain', obj);
```

**Failure**:

```js
const obj1 = {},
  obj2 = {};
const wm = new WeakMap([[obj1, 'value']]);
expect(wm, 'to contain', obj2);
// AssertionError: Expected WeakMap to contain object
```

**Negation**:

```js
expect(wm, 'not to contain', obj2);
```

### {unknown} to be a WeakMap

**Success**:

```js
expect(new WeakMap(), 'to be a WeakMap');
```

**Failure**:

```js
expect(new Map(), 'to be a WeakMap');
// AssertionError: Expected Map to be a WeakMap
```

**Negation**:

```js
expect(new Map(), 'not to be a WeakMap');
```

### {WeakSet} to contain {object | symbol}

> ✏️ Aliases:
>
>     {WeakSet} to contain {object | symbol}
>     {WeakSet} to include {object | symbol}

**Success**:

```js
const obj = {};
const ws = new WeakSet([obj]);
expect(ws, 'to contain', obj);
```

**Failure**:

```js
const obj1 = {},
  obj2 = {};
const ws = new WeakSet([obj1]);
expect(ws, 'to contain', obj2);
// AssertionError: Expected WeakSet to contain object
```

**Negation**:

```js
expect(ws, 'not to contain', obj2);
```

### {unknown} to be a WeakSet

**Success**:

```js
expect(new WeakSet(), 'to be a WeakSet');
```

**Failure**:

```js
expect(new Set(), 'to be a WeakSet');
// AssertionError: Expected Set to be a WeakSet
```

**Negation**:

```js
expect(new Set(), 'not to be a WeakSet');
```

### {Map | Set | Array} to have values satisfying {any}

> ✏️ Aliases:
>
>     {Map | Set | Array} to have values satisfying {any}
>     {Map | Set | Array} to contain values satisfying {any}

Asserts that **all** values in a Map, Set, or Array individually satisfy the
expected shape. Uses partial/satisfy semantics (same as `'to satisfy'`). Empty
collections pass vacuously.

For `Map`, the **values** (not the keys) are checked. Use [`{Map} to have keys satisfying`](#map-to-have-keys-satisfying-any) to check Map keys.

**Success**:

```js
expect([1, 2, 3], 'to have values satisfying', expect.it('to be a number'));
expect(
  new Set(['a', 'b']),
  'to contain values satisfying',
  expect.it('to be a string'),
);

const map = new Map([
  ['x', 10],
  ['y', 20],
]);
expect(map, 'to have values satisfying', expect.it('to be a number')); // checks 10 and 20
```

**Failure**:

```js
expect([1, 'two', 3], 'to have values satisfying', expect.it('to be a number'));
// AssertionError: Expected all values to satisfy …, but value at index 1 did not match: 'two'
```

**Negation**:

```js
expect(
  [1, 'two', 3],
  'not to have values satisfying',
  expect.it('to be a number'),
);
```

### {Map | Set | Array} to have values exhaustively satisfying {any}

Asserts that **all** values in a Map, Set, or Array individually match with
deep equality. Extra properties on object values cause failure. Empty
collections pass vacuously.

**Success**:

```js
expect([{ a: 1 }, { a: 1 }], 'to have values exhaustively satisfying', {
  a: 1,
});
```

**Failure**:

```js
expect([{ a: 1, b: 2 }], 'to have values exhaustively satisfying', { a: 1 });
// AssertionError: Expected all values to exhaustively satisfy …, but value at index 0 did not match
```

**Negation**:

```js
expect([{ a: 1, b: 2 }], 'not to have values exhaustively satisfying', {
  a: 1,
});
```

### {Map | Set | Array} to have a value satisfying {any}

> ✏️ Aliases:
>
>     {Map | Set | Array} to have a value satisfying {any}
>     {Map | Set | Array} to have value satisfying {any}
>     {Map | Set | Array} to contain a value satisfying {any}

Asserts that **at least one** value in a Map, Set, or Array satisfies the
expected shape. Uses partial/satisfy semantics. Fails on empty collections.

**Success**:

```js
expect(
  [1, 'two', true],
  'to have a value satisfying',
  expect.it('to be a string'),
);
expect(
  new Set([1, 'hello']),
  'to contain a value satisfying',
  expect.it('to be a string'),
);
```

**Failure**:

```js
expect([1, 2, 3], 'to have a value satisfying', expect.it('to be a string'));
// AssertionError: Expected collection to have a value satisfying …, but none matched
```

**Negation**:

```js
expect(
  [1, 2, 3],
  'not to have a value satisfying',
  expect.it('to be a string'),
);
```

### {Map | Set | Array} to have a value exhaustively satisfying {any}

> ✏️ Aliases:
>
>     {Map | Set | Array} to have a value exhaustively satisfying {any}
>     {Map | Set | Array} to have value exhaustively satisfying {any}

Asserts that **at least one** value in a Map, Set, or Array exhaustively
matches the expected value (deep equality, no extra properties). Fails on
empty collections.

**Success**:

```js
expect([{ a: 1 }, { a: 1, b: 2 }], 'to have a value exhaustively satisfying', {
  a: 1,
});
// passes — first element exactly matches { a: 1 }
```

**Failure**:

```js
expect([{ a: 1, b: 2 }], 'to have a value exhaustively satisfying', { a: 1 });
// AssertionError: Expected collection to have a value exhaustively satisfying …, but none matched
```

**Negation**:

```js
expect([{ a: 1, b: 2 }], 'not to have a value exhaustively satisfying', {
  a: 1,
});
```

### {Map} to have keys satisfying {any}

> ✏️ Aliases:
>
>     {Map} to have keys satisfying {any}
>     {Map} to have props satisfying {any}
>     {Map} to have properties satisfying {any}
>     {Map} to have fields satisfying {any}
>     {Map} to contain keys satisfying {any}
>     {Map} to contain props satisfying {any}
>     {Map} to contain properties satisfying {any}
>     {Map} to contain fields satisfying {any}

Asserts that **all** keys in a Map individually satisfy the expected shape.
Uses partial/satisfy semantics. Empty Maps pass vacuously.

**Success**:

```js
const map = new Map([
  ['foo', 1],
  ['bar', 2],
]);
expect(map, 'to have keys satisfying', expect.it('to be a string'));
```

**Failure**:

```js
const map = new Map([
  [1, 'a'],
  ['two', 'b'],
]);
expect(map, 'to have keys satisfying', expect.it('to be a string'));
// AssertionError: Expected all Map keys to satisfy …, but key at index 0 did not match: 1
```

**Negation**:

```js
expect(map, 'not to have keys satisfying', expect.it('to be a string'));
```

### {Map} to have keys exhaustively satisfying {any}

> ✏️ Aliases:
>
>     {Map} to have keys exhaustively satisfying {any}
>     {Map} to have props exhaustively satisfying {any}
>     {Map} to have properties exhaustively satisfying {any}
>     {Map} to have fields exhaustively satisfying {any}

Asserts that **all** keys in a Map individually match with deep equality. Empty
Maps pass vacuously.

**Success**:

```js
const map = new Map([['only', 1]]);
expect(map, 'to have keys exhaustively satisfying', 'only');
```

**Failure**:

```js
const map = new Map([
  ['a', 1],
  ['b', 2],
]);
expect(map, 'to have keys exhaustively satisfying', 'a');
// AssertionError: Expected all Map keys to exhaustively satisfy …
```

**Negation**:

```js
expect(map, 'not to have keys exhaustively satisfying', 'a');
```

### {Map} to have a key satisfying {any}

> ✏️ Aliases:
>
>     {Map} to have a key satisfying {any}
>     {Map} to have key satisfying {any}
>     {Map} to have a prop satisfying {any}
>     {Map} to have prop satisfying {any}
>     {Map} to have a property satisfying {any}
>     {Map} to have property satisfying {any}
>     {Map} to have a field satisfying {any}
>     {Map} to have field satisfying {any}

Asserts that **at least one** key in a Map satisfies the expected shape. Fails
on empty Maps.

**Success**:

```js
const map = new Map([
  [1, 'a'],
  ['two', 'b'],
]);
expect(map, 'to have a key satisfying', expect.it('to be a string')); // 'two' matches
```

**Failure**:

```js
const map = new Map([
  [1, 'a'],
  [2, 'b'],
]);
expect(map, 'to have a key satisfying', expect.it('to be a string'));
// AssertionError: Expected Map to have a key satisfying …, but none matched
```

**Negation**:

```js
expect(map, 'not to have a key satisfying', expect.it('to be a string'));
```

### {Map} to have a key exhaustively satisfying {any}

> ✏️ Aliases:
>
>     {Map} to have a key exhaustively satisfying {any}
>     {Map} to have key exhaustively satisfying {any}
>     {Map} to have a prop exhaustively satisfying {any}
>     {Map} to have prop exhaustively satisfying {any}
>     {Map} to have a property exhaustively satisfying {any}
>     {Map} to have property exhaustively satisfying {any}
>     {Map} to have a field exhaustively satisfying {any}
>     {Map} to have field exhaustively satisfying {any}

Asserts that **at least one** key in a Map exhaustively matches the expected
value. Fails on empty Maps.

**Success**:

```js
const map = new Map([
  ['foo', 1],
  ['bar', 2],
]);
expect(map, 'to have a key exhaustively satisfying', 'foo');
```

**Failure**:

```js
const map = new Map([['foo', 1]]);
expect(map, 'to have a key exhaustively satisfying', 'bar');
// AssertionError: Expected Map to have a key exhaustively satisfying …, but none matched
```

**Negation**:

```js
expect(map, 'not to have a key exhaustively satisfying', 'bar');
```
