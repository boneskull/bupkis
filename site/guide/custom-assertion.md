---
title: Creating Custom Assertions
category: Guides
---

<!-- markdownlint-disable MD038 MD026 -->

This guide shows you how to create and register custom assertions in <span class="bupkis">Bupkis</span>. You'll learn to build both simple and parameterized assertions using Zod schemas or custom functions.

> Before you proceed, you should be familiar with the [basic usage](./usage.md) of <span class="bupkis">Bupkis</span> and [Zod][].

## Wait… do I need a custom assertion?

Generally speaking: yes.

We use custom assertions to _express_ expectations that are specific to Our
application domain or testing needs. We decree that expressiveness is unequivocally _good._

Of course, these mundane reasons may also apply:

- **<span class="bupkis">Bupkis</span> doesn't ship with the assertion(s) you want**
- **You want to encapsulate repeated validation logic** into reusable assertions (i.e., "reduce boilerplate")

## Static Assertions

[_Static assertions_](../reference/glossary.md#static-assertionexpectation) are assertions about the way things _are_. They do not test [_behavior_](#behavioral-assertions).

### Static Assertions: "Zod Schema" Style

Implementing a static assertion as a [Zod schema][] is the simplest and most robust approach:

```ts
import { createAssertion, z, use } from 'bupkis';

// Create an assertion for email validation
const emailAssertion = createAssertion(
  ['to be a valid email'],
  z.string().email(),
);

// Register and use the assertion
const { expect } = use([emailAssertion]);
expect('user@example.com', 'to be a valid email');
```

This is also be called a [schema-based assertion][].

### Static Assertions: "Function" Style

When Zod schemas aren't the best way forward (note: `z.custom()` and `.refine()` can take a lot of abuse!), you can implement the assertion logic as a function:

```ts
import { createAssertion, z, use } from 'bupkis';

const isEvenAssertion = createAssertion(
  ['to be even'],
  (subject) => subject % 2 === 0,
);
```

The function receives the _subject_ of the assertion and any parameters (if applicable; there are none here). Importantly, **the function never receives [phrases][phrase]**—that means the second parameter to the implementation function above will be `undefined` and not `to be even`—phrases are stripped out before the function is called.

> See [Allowed Return Types for Function-Style Assertions](#allowed-return-types-for-function-style-assertions) for more details.

## Behavioral Assertions

[Behavioral assertions](../reference/glossary.md#behavioral-assertion) typically avoid Zod schemas for their implementations, and instead use a _function-style_ assertion. Instead, they test the _behavior_ of functions or Promises. Example:

```ts
import { z, use, createAssertion } from 'bupkis';

const returnsFooAssertion = createAssertion(
  [z.function(), 'to return foo'],
  (subject) => {
    try {
      const result = subject();
      if (result !== 'foo') {
        return {
          actual: result,
          expected: 'foo',
          message: `Expected function to return 'foo', but got '${result}'`,
        };
      }
    } catch (err) {
      return {
        actual: err,
        expected: 'foo',
        message: 'Expected function to return 'foo' and not throw an exception',
      };
    }
  },
);
```

## Parametric Assertions

A [_parametric assertion_][parametric assertions] is an assertion that accepts additional parameters beyond the subject. If you need more than one chunk of data to make an assertion, then you probably want a parametric assertion. An example might be "is greater than":

```ts
expect(42, 'to be greater than', 10);
```

This is a parametric assertion because it needs the [parameter][] `10` to compare against the subject `42`.

> This section expects you've read [Static Assertions](#static-assertions) above; especially the bit about [Allowed Return Types](#allowed-return-types-for-function-style-assertions). Just gloss over it quick; I'll wait.
>
> Actually—nevermind; I don't care. _I hate it when I read that sort of shit._

### Parametric Assertions: "Schema-Returning-Function" Style

Due to their nature of needing a yet-as-of-unknown parameter, a parametric assertion implementation is _always_ a function. In these two examples below, the function returns a Zod schema:

```ts
import { createAssertion, z, use } from 'bupkis';

// Assertion that checks if a number is greater than another
const greaterThanAssertion = createAssertion(
  [z.number(), 'to be greater than', z.number()],
  (_, threshold) => z.number().gt(threshold),
);

// Assertion that checks if a string contains a substring
const containsAssertion = createAssertion(
  [z.string(), 'to have substring', z.string()],
  (_, substring) => z.string().includes(substring),
);

// Register and use the assertions
const { expect } = use([greaterThanAssertion, containsAssertion]);

expect(10, 'to be greater than', 5);
expect('hello world', 'to have substring', 'world');
```

### Parametric Assertions: The Other Styles

You can return a `boolean` or an `AssertionFailure` object just as you would with a [static assertion](#static-assertions). It's exactly the same idea:

```ts
import { createAssertion, z, use } from 'bupkis';

// boolean-style
const toBeOfSizeAssertion = createAssertion(
  [z.array(z.unknown()), 'to be of size', z.number()],
  (subject, expectedSize) => subject.length === expectedSize,
);

// AssertionFailure-style
const toBeOfSizeAssertion2 = createAssertion(
  [z.array(z.unknown()), 'to be of size', z.number()],
  (subject, expectedSize) => {
    if (subject.length !== expectedSize) {
      return {
        actual: subject.length,
        expected: expectedSize,
        message: `Expected ${subject} to be of size ${expectedSize}`,
      };
    }
  },
);
```

As you can see, returning an `AssertionFailure` object allows you to provide more context about the failure, resulting in better error messaging.

> See [Allowed Return Types for Function-Style Assertions](#allowed-return-types-for-function-style-assertions) for more details.

### Multiple Parameters

You are not limited to a single parameter:

```ts
import { z, use, createAssertion } from 'bupkis';

// Assertion for number ranges
const betweenAssertion = createAssertion(
  [z.number(), 'to be between', z.number(), 'and', z.number()],
  // I don't recall if this is inclusive or exclusive; RTFM
  (_, min, max) => z.number().min(min).max(max),
);

// Register and use the assertion
const { expect } = use([betweenAssertion]);
expect(5, 'to be between', 1, 'and', 10);
```

Add as many as you want. Yes… yes. Keep adding them. Goood.

## Asynchronous Assertions

[_Asynchronous assertions_][asynchronous assertion] typically involve `Promise` in some way.

The target use case for async assertions are high-level expectations against some async I/O operation, like an API call or database query. Here's an example—using the venerable `mungodb` package—to check if a database connection function connects successfully:

```ts
import { z, use, createAsyncAssertion } from 'bupkis';
import { connect } from 'mungodb';

// Assertion that checks if the DB connected
const dbConnectedAssertion = createAsyncAssertion(
  [z.function(), 'to connect to the mungobase'],
  async (connectFn) => {
    try {
      const db = await connectFn();
      if (!db.isConnected()) {
        return {
          actual: 'Database not connected',
          expected: 'Database to be connected',
          message:
            'Expected the database connection function to connect successfully',
        };
      }
    } catch (err) {
      return {
        actual: err,
        expected: 'Database to connect without error',
        message:
          'Expected the database connection function to connect without throwing',
      };
    }
  },
);

const { expectAsync } = use([dbConnectedAssertion]);

await expectAsync(connect, 'to connect to the mungobase');
```

## Composing Assertions

One powerful feature of _function-based assertions_ is the ability to call {@link bupkis!expect | expect} from _within_ your assertion implementation. This allows you to compose complex assertions from simpler ones, creating reusable building blocks.

### Basic Composition

You can call `expect()` within your assertion function to leverage existing assertions:

```ts
import { createAssertion, z, use } from 'bupkis';

// A complex assertion that validates user objects
const validUserAssertion = createAssertion(
  ['to be a valid user'],
  (subject, _, expect) => {
    // Use existing assertions to validate parts
    expect(subject, 'to be an object');
    expect(subject, 'to have property', 'name');
    expect(subject, 'to have property', 'email');

    // Validate specific properties
    expect(subject.name, 'to be a string');
    expect(subject.email, 'to be a valid email'); // assumes email assertion exists
    expect(subject.name, 'to have length greater than', 0);
  },
);

const { expect } = use([validUserAssertion]);

expect({ name: 'Alice', email: 'alice@example.com' }, 'to be a valid user');
```

### Composition with Custom Logic

You can combine assertion composition with your own validation logic:

```ts
import { createAssertion, z, use } from 'bupkis';

const validProductAssertion = createAssertion(
  ['to be a valid product'],
  (subject, _, expect) => {
    // Basic structure validation
    expect(subject, 'to be an object');
    expect(subject, 'to have properties', ['name', 'price', 'category']);

    // Type validation
    expect(subject.name, 'to be a string');
    expect(subject.price, 'to be a number');
    expect(subject.category, 'to be a string');

    // Business logic validation
    if (subject.price <= 0) {
      return {
        actual: subject.price,
        expected: 'positive number',
        message: 'Product price must be positive',
      };
    }

    // Category validation using composition
    const validCategories = ['electronics', 'books', 'clothing'];
    expect(subject.category, 'to be one of', validCategories);
  },
);
```

### Async Composition

The same pattern works with asynchronous assertions:

```ts
import { createAsyncAssertion, z, use } from 'bupkis';

const validAPIResponseAssertion = createAsyncAssertion(
  ['to be a valid API response'],
  async (subject, _, expectAsync) => {
    // Validate structure
    await expectAsync(subject, 'to be an object');
    await expectAsync(subject, 'to have property', 'data');
    await expectAsync(subject, 'to have property', 'status');

    // Validate status
    await expectAsync(subject.status, 'to be a number');
    await expectAsync(subject.status, 'to be between', 200, 299);

    // Custom async validation
    if (subject.data && typeof subject.data === 'object') {
      await expectAsync(subject.data, 'to be a valid user'); // composition!
    }
  },
);
```

### Benefits of Composition

- **Reusability**: Build complex validations from simple, tested pieces
- **Readability**: Each assertion focuses on one concern
- **Maintainability**: Changes to base assertions automatically propagate
- **Error Context**: Failed composed assertions show exactly which part failed

### Gotchas

- **Infinite Recursion**: Be careful not to create circular assertion dependencies
- **Error Handling**: Composed assertions will throw immediately on the first failure
- **Performance**: Many composed assertions can be slower than a single comprehensive schema

## Generally Applicable Concepts

This section describes some important concepts to understand when creating assertions.

### Allowed Return Types for Function-Style Assertions

> 🥱 **TL;DR:**
>
> Only return Zod schemas, {@link bupkis!types.AssertionParseRequest | AssertionParseRequest} objects, or {@link bupkis!types.AssertionFailure | AssertionFailure} objects. Don't throw anything.

If a function-style assertion must indicate failure, it can:

1. _Return_ a Zod schema (**strongly recommended** if feasible)
2. _Return_ a {@link bupkis!types.AssertionParseRequest | AssertionParseRequest} function containing a Zod schema and a `subject` to parse (**strongly recommended** if feasible). This is only needed if the subject you want to parse is not the same `subject` as passed to the assertion function implementation.
3. _Return_ an {@link bupkis!types.AssertionFailure | AssertionFailure} object to indicate failure with details (_only recommended if 1. or 2. is infeasible_)
4. _Return_ a `ZodError` object to indicate failure with details (_not recommended_, but could be worse; prefer {@link bupkis!types.AssertionParseRequest | AssertionParseRequest})
5. _Throw/reject_ a `ZodError` (_not recommended_; only slightly worse than previous; prefer {@link bupkis!types.AssertionParseRequest | AssertionParseRequest})
6. _Throw/reject_ an `AssertionError` (_not recommended_; prefer returning an {@link bupkis!types.AssertionFailure | AssertionFailure})
7. _Return_ `false` to indicate failure (_avoid_; the resulting `AssertionError` will be generic and unhelpful)

> **Why don't we want to throw an `AssertionError`?**
> We don't want to encourage throwing because a) <span class="bupkis">Bupkis</span> will do this for you, and b) it will inhibit automatic diff generation. It will "work", but it might not be pretty.
>
> **Why don't we want to throw a `ZodError`?**
> It's honestly fine to do this, but you might as well avoid throwing errors if you don't need to. You could use `.safeParse()` instead, for instance, then return the resulting `.error` from the parse result.
>
> However, it's _even better_ to return a {@link bupkis!types.AssertionParseRequest | AssertionParseRequest} object, which delegates the heavy lifting to <span class="bupkis">Bupkis</span>.
>
> **Why don't we want to return `false`?**
> Returning `false` should be avoided because it provides no context about the failure. It will work, but the resulting `AssertionError` will be generic and unhelpful.
>
> The above two options will work in a pinch, but you should avoid them because you might get on the naughty list.

The following subsections will describe each of the non-_non-recommended_ options in more detail.

#### Returning a Zod Schema

You can return a Zod schema from your function; you do not need to call `.parse()` or `.safeParse()`. <span class="bupkis">Bupkis</span> will do that for you. For example, the above assertion could be written like this:

```ts
const isEvenAssertion = createAssertion(['to be even'], (_subject) =>
  z.number().refine((n) => n % 2 === 0, { error: 'Expected an even number' }),
);
```

You'll note that `_subject` is unused. Functions returning Zod schemas will generally _always_ ignore the `subject` unless there's something weird you're trying to do. More on this in [Parametric Assertions][] later. You can even use Zod's own facilities to provide custom error messages!

If you're looking side-eyed at this, then I'll be happy to tell you that _you didn't need a function at all_, and could have just returned the schema:

```ts
const isEvenAssertion = createAssertion(
  ['to be even'],
  z.number().refine((n) => n % 2 === 0, { error: 'Expected an even number' }),
);
```

Oh well. Lesson learned. A non-parametric assertion isn't the right use-case for it; see [Parametric Assertions][].

#### Returning an AssertionParseRequest object

An {@link bupkis!types.AssertionParseRequest | AssertionParseRequest} object looks like this:

```ts
type AssertionParseRequest = {
  subject: unknown;
} & (
  | {
      asyncSchema: z.ZodType;
      schema?: never;
    }
  | {
      asyncSchema?: never;
      schema: z.ZodType;
    }
);
```

If you return this object, <span class="bupkis">Bupkis</span> will call `.parse()` (or `.parseAsync()`, respectively) on the schema with the provided `subject`. This delegates all handling of exceptions to <span class="bupkis">Bupkis</span>, which is good for you and us.

#### Returning an AssertionFailure object

An {@link bupkis!types.AssertionFailure | AssertionFailure} object looks like this:

```ts
type AssertionFailure = {
  /**
   * The actual value, or description of what actually happened
   */
  actual?: unknown;
  /**
   * The expected value, or description of what was expected to happen
   */
  expected?: unknown;
  /**
   * A custom error message to use
   */
  message?: string;
  /**
   * A pre-computed diff string to display (highest priority)
   */
  diff?: string;
  /**
   * Custom formatter for the actual value in diff output
   */
  formatActual?: (value: unknown) => string;
  /**
   * Custom formatter for the expected value in diff output
   */
  formatExpected?: (value: unknown) => string;
  /**
   * Options to pass to jest-diff for diff generation
   */
  diffOptions?: DiffOptions;
};
```

If you return this object, <span class="bupkis">Bupkis</span> will stuff it into an `AssertionError` and toss it. If you don't know what to put for any of the fields, just omit them, with the following caveat: if either `actual` or `expected` (or both) are `undefined`, then no diff will be generated.

> ℹ️ When To Use `actual` and `expected`
>
> Use `actual` and `expected` if you can provide meaningful, _diff-able_ values. This is generally best used in "equality"-style assertions.
>
> One thing explicitly _not_ to do is to provide values of two different types for `expected` and `actual`. There is no reasonable way to diff them, and the error message will reflect that.
>
> In short: just think about how a diff would display, and if it doesn't make sense, omit `actual` and `expected`. If the default diff output doesn't work for your use case, see [Custom Diff Output](#custom-diff-output) below.

##### Custom Diff Output

<span class="bupkis">Bupkis</span> provides several ways to customize how diffs are displayed in assertion failures. These options follow a precedence order:

1. **Pre-computed diff (`diff`)**: If you provide a `diff` string, it will be used as-is
2. **Custom formatters (`formatActual`/`formatExpected`)**: Transform values before diffing
3. **Default**: Uses [jest-diff][] with standard formatting

###### Using a Pre-computed Diff

For complete control over diff output, provide your own diff string:

```ts
import { createAssertion, z, use } from 'bupkis';

const customDiffAssertion = createAssertion(
  [z.unknown(), 'to diff custom with', z.unknown()],
  (actual, expected) => ({
    actual,
    expected,
    diff: `My Custom Diff:\n  want: ${expected}\n  got:  ${actual}`,
    message: 'Values differ',
  }),
);

const { expect } = use([customDiffAssertion]);
expect('foo', 'to diff custom with', 'bar');
// Error message will include:
// My Custom Diff:
//   want: bar
//   got:  foo
```

###### Using Custom Formatters

For domain-specific value formatting before diff generation:

```ts
import { createAssertion, z, use } from 'bupkis';

const dateAssertion = createAssertion(
  [z.date(), 'to be same day as', z.date()],
  (actual, expected) => {
    const sameDay = actual.toDateString() === expected.toDateString();
    if (!sameDay) {
      return {
        actual,
        expected,
        formatActual: (d) => (d as Date).toDateString(),
        formatExpected: (d) => (d as Date).toDateString(),
        message: 'Dates are not the same day',
      };
    }
  },
);

const { expect } = use([dateAssertion]);
expect(new Date('2024-01-15'), 'to be same day as', new Date('2024-01-16'));
// Diff will show formatted dates instead of full Date objects
```

###### Using diffOptions

Pass options to [jest-diff][] for fine-grained control:

```ts
import { createAssertion, z, use } from 'bupkis';

const verboseDiffAssertion = createAssertion(
  [z.unknown(), 'to verbose equal', z.unknown()],
  (actual, expected) => {
    if (actual !== expected) {
      return {
        actual,
        expected,
        diffOptions: {
          expand: true, // Show all lines, not just changed
          contextLines: 10, // More context around changes
          aAnnotation: 'Expected Value',
          bAnnotation: 'Received Value',
        },
        message: 'Values do not match',
      };
    }
  },
);
```

> ℹ️ `DiffOptions` is re-exported from <span class="bupkis">Bupkis</span> for your convenience:
>
> ```ts
> import type { DiffOptions } from 'bupkis';
> ```

Returning an `AssertionFailure` object provides much more context about what went wrong than getting all _lazy_ by returning `false`.

[jest-diff]: https://npm.im/jest-diff

#### Returning a ZodError object

If, for some reason, you need to call `.safeParse` (or `.parse` + `try`/`catch`) yourself, you can return the resulting `ZodError` object to indicate failure. <span class="bupkis">Bupkis</span> handle it appropriately.

> ⚠️ Warning!
>
> I don't know of a use-case for returning a `ZodError` which could not be satisfied by returning an [`AssertionParseRequest`](#returning-an-assertionparserequest-object) instead. If you have one, please [report it](https://github.com/bupkis/issues/new). It may be deprecated and removed.

### The Implicit "Unknown"

Any assertion (be it static, parametric, behavioral, metaphysical, pataphysical, etc.) defined in such a way that the _first_ item in the tuple of phrases passed to `createAssertion()` is _not a Zod schema_ is considered to have an implicit [subject][] of type `unknown`. To illustrate:

```ts
const stringAssertion = createAssertion(['to be a string'], z.string());
// Equivalent to:
const stringAssertion = createAssertion(
  [z.unknown(), 'to be a string'],
  z.string(),
);
```

We **recommend** supplying a specific schema for the subject; think of it as a "hint". This "hint" will provide better type inference and will warn you before you ~~make a stupid mistake~~ use the wrong assertion:

```ts
const numberAssertion = createAssertion(z.string(), ['to be an email'], z.string().email()));

// later

expect(42, 'to be an email'); // type error, since 42 is not a string
```

The point of this black magic is to reduce boilerplate. If you don't care about the type of the subject, ~~you need an attitude adjustment~~ you can skip it and start right in with the phrases.

### Phrase Aliases

Users of language (you and I, presumably) know many different ways to write the same thing. Perhaps we can agree on this: the specific words do not matter as much as _the meaning_ behind those words (_don't you remember your semiotics?_). To that end, <span class="bupkis">Bupkis</span> allows for _aliases_:

```ts
import { z, use, createAssertion } from 'bupkis';

// Multiple ways to express the same assertion
const stringAssertion = createAssertion(
  [['to be based', 'to be bussin']],
  z.string(),
);

const { expect } = use([stringAssertion]);

expect('chat', 'to be based');
expect('chat', 'to be bussin');
```

_Remember: we are doomed to toil in this prison-house of language._

### Disallowed Phrases

There are certain phrases which are disallowed in custom assertions. These are:

1. A phrase may not begin with `not `. This is because negation is handled automatically by <span class="bupkis">Bupkis</span>. Example:

   ```ts
   // ❌ Disallowed
   createAssertion(['not to be a string'], ...);

   // ✅ Allowed; negation is automatic
   createAssertion(['to be a string'], ...);
   expect(42, 'not to be a string');
   ```

2. A phrase may be a bare `and` _if and only if_ it is directly followed by a Zod schema. This is because it conflicts with the [assertion conjunction](../reference/glossary.md#conjunction) functionality provided by <span class="bupkis">BUPKIS</span>. Example:

   ```ts
   // ❌ Disallowed
   createAssertion(['to be a string', 'and', 'to have length greater than', 0], ...);

   // ✅ Allowed; chaining is automatic
   createAssertion(['to be a string', 'and', z.string().min(1)], ...);
   expect('chat', 'to be a string', 'and', 'to have length greater than', 0);
   ```

## Sharing & Reusing Assertions

You can package multiple assertions into a single module for easy reuse. For example, you might create a collection of validation assertions:

```ts
// validation-assertions.ts
import { expect, z } from 'bupkis';

export const ValidationAssertions = [
  expect.createAssertion(['to be a valid email'], z.string().email()),
  expect.createAssertion(['to be a URL'], z.string().url()),
  expect.createAssertion(['to be a UUID'], z.string().uuid()),
  expect.createAssertion(['to be a valid JSON'], (subject) => {
    try {
      JSON.parse(subject);
      return true;
    } catch {
      return false;
    }
  }),
] as const;
```

Then register the entire collection:

```ts
import { use } from 'bupkis';
import { ValidationAssertions } from './validation-assertions.js';

const { expect } = use(ValidationAssertions);

// Now use any of the validation assertions
expect('user@example.com', 'to be a valid email');
expect('https://example.com', 'to be a URL');

// Note that the builtin-assertions will still be available!
expect(42, 'to be a number');
```

You could even do something _wild_ like publish your assertions as package for others to use.

> Someone should probably go in and create assertions for all of the fancy string validation in Zod…

## Troubleshooting

### Common Errors

#### "Invalid Arguments. No assertion matched" Error

> A.K.A. `ERR_BUPKIS_UNKNOWN_ASSERTION`

- Ensure you've registered it with {@link bupkis!use | use()} before calling {@link bupkis!expect | expect()}.
- Another assertion may be conflicting; check for overlapping phrases or parameter types.
- [File an issue][issues]

### Debugging Tips

- For a firehose of nonsense that _might_ be helpful, enable debug logging:

  ```bash
  DEBUG=bupkis* npm test
  ```

- Verify your [assertion ID][] and [assertion parts][]:

  ```ts
  console.log('Assertion ID:', yourAssertion.id);
  console.log('Phrases:', yourAssertion.parts);
  ```

## Bonus for Zod Users!

If you happen to have Zod schemas laying around, you can trivially create assertions for them:

```ts
import { createAssertion, use, z } from 'bupkis';

// Schema for a user object
const UserSchema = z.object({
  id: z.number().positive(),
  email: z.string().email(),
  name: z.string().min(1),
  roles: z.array(z.enum(['admin', 'user', 'moderator'])),
});

const validUserAssertion = createAssertion(['to be a valid user'], UserSchema);

// Register and use
const { expect } = use([validUserAssertion]);
expect(
  { id: 1, email: 'john@example.com', name: 'John', roles: ['user'] },
  'to be a valid user',
);
```

## Best Practices

- **Keep assertions focused**: Each assertion should test one specific thing
- **Use descriptive phrases**: Make assertion phrases read naturally
- **Use All of Zod**: Prefer a Zod schema over a bespoke function; leverage Zod's error reporting and metadata to your advantage
- **Provide helpful error messages & context**: Help users understand what went wrong
- **Group related assertions**: Organize similar assertions into collections

## Next Steps

- [Testing Assertions](./testing.md)

## See Also

- [About Assertions][]

[about assertions]: /reference/assertions.md
[assertion id]: /reference/glossary.md#assertion-id
[assertion parts]: /reference/glossary.md#assertion-parts
[asynchronous assertion]: /reference/glossary.md#asynchronous-assertion
[issues]: https://github.com/boneskull/bupkis/issues
[parameter]: /reference/glossary.md#parameter
[parametric assertions]: /reference/glossary.md#parametric-assertion
[phrase]: /reference/glossary.md#phrase
[schema-based assertion]: /reference/glossary.md#schema-based-assertion
[subject]: /reference/glossary.md#subject
[zod schema]: https://zod.dev/api
[zod]: https://zod.dev
