---
title: Basic Usage
category: Guides
---

## <span class="bupkis">Bupkis</span>: Basic Usage

So you want to use <span class="bupkis">BUPKIS</span> to write some assertions. Good. _Excellent_, even. This guide will get you started without the usual nonsense you'd find in other assertion libraries' documentation.

### Installation

If you're here, you likely know this part:

```bash
npm install bupkis -D
```

### Prerequisites

<span class="bupkis">BUPKIS</span> requires Node.js version **^20.19.0 || ^22.12.0 || >=23**. Take it or leave it.

The library supports both **ESM** and **CommonJS** module systems, because we're not ~~monsters~~ ~~pedants~~ _ideologues_ about this sort of thing.

### Importing

We know—you just want to write some damn tests. But <span class="bupkis">BUPKIS</span> offers different import strategies because ~~we couldn't decide~~ different use cases demand different approaches:

#### Quick Start: Just Expect

The most common case—you just want to make some assertions and get on with your life:

```ts
import { expect } from 'bupkis';

expect('hello', 'to be a string');
```

#### Full Import: Building Custom Assertions

When you're ready to get fancy with custom assertions (and you _will_ be):

```ts
import {
  expect,
  expectAsync,
  createAssertion,
  createAsyncAssertion,
  use,
  z,
} from 'bupkis';
```

#### Namespace Imports

<span class="bupkis">BUPKIS</span> contains a lot of lovely exports:

```ts
import { expect, assertion, guards, schema, util, error } from 'bupkis';

// Use assertion creation utilities
const myAssertion = assertion.createAssertion(['to be rad'], z.boolean());

// Use type guards
if (guards.isString(value)) {
  // value is guaranteed to be a string
}

schema.PropertyKeySchema.parse({}); // fails; not a number, symbol or string
```

## Basic Assertion Usage

Right. So. <span class="bupkis">BUPKIS</span> doesn't do the pretty-much-universally-reviled-in-2025-method-concatenation-thing. We've discussed this in the `README`, but it bears repeating: we buck the hell out of that busted trend. Here's a practical example using some sort of familiar test framework:

```ts
import { expect } from 'bupkis';

describe('Basic assertions', () => {
  it('should validate types', () => {
    expect('hello', 'to be a string');
    expect(42, 'to be a number');
    expect(true, 'to be a boolean');
  });

  it('should validate values', () => {
    expect(5, 'to equal', 5);
    expect('hello world', 'to contain', 'world');
    expect([1, 2, 3], 'to have length', 3);
  });

  it('should support negation', () => {
    // prepend assertions with "not"
    expect(42, 'not to be a string');
    expect('hello', 'not to equal', 'goodbye');
  });

  it('should partially match objects', () => {
    const user = { name: 'Alice', age: 30 };

    // concatenate assertions with "and"
    expect(user, 'to be an object', 'and', 'to satisfy', { name: 'Alice' });
  });
});
```

### Negation with "not"

Every assertion in <span class="bupkis">BUPKIS</span> can be negated. _Every. Single. One._ Just slap a `"not "` in front of your phrase and you're good. No need to remember separate "not" methods and no guilt about the flagrant abuse of getters:

```ts
describe('Negation examples', () => {
  it('should support negated type checks', () => {
    expect(42, 'not to be a string');
    expect('hello', 'not to be a number');
    expect([], 'not to be a function');
  });

  it('should support negated value checks', () => {
    expect('apple', 'not to equal', 'orange');
    expect([1, 2, 3], 'not to have length', 5);
    expect('hello world', 'not to contain', 'goodbye');
  });

  it('should support negated object checks', () => {
    const user = { name: 'Alice', age: 30 };

    expect(user, 'not to have property', 'email');
    expect(user, 'not to satisfy', { name: 'Bob' });
    expect(user, 'not to be an', Array);
  });
});
```

Yes, it works with **all** assertion types. _Even your custom ones._

### Concatenation with "and"

Now here's where things get interesting. You can concatenate¹ multiple ("multiple" meaning _n_) assertions together using `"and"`:

```ts
describe('Assertion concatenation', () => {
  it('should concatenate multiple type and value checks', () => {
    // Concatenate type and range checks
    expect(42, 'to be a number', 'and', 'to be greater than', 0);
    expect('hello', 'to be a string', 'and', 'to have length', 5);

    // Concatenate multiple range conditions
    expect(25, 'to be greater than', 18, 'and', 'to be less than', 65);
  });

  it('should concatenate object assertions', () => {
    const user = { name: 'Alice', age: 30, role: 'admin' };

    expect(user, 'to be an object', 'and', 'to have property', 'name');
    expect(user.name, 'to be a string', 'and', 'to contain', 'Alice');
  });

  it('should concatenate again and again. love it!', () => {
    const numbers = [1, 2, 3, 4, 5];

    expect(
      numbers,
      'to be an array',
      'and',
      'to have length',
      5,
      'and',
      'to contain',
      3,
      'and',
      'not to contain',
      10,
    );
  });
});
```

