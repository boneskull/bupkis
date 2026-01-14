---
title: Iterable Assertions
category: Assertions
---

## Iterable Assertions

These assertions test iterables and async iterables using the **iteration protocol** (`Symbol.iterator` / `Symbol.asyncIterator`).

> **Important:** These assertions are semantically different from [Collection Assertions](./collection.md).
> Collection assertions use native APIs like `Array.prototype.includes()` and `.size`.
> Iterable assertions use `for...of` / `for await...of` to consume the iterator.
> A subject with custom `Symbol.iterator` behavior may produce different results.

### Sync Iterable Assertions

These assertions work with any synchronous iterable (arrays, Sets, Maps, generators, custom iterables) via `expect()`.

#### {Iterable} to yield {any}

> Aliases:
>
>     {Iterable} to yield {any}
>     {Iterable} to emit {any}
>     {Iterable} to yield value satisfying {any}

Iterates through the subject and checks if any yielded value **satisfies** the expected shape (partial matching semantics, like `'to satisfy'`).

**Success**:

```js
expect([1, 2, 3], 'to yield', 2);
expect(new Set(['a', 'b']), 'to emit', 'a');

// Partial matching - extra properties are allowed
expect([{ a: 1, b: 2 }, { c: 3 }], 'to yield', { a: 1 }); // passes

function* gen() {
  yield { name: 'test', extra: true };
}
expect(gen(), 'to yield value satisfying', { name: 'test' }); // passes
```

**Failure**:

```js
expect([1, 2, 3], 'to yield', 5);
// AssertionError: Expected iterable to yield a value satisfying 5, but none matched
```

**Negation**:

```js
expect([1, 2, 3], 'not to yield', 5);
```

#### {Iterable} to yield value exhaustively satisfying {any}

Iterates through the subject and checks if any yielded value **exhaustively matches** the expected value (deep equality semantics, like `'to equal'`).

**Success**:

```js
expect([{ a: 1 }, { b: 2 }], 'to yield value exhaustively satisfying', {
  a: 1,
}); // passes
```

**Failure**:

```js
// Extra properties cause failure with exhaustive matching
expect([{ a: 1, b: 2 }], 'to yield value exhaustively satisfying', { a: 1 });
// AssertionError: Expected iterable to yield a value exhaustively satisfying { a: 1 }, but none matched
```

**Negation**:

```js
expect([{ a: 1, b: 2 }], 'not to yield value exhaustively satisfying', {
  a: 1,
});
```

#### {Iterable} to yield items satisfying {any}

Asserts that **ALL** yielded values individually satisfy the expected shape. Uses partial matching semantics.

**Success**:

```js
expect([{ a: 1 }, { a: 2, b: 3 }], 'to yield items satisfying', {
  a: expect.it('to be a number'),
});
expect([1, 2, 3], 'to yield items satisfying', expect.it('to be a number'));
expect([], 'to yield items satisfying', { any: 'shape' }); // vacuous truth
```

**Failure**:

```js
expect([{ a: 1 }, { b: 2 }], 'to yield items satisfying', {
  a: expect.it('to be a number'),
});
// AssertionError: Expected all items to satisfy {...}, but item at index 1 did not match
```

#### {Iterable} to yield items exhaustively satisfying {any}

Asserts that **ALL** yielded values individually match with deep equality. Extra properties cause failure.

**Success**:

```js
expect([{ a: 1 }, { a: 1 }], 'to yield items exhaustively satisfying', {
  a: 1,
});
```

**Failure**:

```js
expect([{ a: 1, b: 2 }], 'to yield items exhaustively satisfying', { a: 1 });
// AssertionError: Expected all items to exhaustively satisfy { a: 1 }, but item at index 0 did not match
```

#### {Iterable} to yield first {any}

> Aliases:
>
>     {Iterable} to yield first {any}
>     {Iterable} to yield first satisfying {any}

Asserts that the **first** yielded value satisfies the expected shape. Uses partial matching semantics.

