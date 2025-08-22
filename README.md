<p align="center">
  <img src="https://github.com/bupkis/tree/main/assets/bupkis-logo-256.png" width="256px" align="center" alt="BUPKIS logo" />
  <h1 align="center"><em>BUPKIS</em></h1>
  <p align="center">
    A well-typed and easily exensible _BDD-style_ assertion library.
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

In _BUPKIS_, you **don't** write this:

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

> **TODO**: More examples as assertions are implemented.

### Just Use Zod

_BUPKIS_ dogfoods its own custom assertions, so all of its builtin assertions are implemented the same way a user would. If you recall the [first example](#natural-language-assertions), the implementation looks similar to this:

```ts
createAssertion(
  [
    ['to be', 'to equal', 'equals', 'is', 'is equal to', 'to strictly equal'],
    z.any(),
  ],
  (subject: unknown, expected: any) => {
    if (subject !== expected) {
      throw new AssertionError(`Expected ${subject} to be ${value}`);
    }
  },
);
```

> [!TIP] If the first item of the first parameter to `createAssertion()` is _not_ a Zodlike object, we implicitly parse the _subject_ with `z.unknown()`.

See that `z.any()`? That's [Zod](https://zod.dev/). If you know Zod, you know how to create a custom assertion. Most all of Zod's functionality is available to you. If Zod _can't_ do it, well, you always have [`z.custom()`](https://zod.dev/api#custom). For example (explicit types added for clarity in some cases):

```ts
const ClassSchema = z.custom<new (...args: any[]) => any>({
  // this seems to actually work and doesn't call the constructor
  try {
    new new Proxy(fn, { construct: () => ({}) })();
    return true;
  } catch (err) {
    return false;
  }
});

createAssertion(
  ['to be an instance of'], ClassSchema],
  (subject: unknown, ctor: new (...args: any[]) => any) => {
    if (!(subject instanceof ctor)) {
      throw new AssertionError(
        `Expected ${subject} to be an instance of ${ctor.name}`);
    }
  },
);

// usage
expect(new Date(), 'to be an instance of', Date);
```

The main role of Zod here is to provide a _matching function_ ("matcher"). The matcher is necessary to know which assertion we should call. It is also responsible for much inference and type-safety.

## Prerequisites

_BUPKIS_ ships as a dual CJS/ESM package.

I have no idea what the minimum Node.js version is, but I wrote it for Node.js. I don't know if it works in browsers. I don't know if it works in Deno. I don't know if it works in Bun. I don't know if it runs on a toaster. I don't know why it's always a toaster.

## Installation

```bash
npm install bupkis -D
```

## Usage

I guess I have to document all these things in a nice way, which maybe is going to be too big for a `README`. I guess I need a website.

### TODO

In no particular order, here are some things I want to implement (maybe):

- [ ] Diffs (use a library)
- [ ] Custom diffs
- [ ] More assertions
  - [ ] Better / more async support
  - [ ] `is true` / `is not true`
  - [ ] `is false` / `is not false`
  - [ ] `is NaN` / `is not NaN`
  - [ ] Assertions for all Zod v4 builtins, essentially (which suggests some dynamic generation of assertions)
  - [ ] Support for more intrinsics; `Set`, `Map`, `WeakSet`, `WeakMap`, `WeakRef`
  - [ ] Random convenience like `is frozen`, `is sealed`, `is extensible`
  - [ ] Deep equality / partial equality, strict and loose
- [ ] Dynamic types
- [ ] Custom error messages
- [ ] Custom error metadata
- [ ] Lean on Zod more for builtin assertion implementations and use its error-reporting facilities
- [ ] Type safety for custom assertions (may require a significant refactor)
- [ ] Lower-level plugin API for those things which are more involved than custom assertions
- [ ] Basic spies
  - [ ] Simple function instrumentation via `Proxy` or something; a way to check if a function was called, how many times, and with what
  - [ ] Adapters which generate assertions from 3p spy providers
- [ ] Boolean logic syntax (`and`, `or`, `not`) while still avoiding chainable APIs. Though I might convince myself that chainable APIs are OK for this and this only.
- [ ] Keypaths / property drilling

### Not TODO

Non-goals:

- Stubs and mocks
-

## Prior Art

- [Unexpected](https://unexpected.js.org/) is the main inspiration for _BUPKIS_. However, creating types for this library is exceedingly difficult (and was in fact the first thing I tried).
- [Chai](https://www.chaijs.com/)

## A Note From The Author

> _"This is my assertion library. Many are like it, but this one is mine."_
>
> —boneskull, 2025

## License

Copyright © 2025 Christopher Hiller. Licensed under [BlueOak-1.0.0](https://blueoakcouncil.org/license/1.0.0).
