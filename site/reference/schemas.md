---
title: Utility Schemas
category: Reference
---

## Utility Schemas

<span class="bupkis">BUPKIS</span> provides several utility ([Zod][]) schemas [in the `schema` namespace][schema-namespace] to facilitate common validation tasks. You can use these to help build [custom assertions][custom-assertions].

> Examples will include usage in `createAssertion()` calls, but the schemas can be used directly with Zod's `parse()` and `safeParse()` methods as well.
>
> {@link bupkis!z z} refers to the {@link bupkis!z re-exported Zod namespace} from the main `bupkis` entrypoint.

### ArrayLikeSchema

{@link schema!ArrayLikeSchema ArrayLikeSchema} parses [Arrays][array] in addition to _array-like_ objects, which are objects with a `length` property and indexed elements (like [arguments][] or [NodeList][]).

**Example:**

```ts
import { createAssertion, use } from 'bupkis';
import { ArrayLikeSchema } from 'bupkis/schema';

const argsAssertion = createAssertion(
  [ArrayLikeSchema, 'to be a non-array arraylike object'],
  ArrayLikeSchema.refine((subject) => !Array.isArray(subject)),
);

const { expect } = use([argsAssertion]);
expect(
  (function () {
    return arguments;
  })(),
  'to be a non-array arraylike object',
);
```

### AsyncFunctionSchema

{@link schema!AsyncFunctionSchema AsyncFunctionSchema} matches asynchronous functions (i.e. [AsyncFunctions][asyncfunction])—functions which were declared with the [async][] keyword.

> **This schema _cannot_ match a function that returns a [Promise][] but was not declared via `async`.** Determining if a function returns a `Promise` is only possible by execution of said function (which <span class="bupkis">BUPKIS</span> avoids, naturally). This is a limitation of JavaScript itself.

**Example:**

```ts
import { createAssertion, use } from 'bupkis';
import { AsyncFunctionSchema } from 'bupkis/schema';

const asyncFnAssertion = createAssertion(
  [AsyncFunctionSchema, 'to be an async function'],
  AsyncFunctionSchema,
);

const { expect } = use([asyncFnAssertion]);
expect(async () => {}, 'to be an async function');
```

### ConstructibleSchema

{@link schema!ConstructibleSchema ConstructibleSchema} matches JavaScript functions which may be constructed with the [new keyword][]. This includes any function which was defined using the `function` keyword in addition to classes (created with `class` or otherwise).

> **Important:** We can only know if a function is _constructible_; we cannot know if it was specifically created using the `class` keyword or is otherwise intended to be a "class". This is a language-level limitation. If someone knows a way around this, please [open an issue][issue-tracker]!

**Example:**

```ts
import { createAssertion, use } from 'bupkis';
import { ConstructibleSchema } from 'bupkis/schema';

const classAssertion = createAssertion(
  [ConstructibleSchema, 'to be a subclass of Error'],
  ConstructibleSchema.refine((subject) => subject.prototype instanceof Error),
);

const { expect } = use([classAssertion]);
expect(class MyError extends Error {}, 'to be a subclass of Error');
```

### FalsySchema

{@link schema!FalsySchema FalsySchema} schema matches any _falsy_ value:

- `false`
- `0`
- `-0`
- `0n`
- `''` (empty string)
- `null`
- `NaN`
- `undefined`

**Example:**

```ts
import { createAssertion, use } from 'bupkis';
import { FalsySchema } from 'bupkis/schema';

const falsyAssertion = createAssertion(['to be nothing'], FalsySchema);

const { expect } = use([falsyAssertion]);

expect('', 'to be nothing');
```

### DictionarySchema

> _Alias:_ {@link schema!NullProtoObjectSchema NullProtoObjectSchema}

{@link schema!DictionarySchema DictionarySchema} matches _dictionaries_; for our purposes, these are `Record`-like objects having a `null` prototype (i.e. created via `Object.create(null)`). This is useful when you want to ensure that the object has no inherited properties.

**Example:**

```ts
import { createAssertion, use } from 'bupkis';
import { DictionarySchema } from 'bupkis/schema';

const dictAssertion = createAssertion(
  [DictionarySchema, 'to be a dictionary of numbers'],
  DictionarySchema.pipe(z.record(z.number())),
);

const { expect } = use([dictAssertion]);

expect(Object.create(null, { pants: { value: 42, enumerable: true } }),
```

### PrimitiveSchema

{@link schema!PrimitiveSchema PrimitiveSchema} matches any [JavaScript primitive][primitive] created via a literal. It will **not** match wrapped/boxed primitives (e.g. `new String('foo')`). Primitives include:

- `string`
- `number`
- `bigint`
- `boolean`
- `symbol`
- `null`
- `undefined`

**Example:**

```ts
import { createAssertion, use } from 'bupkis';
import { PrimitiveSchema } from 'bupkis/schema';

const primitiveAssertion = createAssertion(
  ['to be a primitive, Date, or RegExp'],
  PrimitiveSchema.or(z.instanceof(Date)).or(z.instanceof(RegExp)),
);

const { expect } = use([primitiveAssertion]);

expect('pants', 'to be a primitive, Date, or RegExp');
```

