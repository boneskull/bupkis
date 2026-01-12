# Iterator/Iterable Assertions Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add built-in assertions for testing synchronous iterables/iterators and asynchronous iterables/iterators (including Node.js streams and Web Streams).

**Architecture:** Core assertions using `createAssertion()` for sync and `createAsyncAssertion()` for async. Zod schemas detect iterable/iterator protocol compliance. Assertions consume iterables via iteration protocol, NOT collection APIs.

**Tech Stack:** TypeScript, Zod v4, Node.js built-in test runner

---

## Design Decisions

### Semantic Separation from Collection Assertions

Iterator assertions test the **iteration protocol** (`Symbol.iterator` / `Symbol.asyncIterator`), while existing collection assertions test **native collection APIs** (e.g., `Array.prototype.includes`, `.size`).

These are kept **separate** because:
- A subject could implement both protocols with different behavior
- Custom `Symbol.iterator` overrides, Proxies, or `Symbol.species` abuse could cause divergent results
- Explicit assertion names communicate what's actually being tested

```typescript
// Collection assertion - uses Array.prototype.includes()
expect([1, 2, 3], 'to contain', 2);

// Iterator assertion - uses for...of / Symbol.iterator
expect([1, 2, 3], 'to yield', 2);
```

### Generator Functions Require Explicit Calling

Generator functions are NOT accepted directly. Users must call them:

```typescript
// ✅ Correct - call the generator function
expect(myGenerator(), 'to yield', 1);

// ❌ Not supported - myGenerator is a Function, not an Iterable
expect(myGenerator, 'to yield', 1);
```

Rationale:
- Generators are one-shot; explicit calling gives users control over creation
- Generator functions may take parameters
- Matches the principle of least surprise

### No Memory Limits

Users are responsible for managing memory when iterating large/infinite streams. They can always use manual `for await...of` loops with custom assertions if needed.

### Timeouts Are the Test Framework's Responsibility

Bupkis does **not** implement timeouts for async iteration. If an async iterable hangs or never completes, the test framework's built-in timeout mechanism (e.g., Node.js test runner's `--test-timeout`, Mocha's `this.timeout()`, Jest's `testTimeout`) is responsible for terminating the test.

This follows the principle that assertion libraries assert on values, not execution timing.

### Web Streams Support

Modern browsers (Chrome 124+, Firefox 110+, Safari 16.4+) and Node.js v22+ support `ReadableStream[Symbol.asyncIterator]` directly. No wrapping required.

---

## Assertion Phrases

### Sync Iterable Assertions (via `expect()`)

| Phrase | Description |
|--------|-------------|
| `'to yield'` / `'to emit'` / `'to yield value satisfying'` | ANY yielded value satisfies (partial matching) |
| `'to yield value exhaustively satisfying'` | ANY yielded value matches with deep equality |
| `'to yield items satisfying'` | ALL yielded values individually satisfy (partial) |
| `'to yield items exhaustively satisfying'` | ALL yielded values individually match (deep equality) |
| `'to yield first'` / `'to yield first satisfying'` | First yielded value satisfies |
| `'to yield first exhaustively satisfying'` | First yielded value matches with deep equality |
| `'to yield last'` / `'to yield last satisfying'` | Last yielded value satisfies |
| `'to yield last exhaustively satisfying'` | Last yielded value matches with deep equality |
| `'to yield count'` | Exact count of yielded values |
| `'to yield at least'` | Minimum count |
| `'to yield at most'` | Maximum count |
| `'to be an empty iterable'` | Yields nothing |
| `'to yield exactly'` | Collect all → deep equality on sequence |
| `'to yield sequence satisfying'` / `'to yield array satisfying'` | Collect all → satisfy semantics on sequence |

> **Note:** No separate "non-empty" assertion. Use `'not to be an empty iterable'` or `'to yield at least', 1`.

### Async Iterable Assertions (via `expectAsync()`)

All sync phrases above, plus:

| Phrase | Description |
|--------|-------------|
| `'to complete'` / `'to finish'` | Iterator completes without rejecting |
| `'to reject'` / `'to be rejected'` | Iterator rejects during iteration |
| `'to reject with a'` / `'to reject with an'` | Rejects with specific error type |
| `'to reject with error satisfying'` / `'to be rejected with error satisfying'` | Rejects with error matching schema |

