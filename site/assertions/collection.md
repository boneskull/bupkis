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
expect('hello', 'to have length', 5);
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

> ✏️ Aliases:
>
>     {Map} to deep equal {Map}
>     {Map} to deeply equal {Map}

Tests that two Maps have the same keys and values using deep equality comparison.

**Success**:

```js
const map1 = new Map([
  ['a', 1],
  ['b', { nested: 'value' }],
]);
const map2 = new Map([
  ['a', 1],
  ['b', { nested: 'value' }],
]);
expect(map1, 'to deep equal', map2);
```

**Failure**:

```js
const map1 = new Map([
  ['a', 1],
  ['b', 2],
]);
const map2 = new Map([
  ['a', 1],
  ['b', 3],
]);
expect(map1, 'to deep equal', map2);
// AssertionError: Expected Map to deep equal Map
```

**Negation**:

```js
const map1 = new Map([['a', 1]]);
const map2 = new Map([['a', 2]]);
expect(map1, 'not to deep equal', map2);
```

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

> ✏️ Aliases:
>
>     {Set} to deep equal {Set}
>     {Set} to deeply equal {Set}

Tests that two Sets have the same values using deep equality comparison.

**Success**:

```js
const set1 = new Set([1, 2, { nested: 'value' }]);
const set2 = new Set([1, 2, { nested: 'value' }]);
expect(set1, 'to deep equal', set2);
```

**Failure**:

```js
const set1 = new Set([1, 2, 3]);
const set2 = new Set([1, 2, 4]);
expect(set1, 'to deep equal', set2);
// AssertionError: Expected Set to deep equal Set
```

**Negation**:

```js
const set1 = new Set([1, 2, 3]);
const set2 = new Set([1, 2, 4]);
expect(set1, 'not to deep equal', set2);
```

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