> ¹ _Author's note_: Carefully avoiding the use of "chain" here.

#### Concatenation Rules

Some things you need to know:

- Use `"and"` to separate multiple assertions on the same subject
- Each assertion after `"and"` applies to the _original subject value_ (_not_ the result of the previous assertion)
- Concatenate as many as you want: `expect(value, assertion1, 'and', assertion2, 'and', assertion3, ...)`
- Works with both regular and negated assertions (because _of course it does_)
- "And" is not "or"; _all_ concatenated assertions must pass for the overall assertion to succeed

> **What about "or"?** It doesn't seem practically useful to us—this is for _testing_, after all—but if you have a use case, please [let us know](https://github.com/boneskull/bupkis/issues/new).

#### Concatenation vs. Multiple Statements

You don't _have_ to concatenate assertions; it's mainly just a stylistic preference. The behavior is _exactly the same_ either way.

```ts
// Using concatenation (recommended for related conditions)
expect(age, 'to be a number', 'and', 'to be between', 18, 65);

// Using separate statements (fine for unrelated conditions)
expect(age, 'to be a number');
expect(age, 'to be between', 18, 65);
```

## Embeddable Assertions

You aren't ready for this, but: **embeddable assertions**. The dark-grey-magic `expect.it()` function lets you create assertions which can be used _within_ assertions supporting the "to satisfy" pattern. _How did you live without this?_

Here, have some _absurdly expressive validation_ for complex structures:

```ts
describe('Object pattern validation', () => {
  it('should validate complex objects with embeddable assertions', () => {
    const user = {
      name: 'Alice Johnson',
      email: 'alice@example.com',
      age: 30,
      roles: ['admin', 'user'],
      metadata: {
        lastLogin: '2024-01-15',
        preferences: {
          theme: 'dark',
          notifications: true,
        },
      },
    };

    // Use embeddable assertions for flexible pattern matching
    expect(user, 'to satisfy', {
      name: expect.it('to be a string'),
      email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, // RegExp patterns also work
      age: expect.it('to be greater than', 18),
      roles: [expect.it('to be a string')], // Each array element must be a string
      metadata: {
        lastLogin: expect.it('to match', /^\d{4}-\d{2}-\d{2}$/),
        preferences: {
          theme: expect.it('to be one of', ['light', 'dark']),
          notifications: expect.it('to be a boolean', 'and', 'to be true'), // redundant, but proving a point
        },
      },
    });
  });
});
```

### Benefits of Embeddable Assertions

1. **Flexibility**: Mix exact values, RegExps, and assertions however you want
2. **Composability**: Nest assertions within other assertions—turtles all the way down
3. **Type Safety**: _Of course._
4. **Readable Patterns**: Express complex validation without making your eyes bleed

This feature makes <span class="bupkis">BUPKIS</span> particularly powerful for API response validation, configuration testing, and any scenario where you need to validate complex nested data structures. In other words: _the stuff you actually do in real tests_.

> While embeddable assertions are _freaking awesome_, you might get even more mileage out of [Custom Assertions](./custom-assertion.md).

### Drawbacks of Embeddable Assertions

1. None whatsoever.

## Snapshot Testing

> 🆕 **New in v0.13.0**

<span class="bupkis">BUPKIS</span> includes snapshot testing support for capturing and comparing complex output. Instead of manually asserting every property of a large object, you create a snapshot that gets automatically validated on future runs.

**Currently Supported:**

- **node:test** - Native `assert.snapshot()` integration
- **Mocha** - Custom snapshot storage
- **Other frameworks** - Explicit snapshot names

**Coming Soon:**

- Jest and Vitest support (planned for future releases)

### Basic Snapshot Usage

```ts
import test from 'node:test';
import { expect } from 'bupkis';

test('component renders correctly', (t) => {
  const output = {
    type: 'div',
    props: { className: 'container' },
    children: ['Hello, World!'],
  };

  // First run creates snapshot, subsequent runs validate against it
  expect(output, 'to match snapshot', t);
});
```

### Custom Serialization

Redact volatile data like timestamps or IDs using a custom serializer:

```ts
test('handles sensitive data', (t) => {
  const user = {
    username: 'alice',
    password: 'secret123',
    createdAt: Date.now(),
  };

  expect(user, 'to match snapshot', t, 'with options', {
    serializer: (value) =>
      JSON.stringify(
        {
          ...value,
          password: '[REDACTED]',
          createdAt: '[TIMESTAMP]',
        },
        null,
        2,
      ),
  });
});
```