> **Note:** Uses same phrases as Promise assertions since async iterator `.next()` returns a Promise.

---

## Prerequisites

Before starting, ensure you have:
- Node.js 22.12+ (for stable Web Streams API)
- Understanding of JavaScript iteration protocols
- Familiarity with Bupkis assertion creation patterns

---

## Task 1: Create Zod Schemas for Iterables/Iterators

**Files:**
- Modify: `packages/bupkis/src/schema.ts`

**Step 1: Add sync iterable/iterator schemas**

Add to `packages/bupkis/src/schema.ts`:

```typescript
/**
 * Schema matching any synchronous iterable (has Symbol.iterator method).
 */
export const SyncIterableSchema = z.custom<Iterable<unknown>>(
  (val): val is Iterable<unknown> =>
    val != null && typeof (val as any)[Symbol.iterator] === 'function',
  { error: 'Expected a synchronous iterable' },
);

/**
 * Schema matching any synchronous iterator (has next() method).
 */
export const SyncIteratorSchema = z.custom<Iterator<unknown>>(
  (val): val is Iterator<unknown> =>
    val != null && typeof (val as any).next === 'function',
  { error: 'Expected a synchronous iterator' },
);

/**
 * Schema matching either a sync iterable or sync iterator.
 */
export const SyncIterableOrIteratorSchema = z.union([
  SyncIterableSchema,
  SyncIteratorSchema,
]);
```

**Step 2: Add async iterable/iterator schemas**

```typescript
/**
 * Schema matching any asynchronous iterable (has Symbol.asyncIterator method).
 */
export const AsyncIterableSchema = z.custom<AsyncIterable<unknown>>(
  (val): val is AsyncIterable<unknown> =>
    val != null && typeof (val as any)[Symbol.asyncIterator] === 'function',
  { error: 'Expected an asynchronous iterable' },
);

/**
 * Schema matching any asynchronous iterator (has async next() method).
 */
export const AsyncIteratorSchema = z.custom<AsyncIterator<unknown>>(
  (val): val is AsyncIterator<unknown> =>
    val != null && typeof (val as any).next === 'function',
  { error: 'Expected an asynchronous iterator' },
);

/**
 * Schema matching either an async iterable or async iterator.
 * Also accepts sync iterables (can be consumed async).
 */
export const AsyncIterableOrIteratorSchema = z.union([
  AsyncIterableSchema,
  AsyncIteratorSchema,
  SyncIterableSchema,
]);
```

**Step 3: Export the new schemas**

Add exports to the module's public API.

**Verification:**
- Run `npm run lint:types` - should pass
- Schemas should correctly match arrays, Sets, generators, ReadableStreams, etc.

---

## Task 2: Create Iteration Utility Functions

**Files:**
- Create: `packages/bupkis/src/assertion/impl/iteration-util.ts`

**Step 1: Create sync iteration helpers**

```typescript
/**
 * Normalizes an iterable or iterator to an iterator.
 */
export function toIterator<T>(source: Iterable<T> | Iterator<T>): Iterator<T> {
  if (Symbol.iterator in source) {
    return (source as Iterable<T>)[Symbol.iterator]();
  }
  return source as Iterator<T>;
}

/**
 * Collects all values from an iterable/iterator into an array.
 */
export function collectSync<T>(source: Iterable<T> | Iterator<T>): T[] {
  const result: T[] = [];
  const iterator = toIterator(source);
  let next = iterator.next();
  while (!next.done) {
    result.push(next.value);
    next = iterator.next();
  }
  return result;
}

/**
 * Counts items yielded by an iterable/iterator.
 */
export function countSync(source: Iterable<unknown> | Iterator<unknown>): number {
  let count = 0;
  const iterator = toIterator(source);
  while (!iterator.next().done) {
    count++;
  }
  return count;
}
```

**Step 2: Create async iteration helpers**

