---
title: Async Assertions
category: Assertions
---

## Async Assertions

These assertions test Promises and asynchronous operations. Use `expectAsync()` for these assertions.

### to resolve

> _Aliases: `to resolve`, `to fulfill`_

**Success**:

```js
await expectAsync(Promise.resolve(42), 'to resolve');
await expectAsync(Promise.resolve('success'), 'to fulfill');

// With async functions
await expectAsync(async () => 'result', 'to resolve');
```

**Failure**:

```js
await expectAsync(Promise.reject('error'), 'to resolve');
// AssertionError: Expected Promise to resolve
```

**Negation**:

```js
await expectAsync(Promise.reject('error'), 'not to resolve');
```

### to reject

**Success**:

```js
await expectAsync(Promise.reject('error'), 'to reject');
await expectAsync(Promise.reject(new Error('failed')), 'to reject');

// With async functions
await expectAsync(async () => {
  throw new Error('async error');
}, 'to reject');
```

**Failure**:

```js
await expectAsync(Promise.resolve(42), 'to reject');
// AssertionError: Expected Promise to reject
```

**Negation**:

```js
await expectAsync(Promise.resolve(42), 'not to reject');
```

### to reject with a &lt;constructor&gt;

> _Aliases: `to reject with a <constructor>`_

**Success**:

```js
await expectAsync(
  Promise.reject(new TypeError('Type error')),
  'to reject with a',
  TypeError,
);

await expectAsync(
  Promise.reject(new Error('Generic error')),
  'to reject with an',
  Error,
);
```

**Failure**:

```js
await expectAsync(
  Promise.reject(new TypeError('Type error')),
  'to reject with a',
  RangeError,
);
// AssertionError: Expected Promise to reject with a RangeError
```

**Negation**:

```js
await expectAsync(
  Promise.reject(new TypeError('Type error')),
  'not to reject with a',
  RangeError,
);
```

### to reject with error satisfying &lt;any&gt;

> _See also: [`to satisfy <any>`](objects.md#to-satisfy-)_

**Success**:

```js
// String matching
await expectAsync(
  Promise.reject(new Error('Specific error')),
  'to reject with',
  'Specific error',
);

// RegExp matching
await expectAsync(
  Promise.reject(new Error('Error: Something failed')),
  'to reject with',
  /Something failed/,
);

// Object matching
await expectAsync(
  Promise.reject({ message: 'Custom error', code: 500 }),
  'to reject with',
  { message: 'Custom error' },
);
```

**Failure**:

```js
await expectAsync(
  Promise.reject(new Error('Different error')),
  'to reject with',
  'Specific error',
);
// AssertionError: Expected Promise to reject with 'Specific error'
```

**Negation**:

```js
await expectAsync(
  Promise.reject(new Error('Different error')),
  'not to reject with',
  'Specific error',
);
```

### to fulfill with value satisfying &lt;any&gt;

> _Aliases: `to fulfill with value satisfying <any>`, `to resolve to value satisfying <any>`_

> _See also: [`to satisfy <any>`](objects.md#to-satisfy-)_

**Success**:

```js
// String matching
await expectAsync(
  Promise.resolve('Hello World'),
  'to fulfill with value satisfying',
  'Hello World',
);

// RegExp matching
await expectAsync(
  Promise.resolve('Success: Operation completed'),
  'to resolve to value satisfying',
  /Success/,
);

// Object matching
await expectAsync(
  Promise.resolve({ status: 'ok', data: [1, 2, 3] }),
  'to fulfill with value satisfying',
  { status: 'ok' },
);
```

**Failure**:

```js
await expectAsync(
  Promise.resolve('Different value'),
  'to fulfill with value satisfying',
  'Expected value',
);
// AssertionError: Expected Promise to resolve to value satisfying 'Expected value'
```

**Negation**:

```js
await expectAsync(
  Promise.resolve('Different value'),
  'not to fulfill with value satisfying',
  'Expected value',
);
```
