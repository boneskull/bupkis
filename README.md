<p align="center">
  <img src="https://github.com/boneskull/bupkis/blob/main/assets/bupkis-logo-256.png" width="256px" align="center" alt="BUPKIS logo"/>
  <h1 align="center"><em><span class="federo-caps">BUPKIS<span></em></h1>
  <p align="center">
    A well-typed and easily exensible <em>BDD-style</em> assertion library.
    <br/>
    by <a href="https://github.com/boneskull">@boneskull</a>
  </p>
</p>

## Motivation

Look, I'm ~~old~~ ~~wizened~~ ~~experienced~~ knowledegable and I've written a lot of tests. I've used a lot of assertion libraries. There are ones I prefer and ones I don't.

But none of them do quite what _this_ does. The main goals of this library are:

- Type safety
- Dead-simple creation of custom assertions
- Minimal API surface

A chainable API may provide type safety. But it seems to _guarantee_ implementing a custom assertion will be complicated. The API surface is necessarily a combinatoric explosion of methods.

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

### Custom Assertions

In _BUPKIS_, custom assertions are _first-class citizens_. You can create your own assertions with minimal boilerplate. You don't have to learn a new API or a new DSL (maybe); you just use [Zod][]. _It's so easy, even a **archaic human** could do it!_

Read [Guide: How to Create a Custom Assertion](https://boneskull.github.io/bupkis/documents/Guides.How_to_Create_a_Custom_Assertion) to learn more.

## Prerequisites

_BUPKIS_ requires **Node.js ^20.19.0 || ^22.12.0 || >=23** and ships as a dual CJS/ESM package.

The library has been designed for Node.js environments and testing frameworks.

## Installation

```bash
npm install bupkis -D
```

## Usage

Here:

```ts
import { expect } from 'bupkis';

// Basic type assertions
expect('hello', 'to be a string');
expect(42, 'to be a number');
expect(true, 'to be a boolean');

// Value comparisons
expect(10, 'to equal', 10);
expect('hello world', 'to contain', 'world');
expect([1, 2, 3], 'to have length', 3);

// Negation
expect(42, 'not to be a string');
expect('hello', 'not to equal', 'goodbye');

// Object assertions
const user = { name: 'Alice', age: 30 };
expect(user, 'to be an object');
expect(user, 'to have property', 'name');
expect(user, 'to satisfy', { name: 'Alice' });
```

For comprehensive documentation and guides, visit the [project documentation](https://boneskull.github.io/bupkis/).

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