```typescript
/**
 * Normalizes an async iterable/iterator to an async iterator.
 * Also handles sync iterables for convenience.
 */
export function toAsyncIterator<T>(
  source: AsyncIterable<T> | AsyncIterator<T> | Iterable<T>,
): AsyncIterator<T> {
  if (Symbol.asyncIterator in source) {
    return (source as AsyncIterable<T>)[Symbol.asyncIterator]();
  }
  if (Symbol.iterator in source) {
    // Wrap sync iterator as async
    const syncIterator = (source as Iterable<T>)[Symbol.iterator]();
    return {
      async next() {
        return syncIterator.next();
      },
    };
  }
  return source as AsyncIterator<T>;
}

/**
 * Collects all values from an async iterable/iterator into an array.
 */
export async function collectAsync<T>(
  source: AsyncIterable<T> | AsyncIterator<T> | Iterable<T>,
): Promise<T[]> {
  const result: T[] = [];
  const iterator = toAsyncIterator(source);
  let next = await iterator.next();
  while (!next.done) {
    result.push(next.value);
    next = await iterator.next();
  }
  return result;
}

/**
 * Counts items yielded by an async iterable/iterator.
 */
export async function countAsync(
  source: AsyncIterable<unknown> | AsyncIterator<unknown> | Iterable<unknown>,
): Promise<number> {
  let count = 0;
  const iterator = toAsyncIterator(source);
  while (!(await iterator.next()).done) {
    count++;
  }
  return count;
}
```

**Verification:**
- Unit tests for helpers with arrays, generators, async generators
- Test with Node.js Readable streams
- Test with Web ReadableStream (in Node.js v22+ environment)

---

## Task 3: Implement Sync Iterable Assertions

**Files:**
- Create: `packages/bupkis/src/assertion/impl/sync-iterable.ts`
- Modify: `packages/bupkis/src/assertion/impl/sync.ts` (add to exports)

**Step 1: Implement 'to yield' assertion (satisfy semantics)**

```typescript
import { inspect } from 'node:util';
import { z } from 'zod/v4';
import { SyncIterableOrIteratorSchema, UnknownSchema } from '../../schema.js';
import { createAssertion } from '../create.js';
import { toIterator } from './iteration-util.js';
import {
  valueToSchema,
  valueToSchemaOptionsForSatisfies,
  valueToSchemaOptionsForEquality,
} from '../../value-to-schema.js';
import { satisfies } from '../../util.js';

/**
 * Asserts that an iterable yields a value satisfying the expected shape.
 * Uses partial/satisfy semantics (like 'to satisfy').
 *
 * @example
 * ```ts
 * expect([{ a: 1, b: 2 }], 'to yield', { a: 1 }); // passes (partial match)
 * expect([1, 2, 3], 'to emit', 2); // passes
 * expect(myGenerator(), 'to yield value satisfying', { name: 'test' }); // passes
 * ```
 *
 * @group Iterable Assertions
 * @bupkisAssertionCategory iterable
 */
export const iterableYieldsAssertion = createAssertion(
  [
    SyncIterableOrIteratorSchema,
    ['to yield', 'to emit', 'to yield value satisfying'],
    UnknownSchema,
  ],
  (subject, expected) => {
    const iterator = toIterator(subject);
    const schema = valueToSchema(expected, valueToSchemaOptionsForSatisfies);
    let next = iterator.next();
    while (!next.done) {
      if (satisfies(next.value, schema)) {
        return; // success - found a matching value
      }
      next = iterator.next();
    }
    return {
      message: `Expected iterable to yield a value satisfying ${inspect(expected)}, but none matched`,
    };
  },
);

/**
 * Asserts that an iterable yields a value exhaustively matching the expected value.
 * Uses deep equality semantics (like 'to equal').
 *
 * @example
 * ```ts
 * expect([{ a: 1 }], 'to yield value exhaustively satisfying', { a: 1 }); // passes
 * expect([{ a: 1, b: 2 }], 'to yield value exhaustively satisfying', { a: 1 }); // fails (extra prop)
 * ```
 *
 * @group Iterable Assertions
 * @bupkisAssertionCategory iterable
 */
export const iterableYieldsExhaustivelyAssertion = createAssertion(
  [
    SyncIterableOrIteratorSchema,
    'to yield value exhaustively satisfying',
    UnknownSchema,
  ],
  (subject, expected) => {
    const iterator = toIterator(subject);
    const schema = valueToSchema(expected, valueToSchemaOptionsForEquality);
    let next = iterator.next();
    while (!next.done) {
      if (satisfies(next.value, schema)) {
        return; // success - found an exact match
      }
      next = iterator.next();
    }
    return {
      message: `Expected iterable to yield a value exhaustively satisfying ${inspect(expected)}, but none matched`,
    };
  },
);
```

