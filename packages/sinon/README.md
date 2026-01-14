# @bupkis/sinon

Sinon spy/stub/mock assertions for [Bupkis](https://bupkis.zip).

## Installation

```bash
npm install @bupkis/sinon bupkis sinon
```

## Usage

```typescript
import { use } from 'bupkis';
import { sinonAssertions } from '@bupkis/sinon';
import sinon from 'sinon';

const { expect } = use(sinonAssertions);

// Basic spy assertions
const spy = sinon.spy();
spy(42);
expect(spy, 'was called');
expect(spy, 'was called once');
expect(spy, 'was called with', [42]);

// Call count
spy();
spy();
expect(spy, 'was called times', 3);

// Stub return values
const stub = sinon.stub().returns(100);
stub();
expect(stub.firstCall, 'to have returned', 100);

// Call order
const first = sinon.spy();
const second = sinon.spy();
first();
second();
expect(first, 'was called before', second);
expect([first, second], 'given call order');

// Complex call specifications
const logger = sinon.spy();
logger('info', 'started');
logger('debug', 'processing');
logger('info', 'done');
expect(logger, 'to have calls satisfying', [
  ['info', 'started'],
  ['debug', 'processing'],
  ['info', 'done'],
]);
```

## Assertions

### {Spy} was called

> ✏️ Aliases:
>
>     {Spy} was called
>     {Spy} to have been called

Asserts that a spy was called at least once.

**Success**:

```js
const spy = sinon.spy();
spy();
expect(spy, 'was called');
expect(spy, 'to have been called');
```

**Failure**:

```js
const spy = sinon.spy();
expect(spy, 'was called');
// AssertionError: Expected spy to have been called, but it was never called
```

**Negation**:

```js
const spy = sinon.spy();
expect(spy, 'not to have been called');
```

### {Spy} was not called

> ✏️ Aliases:
>
>     {Spy} was not called
>     {Spy} to not have been called

Asserts that a spy was never called.

**Success**:

```js
const spy = sinon.spy();
expect(spy, 'was not called');
expect(spy, 'to not have been called');
```

**Failure**:

```js
const spy = sinon.spy();
spy();
expect(spy, 'was not called');
// AssertionError: Expected spy to not have been called, but it was called 1 time(s)
```

**Negation**:

```js
const spy = sinon.spy();
spy();
expect(spy, 'not was not called'); // awkward but valid
```

### {Spy} was called once

> ✏️ Aliases:
>
>     {Spy} was called once
>     {Spy} to have been called once

Asserts that a spy was called exactly once.

**Success**:

```js
const spy = sinon.spy();
spy();
expect(spy, 'was called once');
expect(spy, 'to have been called once');
```

**Failure**:

```js
const spy = sinon.spy();
spy();
spy();
expect(spy, 'was called once');
// AssertionError: Expected spy to have been called exactly once
```

**Negation**:

```js
const spy = sinon.spy();
expect(spy, 'not to have been called once');
```

### {Spy} was called twice

Asserts that a spy was called exactly twice.

**Success**:

```js
const spy = sinon.spy();
spy();
spy();
expect(spy, 'was called twice');
```

**Failure**:

```js
const spy = sinon.spy();
spy();
expect(spy, 'was called twice');
// AssertionError: Expected spy to have been called exactly twice
```

**Negation**:

```js
const spy = sinon.spy();
expect(spy, 'not was called twice');
```

### {Spy} was called thrice

Asserts that a spy was called exactly three times.

**Success**:

```js
const spy = sinon.spy();
spy();
spy();
spy();
expect(spy, 'was called thrice');
```

**Failure**:

```js
const spy = sinon.spy();
spy();
spy();
expect(spy, 'was called thrice');
// AssertionError: Expected spy to have been called exactly three times
```

**Negation**:

```js
const spy = sinon.spy();
expect(spy, 'not was called thrice');
```

### {Spy} was called times {number}

Asserts that a spy was called exactly the specified number of times.

**Success**:

```js
const spy = sinon.spy();
spy();
spy();
spy();
spy();
spy();
expect(spy, 'was called times', 5);
```

**Failure**:

```js
const spy = sinon.spy();
spy();
spy();
expect(spy, 'was called times', 5);
// AssertionError: Expected spy to have been called 5 time(s)
```

**Negation**:

```js
const spy = sinon.spy();
spy();
expect(spy, 'not was called times', 5);
```

### {Spy} was called with {array}

> ✏️ Aliases:
>
>     {Spy} was called with {array}
>     {Spy} to have been called with {array}

Asserts that at least one call to the spy included the specified arguments. Uses _prefix matching_: the spy may have been called with additional arguments beyond those specified.

**Success**:

```js
const spy = sinon.spy();
spy('foo', 42, 'extra');
expect(spy, 'was called with', ['foo', 42]); // prefix match - 'extra' ignored
expect(spy, 'to have been called with', ['foo', 42, 'extra']); // exact match
```

**Failure**:

```js
const spy = sinon.spy();
spy('bar');
expect(spy, 'was called with', ['foo']);
// AssertionError: Expected spy to have been called with specified arguments
```

**Negation**:

```js
const spy = sinon.spy();
spy('bar');
expect(spy, 'not to have been called with', ['foo']);
```

### {Spy} was always called with {array}

Asserts that _all_ calls to the spy included the specified arguments (prefix match).

**Success**:

```js
const spy = sinon.spy();
spy('foo', 1);
spy('foo', 2);
spy('foo', 3);
expect(spy, 'was always called with', ['foo']);
```

**Failure**:

```js
const spy = sinon.spy();
spy('foo');
spy('bar');
expect(spy, 'was always called with', ['foo']);
// AssertionError: Expected spy to always have been called with specified arguments
```

**Negation**:

```js
const spy = sinon.spy();
spy('foo');
spy('bar');
expect(spy, 'not was always called with', ['foo']);
```

### {Spy} was called with exactly {array}

Asserts that at least one call to the spy had _exactly_ the specified arguments (no additional arguments).

**Success**:

```js
const spy = sinon.spy();
spy('foo', 42);
expect(spy, 'was called with exactly', ['foo', 42]);
```

**Failure**:

```js
const spy = sinon.spy();
spy('foo', 42, 'extra');
expect(spy, 'was called with exactly', ['foo', 42]);
// AssertionError: Expected spy to have been called with exactly the specified arguments
```

**Negation**:

```js
const spy = sinon.spy();
spy('foo', 42, 'extra');
expect(spy, 'not was called with exactly', ['foo', 42]);
```

### {Spy} was never called with {array}

Asserts that the spy was never called with the specified arguments.

**Success**:

```js
const spy = sinon.spy();
spy('foo');
spy('bar');
expect(spy, 'was never called with', ['baz']);
```

**Failure**:

```js
const spy = sinon.spy();
spy('foo');
expect(spy, 'was never called with', ['foo']);
// AssertionError: Expected spy to never have been called with specified arguments
```

**Negation**:

```js
const spy = sinon.spy();
spy('foo');
expect(spy, 'not was never called with', ['foo']);
```

### {Spy} was called on {unknown}

> ✏️ Aliases:
>
>     {Spy} was called on {unknown}
>     {Spy} to have been called on {unknown}

Asserts that at least one call to the spy used the specified `this` context.

**Success**:

```js
const obj = { name: 'test' };
const spy = sinon.spy();
spy.call(obj);
expect(spy, 'was called on', obj);
expect(spy, 'to have been called on', obj);
```

**Failure**:

```js
const obj1 = { name: 'one' };
const obj2 = { name: 'two' };
const spy = sinon.spy();
spy.call(obj1);
expect(spy, 'was called on', obj2);
// AssertionError: Expected spy to have been called with specified this context
```

**Negation**:

```js
const obj1 = { name: 'one' };
const obj2 = { name: 'two' };
const spy = sinon.spy();
spy.call(obj1);
expect(spy, 'not to have been called on', obj2);
```

### {Spy} was always called on {unknown}

Asserts that _all_ calls to the spy used the specified `this` context.

**Success**:

```js
const obj = { name: 'test' };
const spy = sinon.spy();
spy.call(obj);
spy.call(obj);
expect(spy, 'was always called on', obj);
```

**Failure**:

```js
const obj1 = { name: 'one' };
const obj2 = { name: 'two' };
const spy = sinon.spy();
spy.call(obj1);
spy.call(obj2);
expect(spy, 'was always called on', obj1);
// AssertionError: Expected spy to always have been called with specified this context
```

**Negation**:

```js
const obj1 = { name: 'one' };
const obj2 = { name: 'two' };
const spy = sinon.spy();
spy.call(obj1);
spy.call(obj2);
expect(spy, 'not was always called on', obj1);
```

### {Spy} threw

> ✏️ Aliases:
>
>     {Spy} threw
>     {Spy} to have thrown

Asserts that the spy threw an exception on at least one call.

**Success**:

```js
const spy = sinon.spy(() => {
  throw new Error('boom');
});
try {
  spy();
} catch {}
expect(spy, 'threw');
expect(spy, 'to have thrown');
```

**Failure**:

```js
const spy = sinon.spy();
spy();
expect(spy, 'threw');
// AssertionError: Expected spy to have thrown an exception
```

**Negation**:

```js
const spy = sinon.spy();
spy();
expect(spy, 'not to have thrown');
```

### {Spy} threw {Error | string}

Asserts that the spy threw a specific error. The parameter can be an `Error` instance or a string representing the error type name.

**Success**:

```js
const spy = sinon.spy(() => {
  throw new TypeError('bad type');
});
try {
  spy();
} catch {}
expect(spy, 'threw', 'TypeError'); // match by type name
expect(spy, 'threw', new TypeError('bad type')); // match by instance
```

**Failure**:

```js
const spy = sinon.spy(() => {
  throw new Error('boom');
});
try {
  spy();
} catch {}
expect(spy, 'threw', 'TypeError');
// AssertionError: Expected spy to have thrown specified exception
```

**Negation**:

```js
const spy = sinon.spy(() => {
  throw new Error('boom');
});
try {
  spy();
} catch {}
expect(spy, 'not threw', 'TypeError');
```

### {Spy} always threw

Asserts that the spy threw an exception on every call.

**Success**:

```js
const spy = sinon.spy(() => {
  throw new Error('boom');
});
try {
  spy();
} catch {}
try {
  spy();
} catch {}
expect(spy, 'always threw');
```

**Failure**:

```js
let shouldThrow = true;
const spy = sinon.spy(() => {
  if (shouldThrow) {
    shouldThrow = false;
    throw new Error('boom');
  }
});
try {
  spy();
} catch {}
spy();
expect(spy, 'always threw');
// AssertionError: Expected spy to always have thrown an exception
```

**Negation**:

```js
const spy = sinon.spy();
spy();
expect(spy, 'not always threw');
```

### {Spy} was called before {Spy}

Asserts that the first spy was called before the second spy.

**Success**:

```js
const first = sinon.spy();
const second = sinon.spy();
first();
second();
expect(first, 'was called before', second);
```

**Failure**:

```js
const first = sinon.spy();
const second = sinon.spy();
second();
first();
expect(first, 'was called before', second);
// AssertionError: Expected first spy to have been called before second spy
```

**Negation**:

```js
const first = sinon.spy();
const second = sinon.spy();
second();
first();
expect(first, 'not was called before', second);
```

### {Spy} was called after {Spy}

Asserts that the first spy was called after the second spy.

**Success**:

```js
const first = sinon.spy();
const second = sinon.spy();
second();
first();
expect(first, 'was called after', second);
```

**Failure**:

```js
const first = sinon.spy();
const second = sinon.spy();
first();
second();
expect(first, 'was called after', second);
// AssertionError: Expected first spy to have been called after second spy
```

**Negation**:

```js
const first = sinon.spy();
const second = sinon.spy();
first();
second();
expect(first, 'not was called after', second);
```

### {SpyCall} to have args {array}

Asserts that a specific spy call had exactly the specified arguments.

Access individual calls via `spy.firstCall`, `spy.secondCall`, `spy.thirdCall`, `spy.lastCall`, or `spy.getCall(n)`.

**Success**:

```js
const spy = sinon.spy();
spy('foo', 42);
expect(spy.firstCall, 'to have args', ['foo', 42]);
```

**Failure**:

```js
const spy = sinon.spy();
spy('foo', 42);
expect(spy.firstCall, 'to have args', ['bar', 42]);
// AssertionError: Expected spy call to have specified arguments
```

**Negation**:

```js
const spy = sinon.spy();
spy('foo', 42);
expect(spy.firstCall, 'not to have args', ['bar', 42]);
```

### {SpyCall} to have returned {unknown}

Asserts that a specific spy call returned the specified value.

**Success**:

```js
const stub = sinon.stub().returns(100);
stub();
expect(stub.firstCall, 'to have returned', 100);
```

**Failure**:

```js
const stub = sinon.stub().returns(100);
stub();
expect(stub.firstCall, 'to have returned', 200);
// AssertionError: Expected spy call to have returned specified value
```

**Negation**:

```js
const stub = sinon.stub().returns(100);
stub();
expect(stub.firstCall, 'not to have returned', 200);
```

### {SpyCall} to have thrown

Asserts that a specific spy call threw an exception.

**Success**:

```js
const spy = sinon.spy(() => {
  throw new Error('boom');
});
try {
  spy();
} catch {}
expect(spy.firstCall, 'to have thrown');
```

**Failure**:

```js
const spy = sinon.spy();
spy();
expect(spy.firstCall, 'to have thrown');
// AssertionError: Expected spy call to have thrown an exception
```

**Negation**:

```js
const spy = sinon.spy();
spy();
expect(spy.firstCall, 'not to have thrown');
```

### {SpyCall} to have this {unknown}

Asserts that a specific spy call used the specified `this` context.

**Success**:

```js
const obj = { name: 'test' };
const spy = sinon.spy();
spy.call(obj);
expect(spy.firstCall, 'to have this', obj);
```

**Failure**:

```js
const obj1 = { name: 'one' };
const obj2 = { name: 'two' };
const spy = sinon.spy();
spy.call(obj1);
expect(spy.firstCall, 'to have this', obj2);
// AssertionError: Expected spy call to have specified this context
```

**Negation**:

```js
const obj1 = { name: 'one' };
const obj2 = { name: 'two' };
const spy = sinon.spy();
spy.call(obj1);
expect(spy.firstCall, 'not to have this', obj2);
```

### {Spy[]} given call order

Asserts that an array of spies were called in the specified order.

**Success**:

```js
const first = sinon.spy();
const second = sinon.spy();
const third = sinon.spy();
first();
second();
third();
expect([first, second, third], 'given call order');
```

**Failure**:

```js
const first = sinon.spy();
const second = sinon.spy();
const third = sinon.spy();
third();
first();
second();
expect([first, second, third], 'given call order');
// AssertionError: Expected spies to have been called in order, but spy 0 was not called before spy 1
```

**Negation**:

```js
const first = sinon.spy();
const second = sinon.spy();
const third = sinon.spy();
third();
first();
second();
expect([first, second, third], 'not given call order');
```

### {Spy} to have calls satisfying {array}

Asserts that all calls to a spy match a specification array. Each element in the array corresponds to one call and can be either:

- An **object** with optional `args`, `returned`, `threw`, `thisValue` properties
- An **array** (shorthand for `{ args: [...] }`)

The number of specifications must match the number of calls exactly.

**Success**:

```js
const spy = sinon.spy();
spy('a', 1);
spy('b', 2);
spy('c', 3);

// Using object specifications
expect(spy, 'to have calls satisfying', [
  { args: ['a', 1] },
  { args: ['b', 2] },
  { args: ['c', 3] },
]);

// Using array shorthand
expect(spy, 'to have calls satisfying', [
  ['a', 1],
  ['b', 2],
  ['c', 3],
]);
```

**With return values and `this` context**:

```js
const obj = { multiplier: 2 };
const stub = sinon.stub().callsFake(function (x) {
  return x * this.multiplier;
});

stub.call(obj, 5);
stub.call(obj, 10);

expect(stub, 'to have calls satisfying', [
  { args: [5], returned: 10, thisValue: obj },
  { args: [10], returned: 20, thisValue: obj },
]);
```

**Failure**:

```js
const spy = sinon.spy();
spy('a');
spy('b');
expect(spy, 'to have calls satisfying', [['a'], ['c']]);
// AssertionError: Call 1: argument 0 did not match

const spy2 = sinon.spy();
spy2('a');
expect(spy2, 'to have calls satisfying', [['a'], ['b']]);
// AssertionError: Expected spy to have 2 call(s), but it had 1
```

**Negation**:

```js
const spy = sinon.spy();
spy('a');
spy('b');
expect(spy, 'not to have calls satisfying', [['x'], ['y']]);
```

## Exports

```typescript
// Main assertion array for use()
import { sinonAssertions } from '@bupkis/sinon';

// Individual assertions (for selective use)
import {
  wasCalledAssertion,
  wasCalledWithAssertion /* ... */,
} from '@bupkis/sinon';

// Type guards
import { isSpy, isSpyCall } from '@bupkis/sinon';

// Zod schemas
import { SpySchema, SpyCallSchema } from '@bupkis/sinon';
```

## License

Copyright © 2026 [Christopher "boneskull" Hiller][boneskull]. Licensed under [BlueOak-1.0.0](https://blueoakcouncil.org/license/1.0.0).

[boneskull]: https://github.com/boneskull
