<p align="center">
  <img src="./assets/bupkis-logo-512.png" width="512px" align="center" alt="BUPKIS logo"/>
  <h1 align="center"><span class="twentieth-century-caps">⁓ BUPKIS ⁓<span></h1>
  <p align="center">
    A well-typed and easily exensible <em>BDD-style</em> assertion library
    <br/>
    <small>by <a href="https://github.com/boneskull">@boneskull</a></small>
  </p>
</p>

## Quick Links

- [BUPKIS' Homepage][docs] (<https://bupkis.zip>)
- [Assertion Reference][assertion-reference]
- [Guide: Basic Usage][basic-usage]
- [Guide: How to Create a Custom Assertion][create-a-custom-assertion]

## Motivation

> "_Another_ assertion library? Are you daft? My test framework has its own assertions!"
>
> ‒sickos, probably

Look, I'm ~~old~~ ~~wizened~~ ~~experienced~~ knowledegable and I've written a lot of tests. I've used a lot of assertion libraries. There are ones I prefer and ones I don't.

But none of them do quite what _this_ does. The main goals of this library are:

- Type safety
- Dead-simple creation of custom assertions
- Minimal API surface

A chainable API may provide type safety. But it seems to _guarantee_ implementing a custom assertion will be complicated. The API surface is necessarily a combinatoric explosion of methods.

> ⚠️ **Caution!**
>
> Because chainable APIs are familiar, you may hate _BUPKIS_ once you see some examples. Nobody's making you use it. But please, keep an open mind & give me this grace: _don't confuse familiarity with usability_.

To achieve these goals, _BUPKIS_ makes the following design choices.

### Assertions are Natural Language

When you're using _BUPKIS_, you **don't** write this:

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
// it is tolerant of poor/ironic grammar, sometimes
expect(actual, 'to be an string');
```

Can't remember the string? Did you forget a word or make a typo? Maybe you also forgot **_BUPKIS_ is type-safe?** You'll get a nice squiggly for your trouble. This isn't black magic. It ain't a _cauldron_. We're not just _throwing rat tails and `string`s in there._

> "Preposterous! Codswallop!"
>
> ‒the reader and/or more sickos

Right—how could this be anything by loosey-goosey _senselessness_? I beg to differ; _BUPKIS_ is nothing if not _intentional_.

The first parameter to a _BUPKIS_ assertion is always the _subject_ ([def.](https://bupkis.zip/documents/Reference.Glossary_of_Terms#subject)).

The "string" part of a _BUPKIS_ assertion is known as a _phrase_. Every expectation will contain _at minimum_ one (1) phrase. As you can see from the above "to be a string" example, phrases often have aliases.

Assertions may have multiple phrases or parameters, but the simplest assertions always look like this:

```ts
expect(subject, 'phrase');
```

...and more complex assertions look like this:

```ts
expect(subject, 'phrase', [parameter?, phrase?, parameter?, ...]);
```

One more convention worth mentioning is _negation_.

You can _negate_ just about any phrase by prepending it with `not` and a space. For example:

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

### Custom Assertions by Zod

[Zod][] is a popular object validation library which does some heavy lifting for _BUPKIS_. In fact, its fundamentals get us _most_ of the way to a type-safe assertion library!

So We recognized that many (most?) custom assertions can be _implemented as Zod schemas._

Here's a ~~stupid~~ ~~quick~~ _stupid_ example of a creating and "registering" a basic assertion _which can be invoked using two different phrases_:

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

**If you can express it in Zod, you can make it an assertion.** There's also a [function-based API][custom-assertion-function] for use with [parametric][] and behavioral assertions.

👉 For a thorough guide on creating assertions, read [Guide: How to Create a Custom Assertion][create-a-custom-assertion].

## Prerequisites

**Node.js**: ^20.19.0, ^22.12.0, >=23

_BUPKIS_ has a peer dependency on [Zod][] v4+, but will install it as an optional dependency if you are not already using it.

_BUPKIS_ ships as a dual CJS/ESM package.

> Disclaimer: _BUPKIS_ has been designed to run on Node.js in a development environment. Anyone attempting to deploy _BUPKIS_ to some server somewhere will get what is coming to them.

## Installation

```bash
npm install bupkis -D
```

## Usage

👉 See the [Basic Usage Guide](https://bupkis.zip/documents/guides.basic_usage) for a quick introduction.

📖 Visit [https://bupkis.zip](https://bupkis.zip) for comprehensive guides and reference.

## Acknowledgements

- [Unexpected][] is the main inspiration for _BUPKIS_. However, creating types for this library is exceedingly difficult (and was in fact the first thing I tried). Despite that drawback, I find it more usable than any other assertion library I've tried.
- [Zod][] is a popular object validation library upon which _BUPKIS_ builds many of its own assertions.
- [fast-check][]: Thanks to Nicholas Dubien for this library. There is **no better library** for an assertion library to use to test itself! Well, besides itself, I mean. How about _in addition to_ itself? Yes. Thank you!
- [tshy][] from Isaac Schlueter. Thanks for making dual ESM/CJS packages easy and not too fancy.
- [TypeDoc][] it really documents the hell out of TypeScript projects.
- [@cjihrig](https://github.com/cjihrig) and other Node.js contributors for the thoughtfulness put into [`node:test`](https://nodejs.org/api/test.html) that make it my current test-runner-of-choice.

## Why is it called _BUPKIS_?

TODO: think of good reason and fill in later

## A Note From The Author

> _"This is my assertion library. Many are like it, but this one is mine."_
>
> ‒boneskull, 2025

## License

Copyright © 2025 Christopher Hiller. Licensed under [BlueOak-1.0.0](https://blueoakcouncil.org/license/1.0.0).

[zod]: https://zod.dev
[docs]: https://bupkis.zip
[basic-usage]: https://bupkis.zip/documents/guides.basic_usage
[unexpected]: https://unexpected.js.org
[fast-check]: https://fast-check.dev
[parametric]: https://bupkis.zip/documents/Reference.Glossary_of_Terms#parametric-assertion
[custom-assertion-function]: https://bupkis.zip/documents/guides.how_to_create_a_custom_assertion#using-a-function
[create-a-custom-assertion]: https://bupkis.zip/documents/Guides.How_to_Create_a_Custom_Assertion
[assertion-reference]: https://bupkis.zip/documents/reference.assertions
[tshy]: https://github.com/isaacs/tshy
[typedoc]: https://typedoc.org