**Step 2: Implement sequence assertions**

```typescript
/**
 * Asserts that an iterable yields exactly the specified values in order.
 * Uses deep equality semantics.
 *
 * @example
 * ```ts
 * expect([1, 2, 3], 'to yield exactly', [1, 2, 3]); // passes
 * expect([{ a: 1, b: 2 }], 'to yield exactly', [{ a: 1 }]); // fails (extra prop)
 * ```
 *
 * @group Iterable Assertions
 * @bupkisAssertionCategory iterable
 */
export const iterableYieldsExactlyAssertion = createAssertion(
  [SyncIterableOrIteratorSchema, 'to yield exactly', z.array(UnknownSchema)],
  (subject, expected) => {
    const actual = collectSync(subject);
    const schema = valueToSchema(expected, valueToSchemaOptionsForEquality);
    return { schema, subject: actual };
  },
);

/**
 * Asserts that an iterable yields values that satisfy the expected sequence.
 * Uses satisfy/partial matching semantics.
 *
 * @example
 * ```ts
 * expect([{ a: 1, b: 2 }], 'to yield sequence satisfying', [{ a: 1 }]); // passes
 * expect([1, 2, 3], 'to yield array satisfying', [1, 2, 3]); // passes
 * ```
 *
 * @group Iterable Assertions
 * @bupkisAssertionCategory iterable
 */
export const iterableYieldsSequenceSatisfyingAssertion = createAssertion(
  [
    SyncIterableOrIteratorSchema,
    ['to yield sequence satisfying', 'to yield array satisfying'],
    z.array(UnknownSchema),
  ],
  (subject, expected) => {
    const actual = collectSync(subject);
    const schema = valueToSchema(expected, valueToSchemaOptionsForSatisfies);
    return { schema, subject: actual };
  },
);
```

**Step 3: Implement remaining sync assertions**

Implement the following assertions following the same pattern:

**Satisfy semantics (use `valueToSchemaOptionsForSatisfies`):**
- `iterableYieldsItemsSatisfyingAssertion` - 'to yield items satisfying'
- `iterableYieldsFirstAssertion` - 'to yield first' / 'to yield first satisfying'
- `iterableYieldsLastAssertion` - 'to yield last' / 'to yield last satisfying'

**Deep equality semantics (use `valueToSchemaOptionsForEquality`):**
- `iterableYieldsItemsExhaustivelyAssertion` - 'to yield items exhaustively satisfying'
- `iterableYieldsFirstExhaustivelyAssertion` - 'to yield first exhaustively satisfying'
- `iterableYieldsLastExhaustivelyAssertion` - 'to yield last exhaustively satisfying'

**Cardinality (no schema comparison):**
- `iterableYieldsCountAssertion` - 'to yield count'
- `iterableYieldsAtLeastAssertion` - 'to yield at least'
- `iterableYieldsAtMostAssertion` - 'to yield at most'
- `iterableEmptyAssertion` - 'to be an empty iterable' (distinct from array/set empty)

> **Note:** No separate "non-empty" assertion. Use negation (`'not to be an empty iterable'`) or `'to yield at least', 1`.

**Aggregate/Sequence:**
- `iterableYieldsExactlyAssertion` - 'to yield exactly' (collect all, deep equality on sequence)
- `iterableYieldsSequenceSatisfyingAssertion` - 'to yield sequence satisfying' / 'to yield array satisfying' (collect all, satisfy semantics)

**Step 4: Export assertions**

Create `SyncIterableAssertions` tuple and add to main sync exports.

