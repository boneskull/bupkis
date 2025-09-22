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

### "Satisfy" Semantics Are Not Strongly Typed

When calling `expect()` or `expectAsync()`, the _parameter_ in assertions supporting the ["to satisfy"](../assertions/object.md#object-to-satisfy-any) semantics is not strongly typed, even though regular expressions and `expect.it()` have special meaning. This is because it can accept _literally any value_ (i.e. `any`). If `any` appears within a union type, TypeScript will widen the entire union to `any`. There you have it.

### Zod Isn't an Assertion Library

…which means using it as a core building block of an assertion library has a few trade-offs.

Zod is meant for _parsing_ and _validating_ data, which means there may be some circumstances where Zod will attempt to _mutate the data you give it_ …which is generally Bad for our purposes.

For that reason, <span class="bupkis">BUPKIS</span> recommends avoiding any Zod schema that mutates data. One example would be the `.readonly()` schema, which necessarily calls `Object.freeze()` on the input value (the _output_ is read-only; not the input!). If you need to check that a value is read-only, you can work around this via `.refine()`, like so:

```ts
import { z } from 'zod';
import { createAssertion, use } from 'bupkis';

// Object.isFrozen is liberal in what it accepts
const ReadonlySchema = z.unknown().refine((value) => Object.isFrozen(value), {
  message: 'Expected object to be frozen',
});

const assertion = createAssertion('to be readonly', ReadonlySchema);
const { expect } = use([assertion]);

expect(Object.freeze({ foo: 'bar' }), 'to be readonly');
```

> 👋 If you're aware of any other Zod schemas that mutate data, please open an [issue](https://github.com/boneskull/bupkis/issues)!

## Errata

Bits & bobs.

### Under Construction

<span class="bupkis">Bupkis</span> is not yet complete. There are features that We want to implement that We just haven't gotten to yet!

See the [ROADMAP][] for details.

[ROADMAP]: ../about/roadmap.md