### Multiple Snapshots Per Test

Use the `hint` option to create multiple snapshots in a single test:

```ts
test('multi-step workflow', (t) => {
  const step1 = { status: 'pending' };
  expect(step1, 'to match snapshot', t, 'with options', { hint: 'step-1' });

  const step2 = { status: 'processing' };
  expect(step2, 'to match snapshot', t, 'with options', { hint: 'step-2' });

  const step3 = { status: 'complete' };
  expect(step3, 'to match snapshot', t, 'with options', { hint: 'step-3' });
});
```

### Updating Snapshots

When your code changes intentionally, update snapshots with:

```bash
# node:test
node --test --test-update-snapshots

# Other frameworks
BUPKIS_UPDATE_SNAPSHOTS=1 npm test
```

> **Learn more:** See the [Snapshot Assertions](../assertions/snapshots.md) reference for complete details.

## Assertion Errors

When an assertion goes south, <span class="bupkis">BUPKIS</span> throws a proper `AssertionError` explaining exactly what went wrong. It even diffs stuff for you. Here's what they look like:

### Simple Type Mismatch

```ts
expect(42, 'to be a string');
// AssertionError: Assertion "{unknown} 'to be a string'" failed:
//   Comparing two different types of values. Expected string but received number.
//
// actual: 42
// expected: "42"
```

### Value Comparison

```ts
expect({ foo: 'bar' }, 'to equal', { foo: 'baz' });
// AssertionError: Assertion "{unknown} 'to be' / 'to equal' / 'equals' / 'is' /
//   'is equal to' / 'to strictly equal' / 'is strictly equal to' {unknown}" failed:
// - expected  - 1
// + actual    + 1
//
//   Object {
// -   "foo": "baz",
// +   "foo": "bar",
//   }
```

### Array Length Mismatch

```ts
expect([1, 2, 3], 'to have length', 5);
// AssertionError: Assertion "{unknown-array} 'to have length' / 'to have size'
//   {nonnegative-integer}" failed:
// - expected  - 2
// + actual    + 0
//
//   Array [
//     1,
//     2,
//     3,
// -   null,
// -   null,
//   ]
```

### Complex Object Validation

```ts
expect({ a: 1, b: 2 }, 'to satisfy', { a: 1, b: 3 });
// AssertionError: Assertion "{object!} 'to satisfy' / 'to be like' / 'satisfies'
//   {unknown}" failed:
// - expected  - 1
// + actual    + 1
//
//   Object {
//     "a": 1,
// -   "b": 3,
// +   "b": 2,
//   }
```

### Error Properties

<span class="bupkis">BUPKIS</span>' `AssertionError` is a subclass of [Node.js' `AssertionError`](https://nodejs.org/api/assert.html#class-assertassertionerror), so it includes the standard properties:

- **`name`**: Always `'AssertionError'` so your test framework doesn't get confused
- **`code`**: `'ERR_ASSERTION'` for standard Node.js compatibility
- **`message`**: What actually went wrong, in ~~English~~ ~~human language~~ _words you can understand_
- **`actual`**: The value that was tested (only when it makes sense)
- **`expected`**: The expected value or pattern (ditto)
- **`diff`**: No idea what this is, but it's there!

Plus some <span class="bupkis">BUPKIS</span>-specific goodies:

- **`assertionId`**: A unique identifier for the assertion that failed (useful for debugging)
- **`Symbol(bupkis-error)`**: A unique symbol that we use internally. You can't have it.

When assertion implementations use Zod schemas, the error messages are powered by Zod's validation system. This means you get detailed context about _exactly_ why an assertion failed—including proper diffs for complex objects and arrays. No more cryptic "expected truthy value" nonsense. _Do not_ ask how this works.

## Next Steps

- **[About Assertions](../reference/assertions.md)** - Learn more about what assertions are available
- **[Custom Assertions](./custom-assertion.md)** - Learn how to create your own. Be creative!

That's it. You now know how to use <span class="bupkis">BUPKIS</span>. The natural language approach makes your tests more readable and self-documenting—instead of memorizing method names like `toBeInstanceOf()` or `toHaveProperty()`, you just write what you mean: `'to be an instance of'` or `'to have property'`.

> If you write what you mean but receive an error with code `ERR_BUPKIS_UNKNOWN_ASSERTION`, please [let us know](https://github.com/boneskull/bupkis/issues/new) and we'll see if it makes sense to update the assertion.
>
> As of Oct 19 2025, overwriting builtin assertions is _undefined behavior_ which should scare you off.