**Success**:

```js
expect([{ a: 1, b: 2 }, { c: 3 }], 'to yield first', { a: 1 });
expect([1, 2, 3], 'to yield first satisfying', 1);
```

**Failure**:

```js
expect([1, 2, 3], 'to yield first', 2);
// AssertionError: Expected first yielded value to satisfy 2, but got 1

expect([], 'to yield first', 1);
// AssertionError: Expected iterable to yield at least one value, but it was empty
```

#### {Iterable} to yield first exhaustively satisfying {any}

Asserts that the **first** yielded value exhaustively matches. Extra properties cause failure.

**Success**:

```js
expect([{ a: 1 }], 'to yield first exhaustively satisfying', { a: 1 });
```

**Failure**:

```js
expect([{ a: 1, b: 2 }], 'to yield first exhaustively satisfying', { a: 1 });
// AssertionError: Expected first yielded value to exhaustively satisfy { a: 1 }, but got { a: 1, b: 2 }
```

#### {Iterable} to yield last {any}

> Aliases:
>
>     {Iterable} to yield last {any}
>     {Iterable} to yield last satisfying {any}

Asserts that the **last** yielded value satisfies the expected shape. Uses partial matching semantics.

Note: Fully consumes the iterator.

**Success**:

```js
expect([{ a: 1 }, { b: 2, c: 3 }], 'to yield last', { b: 2 });
expect([1, 2, 3], 'to yield last satisfying', 3);
```

**Failure**:

```js
expect([1, 2, 3], 'to yield last', 2);
// AssertionError: Expected last yielded value to satisfy 2, but got 3
```

#### {Iterable} to yield last exhaustively satisfying {any}

Asserts that the **last** yielded value exhaustively matches. Extra properties cause failure.

Note: Fully consumes the iterator.

**Success**:

```js
expect([{ a: 1 }, { b: 2 }], 'to yield last exhaustively satisfying', { b: 2 });
```

**Failure**:

```js
expect([{ a: 1, extra: true }], 'to yield last exhaustively satisfying', {
  a: 1,
});
// AssertionError: Expected last yielded value to exhaustively satisfy { a: 1 }, but got { a: 1, extra: true }
```

#### {Iterable} to yield count {number}

Asserts that an iterable yields exactly the specified count of values.

**Success**:

```js
expect([1, 2, 3], 'to yield count', 3);
expect(new Set([1, 2]), 'to yield count', 2);

function* gen() {
  yield 1;
  yield 2;
  yield 3;
  yield 4;
}
expect(gen(), 'to yield count', 4);
```

**Failure**:

```js
expect([1, 2, 3], 'to yield count', 5);
// AssertionError: Expected iterable to yield 5 value(s), but yielded 3
```

**Negation**:

```js
expect([1, 2, 3], 'not to yield count', 5);
```

#### {Iterable} to yield at least {number}

Asserts that an iterable yields at least the specified count of values.

**Success**:

```js
expect([1, 2, 3], 'to yield at least', 2);
expect([1, 2, 3], 'to yield at least', 3);
```

**Failure**:

```js
expect([1], 'to yield at least', 2);
// AssertionError: Expected iterable to yield at least 2 value(s), but yielded 1
```

#### {Iterable} to yield at most {number}

Asserts that an iterable yields at most the specified count of values.

**Success**:

```js
expect([1, 2], 'to yield at most', 3);
expect([1, 2, 3], 'to yield at most', 3);
```

**Failure**:

```js
expect([1, 2, 3, 4], 'to yield at most', 3);
// AssertionError: Expected iterable to yield at most 3 value(s), but yielded 4
```

#### {Iterable} to be an empty iterable

Asserts that an iterable yields nothing.

Use `'not to be an empty iterable'` or `'to yield at least', 1` for non-empty assertions.

**Success**:

```js
expect([], 'to be an empty iterable');
expect(new Set(), 'to be an empty iterable');

function* emptyGen() {}
expect(emptyGen(), 'to be an empty iterable');
```

**Failure**:

```js
expect([1], 'to be an empty iterable');
// AssertionError: Expected iterable to be empty, but it yielded at least one value: 1
```

**Negation**:

```js
expect([1, 2, 3], 'not to be an empty iterable');
```

#### {Iterable} to yield exactly {array}

Collects all yielded values and checks they match the expected array with **deep equality** semantics.

**Success**:

```js
expect([1, 2, 3], 'to yield exactly', [1, 2, 3]);

function* gen() {
  yield 'a';
  yield 'b';
}
expect(gen(), 'to yield exactly', ['a', 'b']);
```

**Failure**:

```js
expect([1, 2, 3], 'to yield exactly', [1, 2]);
// AssertionError: Expected iterable to yield exactly [1, 2]

// Extra properties also cause failure (deep equality)
expect([{ a: 1, b: 2 }], 'to yield exactly', [{ a: 1 }]);
// AssertionError: Expected iterable to yield exactly [{ a: 1 }]
```

**Negation**:

```js
expect([1, 2], 'not to yield exactly', [1, 2, 3]);
```

#### {Iterable} to yield sequence satisfying {array}

> Aliases:
>
>     {Iterable} to yield sequence satisfying {array}
>     {Iterable} to yield array satisfying {array}

Collects all yielded values and checks they match the expected array with **satisfy** semantics (partial matching on objects).

**Success**:

```js
expect([1, 2, 3], 'to yield sequence satisfying', [1, 2, 3]);

// Partial object matching - extra properties allowed
expect([{ a: 1, b: 2 }], 'to yield array satisfying', [{ a: 1 }]); // passes!
```

**Failure**:

```js
expect([1, 2, 3], 'to yield sequence satisfying', [1, 2]);
// AssertionError: Expected iterable to yield sequence satisfying [1, 2]
```

**Negation**:

```js
expect([1, 2], 'not to yield sequence satisfying', [1, 2, 3]);
```

---

### Async Iterable Assertions

These assertions work with async generators, Node.js Readable streams, Web ReadableStreams, and sync iterables via `expectAsync()`.

> **Note:** Sync iterables can be passed to async assertions - they are automatically wrapped as async iterators.

#### {AsyncIterable} to yield {any}

> Aliases:
>
>     {AsyncIterable} to yield {any}
>     {AsyncIterable} to emit {any}
>     {AsyncIterable} to yield value satisfying {any}

Same semantics as the sync version, but for async iterables.

**Success**:

```js
import { Readable } from 'node:stream';

// Async generator
async function* asyncGen() {
  yield 1;
  yield 2;
  yield 3;
}
await expectAsync(asyncGen(), 'to yield', 2);

// Node.js Readable stream
const readable = Readable.from(['chunk1', 'chunk2', 'chunk3']);
await expectAsync(readable, 'to emit', 'chunk2');

// Web ReadableStream (Node.js v22+)
const webStream = new ReadableStream({
  start(controller) {
    controller.enqueue('data1');
    controller.enqueue('data2');
    controller.close();
  },
});
await expectAsync(webStream, 'to yield', 'data2');

// Sync iterable also works
await expectAsync([1, 2, 3], 'to yield', 2);
```

#### {AsyncIterable} to yield value exhaustively satisfying {any}

Same semantics as the sync version, but for async iterables.

```js
await expectAsync(asyncGen(), 'to yield value exhaustively satisfying', {
  a: 1,
});
```

#### {AsyncIterable} to yield items satisfying {any}

Same semantics as the sync version, but for async iterables.

```js
import { Readable } from 'node:stream';

const readable = Readable.from(['str1', 'str2', 'str3']);
await expectAsync(
  readable,
  'to yield items satisfying',
  expect.it('to be a string'),
);
```

#### {AsyncIterable} to yield items exhaustively satisfying {any}

