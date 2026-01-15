---
title: Equality & Comparison Assertions
category: Assertions
---

## Equality & Comparison Assertions

These assertions test equality, identity, and value comparisons.

### {unknown} to equal {any}

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

### {unknown} to deep equal {any}

> ✏️ Aliases:
>
>     {unknown} to deep equal {any}
>     {unknown} to deeply equal {any}

Tests structural equality between any two values. Works with primitives, objects, arrays, Maps, Sets, and nested structures.

**Success**:

```js
// Primitives
expect(42, 'to deep equal', 42);
expect('hello', 'to deeply equal', 'hello');

// Objects
expect({ a: 1, b: 2 }, 'to deep equal', { a: 1, b: 2 });
expect({ nested: { value: 42 } }, 'to deep equal', { nested: { value: 42 } });

// Arrays
expect([1, 2, 3], 'to deeply equal', [1, 2, 3]);

// Maps
expect(
  new Map([
    ['a', 1],
    ['b', 2],
  ]),
  'to deep equal',
  new Map([
    ['a', 1],
    ['b', 2],
  ]),
);

// Sets
expect(new Set([1, 2, 3]), 'to deeply equal', new Set([1, 2, 3]));
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

### {unknown} to satisfy {any}

> ✏️ Aliases:
>
>     {unknown} to satisfy {any}
>     {unknown} to be like {any}
>     {unknown} satisfies {any}

A loose "deep equal" assertion similar to AVA's `t.like()` or Jest's `expect.objectContaining()`. It checks that the actual value contains _at least_ the properties and values specified in the expected pattern, ignoring additional properties.

**Cross-Type Satisfaction**: This assertion also supports validating properties on any value that has them—including arrays (which have `length`), functions (which have `name`), and constructors (which have static properties).

Any _regular expression_ in a property value position will be used to match the corresponding actual value (which will be coerced into a string). This makes it easy to assert that a string property contains a substring, starts with a prefix, or matches some other pattern.

> Note: The parameter in this assertion is not strongly typed, even though regular expressions and `expect.it()` have special meaning. This is because the parameter can accept _literally any value_.

**Success**:

```js
// Objects satisfying object shapes
expect({ a: 1, b: 2, c: 3 }, 'to satisfy', { a: 1, b: 2 });
expect({ name: 'John', age: 30 }, 'to be like', { name: 'John' });

// Arrays satisfying array shapes
expect([1, 2, 3], 'to satisfy', [1, 2, 3]);

// Arrays satisfying object shapes (cross-type satisfaction)
expect([1, 2, 3], 'to satisfy', { length: 3 });

// Functions satisfying object shapes
expect(function myFn() {}, 'to satisfy', { name: 'myFn' });

// Constructors satisfying object shapes
expect(Promise, 'to satisfy', {
  reject: expect.it('to be a function'),
  resolve: expect.it('to be a function'),
});

// Using regular expressions in property values
expect(
  {
    email: 'user@example.com',
    phone: '+1-555-0123',
    id: 12345,
  },
  'to satisfy',
  {
    email: /^user@/,
    phone: /^\+1-555/,
    id: /123/,
  },
);
```

**Failure**:

```js
expect({ a: 1 }, 'to satisfy', { a: 1, b: 2 });
// AssertionError: Expected { a: 1 } to satisfy { a: 1, b: 2 }
```

**Negation**:

```js
expect({ a: 1 }, 'not to satisfy', { a: 1, b: 2 });
```

### {unknown} to be one of {array}

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

### {unknown} to be an instance of {constructor}

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

### {unknown} to be a {intrinsic-type}

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
