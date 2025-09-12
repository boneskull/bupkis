---
title: Function Assertions
category: Assertions
---

## Function Assertions

These assertions test functions, their behavior, and properties.

### to be a function

**Success**:

```js
expect(function () {}, 'to be a function');
expect(() => {}, 'to be a function');
expect(Math.max, 'to be a function');
```

**Failure**:

```js
expect('hello', 'to be a function');
// AssertionError: Expected 'hello' to be a function
```

**Negation**:

```js
expect('hello', 'not to be a function');
```

### to be an async function

**Success**:

```js
expect(async function () {}, 'to be an async function');
expect(async () => {}, 'to be an async function');
```

**Failure**:

```js
expect(function () {}, 'to be an async function');
// AssertionError: Expected function to be an async function
```

**Negation**:

```js
expect(function () {}, 'not to be an async function');
```

### to be a class

> _Aliases: `to be a class`, `to be a constructor`_

> ⚠️ Warning!
>
> It is currently (as of September 2025) _not possible_ to reliably distinguish between classes and regular functions in JavaScript. We can only tell if a function is _constructable_ (i.e., can be called with `new`); we cannot determine if it is specifically a _class constructor_.
>
> Use with caution.

**Success**:

```js
class MyClass {}
expect(MyClass, 'to be a class');
expect(Date, 'to be a constructor');
```

**Failure**:

```js
const fn = function () {};
expect(fn, 'to be a class');
// AssertionError: Expected function to be a class
```

**Negation**:

```js
expect(fn, 'not to be a class');
```

### to have arity &lt;nonnegative-integer&gt;

**Success**:

```js
function add(a, b) {
  return a + b;
}
expect(add, 'to have arity', 2);

const multiply = (x, y, z) => x * y * z;
expect(multiply, 'to have arity', 3);
```

**Failure**:

```js
function greet(name) {
  return `Hello, ${name}!`;
}
expect(greet, 'to have arity', 2);
// AssertionError: Expected function to have arity 2
```

**Negation**:

```js
expect(greet, 'not to have arity', 2);
```

### to throw &lt;matcher&gt;

This assertion _optionally_ accepts a "matcher" which must be a `string`, `RegExp` or a partial `object` structure:

- If omitted, the assertion checks that the function throws _anything_.
- If a `string`, matches the `message` prop of the thrown Error exactly; if a non-error was thrown, the value is coerced to a string and matched directly.
- If a `RegExp`, tests the `message` prop of the thrown Error; if a non-error was thrown, the value is coerced to a string and tested directly.
- If an `object`, ["to satisfy"](./objects.md#to-satisfy-) semantics are used.

**Success**:

```js
expect(() => {
  throw new Error('Something went wrong');
}, 'to throw');

expect(() => {
  JSON.parse('invalid json');
}, 'to throw');

// String matching
expect(
  () => {
    throw new Error('Specific error message');
  },
  'to throw',
  'Specific error message',
);

// RegExp matching
expect(
  () => {
    throw new Error('Error: Something failed');
  },
  'to throw',
  /Something failed/,
);

// Object matching
expect(
  () => {
    throw new Error('Custom error');
  },
  'to throw',
  { message: 'Custom error' },
);
```

**Failure**:

```js
expect(() => {
  return 'all good';
}, 'to throw');
// AssertionError: Expected function to throw

expect(
  () => {
    throw new Error('Different message');
  },
  'to throw',
  'Specific error message',
);
// AssertionError: Expected function to throw 'Specific error message'
```

**Negation**:

```js
expect(() => {
  return 'all good';
}, 'not to throw');

expect(
  () => {
    throw new Error('Different message');
  },
  'not to throw',
  'Specific error message',
);
```

### to throw a &lt;constructor&gt;

> _Aliases: `to throw a <constructor>`, `to throw an <constructor>`_

**Success**:

```js
expect(
  () => {
    throw new TypeError('Type error');
  },
  'to throw a',
  TypeError,
);

expect(
  () => {
    throw new RangeError('Range error');
  },
  'to throw an',
  Error,
); // RangeError extends Error
```

**Failure**:

```js
expect(
  () => {
    throw new TypeError('Type error');
  },
  'to throw a',
  RangeError,
);
// AssertionError: Expected function to throw a RangeError
```

**Negation**:

```js
expect(
  () => {
    throw new TypeError('Type error');
  },
  'not to throw a',
  RangeError,
);
```

### to throw an &lt;error&gt; satisfying &lt;object&gt;

> _Aliases: `to throw a <error> satisfying <object>`, `to throw an <error> satisfying <object>`_

This assertion is a combination of ["to throw a"](#to-throw-a-constructor) and ["to throw"](#to-throw-matcher) (with an object parameter).

**Success**:

```js
expect(
  () => {
    const err = new Error('Custom error');
    err.code = 'CUSTOM_CODE';
    throw err;
  },
  'to throw a',
  Error,
  'satisfying',
  { code: 'CUSTOM_CODE' },
);
```

**Failure**:

```js
expect(
  () => {
    throw new Error('Simple error');
  },
  'to throw a',
  Error,
  'satisfying',
  { code: 'MISSING_CODE' },
);
// AssertionError: Expected thrown error to satisfy { code: 'MISSING_CODE' }
```

**Negation**:

```js
expect(
  () => {
    throw new Error('Simple error');
  },
  'not to throw a',
  Error,
  'satisfying',
  { code: 'MISSING_CODE' },
);
```
