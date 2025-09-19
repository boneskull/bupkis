---
title: Error Assertions
category: Assertions
---

## Error Assertions

These assertions test `Error` objects and their properties. If the subject _looks like_ an `Error` but is not an instance of `Error`, these assertions will be unavailable.

### `{unknown} to be an Error`

> ✏️ Aliases:
>
>     {unknown} to be an Error
>     {unknown} to be a Error

**Success**:

```js
expect(new Error(), 'to be an Error');
expect(new TypeError(), 'to be an Error');
expect(new RangeError('Invalid range'), 'to be an Error');
```

**Failure**:

```js
expect('error message', 'to be an Error');
// AssertionError: Expected 'error message' to be an Error
```

**Negation**:

```js
expect('error message', 'not to be an Error');
```

### `{Error} to have message {string}`

**Success**:

```js
const error = new Error('Something went wrong');
expect(error, 'to have message', 'Something went wrong');

const typeError = new TypeError('Invalid type');
expect(typeError, 'to have message', 'Invalid type');
```

**Failure**:

```js
const error = new Error('Actual message');
expect(error, 'to have message', 'Expected message');
// AssertionError: Expected Error to have message 'Expected message'
```

**Negation**:

```js
expect(error, 'not to have message', 'Expected message');
```

### `{Error} to have message matching {RegExp}`

**Success**:

```js
const error = new Error('File not found: /path/to/file.txt');
expect(error, 'to have message matching', /File not found/);
expect(error, 'to have message matching', /\.txt$/);
```

**Failure**:

```js
const error = new Error('Something went wrong');
expect(error, 'to have message matching', /File not found/);
// AssertionError: Expected Error message to match /File not found/
```

**Negation**:

```js
expect(error, 'not to have message matching', /File not found/);
```
