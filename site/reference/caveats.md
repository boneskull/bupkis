---
title: Caveats & Errata
category: Reference
---

## Caveats

We know <span class="bupkis">Bupkis</span> is a rare stroke of genius—but there are things it can't do. Here are some caveats to be aware of.

### Expect Is Not A Type Guard

`expect()` performs assertions, yes, but the type signature _does not_ look like this:

```ts
function expect<T>(
  actual: unknown,
  phrase: string,
  ...args: unknown[]
): asserts actual is T;
```

Maybe better to show an example:

```ts
let foo: unknown = getFoo();

expect(foo, 'to be a string'); // foo is still inferred as `unknown`
```

It is currently _not possible_ (as of TypeScript v5.9.2) for a dynamically-typed function (like `expect()`) to have such a type signature. AFAIK, such a function _cannot_ be overloaded, which is in direct conflict to <span class="bupkis">Bupkis</span>' mode of operation.

But if that ever changes, we'll jump on it!

### Zod Isn't an Assertion Library

…which means using it as a core building block of an assertion library has a few trade-offs.

Zod is meant for _parsing_ and _validating_ data, which means there may be some circumstances where Zod will attempt to _mutate the data you give it_ …which is generally Bad.

For that reason, <span class="bupkis">Bupkis</span> recommends avoiding any Zod schema that mutates data. One example would be the `.readonly()` schema, which necessarily calls `Object.freeze()` on the input value (the _output_ is read-only; not the input!). If you need to check that a value is read-only, you can work around this via `.refine()`, `.preprocess()`, etc.

## Errata

Bits & bobs.

### Under Construction

<span class="bupkis">Bupkis</span> is not yet complete (see [ROADMAP][]). There are features that We want to implement that We just haven't gotten to yet, including (but not limited to):

- Custom diffs
- Property drilling via keypaths (to make assertions about deeply-nested props)
- Integration of async assertions into sync assertions (so that you can make any extant sync assertion against a `Promise` or async function)
- Chaining assertions via boolean logic (`and`, `or`, etc.); we already have `not`
- Unwinding assertions created via composition (i.e. containing calls to `expect()`) for better error messages & stack traces

[ROADMAP]: ../../ROADMAP.md
