<p align="center">
  <img src="https://github.com/boneskull/bupkis/blob/main/assets/bupkis-logo-256.png" width="256px" align="center" alt="BUPKIS logo" />
  <h1 align="center"><em>BUPKIS</em></h1>
  <p align="center">
    A well-typed and easily exensible <em>BDD-style</em> assertion library.
    <br/>
    by <a href="https://github.com/boneskull">@boneskull</a>
  </p>
</p>

> [!CAUTION]
>
> This is half-implemented and not ready for anybody to use. You know how
> projects say that and you use them anyway? No, this thing is probably fully broken rn.

## Motivation

Look, I'm ~~old~~ ~~wizened~~ ~~experienced~~ knowledegable and I've written a lot of tests. I've used a lot of assertion libraries. There are ones I prefer and ones I don't.

But none of them do quite what _this_ does. The main goals of this library are:

- Type safety
- Dead-simple creation of custom assertions
- Minimal API surface

A chainable API may provide type safety. But it seems to _guarantee_ implementing a custom assertion will be complicated. The API surface is necessarily a large, combinatoric explosion of methods.

> [!WARNING]
>
> Because chainable APIs are familiar, you may hate _BUPKIS_ once you see some examples. You don't have to use it, but please: _don't confuse familiarity with usability_.

To achieve these goals, I've adopted the following design principles:

### Natural-Language Assertions

In `bupkis` (stylized as "_BUPKIS_"), you **don't** write this:

```js
expect(actual).toEqual(expected);
```

Instead, you write this:

```js
expect(actual, 'is', expected);
// or this
expect(actual, 'to be', expected);
// or this
expect(actual, 'to equal', expected);
// or even this
expect(actual, 'equals', expected);
// or yet another way
expect(actual, 'is equal to', expected);
// or believe it or not, even this
expect(actual, 'to strictly equal', expected);
```

If Chai wants you to write:

```js
expect(actual).to.be.a('string');
```

Then _BUPKIS_ wants you to write:

```js
expect(actual, 'to be a string');
// it is tolerant of poor/ironic grammar
expect(actual, 'to be an string');
```

Can't remember the string? Did you forget a word or make a typo? Maybe you also forgot _BUPKIS_ is type-safe? You'll get a nice squiggly for your trouble.

The "string" part of an expectation is known as a _phrase_. Every expectation will contain, at minimum, one phrase. As you can see from the above example, phrases often have aliases.

You can negate just about any phrase:

```js
expect(actual, 'to be', expected);
// did they not teach grammar in nerd school??
expect(actual, 'not is', expected);

expect(
  () => throw new TypeError('aww, shucks'),
  'to throw a',
  TypeError,
  'not satisfying',
  /gol durn/,
);
```

> [!CAUTION]
>
> I haven't yet documented all of the parameters to `expect()`/`expectAsync()`.

### Custom Assertions: Basics

_BUPKIS_ dogfoods its own custom assertions, so all of its builtin assertions are implemented the same way a user would. An implementation for a simple "`unknown` is a string" assertion would look like this:

```ts
createAssertion(['is a string'], z.string());
```

See that `z.string()`? That's [Zod][]. If you know Zod, you know how to create a custom assertion. Most all of Zod's functionality is available to you. If Zod _can't_ do it out-of-the-box, you always have [`z.custom()`](https://zod.dev/api#custom). For example, we have an "is a function" assertion:

```ts
createAssertion(
  ['is a function'],
  z.custom<(...args: any[]) => any>((value) => typeof value === 'function'),
);

// usage
expect(Date, 'to be a function');
```

In _BUPKIS_, Zod plays a dual role:

1. It is used to check values to determine _which_ assertion should be executed, and
2. It is most often used to implement the assertion itself.

#### Custom Assertions: Parametric Assertions

When we want to create an assertion that takes parameters—i.e. a _parameterized assertion_, we can still use Zod. For example, here is a simple "is greater than" assertion:

```ts
createAssertion([z.number(), 'is greater than', z.number()], (_, expected) =>
  z.number().gt(expected),
);
```

The first parameter to the callback `(_, expected)` is the subject of the assertion, which corresponds to the first item of the first argument to `createAssertion()`. The second argument is of course the phrase, and the third is the expected value. The callback `(_, expected)` will always eliminate phrases from its parameters (since they are not really useful). If we _return_ a Zod schema from the callback, it will be used to validate the subject. It's equivalent to writing the following (with less boilerplate):

```ts
createAssertion(
  [z.number(), 'is greater than', z.number()],
  (subject, expected) => {
    z.number().gt(expected).parse(subject);
  },
);
```

#### Custom Assertions: Boolean-Returning Functions

