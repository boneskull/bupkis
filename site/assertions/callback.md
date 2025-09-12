---
title: Callback Assertions
category: Assertions
---

## Callback Assertions

These assertions test functions that work with callbacks, including Node.js-style error-first callbacks ("nodebacks") and regular callbacks. They verify that functions properly invoke their callbacks and handle the callback values correctly.

> **Note**: Synchronous callback assertions use `expect()`, while asynchronous callback assertions use `expectAsync()`.

### &lt;function&gt; to call callback

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

### &lt;function&gt; to call nodeback

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

### &lt;function&gt; to call callback with &lt;unknown&gt;

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

### &lt;function&gt; to call callback with exactly &lt;unknown&gt;

> _Aliases: `to call callback with exactly`, `to call callback with exact value`, `to invoke callback with exactly`, `to invoke callback with exact value`_

Tests that a function calls its callback with an exact value using strict equality (`Object.is`).

**Success**:

```js
function withExactValue(callback) {
  callback('success');
}

function withExactNumber(callback) {
  callback(42);
}

function withExactObject(callback) {
  const obj = { status: 'ok' };
  callback(obj);
}

expect(withExactValue, 'to call callback with exactly', 'success');
expect(withExactNumber, 'to invoke callback with exact value', 42);
expect(withExactObject, 'to call callback with exactly', { status: 'ok' }); // will fail unless same reference
```

**Failure**:

```js
function withWrongValue(callback) {
  callback('failure');
}

expect(withWrongValue, 'to call callback with exactly', 'success');
// AssertionError: Expected function to call callback with exactly 'success'
```

**Negation**:

```js
function withWrongValue(callback) {
  callback('failure');
}

expect(withWrongValue, 'not to call callback with exactly', 'failure');
```

### &lt;function&gt; to call callback with value satisfying &lt;string | RegExp | object&gt;

> _Aliases: `to call callback with value satisfying`, `to invoke callback with value satisfying`_

Tests that a function calls its callback with a value that matches a pattern using partial object matching.

**Success**:

```js
function withStringPattern(callback) {
  callback('Error: something went wrong');
}

function withObjectPattern(callback) {
  callback({ status: 'ok', extra: 'data' });
}

expect(withStringPattern, 'to call callback with value satisfying', /Error:/);
expect(
  withStringPattern,
  'to invoke callback with value satisfying',
  'Error: something went wrong',
);
expect(withObjectPattern, 'to call callback with value satisfying', {
  status: 'ok',
}); // matches partial object
```

**Failure**:

```js
function withNoMatch(callback) {
  callback('No error here');
}

expect(withNoMatch, 'to call callback with value satisfying', /Error:/);
// AssertionError: Expected function to call callback with value satisfying pattern
```

**Negation**:

```js
function withNoMatch(callback) {
  callback('No error here');
}

expect(withNoMatch, 'not to call callback with value satisfying', /Error:/);
```

### &lt;function&gt; to call nodeback with &lt;unknown&gt;

> _Aliases: `to call nodeback with`, `to invoke nodeback with`_

Tests that a function calls its Node.js-style callback successfully (no error) with a specific value using deep equality.

**Success**:

```js
function successfulOperation(callback) {
  callback(null, 'result');
}

const obj = { status: 'success' };
function successfulWithObject(callback) {
  callback(null, { status: 'success' }); // same structure, different reference
}

expect(successfulOperation, 'to call nodeback with', 'result');
expect(successfulWithObject, 'to call nodeback with', obj); // deep equality
```

**Failure**:

```js
function failedOperation(callback) {
  callback(new Error('Something went wrong'));
}

expect(failedOperation, 'to call nodeback with', 'result');
// AssertionError: Expected function to call nodeback with 'result'

function wrongValue(callback) {
  callback(null, 'different');
}

expect(wrongValue, 'to call nodeback with', 'result');
// AssertionError: Expected function to call nodeback with 'result'
```