**Step 5: Add JSDoc tags for documentation**

Each assertion must include `@bupkisAnchor` and `@bupkisAssertionCategory` tags. See Task 6 for details.

**Verification:**
- Unit tests for each assertion
- Test with arrays, Sets, Maps, generators, custom iterables
- Test negation (`'not to yield'`, etc.)

---

## Task 4: Implement Async Iterable Assertions

**Files:**
- Create: `packages/bupkis/src/assertion/impl/async-iterable.ts`
- Modify: `packages/bupkis/src/assertion/impl/async.ts` (add to exports)

**Step 1: Implement async 'to yield' assertion**

```typescript
import { inspect } from 'node:util';
import { z } from 'zod/v4';
import { AsyncIterableOrIteratorSchema, UnknownSchema } from '../../schema.js';
import { createAsyncAssertion } from '../create.js';
import { toAsyncIterator } from './iteration-util.js';

/**
 * Asserts that an async iterable yields a specific value at some point.
 *
 * @example
 * ```ts
 * await expectAsync(asyncGenerator(), 'to yield', 'value'); // passes
 * await expectAsync(nodeReadable, 'to emit', 'chunk'); // passes
 * await expectAsync(response.body, 'to yield', expectedChunk); // Web Stream
 * ```
 *
 * @group Async Iterable Assertions
 * @bupkisAssertionCategory iterable
 */
export const asyncIterableYieldsAssertion = createAsyncAssertion(
  [AsyncIterableOrIteratorSchema, ['to yield', 'to emit'], UnknownSchema],
  async (subject, expected) => {
    const iterator = toAsyncIterator(subject);
    let next = await iterator.next();
    while (!next.done) {
      if (Object.is(next.value, expected)) {
        return; // success
      }
      next = await iterator.next();
    }
    return {
      message: `Expected async iterable to yield ${inspect(expected)}, but it was not found`,
    };
  },
);
```

**Step 2: Implement async completion/error assertions**

```typescript
/**
 * Asserts that an async iterable completes without throwing.
 *
 * @example
 * ```ts
 * await expectAsync(asyncGenerator(), 'to complete'); // passes if no error
 * await expectAsync(nodeReadable, 'to finish'); // passes if stream ends cleanly
 * ```
 *
 * @group Async Iterable Assertions
 * @bupkisAssertionCategory iterable
 */
export const asyncIterableCompletesAssertion = createAsyncAssertion(
  [AsyncIterableOrIteratorSchema, ['to complete', 'to finish']],
  async (subject) => {
    try {
      const iterator = toAsyncIterator(subject);
      while (!(await iterator.next()).done) {
        // consume
      }
    } catch (err) {
      return {
        message: `Expected async iterable to complete, but it rejected with: ${inspect(err)}`,
      };
    }
  },
);

/**
 * Asserts that an async iterable rejects during iteration.
 *
 * @example
 * ```ts
 * await expectAsync(failingStream, 'to reject'); // passes if iteration rejects
 * await expectAsync(failingStream, 'to be rejected'); // alias
 * ```
 *
 * @group Async Iterable Assertions
 * @bupkisAssertionCategory iterable
 */
export const asyncIterableRejectsAssertion = createAsyncAssertion(
  [AsyncIterableOrIteratorSchema, ['to reject', 'to be rejected']],
  async (subject) => {
    try {
      const iterator = toAsyncIterator(subject);
      while (!(await iterator.next()).done) {
        // consume
      }
      return {
        message: 'Expected async iterable to reject, but it completed successfully',
      };
    } catch {
      // success - it rejected
    }
  },
);
```

**Step 3: Implement remaining async assertions**

Mirror the sync assertions plus the async-only completion/error assertions:
- `asyncIterableYieldsExactlyAssertion`
- `asyncIterableYieldsSatisfyingAssertion`
- `asyncIterableYieldsItemsSatisfyingAssertion`
- `asyncIterableYieldsFirstAssertion`
- `asyncIterableYieldsLastAssertion`
- `asyncIterableYieldsCountAssertion`
- `asyncIterableYieldsAtLeastAssertion`
- `asyncIterableYieldsAtMostAssertion`
- `asyncIterableEmptyAssertion`
- `asyncIterableNonEmptyAssertion`
- `asyncIterableCollectsToAssertion`
- `asyncIterableCollectsSatisfyingAssertion`
- `asyncIterableRejectsWithTypeAssertion` - 'to reject with a' / 'to reject with an'
- `asyncIterableRejectsWithErrorSatisfyingAssertion` - 'to reject with error satisfying'

