# @bupkis/rxjs

RxJS Observable assertions for [Bupkis](https://bupkis.zip).

All assertions are **asynchronous** since Observable operations are inherently async.

## Installation

```bash
npm install @bupkis/rxjs bupkis rxjs
```

## Usage

```typescript
import { use } from 'bupkis';
import rxjsAssertions from '@bupkis/rxjs';
import { EMPTY, of, throwError } from 'rxjs';

const { expectAsync } = use(rxjsAssertions);

// Completion assertions
await expectAsync(of(1, 2, 3), 'to complete');
await expectAsync(EMPTY, 'to be empty');

// Error assertions
await expectAsync(
  throwError(() => new Error('oops')),
  'to emit error',
);
await expectAsync(
  throwError(() => new Error('oops')),
  'to emit error',
  'oops',
);

// Value assertions
await expectAsync(of('foo', 'bar'), 'to emit values', ['foo', 'bar']);
await expectAsync(of(1, 2, 3), 'to emit times', 3);
await expectAsync(of(42), 'to emit once');

// Completion value assertions
await expectAsync(of(1, 2, 'final'), 'to complete with value', 'final');
```

## Assertions

### {Observable} to complete

Asserts that an Observable completes successfully (does not error).

**Success**:

```js
await expectAsync(of(1, 2, 3), 'to complete');
await expectAsync(EMPTY, 'to complete');
```

**Failure**:

```js
await expectAsync(
  throwError(() => new Error('oops')),
  'to complete',
);
// AssertionError: Expected Observable to complete, but it errored with Error: oops
```

**Negation**:

```js
await expectAsync(
  throwError(() => new Error('oops')),
  'not to complete',
);
```

### {Observable} to be empty

> Aliases:
>
>     {Observable} to be empty
>     {Observable} to complete without emitting

Asserts that an Observable completes without emitting any values.

**Success**:

```js
await expectAsync(EMPTY, 'to be empty');
await expectAsync(EMPTY, 'to complete without emitting');
```

**Failure**:

```js
await expectAsync(of(1), 'to be empty');
// AssertionError: Expected Observable to emit 0 values, but it emitted 1
```

**Negation**:

```js
await expectAsync(of(1), 'not to be empty');
```

### {Observable} to emit error

Asserts that an Observable errors (calls the error callback).

**Success**:

```js
await expectAsync(
  throwError(() => new Error('oops')),
  'to emit error',
);
```

**Failure**:

```js
await expectAsync(of(1, 2, 3), 'to emit error');
// AssertionError: Expected Observable to error, but it completed successfully
```

**Negation**:

```js
await expectAsync(of(1, 2, 3), 'not to emit error');
```

### {Observable} to emit error {string | RegExp}

Asserts that an Observable errors with a message matching the given string or regex.

**Success**:

```js
await expectAsync(
  throwError(() => new Error('oops')),
  'to emit error',
  'oops',
);
await expectAsync(
  throwError(() => new Error('something went wrong')),
  'to emit error',
  /went wrong/,
);
```

**Failure**:

```js
await expectAsync(
  throwError(() => new Error('oops')),
  'to emit error',
  'different',
);
// AssertionError: Expected error message to be "different", but got "oops"

await expectAsync(
  throwError(() => new Error('oops')),
  'to emit error',
  /no match/,
);
// AssertionError: Expected error message to match /no match/, but got "oops"
```

**Negation**:

```js
await expectAsync(
  throwError(() => new Error('oops')),
  'not to emit error',
  'different',
);
```

### {Observable} to emit error satisfying {object}

Asserts that an Observable errors with an error object satisfying a partial specification.

**Success**:

```js
await expectAsync(
  throwError(() => new TypeError('type error')),
  'to emit error satisfying',
  { name: 'TypeError' },
);

await expectAsync(
  throwError(() => new TypeError('type error')),
  'to emit error satisfying',
  { name: 'TypeError', message: 'type error' },
);
```

**Failure**:

```js
await expectAsync(
  throwError(() => new Error('oops')),
  'to emit error satisfying',
  { name: 'TypeError' },
);
// AssertionError: Expected error to satisfy spec, but name did not match: expected Error, got TypeError
```

**Negation**:

```js
await expectAsync(
  throwError(() => new Error('oops')),
  'not to emit error satisfying',
  { name: 'TypeError' },
);
```

### {Observable} to emit values {array}

Asserts that an Observable emits exactly the specified values in order. Uses strict equality (`===`) for comparison.

**Success**:

```js
await expectAsync(of('foo', 'bar'), 'to emit values', ['foo', 'bar']);
await expectAsync(of(1, 2, 3), 'to emit values', [1, 2, 3]);
await expectAsync(EMPTY, 'to emit values', []);
```

**Failure**:

```js
await expectAsync(of(1, 2, 3), 'to emit values', [1, 2]);
// AssertionError: Expected Observable to emit 2 values, but it emitted 3

await expectAsync(of(1, 2), 'to emit values', [2, 1]);
// AssertionError: Expected value at index 0 to be 2, but got 1
```

**Note**: Uses strict equality, so objects must be the same reference:

```js
const obj = { a: 1 };
await expectAsync(of(obj), 'to emit values', [obj]); // passes - same reference
await expectAsync(of({ a: 1 }), 'to emit values', [{ a: 1 }]); // fails - different references
```

**Negation**:

```js
await expectAsync(of(1, 2, 3), 'not to emit values', [3, 2, 1]);
```

### {Observable} to emit times {number}

Asserts that an Observable emits exactly the specified number of values.

**Success**:

```js
await expectAsync(of(1, 2, 3), 'to emit times', 3);
await expectAsync(EMPTY, 'to emit times', 0);
```

**Failure**:

```js
await expectAsync(of(1, 2, 3), 'to emit times', 2);
// AssertionError: Expected Observable to emit 2 values, but it emitted 3
```

**Negation**:

```js
await expectAsync(of(1, 2, 3), 'not to emit times', 5);
```

### {Observable} to emit once

Asserts that an Observable emits exactly one value.

**Success**:

```js
await expectAsync(of(42), 'to emit once');
```

**Failure**:

```js
await expectAsync(EMPTY, 'to emit once');
// AssertionError: Expected Observable to emit 1 value, but it emitted 0

await expectAsync(of(1, 2), 'to emit once');
// AssertionError: Expected Observable to emit 1 value, but it emitted 2
```

**Negation**:

```js
await expectAsync(of(1, 2), 'not to emit once');
```

### {Observable} to emit twice

Asserts that an Observable emits exactly two values.

**Success**:

```js
await expectAsync(of(1, 2), 'to emit twice');
```

**Failure**:

```js
await expectAsync(of(1), 'to emit twice');
// AssertionError: Expected Observable to emit 2 values, but it emitted 1
```

**Negation**:

```js
await expectAsync(of(1), 'not to emit twice');
```

### {Observable} to emit thrice

Asserts that an Observable emits exactly three values.

**Success**:

```js
await expectAsync(of(1, 2, 3), 'to emit thrice');
```

**Failure**:

```js
await expectAsync(of(1, 2), 'to emit thrice');
// AssertionError: Expected Observable to emit 3 values, but it emitted 2
```

**Negation**:

```js
await expectAsync(of(1, 2), 'not to emit thrice');
```

### {Observable} to complete with value {unknown}

Asserts that an Observable completes and its last emitted value equals the expected value (strict equality).

**Success**:

```js
await expectAsync(of(1, 2, 'final'), 'to complete with value', 'final');
await expectAsync(of(42), 'to complete with value', 42);
```

**Failure**:

```js
await expectAsync(of(1, 2, 3), 'to complete with value', 2);
// AssertionError: Expected Observable to complete with value 2, but got 3

await expectAsync(EMPTY, 'to complete with value', 'any');
// AssertionError: Expected Observable to emit at least one value, but it completed without emitting
```

**Negation**:

```js
await expectAsync(of(1, 2, 3), 'not to complete with value', 5);
```

### {Observable} to complete with values {array}

Asserts that an Observable completes and emits exactly the specified values in order. Essentially an alias for `to emit values` that emphasizes completion.

**Success**:

```js
await expectAsync(of('foo', 'bar', 'baz'), 'to complete with values', [
  'foo',
  'bar',
  'baz',
]);
await expectAsync(EMPTY, 'to complete with values', []);
```

**Failure**:

```js
await expectAsync(of(1, 2, 3), 'to complete with values', [1, 2]);
// AssertionError: Expected Observable to emit 2 values, but it emitted 3
```

**Negation**:

```js
await expectAsync(of(1, 2, 3), 'not to complete with values', [3, 2, 1]);
```

### {Observable} to complete with value satisfying {object}

Asserts that an Observable completes and its last emitted value satisfies a partial specification (all specified properties match).

**Success**:

```js
await expectAsync(
  of({ status: 'pending' }, { status: 'done', result: 42 }),
  'to complete with value satisfying',
  { status: 'done' },
);

await expectAsync(
  of({ a: 1, b: 2, c: 3 }),
  'to complete with value satisfying',
  { a: 1, b: 2 },
);
```

**Failure**:

```js
await expectAsync(
  of({ status: 'pending' }),
  'to complete with value satisfying',
  { status: 'done' },
);
// AssertionError: Expected last value to satisfy spec, but status did not match: expected done, got pending

await expectAsync(EMPTY, 'to complete with value satisfying', { any: 'spec' });
// AssertionError: Expected Observable to emit at least one value, but it completed without emitting
```

**Negation**:

```js
await expectAsync(
  of({ status: 'pending' }),
  'not to complete with value satisfying',
  { status: 'done' },
);
```

## License

Copyright © 2026 [Christopher "boneskull" Hiller][boneskull]. Licensed under [BlueOak-1.0.0](https://blueoakcouncil.org/license/1.0.0).

[boneskull]: https://github.com/boneskull