Same semantics as the sync version, but for async iterables.

```js
await expectAsync(asyncGen(), 'to yield items exhaustively satisfying', {
  type: 'data',
});
```

#### {AsyncIterable} to yield first {any}

> Aliases:
>
>     {AsyncIterable} to yield first {any}
>     {AsyncIterable} to yield first satisfying {any}

Same semantics as the sync version, but for async iterables.

```js
await expectAsync(asyncGen(), 'to yield first', { type: 'header' });
```

#### {AsyncIterable} to yield first exhaustively satisfying {any}

Same semantics as the sync version, but for async iterables.

```js
await expectAsync(asyncGen(), 'to yield first exhaustively satisfying', {
  a: 1,
});
```

#### {AsyncIterable} to yield last {any}

> Aliases:
>
>     {AsyncIterable} to yield last {any}
>     {AsyncIterable} to yield last satisfying {any}

Same semantics as the sync version, but for async iterables. Fully consumes the async iterator.

```js
await expectAsync(asyncGen(), 'to yield last', { type: 'footer' });
```

#### {AsyncIterable} to yield last exhaustively satisfying {any}

Same semantics as the sync version, but for async iterables. Fully consumes the async iterator.

```js
await expectAsync(asyncGen(), 'to yield last exhaustively satisfying', {
  b: 2,
});
```

#### {AsyncIterable} to yield count {number}

Same semantics as the sync version, but for async iterables.

```js
import { Readable } from 'node:stream';

const readable = Readable.from(['a', 'b']);
await expectAsync(readable, 'to yield count', 2);
```

#### {AsyncIterable} to yield at least {number}

Same semantics as the sync version, but for async iterables.

```js
await expectAsync(asyncGen(), 'to yield at least', 3);
```

#### {AsyncIterable} to yield at most {number}

Same semantics as the sync version, but for async iterables.

```js
await expectAsync(asyncGen(), 'to yield at most', 10);
```

#### {AsyncIterable} to be an empty iterable

Same semantics as the sync version, but for async iterables.

```js
async function* emptyAsyncGen() {}
await expectAsync(emptyAsyncGen(), 'to be an empty iterable');
```

#### {AsyncIterable} to yield exactly {array}

Same semantics as the sync version, but for async iterables.

```js
await expectAsync(asyncGen(), 'to yield exactly', [1, 2, 3]);
```

#### {AsyncIterable} to yield sequence satisfying {array}

> Aliases:
>
>     {AsyncIterable} to yield sequence satisfying {array}
>     {AsyncIterable} to yield array satisfying {array}

Same semantics as the sync version, but for async iterables.

```js
await expectAsync(asyncGen(), 'to yield sequence satisfying', [
  { type: 'start' },
  { type: 'end' },
]);
```

---

### Completion/Error Assertions (Async Only)

These assertions are specific to async iterables and check completion or error conditions.

#### {AsyncIterable} to complete

> Aliases:
>
>     {AsyncIterable} to complete
>     {AsyncIterable} to finish

Asserts that an async iterable completes without throwing. Fully consumes the iterator.

**Success**:

```js
import { Readable } from 'node:stream';

await expectAsync(asyncGen(), 'to complete');
await expectAsync(Readable.from(['a', 'b']), 'to finish');
```

**Failure**:

```js
async function* failingGen() {
  yield 1;
  throw new Error('Oops!');
}
await expectAsync(failingGen(), 'to complete');
// AssertionError: Expected async iterable to complete, but it rejected with: Error: Oops!
```

#### {AsyncIterable} to reject

> Aliases:
>
>     {AsyncIterable} to reject
>     {AsyncIterable} to be rejected

Asserts that an async iterable rejects (throws) during iteration.

**Success**:

```js
async function* failingGen() {
  yield 1;
  throw new Error('Test error');
}
await expectAsync(failingGen(), 'to reject');
await expectAsync(failingGen(), 'to be rejected');
```

**Failure**:

```js
await expectAsync(asyncGen(), 'to reject');
// AssertionError: Expected async iterable to reject, but it completed successfully
```

#### {AsyncIterable} to reject with a {Constructor}

> Aliases:
>
>     {AsyncIterable} to reject with a {Constructor}
>     {AsyncIterable} to reject with an {Constructor}

Asserts that an async iterable rejects with a specific error type.

**Success**:

```js
async function* typedErrorGen() {
  throw new TypeError('Invalid type');
}
await expectAsync(typedErrorGen(), 'to reject with a', TypeError);
await expectAsync(typedErrorGen(), 'to reject with an', Error);
```

**Failure**:

```js
async function* regularErrorGen() {
  throw new Error('Regular error');
}
await expectAsync(regularErrorGen(), 'to reject with a', TypeError);
// AssertionError: Expected async iterable to reject with TypeError, but got Error: Regular error

await expectAsync(asyncGen(), 'to reject with an', Error);
// AssertionError: Expected async iterable to reject with Error, but it completed successfully
```

#### {AsyncIterable} to reject with error satisfying {any}

> Aliases:
>
>     {AsyncIterable} to reject with error satisfying {any}
>     {AsyncIterable} to be rejected with error satisfying {any}

Asserts that an async iterable rejects with an error matching a shape.

**Success**:

```js
async function* connectionFailGen() {
  throw new Error('Connection failed');
}
await expectAsync(connectionFailGen(), 'to reject with error satisfying', {
  message: 'Connection failed',
});

const errorWithCode = Object.assign(new Error('Failed'), {
  code: 'ECONNREFUSED',
});
async function* codedErrorGen() {
  throw errorWithCode;
}
await expectAsync(codedErrorGen(), 'to be rejected with error satisfying', {
  code: 'ECONNREFUSED',
});
```

**Failure**:

```js
await expectAsync(connectionFailGen(), 'to reject with error satisfying', {
  message: 'Wrong message',
});
// AssertionError: Expected async iterable to reject with error satisfying { message: 'Wrong message' }, but got Error: Connection failed
```

---

### Working with Streams

#### Node.js Readable Streams

```js
import { Readable } from 'node:stream';

// Create from array
const readable = Readable.from(['line1', 'line2', 'line3']);
await expectAsync(readable, 'to yield count', 3);
await expectAsync(Readable.from(['data']), 'to yield first', 'data');
```

#### Web ReadableStream (Node.js v22+)

```js
// Web ReadableStream supports async iteration in Node.js v22+
const webStream = new ReadableStream({
  start(controller) {
    controller.enqueue('chunk1');
    controller.enqueue('chunk2');
    controller.close();
  },
});
await expectAsync(webStream, 'to yield count', 2);
```

#### Fetch Response Body

```js
// response.body is a Web ReadableStream
const response = await fetch('https://example.com/api/stream');
await expectAsync(response.body, 'to complete');
```

---

### Generator Functions vs Generators

**Important:** Generator functions must be called to create an iterator. The assertion library accepts iterators/iterables, not generator functions.

```js
// Generator function - must be called
function* myGenerator() {
  yield 1;
  yield 2;
}

// Correct - call the generator function to create an iterator
expect(myGenerator(), 'to yield', 1);

// Incorrect - myGenerator is a Function, not an Iterable
// expect(myGenerator, 'to yield', 1); // This would fail type checking
```

### Edge Cases

#### Handling undefined Values

```js
expect([1, undefined, 3], 'to yield count', 3);
expect([undefined], 'to yield', undefined);
```

#### String Iteration

Strings are iterable (by character):

```js
expect('abc', 'to yield', 'b');
expect('abc', 'to yield count', 3);
```

#### Map Iteration

Maps yield `[key, value]` entries:

```js
const map = new Map([
  ['a', 1],
  ['b', 2],
]);
expect(map, 'to yield count', 2);
expect(map, 'to yield', ['a', 1]);
```
