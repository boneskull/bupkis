---
title: Callback Assertions
category: Assertions
---

## Callback Assertions

These assertions test functions that work with callbacks, including Node.js-style error-first callbacks ("nodebacks") and regular callbacks. They verify that functions properly invoke their callbacks and handle the callback values correctly.

> **Note**: Synchronous callback assertions use `expect()`, while asynchronous callback assertions use `expectAsync()`.

### to call callback / to invoke callback

> _Aliases: `to call callback`, `to invoke callback`_

Tests that a function calls its callback parameter.

**Success**:

```js
function withCallback(callback) {
  callback();
}

expect(withCallback, 'to call callback');
expect(withCallback, 'to invoke callback');
```

**Failure**:

```js
function withoutCallback(callback) {
  // callback is never called
}

// This should timeout per the timeout setting in your test runner.
expect(withoutCallback, 'to call callback');
```

**Negation**:

```js
function withoutCallback(callback) {
  // callback is never called
}

// This should timeout per the timeout setting in your test runner.
expect(withoutCallback, 'not to call callback');
```

### to call nodeback / to invoke nodeback

> _Aliases: `to call nodeback`, `to invoke nodeback`_

Tests that a function calls its Node.js-style error-first callback parameter.

**Success**:

```js
function withNodeback(callback) {
  callback(null, 'result');
}

expect(withNodeback, 'to call nodeback');
expect(withNodeback, 'to invoke nodeback');
```

**Failure**:

```js
function withoutNodeback(callback) {
  // callback is never called
}

// This should timeout per the timeout setting in your test runner.
expect(withoutNodeback, 'to call nodeback');
```

**Negation**:

```js
function withoutNodeback(callback) {
  // callback is never called
}

// This should timeout per the timeout setting in your test runner.
expect(withoutNodeback, 'not to call nodeback');
```

### to call callback with / to invoke callback with

> _Aliases: `to call callback with`, `to invoke callback with`_

Tests that a function calls its callback with a specific value.

**Success**:

```js
function withValue(callback) {
  callback('success');
}

function withNumber(callback) {
  callback(42);
}

function withObject(callback) {
  callback({ status: 'ok' });
}

expect(withValue, 'to call callback with', 'success');
expect(withNumber, 'to invoke callback with', 42);
expect(withObject, 'to call callback with', { status: 'ok' });

// Works with RegExp for string values
function withMessage(callback) {
  callback('Error: something went wrong');
}

expect(withMessage, 'to call callback with', /Error:/);
```

**Failure**:

```js
function withWrongValue(callback) {
  callback('failure');
}

expect(withWrongValue, 'to call callback with', 'success');
// AssertionError: Expected function to call callback with 'success'
```

**Negation**:

```js
function withWrongValue(callback) {
  callback('failure');
}

expect(withWrongValue, 'not to call callback with', 'failure');
```

### to call nodeback successfully / to invoke nodeback successfully

> _Aliases: `to call nodeback successfully`, `to invoke nodeback successfully`_

Tests that a function calls its Node.js-style callback successfully (no error) with a specific value.

**Success**:

```js
function successfulOperation(callback) {
  callback(null, 'result');
}

function successfulWithNumber(callback) {
  callback(null, 123);
}

expect(successfulOperation, 'to call nodeback successfully', 'result');
expect(successfulWithNumber, 'to invoke nodeback successfully', 123);

// Works with objects and RegExp
function successfulWithData(callback) {
  callback(null, { data: 'value' });
}

expect(successfulWithData, 'to call nodeback successfully', { data: 'value' });
```

**Failure**:

```js
function failedOperation(callback) {
  callback(new Error('failed'));
}

expect(failedOperation, 'to call nodeback successfully', 'result');
// AssertionError: Expected function to call nodeback successfully
```

**Negation**:

```js
function failedOperation(callback) {
  callback(new Error('failed'));
}

expect(failedOperation, 'not to call nodeback successfully', 'result');
```

### to call nodeback with error / to invoke nodeback with error

> _Aliases: `to call nodeback with error`, `to invoke nodeback with error`_

Tests that a function calls its Node.js-style callback with an error.

**Success**:

```js
function failingOperation(callback) {
  callback(new Error('Something went wrong'));
}

expect(failingOperation, 'to call nodeback with error');
expect(failingOperation, 'to invoke nodeback with error');
```

**Failure**:

```js
function successfulOperation(callback) {
  callback(null, 'result');
}

expect(successfulOperation, 'to call nodeback with error');
// AssertionError: Expected function to call nodeback with error
```

**Negation**:

```js
function successfulOperation(callback) {
  callback(null, 'result');
}

expect(successfulOperation, 'not to call nodeback with error');
```

### to call nodeback with a &lt;constructor&gt; / to invoke nodeback with a &lt;constructor&gt;

> _Aliases: `to call nodeback with a <constructor>`, `to call nodeback with an <constructor>`, `to invoke nodeback with a <constructor>`, `to invoke nodeback with an <constructor>`_

Tests that a function calls its Node.js-style callback with an error of a specific type.