### PropertyKeySchema

{@link schema!PropertyKeySchema PropertyKeySchema} matches valid JavaScript property keys: `string`, `number`, or `symbol`, which are the _only_ valid types for object property keys in JavaScript. This is typically used with {@link bupkis!z.record z.record()} where `z.record(z.string(), ...)` is too narrow.

> _Note:_ A {@link bupkis!z.ZodRecord ZodRecord} is not necessarily an object with a `null` prototype; see [DictionarySchema](#dictionaryschema) for if you need a narrower schema.

**Example:**

```ts
import { createAssertion, use } from 'bupkis';
import { PropertyKeySchema } from 'bupkis/schema';
const unknownRecordAssertion = createAssertion(
  ['to be a record of anything'],
  z.record(PropertyKeySchema, z.unknown()),
);

const { expect } = use([unknownRecordAssertion]);
expect(
  { 42: pants, shirts: 'foo', [Symbol('baz')]: null },
  'to be a record of anything',
);
```

### RegExpSchema

{@link schema!RegExpSchema RegExpSchema} matches [RegExp](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp) objects.

**Example:**

```ts
import { createAssertion, use } from 'bupkis';
import { RegExpSchema } from 'bupkis/schema';

const globalRegexAssertion = createAssertion(
  [RegExpSchema, 'to be a RegExp with the global flag'],
  RegExpSchema.refine((subject) => subject.flags.includes('g')),
);

const { expect } = use([globalRegexAssertion]);

expect(/pants/g, 'to be a RegExp with the global flag');
```

### StrongMapSchema

{@link schema!StrongMapSchema StrongMapSchema} matches [Map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map) objects, but not `WeakMap` objects. This exists because {@link bupkis!z.map z.map()} matches both.

**Example:**

```ts
import { createAssertion, use } from 'bupkis';
import { StrongMapSchema } from 'bupkis/schema';

const stringNumberMapAssertion = createAssertion(
  [StrongMapSchema, 'to be a Map with string keys and number values'],
  StrongMapSchema.pipe(z.map(z.string(), z.number())),
);

const { expect } = use([stringNumberMapAssertion]);
expect(
  new Map([['pants', 42]]),
  'to be a Map with string keys and number values',
);
```

### StrongSetSchema

{@link schema!StrongSetSchema StrongSetSchema} matches [Set](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set) objects, but not `WeakSet` objects. This exists because {@link bupkis!z.set z.set()} matches both.

**Example:**

```ts
import { createAssertion, use } from 'bupkis';
import { StrongSetSchema } from 'bupkis/schema';

const stringSetAssertion = createAssertion(
  [StrongSetSchema, 'to be a Set of strings'],
  StrongSetSchema.pipe(z.set(z.string())),
);

const { expect } = use([stringSetAssertion]);
expect(new Set(['pants', 'shirts']), 'to be a Set of strings');
```

## TruthySchema

{@link schema!TruthySchema TruthySchema} matches any _truthy_ value, i.e. any value that is not _falsy_.

> See [FalsySchema](#falsyschema) for the list of falsy values.

**Example:**

```ts
import { createAssertion, use } from 'bupkis';
import { TruthySchema } from 'bupkis/schema';

const somethingAssertion = createAssertion(['to be something'], TruthySchema);

const { expect } = use([somethingAssertion]);

expect('pants', 'to be something');
```

### WrappedPromiseLikeSchema

{@link schema!WrappedPromiseLikeSchema WrappedPromiseLikeSchema} matches objects that implement the [`PromiseLike` interface](https://github.com/microsoft/TypeScript/blob/e9bcbe6ef706e0b5a34678964988eb6a9cd86cc6/src/lib/es5.d.ts#L1519)}; i.e. an object having a [then][] method. This is useful when you want to match "thenable" objects that are not necessarily actual [Promise][] instances.

Unlike the schema created by {@link bupkis!z.promise z.promise()}, this schema **does not automatically unwrap the fulfilled value**; it only checks that the object is a `PromiseLike`.

```ts
import { createAssertion, use } from 'bupkis';
import { WrappedPromiseLikeSchema } from 'bupkis/schema';

const thenableAssertion = createAssertion(
  [WrappedPromiseLikeSchema, 'to be a thenable'],
  WrappedPromiseLikeSchema,
);

const { expect } = use([thenableAssertion]);
// does nothing with 'pants'; await it elsewhere
expect({ then: () => Promise.resolve('pants') }, 'to be a thenable');
```

[schema-namespace]: /modules/schema.html
[custom-assertions]: ../reference/assertions.md
[array]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array
[arguments]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/arguments
[nodelist]: https://developer.mozilla.org/en-US/docs/Web/API/NodeList
[issue-tracker]: https://github.com/boneskull/bupkis/issues
[asyncfunction]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/AsyncFunction
[new keyword]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/new
[primitive]: https://developer.mozilla.org/en-US/docs/Glossary/Primitive
[then]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/then#description
[zod]: https://zod.dev
[promise]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise
[async]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function