That callback can also just be a function that returns a boolean. If the assertion passes, it should return `true`. If it fails, it should return `false`. For example, here is a simple "is even" assertion:

```ts
createAssertion([z.number(), 'is even'], (n) => n % 2 === 0);
```

If this fails, an `AssertionError` will be thrown. It will not be as detailed as if we had used a Zod schema, but I'm hoping future versions of _BUPKIS_ will allow custom errors to mitigate this.

> TODO: Custom error messages.

## Prerequisites

_BUPKIS_ ships as a dual CJS/ESM package.

I have no idea what the minimum Node.js version is, but I wrote it for Node.js. I don't know if it works in browsers. I don't know if it works in Deno. I don't know if it works in Bun. I don't know if it runs on a toaster. I don't know why it's always a toaster.

## Installation

```bash
npm install bupkis -D
```

## Usage

I guess I have to document all these things in a nice way, which maybe is going to be too big for a `README`. I guess I need a website.

### Worth Mentioning Right Now

_BUPKIS_ has two main exports:

- `expect()`: the main entrypoint for synchronous assertions
- `expectAsync()`: the main entrypoint for asynchronous assertions

> [!IMPORTANT]
>
> As of this writing, the assertions available in `expectAsync()` are all `Promise`-related (and custom assertions can even use an async schema for the subject); they are completely disjoint from the assertions available in `expect()`. **This will likely change in the future.**

## Project Scope

1. It's an assertion library

### TODO

In no particular order, here are some things I want to implement:

- [ ] Good diffs (use a library)
- [ ] More assertions
  - [x] Better / more async support
  - [x] `is true` / `is not true`
  - [x] `is false` / `is not false`
  - [x] `is NaN`
  - [ ] Assertions for all Zod v4 builtins, essentially (which suggests some dynamic generation of assertions)
  - [ ] Support for more intrinsics; `Set`, `Map`, `WeakSet`, `WeakMap`, `WeakRef`
  - [x] Random convenience like `is frozen`, `is sealed`, `is extensible`
  - [ ] Deep equality / partial equality, strict and loose
- [ ] Custom assertion improvements
  - [ ] Custom diffs
  - [ ] Custom error messages
  - [ ] Custom error metadata
  - [ ] Type safety for custom assertions (may require a significant refactor)
- [x] Lean on Zod more for builtin assertion implementations and use its error-reporting facilities
- [ ] Keypaths / property drilling
- [ ] See if there's some way to leverage `asserts` type predicates without too much boilerplate & tedium. Maybe make a TS feature request to allow `asserts` and/or `is` keyword to be used in types (or find out why they didn't want to do that).

#### Maybe Later

- [ ] Lower-level plugin API for those things which are more involved than custom assertions
- [ ] Basic spies (rationale: it is v. common to want to just check that a function gets called)
  - [ ] Draw a line in the sand: no stubs, no mocks, no fakes
  - [ ] Simple function instrumentation via `Proxy` or something; a way to check if a function was called, how many times, and with what
  - [ ] Adapters which generate assertions from 3p spy providers?
- [ ] Is snapshot testing the responsibility of an assertion library?
- [ ] Boolean logic syntax (`and`, `or`, `not`) while still avoiding chainable APIs. Though I might convince myself that chainable APIs are OK for this and this only.
- [ ] Completely avoid dependencies on Node.js internals and expand support to other environments; as of this writing there are only three (3) bits used from Node.js:
  - [ ] `node:test` (dev)
  - [ ] `node:util.inspect` (dev)
  - [ ] `node:assert.AssertionError`
- [ ] Pull in multiple test frameworks into the dev env and assert basic compatibility with all of them
- [ ] Codemods for migration
- [ ] Support other object validation libraries (or wasn't there one that provided a translation layer?)

## Prior Art & Appreciation

- [Unexpected][] is the main inspiration for _BUPKIS_. However, creating types for this library is exceedingly difficult (and was in fact the first thing I tried). Despite that drawback, I find it more usable than any other assertion library I've tried.
- [Zod][] is a popular object validation library which does most of the heavy lifting for _BUPKIS_. It's not an assertion library, but there's enough overlap in its use case that it makes sense to leverage it.
- [fast-check][]: A big thanks to Nicholas Dubien for this library. There is **no better library** for an assertion library to use to test itself! Well, besides itself, I mean. How about _in addition to_ itself? Yes. Thank you!

## A Note From The Author

> _"This is my assertion library. Many are like it, but this one is mine."_
>
> ‒boneskull, 2025

## License

Copyright © 2025 Christopher Hiller. Licensed under [BlueOak-1.0.0](https://blueoakcouncil.org/license/1.0.0).

[zod]: https://zod.dev
[unexpected]: https://unexpected.js.org
[fast-check]: https://fast-check.dev