**Success**:

```js
function typeErrorOperation(callback) {
  callback(new TypeError('Type error'));
}

function rangeErrorOperation(callback) {
  callback(new RangeError('Range error'));
}

expect(typeErrorOperation, 'to call nodeback with a', TypeError);
expect(rangeErrorOperation, 'to invoke nodeback with an', RangeError);
```

**Failure**:

```js
function typeErrorOperation(callback) {
  callback(new TypeError('Type error'));
}

expect(typeErrorOperation, 'to call nodeback with a', RangeError);
// AssertionError: Expected function to call nodeback with a RangeError
```

**Negation**:

```js
function typeErrorOperation(callback) {
  callback(new TypeError('Type error'));
}

expect(typeErrorOperation, 'not to call nodeback with a', TypeError);
```

### to call nodeback with error &lt;matcher&gt;

Tests that a function calls its Node.js-style callback with an error matching a specific pattern.

The matcher can be a `string`, `RegExp`, or a partial `object` structure.

**Success**:

```js
// With string message
function withStringError(callback) {
  callback(new Error('Network timeout'));
}

expect(withStringError, 'to call nodeback with error', 'Network timeout');

// With RegExp pattern
function withPatternError(callback) {
  callback(new Error('Connection failed: timeout'));
}

expect(withPatternError, 'to invoke nodeback with error', /Connection failed/);

// With object structure
function withStructuredError(callback) {
  callback({ code: 'TIMEOUT', message: 'Request timed out' });
}

expect(withStructuredError, 'to call nodeback with error', { code: 'TIMEOUT' });
```

**Failure**:

```js
function withWrongError(callback) {
  callback(new Error('Wrong message'));
}

expect(withWrongError, 'to call nodeback with error', 'Expected message');
// AssertionError: Expected function to call nodeback with error matching pattern
```

### to call callback with value satisfying / to invoke callback with value satisfying

> _Aliases: `to call callback with value satisfying`, `to invoke callback with value satisfying`_

Tests that a function calls its callback with a value that satisfies a specific pattern.

**Success**:

```js
// With string pattern
function withStringValue(callback) {
  callback('success message');
}

expect(
  withStringValue,
  'to call callback with value satisfying',
  'success message',
);

// With RegExp pattern
function withPatternValue(callback) {
  callback('Status: OK');
}

expect(withPatternValue, 'to invoke callback with value satisfying', /Status:/);

// With object structure
function withObjectValue(callback) {
  callback({ status: 'ok', data: 'result' });
}

expect(withObjectValue, 'to call callback with value satisfying', {
  status: 'ok',
});
```

**Failure**:

```js
function withWrongValue(callback) {
  callback('failure message');
}

expect(withWrongValue, 'to call callback with value satisfying', /success/);
// AssertionError: Expected function to call callback with value satisfying pattern
```

### to call nodeback successfully satisfying / to invoke nodeback successfully satisfying

> _Aliases: `to call nodeback successfully satisfying`, `to invoke nodeback successfully satisfying`_

Tests that a function calls its Node.js-style callback successfully with a value that satisfies a specific pattern.

**Success**:

```js
// With string pattern
function successWithString(callback) {
  callback(null, 'operation complete');
}

expect(
  successWithString,
  'to call nodeback successfully satisfying',
  'operation complete',
);

// With RegExp pattern
function successWithPattern(callback) {
  callback(null, 'Result: 123');
}

expect(
  successWithPattern,
  'to invoke nodeback successfully satisfying',
  /Result:/,
);

// With object structure
function successWithObject(callback) {
  callback(null, { result: 'data', count: 5 });
}

expect(successWithObject, 'to call nodeback successfully satisfying', {
  result: 'data',
});
```

**Failure**:

```js
function failedOperation(callback) {
  callback(new Error('failed'));
}

expect(failedOperation, 'to call nodeback successfully satisfying', /success/);
// AssertionError: Expected function to call nodeback successfully satisfying pattern
```

## Async Callback Assertions

These assertions work with functions that use callbacks asynchronously. Use `expectAsync()` for these assertions.

### to eventually call callback / to eventually invoke callback

> _Aliases: `to eventually call callback`, `to eventually invoke callback`_

Tests that a function eventually calls its callback in an asynchronous context.

**Success**:

```js
async function asyncWithCallback(callback) {
  setTimeout(() => callback(), 10);
}

await expectAsync(asyncWithCallback, 'to eventually call callback');
await expectAsync(asyncWithCallback, 'to eventually invoke callback');
```

**Failure**:

```js
async function asyncWithoutCallback(callback) {
  // callback is never called
}

await expectAsync(asyncWithoutCallback, 'to eventually call callback');
// AssertionError: Expected function to eventually call callback
```

### to eventually call nodeback / to eventually invoke nodeback

> _Aliases: `to eventually call nodeback`, `to eventually invoke nodeback`_

Tests that a function eventually calls its Node.js-style callback in an asynchronous context.

**Success**:

```js
async function asyncWithNodeback(callback) {
  setTimeout(() => callback(null, 'result'), 10);
}

await expectAsync(asyncWithNodeback, 'to eventually call nodeback');
await expectAsync(asyncWithNodeback, 'to eventually invoke nodeback');
```

### to eventually call callback with / to eventually invoke callback with

> _Aliases: `to eventually call callback with`, `to eventually invoke callback with`_

Tests that a function eventually calls its callback with a specific value.

**Success**:

```js
async function asyncWithValue(callback) {
  setTimeout(() => callback('async result'), 10);
}

await expectAsync(
  asyncWithValue,
  'to eventually call callback with',
  'async result',
);
await expectAsync(
  asyncWithValue,
  'to eventually invoke callback with',
  'async result',
);
```

### to eventually call nodeback successfully / to eventually invoke nodeback successfully

> _Aliases: `to eventually call nodeback successfully`, `to eventually invoke nodeback successfully`_

Tests that a function eventually calls its Node.js-style callback successfully with a specific value.

**Success**:

```js
async function asyncSuccess(callback) {
  setTimeout(() => callback(null, 'async success'), 10);
}

await expectAsync(
  asyncSuccess,
  'to eventually call nodeback successfully',
  'async success',
);
await expectAsync(
  asyncSuccess,
  'to eventually invoke nodeback successfully',
  'async success',
);
```

### to eventually call nodeback with error / to eventually invoke nodeback with error

> _Aliases: `to eventually call nodeback with error`, `to eventually invoke nodeback with error`_

Tests that a function eventually calls its Node.js-style callback with an error.

**Success**:

```js
async function asyncFailure(callback) {
  setTimeout(() => callback(new Error('async error')), 10);
}

await expectAsync(asyncFailure, 'to eventually call nodeback with error');
await expectAsync(asyncFailure, 'to eventually invoke nodeback with error');
```

### to eventually call nodeback with a &lt;constructor&gt; / to eventually invoke nodeback with a &lt;constructor&gt;

> _Aliases: `to eventually call nodeback with a <constructor>`, `to eventually call nodeback with an <constructor>`, `to eventually invoke nodeback with a <constructor>`, `to eventually invoke nodeback with an <constructor>`_

Tests that a function eventually calls its Node.js-style callback with an error of a specific type.

**Success**:

```js
async function asyncTypeError(callback) {
  setTimeout(() => callback(new TypeError('async type error')), 10);
}

await expectAsync(
  asyncTypeError,
  'to eventually call nodeback with a',
  TypeError,
);
await expectAsync(
  asyncTypeError,
  'to eventually invoke nodeback with an',
  TypeError,
);
```

### to eventually call nodeback with error &lt;matcher&gt;

Tests that a function eventually calls its Node.js-style callback with an error matching a specific pattern.

The matcher can be a `string`, `RegExp`, or a partial `object` structure.

**Success**:

```js
// With string message
async function asyncStringError(callback) {
  setTimeout(() => callback(new Error('Async network timeout')), 10);
}

await expectAsync(
  asyncStringError,
  'to eventually call nodeback with error',
  'Async network timeout',
);

// With RegExp pattern
async function asyncPatternError(callback) {
  setTimeout(() => callback(new Error('Async connection failed: timeout')), 10);
}

await expectAsync(
  asyncPatternError,
  'to eventually invoke nodeback with error',
  /connection failed/i,
);
```

### to eventually call callback with value satisfying / to eventually invoke callback with value satisfying

> _Aliases: `to eventually call callback with value satisfying`, `to eventually invoke callback with value satisfying`_

Tests that a function eventually calls its callback with a value that satisfies a specific pattern.

**Success**:

```js
// With RegExp pattern
async function asyncPatternValue(callback) {
  setTimeout(() => callback('Async Status: Complete'), 10);
}

await expectAsync(
  asyncPatternValue,
  'to eventually call callback with value satisfying',
  /Status:/,
);

// With object structure
async function asyncObjectValue(callback) {
  setTimeout(() => callback({ async: true, status: 'complete' }), 10);
}

await expectAsync(
  asyncObjectValue,
  'to eventually invoke callback with value satisfying',
  { async: true },
);
```

### to eventually call nodeback successfully satisfying / to eventually invoke nodeback successfully satisfying

> _Aliases: `to eventually call nodeback successfully satisfying`, `to eventually invoke nodeback successfully satisfying`_

Tests that a function eventually calls its Node.js-style callback successfully with a value that satisfies a specific pattern.

**Success**:

```js
// With RegExp pattern
async function asyncSuccessPattern(callback) {
  setTimeout(() => callback(null, 'Async operation: completed'), 10);
}

await expectAsync(
  asyncSuccessPattern,
  'to eventually call nodeback successfully satisfying',
  /operation:/i,
);

// With object structure
async function asyncSuccessObject(callback) {
  setTimeout(() => callback(null, { operation: 'complete', time: 123 }), 10);
}

await expectAsync(
  asyncSuccessObject,
  'to eventually invoke nodeback successfully satisfying',
  { operation: 'complete' },
);
```