**Step 4: Export assertions**

Create `AsyncIterableAssertions` tuple and add to main async exports.

**Step 5: Add JSDoc tags for documentation**

Each assertion must include `@bupkisAnchor` and `@bupkisAssertionCategory` tags. See Task 6 for details.

**Verification:**
- Unit tests for each assertion
- Test with async generators
- Test with Node.js Readable streams
- Test with Web ReadableStream (fetch response.body)
- Test error scenarios

---

## Task 5: Add Tests

**Files:**
- Create: `packages/bupkis/test/assertion/sync-iterable.test.ts`
- Create: `packages/bupkis/test/assertion/async-iterable.test.ts`

**Step 1: Create sync iterable tests**

Test each sync assertion with:
- Arrays
- Sets
- Maps (iterates entries)
- Generators
- Custom iterable objects
- Negation cases

**Step 2: Create async iterable tests**

Test each async assertion with:
- Async generators
- Node.js `Readable.from()` streams
- Web `ReadableStream`
- `response.body` from fetch (mock or real)
- Error/completion scenarios
- Negation cases

**Step 3: Test edge cases**

- Empty iterables
- Single-item iterables
- Iterables that throw mid-iteration
- Iterator vs Iterable distinction (pass raw iterator)

**Verification:**
- `npm test` passes
- Coverage for all new assertions

---

## Task 6: Documentation

**Files:**
- Create: `site/assertions/iterable.md`
- Modify: `site/assertions/all.md` (add include)
- Modify: `.config/typedoc-plugin-bupkis.js` (add category mapping)

**Step 1: Add category to TypeDoc plugin**

In `.config/typedoc-plugin-bupkis.js`, add to `CATEGORY_DOC_MAP`:

```javascript
iterable: 'Iterable_Assertions',
```

**Step 2: Create iterable assertions documentation page**

Create `site/assertions/iterable.md` following the established format:

```markdown
---
title: Iterable Assertions
category: Assertions
---

## Iterable Assertions

These assertions test iterables and async iterables using the **iteration protocol** (`Symbol.iterator` / `Symbol.asyncIterator`).

> ⚠️ **Important:** These assertions are semantically different from [Collection Assertions](./collection.md).
> Collection assertions use native APIs like `Array.prototype.includes()` and `.size`.
> Iterable assertions use `for...of` / `for await...of` to consume the iterator.
> A subject with custom `Symbol.iterator` behavior may produce different results.

### {Iterable} to yield {any}

> ✏️ Aliases:
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

function* gen() { yield { name: 'test', extra: true }; }
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

### {Iterable} to yield value exhaustively satisfying {any}

Iterates through the subject and checks if any yielded value **exhaustively matches** the expected value (deep equality semantics, like `'to equal'`).

**Success**:

```js
expect([{ a: 1 }, { b: 2 }], 'to yield value exhaustively satisfying', { a: 1 }); // passes
```

**Failure**:

```js
// Extra properties cause failure with exhaustive matching
expect([{ a: 1, b: 2 }], 'to yield value exhaustively satisfying', { a: 1 });
// AssertionError: Expected iterable to yield a value exhaustively satisfying { a: 1 }, but none matched
```

**Negation**:

```js
expect([{ a: 1, b: 2 }], 'not to yield value exhaustively satisfying', { a: 1 });
```

### {Iterable} to yield exactly {array}

Collects all yielded values and checks they match the expected array with **deep equality** semantics.

**Success**:

```js
expect([1, 2, 3], 'to yield exactly', [1, 2, 3]);

function* gen() { yield 'a'; yield 'b'; }
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

### {Iterable} to yield sequence satisfying {array}

> ✏️ Aliases:
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