**Negation**:

```js
function differentResult(callback) {
  callback(null, 'different');
}

expect(differentResult, 'not to call nodeback with', 'result');
```

### &lt;function&gt; to call nodeback with exactly &lt;unknown&gt;

> _Aliases: `to call nodeback with exactly`, `to call nodeback with exact value`, `to invoke nodeback with exactly`, `to invoke nodeback with exact value`_

Tests that a function calls its Node.js-style callback successfully (no error) with an exact value using strict equality.

**Success**:

```js
function successfulOperation(callback) {
  callback(null, 'result');
}

function successfulWithNumber(callback) {
  callback(null, 123);
}

function successfulWithExactObject(callback) {
  const obj = { data: 'value' };
  callback(null, obj);
}

expect(successfulOperation, 'to call nodeback with exactly', 'result');
expect(successfulWithNumber, 'to invoke nodeback with exact value', 123);
expect(successfulWithExactObject, 'to call nodeback with exactly', obj); // must be same reference
```

**Failure**:

```js
function failedOperation(callback) {
  callback(new Error('failed'));
}

expect(failedOperation, 'to call nodeback with exactly', 'result');
// AssertionError: Expected function to call nodeback with exactly 'result'

function wrongValue(callback) {
  callback(null, 'wrong');
}

expect(wrongValue, 'to call nodeback with exactly', 'result');
// AssertionError: Expected function to call nodeback with exactly 'result'
```

**Negation**:

```js
function wrongValue(callback) {
  callback(null, 'wrong');
}

expect(failedOperation, 'not to call nodeback successfully', 'result');
```

### &lt;function&gt; to call nodeback with error

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

### &lt;function&gt; to call nodeback with a &lt;constructor&gt;

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

### &lt;function&gt; to call nodeback with error &lt;string | RegExp | object&gt;

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

### &lt;function&gt; to call nodeback with value satisfying &lt;string | RegExp | object&gt;

> _Aliases: `to call nodeback with value satisfying`, `to invoke nodeback with value satisfying`_

Tests that a function calls its Node.js-style callback successfully with a value that satisfies a specific pattern.

**Success**:

```js
// With string pattern
function withStringResult(callback) {
  callback(null, 'success message');
}

expect(
  withStringResult,
  'to call nodeback with value satisfying',
  'success message',
);

// With RegExp pattern
function withPatternResult(callback) {
  callback(null, 'Status: OK');
}

expect(
  withPatternResult,
  'to invoke nodeback with value satisfying',
  /Status:/,
);

// With object structure - partial matching
function withObjectResult(callback) {
  callback(null, { status: 'ok', data: 'result', extra: 'info' });
}

expect(withObjectResult, 'to call nodeback with value satisfying', {
  status: 'ok',
  data: 'result',
}); // matches partial object
```

**Failure**:

```js
function withError(callback) {
  callback(new Error('failed'));
}

expect(withError, 'to call nodeback with value satisfying', /success/);
// AssertionError: Expected function to call nodeback with value satisfying pattern

function withWrongResult(callback) {
  callback(null, 'failure message');
}

expect(withWrongResult, 'to call nodeback with value satisfying', /success/);
// AssertionError: Expected function to call nodeback with value satisfying pattern
```

## Async Callback Assertions

These assertions work with functions that use callbacks asynchronously. Use `expectAsync()` for these assertions.

### &lt;function&gt; to eventually call callback

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

### &lt;function&gt; to eventually call nodeback

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

### &lt;function&gt; to eventually call callback with &lt;unknown&gt;

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

### &lt;function&gt; to eventually call callback with exactly &lt;unknown&gt;

> _Aliases: `to eventually call callback with exactly`_

Tests that a function eventually calls its callback with an exact value using strict equality in an asynchronous context.

**Success**:

```js
async function asyncWithExactValue(callback) {
  const exactValue = 'specific string';
  setTimeout(() => callback(exactValue), 10);
}

await expectAsync(
  asyncWithExactValue,
  'to eventually call callback with exactly',
  'specific string',
);
await expectAsync(
  asyncWithExactValue,
  'to eventually invoke callback with exact value',
  'specific string',
);
```

### &lt;function&gt; to eventually call callback with value satisfying &lt;function&gt;

> _Aliases: `to eventually call callback with value satisfying`_

Tests that a function eventually calls its callback with a value that satisfies a pattern in an asynchronous context.

**Success**:

```js
async function asyncWithPattern(callback) {
  setTimeout(() => callback('Async result: success'), 10);
}

async function asyncWithObjectValue(callback) {
  setTimeout(
    () => callback({ async: true, status: 'complete', extra: 'data' }),
    10,
  );
}

await expectAsync(
  asyncWithPattern,
  'to eventually call callback with value satisfying',
  /result:/i,
);
await expectAsync(
  asyncWithObjectValue,
  'to eventually invoke callback with value satisfying',
  { async: true }, // matches partial object
);
```

### &lt;function&gt; to eventually call nodeback with exactly &lt;unknown&gt;

> _Aliases: `to eventually call nodeback with exactly`_

Tests that a function eventually calls its Node.js-style callback successfully with an exact value using strict equality.

**Success**:

```js
async function asyncExactSuccess(callback) {
  const exactValue = 'exact result';
  setTimeout(() => callback(null, exactValue), 10);
}

await expectAsync(
  asyncExactSuccess,
  'to eventually call nodeback with exactly',
  'exact result',
);
await expectAsync(
  asyncExactSuccess,
  'to eventually invoke nodeback with exact value',
  'exact result',
);
```

### &lt;function&gt; to eventually call nodeback with &lt;unknown&gt;

> _Aliases: `to eventually call nodeback with`_

Tests that a function eventually calls its Node.js-style callback successfully with a specific value using deep equality.

**Success**:

```js
async function asyncSuccess(callback) {
  setTimeout(() => callback(null, 'async success'), 10);
}

await expectAsync(
  asyncSuccess,
  'to eventually call nodeback with',
  'async success',
);
await expectAsync(
  asyncSuccess,
  'to eventually invoke nodeback with',
  'async success',
);
```

### &lt;function&gt; to eventually call nodeback with error

> _Aliases: `to eventually call nodeback with error`_

Tests that a function eventually calls its Node.js-style callback with an error.

**Success**:

```js
async function asyncFailure(callback) {
  setTimeout(() => callback(new Error('async error')), 10);
}

await expectAsync(asyncFailure, 'to eventually call nodeback with error');
await expectAsync(asyncFailure, 'to eventually invoke nodeback with error');
```

### &lt;function&gt; to eventually call nodeback with a &lt;constructor&gt;

> _Aliases: `to eventually call nodeback with a <constructor>`_

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

### &lt;function&gt; to eventually call nodeback with error &lt;string | RegExp | object&gt;

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

### &lt;function&gt; to eventually call nodeback with value satisfying &lt;function&gt;

> _Aliases: `to eventually call nodeback with value satisfying`_

Tests that a function eventually calls its Node.js-style callback successfully with a value that satisfies a specific pattern using partial matching.

**Success**:

```js
// With RegExp pattern
async function asyncSuccessPattern(callback) {
  setTimeout(() => callback(null, 'Async operation: completed'), 10);
}

await expectAsync(
  asyncSuccessPattern,
  'to eventually call nodeback with value satisfying',
  /operation:/i,
);

// With object structure - partial matching
async function asyncSuccessObject(callback) {
  setTimeout(
    () => callback(null, { operation: 'complete', time: 123, extra: 'data' }),
    10,
  );
}

await expectAsync(
  asyncSuccessObject,
  'to eventually invoke nodeback with value satisfying',
  { operation: 'complete', time: 123 }, // matches partial object
);
```
