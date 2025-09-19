---
title: Equality & Comparison Assertions
category: Assertions
---

## Equality & Comparison Assertions

These assertions test equality, identity, and value comparisons.

### `{unknown} to equal {any}`

> ✏️ Aliases:
>
>     {unknown} to equal {any}
>     {unknown} to be {any}
>     {unknown} equals {any}
>     {unknown} is {any}
>     {unknown} is equal to {any}
>     {unknown} to strictly equal {any}
>     {unknown} is strictly equal to {any}

**Success**:

```js
expect(42, 'to be', 42);
expect('hello', 'to equal', 'hello');
expect(true, 'is', true);
expect(null, 'is equal to', null);
```

**Failure**:

```js
expect(42, 'to be', '42');
// AssertionError: Expected 42 to be '42'
expect({}, 'to equal', {});
// AssertionError: Expected {} to equal {}
```

**Negation**:

```js
expect(42, 'not to be', '42');
expect({}, 'not to equal', {});
```

### `{unknown} to deep equal {any}`

> ✏️ Aliases:
>
>     {unknown} to deep equal {any}
>     {unknown} to deep equal {any}

**Success**:

```js
expect({ a: 1, b: 2 }, 'to deep equal', { a: 1, b: 2 });
expect([1, 2, 3], 'to deeply equal', [1, 2, 3]);
expect({ nested: { value: 42 } }, 'to deep equal', { nested: { value: 42 } });
```

**Failure**:

```js
expect({ a: 1 }, 'to deep equal', { a: 1, b: 2 });
// AssertionError: Expected { a: 1 } to deep equal { a: 1, b: 2 }
```

**Negation**:

```js
expect({ a: 1 }, 'not to deep equal', { a: 1, b: 2 });
```

### `{unknown} to be one of {array}`

**Success**:

```js
expect(2, 'to be one of', [1, 2, 3]);
expect('blue', 'to be one of', ['red', 'green', 'blue']);
```

**Failure**:

```js
expect(5, 'to be one of', [1, 2, 3]);
// AssertionError: Expected 5 to be one of [1, 2, 3]
```

**Negation**:

```js
expect(5, 'not to be one of', [1, 2, 3]);
```

### `{unknown} to be an instance of {constructor}`

> ✏️ Aliases:
>
>     {unknown} to be an instance of {constructor}
>     {unknown} to be a {constructor}
>     {unknown} to be an {constructor}

**Success**:

```js
expect(new Date(), 'to be an instance of', Date);
expect([], 'to be a', Array);
expect('hello', 'to be an instance of', String); // Note: primitive strings work too
```

**Failure**:

```js
expect('hello', 'to be an instance of', Number);
// AssertionError: Expected 'hello' to be an instance of Number
```

**Negation**:

```js
expect('hello', 'not to be an instance of', Number);
```

### `{unknown} to be a {intrinsic-type}`

> ✏️ Aliases:
>
>     {unknown} to be a {intrinsic-type}
>     {unknown} to be an {intrinsic-type}
>     {unknown} to have type {intrinsic-type}

An _intrinsic type_ is a _case-insensitive string_ matching: `string`, `number`, `boolean`, `bigint`, `symbol`, `undefined`, `object`, `function`, `null`, `Map`, `Set`, `WeakMap`, `WeakSet`, `WeakRef`, `Date`, `Error`, `Array`, `RegExp`, `Promise`. This is a mashup of the result of `typeof` and constructor names for built-in types.

**Success**:

```js
expect(new Date(), 'to be a', 'Date');
expect(new Error(), 'to be an', 'Error');
expect([], 'to be an', 'Array');
expect(1, 'to be a', 'number');
```

**Failure**:

```js
expect('hello', 'to be a', Number);
// AssertionError: Expected 'hello' to be a Number
```

**Negation**:

```js
expect('hello', 'not to be a', Number);
```