<!-- Continue with remaining assertions following this format... -->
```

Include documentation for ALL assertions:
- `{Iterable} to yield {any}` / `to emit` / `to yield value satisfying` (satisfy semantics)
- `{Iterable} to yield value exhaustively satisfying {any}` (deep equality semantics)
- `{Iterable} to yield exactly {array}`
- `{Iterable} to yield items satisfying {any}` (satisfy semantics)
- `{Iterable} to yield items exhaustively satisfying {any}` (deep equality semantics)
- `{Iterable} to yield first {any}` / `to yield first satisfying` (satisfy semantics)
- `{Iterable} to yield first exhaustively satisfying {any}` (deep equality semantics)
- `{Iterable} to yield last {any}` / `to yield last satisfying` (satisfy semantics)
- `{Iterable} to yield last exhaustively satisfying {any}` (deep equality semantics)
- `{Iterable} to yield count {number}`
- `{Iterable} to yield at least {number}`
- `{Iterable} to yield at most {number}`
- `{Iterable} to be an empty iterable`
- `{Iterable} to yield exactly {array}` (deep equality on whole sequence)
- `{Iterable} to yield sequence satisfying {array}` / `to yield array satisfying` (satisfy semantics)

Add a dedicated **Async Iterable Assertions** section with:
- `{AsyncIterable} to yield {any}` / `to emit`
- `{AsyncIterable} to yield exactly {array}`
- (mirror all sync assertions)
- `{AsyncIterable} to complete` / `to finish`
- `{AsyncIterable} to reject` / `to be rejected`
- `{AsyncIterable} to reject with a {Constructor}` / `to reject with an`
- `{AsyncIterable} to reject with error satisfying {any}`

Include examples with:
- Node.js streams (`Readable.from()`)
- Web ReadableStream (`response.body`)
- Async generators

**Step 3: Update all.md**

Add the include to `site/assertions/all.md`:

```markdown
{@include ./iterable.md}
```

Place it logically (after collections or before promise assertions).

**Step 4: Add JSDoc tags to all assertion implementations**

Each assertion in `sync-iterable.ts` and `async-iterable.ts` must have:

```typescript
/**
 * Asserts that an iterable yields a specific value.
 *
 * @bupkisAnchor iterable-to-yield-any
 * @bupkisAssertionCategory iterable
 */
export const iterableYieldsAssertion = createAssertion(...);
```

Use consistent anchor naming:
- Sync: `iterable-to-yield-any`, `iterable-to-yield-exactly-array`, etc.
- Async: `async-iterable-to-yield-any`, `async-iterable-to-complete`, etc.

**Verification:**
- Run `npm run docs:build` - should complete without errors
- Check build logs for redirect registration messages
- Run `node .claude/skills/bupkis-docs/scripts/validate-redirects.js --build`
- Verify generated HTML in `docs/documents/Iterable_Assertions.html`

---

## Task 7: Type Inference Verification

**Files:**
- Create: `packages/bupkis/test/types/iterable-assertions.test-d.ts`

**Step 1: Add type tests**

Verify TypeScript correctly infers:
- Iterable assertions only accept iterables
- Async iterable assertions accept async iterables AND sync iterables
- Schema parameters are correctly typed
- Negation types work

**Verification:**
- `npm run lint:types` passes
- Type tests provide expected errors for invalid usage

---

## Summary

This implementation adds comprehensive iterator/iterable assertions to Bupkis core:

**Sync (via `expect()`):**
- ~14 new assertions for synchronous iterables
- Both satisfy (partial) and exhaustive (deep equality) variants
- Works with arrays, Sets, Maps, generators, custom iterables

**Async (via `expectAsync()`):**
- ~18 new assertions for asynchronous iterables
- Both satisfy (partial) and exhaustive (deep equality) variants
- Works with async generators, Node.js streams, Web ReadableStream
- Includes completion/error assertions

**Key Design Points:**
- Semantic separation from collection assertions
- Satisfy vs exhaustive semantics (mirrors `'to satisfy'` vs `'to equal'`)
- No automatic generator function calling
- No memory limits (user responsibility)
- Timeouts are the test framework's responsibility
- Native Web Streams support (no wrapping)
