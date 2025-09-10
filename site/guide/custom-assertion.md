---
title: Creating Custom Assertions
category: Guides
---

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

_Static assertions_ are assertions about the way things _are_. They do not make expectations about _behavior_.

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
const greaterThanAssertion = createAssertion(
  [z.number(), 'to be greater than', z.number()],
  (subject, threshold) => subject > threshold,
);

// AssertionFailure-style
const containsAssertion = createAssertion(
  [z.number(), 'to be greater than', z.number()],
  (subject, threshold) => {
    if (subject <= threshold) {
      return {
        actual: subject,
        expected: `number greater than ${threshold}`,
        message: `Expected ${subject} to be greater than ${threshold}`,
      };
    }
  },
);
```

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
import { z, use, createAsyncAssertion, FunctionSchema } from 'bupkis';
import { connect } from 'mungodb';

// Assertion that checks if the DB connected
const dbConnectedAssertion = createAsyncAssertion(
  [FunctionSchema, 'to connect to the mungobase'],
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

> If your eyes are sharp, you'll have noticed the {@linkcode schema!FunctionSchema | FunctionSchema} creeping in there. _What's `FunctionSchema`?_
>
> Zod v4 [changes][zod-migration] how `z.function()` works; it's now intended purely for wrapping functions and automatically validating their arguments and return values. This is fine + dandy—but it isn't what we need here. We just want to say "this parameter is a function." `FunctionSchema` is a simple schema that does just that. It's defined similarly to this:
>
> ```ts
> export const FunctionSchema = z.custom<(...args: any[]) => any>(
>   (value) => typeof value === 'function',
> );
> ```
>
> <span class="bupkis">Bupkis</span> contains [many cute helper schemas like this][schema namespace] to correct for the various impedence mismatches <span class="bupkis">Bupkis</span> and Zod.

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

## Generally Applicable Concepts

### Allowed Return Types for Function-Style Assertions

If a function-style assertion must indicate failure, it can:

1. Throw (or reject with) an `AssertionError` (not recommended)
2. Return `false` to indicate failure (also not recommended)
3. Return an [AssertionFailure][] object to indicate failure with details (**recommended**)
4. Return a Zod schema (**recommended**)

> **Why don't we want to throw?**
> We don't want to encourage throwing because <span class="bupkis">Bupkis</span> will do this for you. It may also inhibit current or future functionality. It will work, but it might not be pretty.
>
> **Why don't we want to return `false`?**
> Returning `false` is not recommended because it provides no context about the failure. It will work, but the resulting `AssertionError` will be generic and unhelpful.
>
> The above two options will work in a pinch, but you should avoid them because you might get on the naughty list.

#### Returning an `AssertionFailure` object

An [AssertionFailure][] object looks like this:

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
};
```

If you return this object, <span class="bupkis">Bupkis</span> will stuff it into an `AssertionError` and toss it. If you don't know what to put for any of the fields, just omit them.

In short, returning an `AssertionFailure` object provides much more context about what went wrong.

#### Returning a Boolean

You _can_ return a plain-old `boolean` from your assertion function. Returning `true` indicates success; returning `false` indicates failure. <span class="bupkis">Bupkis</span> will throw an `AssertionError` for you if you return `false`, but it won't be very informative.

#### Returning a Zod schema

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

### The Implicit "Unknown"

Any assertion (be it static, parametric, metaphysical, pataphysical, etc.) defined in such a way that the _first_ item in the tuple of phrases passed to `createAssertion()` is _not a Zod schema_ is considered to have an implicit [subject][] of type `unknown`. To illustrate:

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

### Reuse of Zod Schemas

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

## Troubleshooting

### Common Errors

#### "No assertion matched" Error

- Ensure you've registered it with `use()` before calling `expect()`.
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
[assertionfailure]: /interfaces/index.assertion.types.AssertionFailure
[asynchronous assertion]: /reference/glossary.md#asynchronous-assertion
[issues]: https://github.com/boneskull/bupkis/issues
[parameter]: /reference/glossary.md#parameter
[parametric assertions]: /reference/glossary.md#parametric-assertion
[phrase]: /reference/glossary.md#phrase
[schema namespace]: /modules/index.schema
[schema-based assertion]: /reference/glossary.md#schema-based-assertion
[subject]: /reference/glossary.md#subject
[zod schema]: https://zod.dev/api
[zod]: https://zod.dev
[zod-migration]: https://zod.dev/v4/changelog
