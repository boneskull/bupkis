---
title: Function Assertions
group: Assertions
---

# Function Assertions

These assertions test functions, their behavior, and properties.

## to be a function

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

## to be an async function

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

## to be a class

> _Aliases: `to be a class`, `to be a constructor`_

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

## to have arity

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

## to throw

**Success**:

```js
expect(() => {
  throw new Error('Something went wrong');
}, 'to throw');

expect(() => {
  JSON.parse('invalid json');
}, 'to throw');
```

**Failure**:

```js
expect(() => {
  return 'all good';
}, 'to throw');
// AssertionError: Expected function to throw
```

**Negation**:

```js
expect(() => {
  return 'all good';
}, 'not to throw');
```

## to throw a / to throw an

> _Aliases: `to throw a`, `to throw an`_

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

## to throw (with parameter)

**Success**:

```js
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
expect(
  () => {
    throw new Error('Different message');
  },
  'not to throw',
  'Specific error message',
);
```

## to throw satisfying

> _Aliases: `to throw a`, `to throw an satisfying`_

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
