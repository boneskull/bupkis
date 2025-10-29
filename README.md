<p align="center">
  <a href="/"><img src="./site/media/bupkis-logo-512.png" width="512px" align="center" alt="BUPKIS: The Glory of Certainty"/></a>
  <h1 align="center"><span class="bupkis">⁓ BUPKIS ⁓<span></h1>
  <p align="center">
    <em>“Uncommonly Extensible Assertions for The Beautiful People”</em>
    <br/>
    <small>by <a href="https://github.com/boneskull" title="@boneskull on GitHub">@boneskull</a></small>
  </p>
</p>

## Quick Links

- [BUPKIS' Homepage][docs] (<https://bupkis.zip>)
- [Assertion Reference][assertion-reference]
- [Guide: Basic Usage][basic-usage]
- [Guide: Creating a Custom Assertion][create-a-custom-assertion]

## Motivation

> _"Another assertion library? You cannot be serious, dogg. My test framework has its own assertions!"_
>
> <small>‒sickos, probably</small>

Look, we're ~~old~~ ~~wizened~~ ~~experienced~~ knowledgeable and we've written a lot of tests. We've used a lot of assertion libraries. There are ones we prefer and ones we don't.

But none of them do quite what <strong><span class="bupkis">BUPKIS</span></strong> does. We want an assertion library that prioritizes:

- Type safety
- Uncompromisable extensibility
- A small API surface

We can think of several that tick two-thirds of those boxes! But _we demand the total package_ (And You Should Too).

> ⚠️ **Caution!**
>
> Assertion libraries tend come in two flavors: chainable or stiff & traditional. But because these styles are likely _familiar_ to you, you may hate <strong><span class="bupkis">BUPKIS</span></strong>.
>
> We _want_ you to like it, yes. But if you don't, we're content with just making our point and asking the following favor of the reader:
>
> **Do not confuse _familiarity_ with _usability_.**

The following is a brief overview of the design choices we made to serve these goals.

### Natural Language Assertions

In <strong><span class="bupkis">BUPKIS</span></strong>, "natural language" is the means to the end of "a small API surface".

When you're using <strong><span class="bupkis">BUPKIS</span></strong>, you **don't** write this:

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

If another assertion library wants you to write:

```js
expect(actual).to.be.a('string');
```

Then <strong><span class="bupkis">BUPKIS</span></strong> wants you to write:

```js
expect(actual, 'to be a string');
// it is tolerant of poor/ironic grammar, sometimes
expect(actual, 'to be an string');
```

Can't remember the phrase? Did you forget a word or make a typo? Maybe you also forgot <strong><span class="bupkis">BUPKIS</span></strong> is type-safe?! You'll get a nice squiggly for your trouble.

This isn't black magic. It ain't no _cauldron_. We're not just _throwing rat tails and `string`s into a function and stirring that shit up._

> _"Preposterous! Functions. Things of that nature."_
>
> <small>‒the reader and/or more sickos</small>

You may wonder how this could this be anything _but_ loosey-goosey _senselessness_. On the contrary—we have _conventions_!

#### Conventions of `expect()`

To formalize the conventions at a high level:

- The first parameter to a <strong><span class="bupkis">BUPKIS</span></strong> assertion is always the _subject_ ([def.](https://bupkis.zip/documents/Reference.Glossary_of_Terms#subject)).

- The "string" part of a <strong><span class="bupkis">BUPKIS</span></strong> assertion is known as a _phrase_. Every expectation will contain _at minimum_ one (1) phrase. As you can see from the above "to be a string" example, phrases often have aliases.

- Assertions may have multiple phrases or parameters, but the simplest assertions always look like this:

  ```ts
  expect(subject, 'phrase');
  ```

  ...and more complex assertions look like this:

  ```ts
  expect(subject, 'phrase', [parameter?, phrase?, parameter?, ...]);
  ```

- If an assertion's phrase contains something like "to satisfy" or "satisfying", then the next parameter has special meaning. It is somewhat like Jest's `expect.objectContaining()`, but more powerful (prior art: [unexpected's `to satisfy` assertion][unexpected-to-satisfy]).

  There are three (3) things to know about this parameter:
  1. It matches objects, but only verifies that the keys provided are a) **present** and the values _satisfy_ the values in the expected object.
  2. If the value of any given property in an object is a _regular expression_ (`RegExp`), the actual value will be coerced to a string and tested against the regular expression. This provides easy string matching within nested properties (see below example for what this looks like).
  3. _Any assertion_ (including custom assertions) can be embedded within an object parameter via the `expect.it()` function:

  ```ts
  expect(user, 'to satisfy', {
    name: expect.it('to be a string'),
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, // equivalent to "to match" below
    age: expect.it('to be greater than', 18),
    roles: [expect.it('to be a string')], // Each array element must be a string
    metadata: {
      lastLogin: expect.it('to match', /^\d{4}-\d{2}-\d{2}$/),
      preferences: {
        theme: expect.it('to be one of', ['light', 'dark']),
        notifications: expect.it('to be a boolean'),
      },
    },
  });
  ```

  > 👉 See [Embeddable Assertions][] for more a thorough explanation of `expect.it()`.

- You can _negate_ **any** assertion by prepending its first phrase with `not`. For example:

  ```js
  expect(actual, 'to be', expected);
  expect(actual, 'not to be', expected);

  expect(
    () => throw new TypeError('aww, shucks'),
    'not to throw a',
    TypeError,
    'satisfying',
    /gol durn/,
  );
  ```

- You can "chain" multiple assertions (including custom assertions) together by delimiting them with `and`:

  ```js
  expect(
    user,
    'to satisfy',
    {
      name: expect.it('to be a string', 'and', 'to have length less than', 100),
      age: expect.it('to be greater than', 18),
    },
    'and',
    'to have property',
    'email',
  );
  ```

  _How about them apples._

### Custom Assertions Built With Standard Schema V1

<strong><span class="bupkis">BUPKIS</span></strong> supports any [Standard Schema V1][standard-schema]-compliant validation library, including [Zod][], [Valibot][], [ArkType][], [Effect Schema][], and many others.

Most of the built-in assertions are implemented using Zod schemas, but you can use **any** Standard Schema V1 library to create custom assertions. <strong><span class="bupkis">BUPKIS</span></strong> extends this capability to you regardless of your preferred validation library.

An example will be illuminating. What follows is a ~~stupid~~ ~~quick~~ _stupid_ example of a creating and "registering" a basic assertion _which can be invoked using two different phrases_:

```ts
import { z, use, createAssertion } from 'bupkis';

const stringAssertion = createAssertion(
  z.string(),
  [['to be based', 'to be bussin']],
  z.string(),
);

const { expect } = use([stringAssertion]);

expect('chat', 'to be based');
expect('fam', 'to be bussin');

// did you know? includes all builtin assertions!
expect('skiball lavatory', 'to be a string');
```

> 📒 Assertion Registration?
>
> "Registration" of an assertion (a misnomer; there is no stateful "registry" in <strong><span class="bupkis">BUPKIS</span></strong>) is as straightforward as passing an array of objects created by `createAssertion()` and/or `createAsyncAssertion()` to the `use()` function.
>
> `use()`, as exported from `bupkis`, returns a new `expect()`/`expectAsync()` pair that which can execute _your_ custom assertions _in addition to_ every built-in assertion.
>
> The `expect()`/`expectAsync()` functions returned by `use()` are fully type-safe and aware of your custom assertions. Each `expect()`/`expectAsync()` function has a `.use()` method as well; this allows you to compose multiple sets of assertions together (like from several assertion plugin packages).

**Any [Standard Schema V1][standard-schema] library makes it extremely easy to create most custom assertions**. Whether you prefer [Zod][], [Valibot][], [ArkType][], or another compliant library, they all work seamlessly. But despite their power, validation libraries can't do _everything_ we need an assertion to do; for those situations, there's also a [function-based API][custom-assertion-function] for use with [parametric][] and [behavioral][] (e.g., involving function execution) assertions.

👉 For an assiduous guide on creating assertions, read [Guide: How to Create a Custom Assertion][create-a-custom-assertion].

### Excruciating Type Safety

We have tried to make <strong><span class="bupkis">BUPKIS</span></strong> is as type-safe as possible. To be clear, _that is pretty damn possible_. This means:

- Every built-in assertion is fully type-safe and is declared as an overload for `expect()` or `expectAsync()`.
- Every _custom_ assertion is _also_ fully type-safe and is declared as an overload for `expect()` or `expectAsync()` (as returned from `use()`)
- If an assertion demands the _subject_ be of a certain type, the TS compiler will squawk if you try to use an incompatible subject type. For example, `<Map> to have size <number>` will only accept a `Map` as the subject, and this will be obvious in your editor.

> _Note_: `expect()` is not and cannot be a type guard; see the ["Caveats" Reference doc](http://bupkis.zip/documents/Reference.Caveats#expect-is-not-a-type-guard) for more information.

## Prerequisites

**Node.js**: ^20.19.0, ^22.12.0, >=23

<strong><span class="bupkis">BUPKIS</span></strong> supports any [Standard Schema V1][standard-schema]-compliant validation library. It has a peer dependency on [Zod][] v4+ (which implements Standard Schema V1), but will install it as an optional dependency if you are not already using it. You can also use [Valibot][], [ArkType][], [Effect Schema][], or any other Standard Schema V1 library.

<strong><span class="bupkis">BUPKIS</span></strong> ships as a dual CJS/ESM package.

> Disclaimer: <strong><span class="bupkis">BUPKIS</span></strong> has been designed to run on Node.js in a development environment. Anyone attempting to deploy <strong><span class="bupkis">BUPKIS</span></strong> to some server somewhere will get what is coming to them.

## Installation

```sh
npm install bupkis -D
```

## Usage

👉 See the [Basic Usage Guide](https://bupkis.zip/documents/guides.basic_usage) for a quick introduction.

📖 Visit [https://bupkis.zip](https://bupkis.zip) for comprehensive guides and reference.

## Acknowledgements

- [Unexpected][] is the main inspiration for <strong><span class="bupkis">BUPKIS</span></strong>. However, creating types for this library was exceedingly difficult (and was in fact the first thing we tried). Despite that drawback, we found it exquisitely usable.
- [Standard Schema][] for creating a unified interface that allows <strong><span class="bupkis">BUPKIS</span></strong> to work with any compliant validation library.
- [Zod][] is a popular object validation library upon which <strong><span class="bupkis">BUPKIS</span></strong> builds many of its built-in assertions. Special thanks to Colin McDonnell for implementing Standard Schema V1.
- [fast-check][]: Thanks to Nicholas Dubien for this library. There is **no better library** for an assertion library to use to test itself! Well, besides itself, we mean. How about _in addition to_ itself? Yes. Thank you!
- [zshy][] from Colin McDonnell. Thanks for making dual ESM/CJS packages easy and not too fancy.
- [TypeDoc][] it really documents the hell out of TypeScript projects.
- [@cjihrig](https://github.com/cjihrig) and other Node.js contributors for the thoughtfulness put into [`node:test`](https://nodejs.org/api/test.html) that make it my current test-runner-of-choice.

## Why is it called **BUPKIS**?

TODO: think of good reason and fill in later

## License

Copyright © 2025 Christopher Hiller. Licensed under [BlueOak-1.0.0](https://blueoakcouncil.org/license/1.0.0).

[standard-schema]: https://standardschema.dev
[zod]: https://zod.dev
[valibot]: https://valibot.dev
[arktype]: https://arktype.io
[effect schema]: https://effect.website/docs/schema/introduction
[docs]: https://bupkis.zip
[basic-usage]: https://bupkis.zip/usage
[unexpected]: https://unexpected.js.org
[fast-check]: https://fast-check.dev
[parametric]: https://bupkis.zip/glossary#parametric-assertion
[custom-assertion-function]: https://bupkis.zip/custom-assertions#static-assertions-function-style
[create-a-custom-assertion]: https://bupkis.zip/custom-assertions
[assertion-reference]: https://bupkis.zip/assertions
[zshy]: https://github.com/colinhacks/zshy
[typedoc]: https://typedoc.org
[embeddable assertions]: https://bupkis.zip/documents/Basic_Usage#embeddable-assertions
[unexpected-to-satisfy]: https://unexpected.js.org/assertions/any/to-satisfy/
[behavioral]: https://bupkis.zip/glossary#behavioral-assertion
