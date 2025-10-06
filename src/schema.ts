/**
 * Arguably-useful Zod schemas for common types and validation patterns.
 *
 * This module provides reusable Zod schemas for validating constructors,
 * functions, property keys, promises, and other common JavaScript types used
 * throughout the assertion system. These tend to work around the impedance
 * mismatch between **BUPKIS** and Zod.
 *
 * These are used internally, but consumers may also find them useful.
 *
 * For example, we have {@link FunctionSchema} which accepts any
 * function—regardless of its signature. We need this because Zod v4's
 * `z.function()` no longer returns a `ZodType` (ref:
 * {@link https://zod.dev/v4/changelog | Zod v4 Migration Guide}) and so behaves
 * differently. `FunctionSchema` allows us to work with functions as _values_
 * instead of something to be implemented.
 *
 * Similarly—but not a new development—`z.promise()` does not parse a
 * {@link Promise} object; it parses the _fulfilled value_. This is not what we
 * want for "is a Promise" assertions, but it _can_ be useful for making sense
 * of the fulfilled value. To solve this, we have
 * {@link WrappedPromiseLikeSchema} (which explicitly supports
 * {@link PromiseLike}/"thenable" objects).
 *
 * @category API
 * @example
 *
 * ```ts
 * import * as schema from 'bupkis/schema';
 * ```
 *
 * @packageDocumentation
 * @groupDescription Schema
 * Schemas for common types and validation patterns.
 */

import { z } from 'zod/v4';

import { KEYPATH_REGEX } from './constant.js';
import {
  isConstructible,
  isFunction,
  isNonNullObject,
  isPromiseLike,
} from './guards.js';
import { BupkisRegistry } from './metadata.js';
import {
  type Constructor,
  type Keypath,
  type MutableOrReadonly,
} from './types.js';

const { getPrototypeOf, prototype: objectPrototype } = Object;

/**
 * A Zod schema that validates JavaScript constructible functions.
 *
 * This schema validates values that can be used as constructors, including ES6
 * classes, traditional constructor functions, and built-in constructors. It
 * uses the {@link isConstructible} guard function to determine if a value can be
 * invoked with the `new` operator to create object instances.
 *
 * @privateRemarks
 * The schema is registered in the {@link BupkisRegistry} with the name
 * `ConstructibleSchema` for later reference and type checking purposes.
 * @example Direct Usage
 *
 * ```typescript
 * class MyClass {}
 * function MyConstructor() {}
 *
 * ConstructibleSchema.parse(MyClass); // ✓ Valid
 * ConstructibleSchema.parse(MyConstructor); // ✓ Valid
 * ConstructibleSchema.parse(Array); // ✓ Valid
 * ConstructibleSchema.parse(Date); // ✓ Valid
 * ConstructibleSchema.parse(() => {}); // ✗ Throws validation error
 * ConstructibleSchema.parse({}); // ✗ Throws validation error
 * ```
 *
 * @example Assertion Creation
 *
 * ```ts
 * import { createAssertion, use } from 'bupkis';
 * import { ConstructibleSchema } from 'bupkis/schema';
 *
 * const classAssertion = createAssertion(
 *   [ConstructibleSchema, 'to be a subclass of Error'],
 *   ConstructibleSchema.refine(
 *     (subject) => subject.prototype instanceof Error,
 *   ),
 * );
 *
 * const { expect } = use([classAssertion]);
 * expect(class MyError extends Error {}, 'to be a subclass of Error');
 * ```
 *
 * @group Schema
 */

export const ConstructibleSchema = z
  .custom<Constructor>(isConstructible)
  .register(BupkisRegistry, { name: 'constructible' })
  .describe('Constructible Function');

/**
 * A Zod schema that validates any JavaScript function.
 *
 * This schema accepts a function having any signature and avoids Zod's parsing
 * overhead.
 *
 * @remarks
 * Zod v~4.0.0 changed how {@link z.function z.function()} worked, which made it
 * unsuitable for validation. This was reverted in Zod v4.1.0.
 * @privateRemarks
 * The schema is registered in the {@link BupkisRegistry} with the name
 * `FunctionSchema` for later reference and type checking purposes.
 * @example Direct Usage
 *
 * ```typescript
 * FunctionSchema.parse(function () {}); // ✓ Valid
 * FunctionSchema.parse(() => {}); // ✓ Valid
 * FunctionSchema.parse(async () => {}); // ✓ Valid
 * FunctionSchema.parse(function* () {}); // ✓ Valid
 * FunctionSchema.parse(Math.max); // ✓ Valid
 * FunctionSchema.parse('not a function'); // ✗ Throws validation error
 * FunctionSchema.parse({}); // ✗ Throws validation error
 * ```
 *
 * @example Assertion Creation
 *
 * ```ts
 * import { createAssertion, use } from 'bupkis';
 * import { FunctionSchema } from 'bupkis/schema';
 *
 * const fnAssertion = createAssertion(
 *   [FunctionSchema, 'to be a function with arity 2'],
 *   FunctionSchema.refine((subject) => subject.length === 2),
 * );
 * const { expect } = use([fnAssertion]);
 * function add(a: number, b: number) {
 *   return a + b;
 * }
 * expect(add, 'to be a function with arity 2');
 * ```
 *
 * @group Schema
 */
export const FunctionSchema = z
  .custom<(...args: MutableOrReadonly<unknown[]>) => unknown>(isFunction)
  .register(BupkisRegistry, {
    name: 'function',
  })
  .describe('Any function');

/**
 * A Zod schema that validates non-collection objects and functions.
 *
 * Accepts plain objects, functions, arrays, dates, etc. but rejects collection
 * types like `Map`, `Set`, `WeakMap`, and `WeakSet`.
 *
 * @example Direct Usage
 *
 * ```typescript
 * NonCollectionObjectSchema.parse({}); // ✓ Valid
 * NonCollectionObjectSchema.parse({ key: 'value' }); // ✓ Valid
 * NonCollectionObjectSchema.parse(function () {}); // ✓ Valid
 * NonCollectionObjectSchema.parse(() => {}); // ✓ Valid
 * NonCollectionObjectSchema.parse(new Map()); // ✗ Throws validation error
 * NonCollectionObjectSchema.parse(new Set()); // ✗ Throws validation error
 * NonCollectionObjectSchema.parse(null); // ✗ Throws validation error
 * NonCollectionObjectSchema.parse(42); // ✗ Throws validation error
 * ```
 *
 * @example Assertion Creation
 *
 * ```ts
 * import { createAssertion, use } from 'bupkis';
 * import { NonCollectionObjectSchema } from 'bupkis/schema';
 *
 * const nonCollectionAssertion = createAssertion(
 *   [NonCollectionObjectSchema, 'to be a non-collection object'],
 *   NonCollectionObjectSchema,
 * );
 * const { expect } = use([nonCollectionAssertion]);
 * expect({ key: 'value' }, 'to be a non-collection object');
 * ```
 *
 * @group Schema
 */
export const NonCollectionObjectSchema = z
  .custom<((...args: any[]) => any) | Record<PropertyKey, unknown>>(
    (v) =>
      (isNonNullObject(v) || isFunction(v)) &&
      !(v instanceof Map) &&
      !(v instanceof Set) &&
      !(v instanceof WeakMap) &&
      !(v instanceof WeakSet),
  )
  .register(BupkisRegistry, { name: 'non-collection-object' })
  .describe('Non-collection object or function');

/**
 * A Zod schema that validates JavaScript property keys.
 *
 * This schema validates values that can be used as object property keys in
 * JavaScript, which includes strings, numbers, and symbols. These are the three
 * types that JavaScript automatically converts to property keys when used in
 * object access or assignment operations.
 *
 * @privateRemarks
 * The schema is registered in the `BupkisRegistry` with the name
 * `PropertyKeySchema` for later reference and type checking purposes.
 * @example Direct Usage
 *
 * ```typescript
 * PropertyKeySchema.parse('stringKey'); // ✓ Valid
 * PropertyKeySchema.parse(42); // ✓ Valid
 * PropertyKeySchema.parse(Symbol('symbolKey')); // ✓ Valid
 * PropertyKeySchema.parse({}); // ✗ Throws validation error
 * PropertyKeySchema.parse(null); // ✗ Throws validation error
 * ```
 *
 * @example Assertion Creation
 *
 * ```ts
 * import { createAssertion, use } from 'bupkis';
 * import { PropertyKeySchema } from 'bupkis/schema';
 * const unknownRecordAssertion = createAssertion(
 *   ['to be a record of anything'],
 *   z.record(PropertyKeySchema, z.unknown()),
 * );
 *
 * const { expect } = use([unknownRecordAssertion]);
 * expect(
 *   { 42: pants, shirts: 'foo', [Symbol('baz')]: null },
 *   'to be a record of anything',
 * );
 * ```
 *
 * @group Schema
 */
export const PropertyKeySchema = z
  .union([z.string(), z.number(), z.symbol()])
  .describe('Any valid object property name')
  .register(BupkisRegistry, { name: 'property-key' });

/**
 * A Zod schema that validates a keypath, which is a string featuring dot
 * notation or bracket notation, used to access nested object properties.
 *
 * Bare numbers must be wrapped in a string.
 *
 * @example Direct Usage
 *
 * ```typescript
 * KeypathSchema.parse('foo.bar'); // ✓ Valid
 * KeypathSchema.parse('arr[0].item'); // ✓ Valid
 * KeypathSchema.parse('obj["key"].prop'); // ✓ Valid
 * KeypathSchema.parse("obj['key'].prop"); // ✓ Valid
 * KeypathSchema.parse('simpleKey'); // ✓ Valid
 * KeypathSchema.parse('42'); // ✓ Valid
 * KeypathSchema.parse('invalid keypath!'); // ✗ Throws validation error
 * KeypathSchema.parse('foo..bar'); // ✗ Throws validation error
 * KeypathSchema.parse('foo[bar]'); // ✗ Throws validation error
 * KeypathSchema.parse(42); // ✗ Throws validation error
 * ```
 *
 * @example Assertion Creation
 *
 * ```ts
 * import { createAssertion, use } from 'bupkis';
 * import { KeypathSchema } from 'bupkis/schema';
 *
 * const hasKeypathAssertion = createAssertion(
 *   [KeypathSchema, 'to be a keypath'],
 *   KeypathSchema,
 * );
 *
 * const { expect } = use([hasKeypathAssertion]);
 * expect('foo.bar[0]["baz"]', 'to be a keypath');
 * ```
 *
 * @group Schema
 */
export const KeypathSchema: z.ZodType<Keypath> = z
  .string()
  .regex(KEYPATH_REGEX)
  .describe('A keypath supporting dot and bracket notation')
  .register(BupkisRegistry, { name: 'keypath' });

/**
 * A Zod schema that validates "thenable" objects with a `.then()` method.
 *
 * This schema validates objects that implement the PromiseLike interface by
 * having a `.then()` method, which includes Promises and other thenable
 * objects.
 *
 * Unlike Zod's built-in `z.promise()`, this schema does not unwrap the resolved
 * value, meaning the result of parsing remains a Promise or thenable object.
 *
 * @privateRemarks
 * The schema is registered in the `BupkisRegistry` with the name
 * `WrappedPromiseLikeSchema` for later reference and type checking purposes.
 * This is useful when you need to validate that something is thenable without
 * automatically resolving it.
 * @example Direct Usage
 *
 * ```typescript
 * WrappedPromiseLikeSchema.parse(Promise.resolve(42)); // ✓ Valid (returns Promise)
 * WrappedPromiseLikeSchema.parse({ then: () => {} }); // ✓ Valid (thenable)
 * WrappedPromiseLikeSchema.parse(42); // ✗ Throws validation error
 * WrappedPromiseLikeSchema.parse({}); // ✗ Throws validation error
 * ```
 *
 * @example Assertion Creation
 *
 * ```ts
 * import { createAssertion, use } from 'bupkis';
 * import { WrappedPromiseLikeSchema } from 'bupkis/schema';
 *
 * const thenableAssertion = createAssertion(
 *   [WrappedPromiseLikeSchema, 'to be a thenable'],
 *   WrappedPromiseLikeSchema,
 * );
 *
 * const { expect } = use([thenableAssertion]);
 * // does nothing with 'pants'; await it elsewhere
 * expect({ then: () => Promise.resolve('pants') }, 'to be a thenable');
 * ```
 *
 * @group Schema
 */
export const WrappedPromiseLikeSchema = z
  .custom<PromiseLike<unknown>>((value) => isPromiseLike(value))
  .describe(
    'PromiseLike; unlike z.promise(), does not unwrap the resolved value',
  )
  .register(BupkisRegistry, { name: 'promiselike' });

/**
 * A Zod schema that validates plain objects with null prototypes.
 *
 * > Aliases: {@link NullProtoObjectSchema}, {@link DictionarySchema}
 *
 * This schema validates objects that have been created with
 * `Object.create(null)` or otherwise have their prototype set to `null`. Such
 * objects are "plain" objects without any inherited properties or methods from
 * `Object.prototype`, making them useful as pure data containers or
 * dictionaries.
 *
 * @privateRemarks
 * The schema is registered in the `BupkisRegistry` with the name
 * `ObjectWithNullPrototype` for later reference and type checking purposes.
 *
 * Changing this to be a `ZodRecord` would be nice, but that would end up
 * blasting away the original object's prototype.
 * @example Direct Usage
 *
 * ```typescript
 * const nullProtoObj = Object.create(null);
 * nullProtoObj.key = 'value';
 * NullProtoObjectSchema.parse(nullProtoObj); // ✓ Valid
 *
 * const regularObj = { key: 'value' };
 * NullProtoObjectSchema.parse(regularObj); // ✗ Throws validation error
 *
 * const emptyObj = {};
 * NullProtoObjectSchema.parse(emptyObj); // ✗ Throws validation error
 * ```
 *
 * @example Assertion Creation
 *
 * ```ts
 * import { createAssertion, use } from 'bupkis';
 * import { DictionarySchema } from 'bupkis/schema';
 *
 * const dictAssertion = createAssertion(
 *   [DictionarySchema, 'to be a dictionary of numbers'],
 *   DictionarySchema.pipe(z.record(z.number())),
 * );
 *
 * const { expect } = use([dictAssertion]);
 *
 * expect(Object.create(null, { pants: { value: 42, enumerable: true } }),
 * ```
 *
 * @group Schema
 */
export const DictionarySchema = z
  .custom<Record<PropertyKey, unknown>>(
    (value) => isNonNullObject(value) && getPrototypeOf(value) === null,
  )
  .describe('Object with null prototype')
  .register(BupkisRegistry, { name: 'dictionary' });

/**
 * {@inheritDoc DictionarySchema}
 *
 * @group Schema
 */
export const NullProtoObjectSchema = DictionarySchema;

/**
 * A Zod schema that validates functions declared with the `async` keyword.
 *
 * This schema validates functions that are explicitly declared as asynchronous
 * using the `async` keyword. It uses runtime introspection to check the
 * function's internal `[[ToString]]` representation to distinguish async
 * functions from regular functions that might return Promises.
 *
 * @remarks
 * **This schema _cannot_ match a function that returns a {@link Promise} but was
 * not declared via `async`.** Determining if a function returns a `Promise` is
 * only possible by execution of said function (which <span
 * class="bupkis">BUPKIS</span> avoids, naturally). This is a limitation of
 * JavaScript itself.
 * @example Direct Usage
 *
 * ```typescript
 * async function asyncFn() {
 *   return 42;
 * }
 * AsyncFunctionSchema.parse(asyncFn); // ✓ Valid
 *
 * const asyncArrow = async () => 42;
 * AsyncFunctionSchema.parse(asyncArrow); // ✓ Valid
 *
 * function syncFn() {
 *   return Promise.resolve(42);
 * }
 * AsyncFunctionSchema.parse(syncFn); // ✗ Throws validation error
 *
 * const regularFn = () => 42;
 * AsyncFunctionSchema.parse(regularFn); // ✗ Throws validation error
 * ```
 *
 * @example Assertion Creation
 *
 * ```ts
 * import { createAssertion, use } from 'bupkis';
 * import { AsyncFunctionSchema } from 'bupkis/schema';
 *
 * const asyncFnAssertion = createAssertion(
 *   [AsyncFunctionSchema, 'to be an async function'],
 *   AsyncFunctionSchema,
 * );
 *
 * const { expect } = use([asyncFnAssertion]);
 * expect(async () => {}, 'to be an async function');
 * ```
 *
 * @group Schema
 */
export const AsyncFunctionSchema = FunctionSchema.refine(
  (value) => objectPrototype.toString.call(value) === '[object AsyncFunction]',
)
  .describe('Function declared with the `async` keyword')
  .register(BupkisRegistry, { name: 'async-function' });

/**
 * A Zod schema that validates truthy JavaScript values.
 *
 * This schema accepts any input value but only validates successfully if the
 * value is truthy according to JavaScript's truthiness rules. A value is truthy
 * if it converts to `true` when evaluated in a boolean context - essentially
 * any value that is not one of the eight falsy values.
 *
 * @privateRemarks
 * The schema is registered in the `BupkisRegistry` with the name `Truthy` and
 * indicates that it accepts anything as valid input for evaluation.
 * @example Direct Usage
 *
 * ```typescript
 * TruthySchema.parse(true); // ✓ Valid
 * TruthySchema.parse(1); // ✓ Valid
 * TruthySchema.parse('hello'); // ✓ Valid
 * TruthySchema.parse([]); // ✓ Valid (arrays are truthy)
 * TruthySchema.parse({}); // ✓ Valid (objects are truthy)
 * TruthySchema.parse(false); // ✗ Throws validation error
 * TruthySchema.parse(0); // ✗ Throws validation error
 * TruthySchema.parse(''); // ✗ Throws validation error
 * TruthySchema.parse(null); // ✗ Throws validation error
 * ```
 *
 * @example Assertion Creation
 *
 * ```ts
 * import { createAssertion, use } from 'bupkis';
 * import { TruthySchema } from 'bupkis/schema';
 *
 * const somethingAssertion = createAssertion(
 *   ['to be something'],
 *   TruthySchema,
 * );
 *
 * const { expect } = use([somethingAssertion]);
 *
 * expect('pants', 'to be something');
 * ```
 *
 * @group Schema
 * @see {@link FalsySchema}
 */
export const TruthySchema = z
  .any()
  .nonoptional()
  .refine((value) => !!value)
  .describe('Truthy value')
  .register(BupkisRegistry, {
    name: 'truthy',
  });

/**
 * A Zod schema that validates falsy JavaScript values.
 *
 * This schema accepts any input value but only validates successfully if the
 * value is falsy according to JavaScript's truthiness rules. The falsy values
 * in JavaScript are: `false`, `0`, `-0`, `0n`, `""` (empty string), `null`,
 * `undefined`, and `NaN`.
 *
 * @privateRemarks
 * The schema is registered in the `BupkisRegistry` with the name `Falsy` and
 * indicates that it accepts anything as valid input for evaluation.
 * @example Direct Usage
 *
 * ```typescript
 * FalsySchema.parse(false); // ✓ Valid
 * FalsySchema.parse(0); // ✓ Valid
 * FalsySchema.parse(-0); // ✓ Valid
 * FalsySchema.parse(0n); // ✓ Valid (BigInt zero)
 * FalsySchema.parse(''); // ✓ Valid (empty string)
 * FalsySchema.parse(null); // ✓ Valid
 * FalsySchema.parse(undefined); // ✓ Valid
 * FalsySchema.parse(NaN); // ✓ Valid
 * FalsySchema.parse(true); // ✗ Throws validation error
 * FalsySchema.parse(1); // ✗ Throws validation error
 * FalsySchema.parse('hello'); // ✗ Throws validation error
 * FalsySchema.parse({}); // ✗ Throws validation error
 * ```
 *
 * @example Assertion Creation
 *
 * ```ts
 * import { createAssertion, use } from 'bupkis';
 * import { FalsySchema } from 'bupkis/schema';
 *
 * const falsyAssertion = createAssertion(['to be nothing'], FalsySchema);
 *
 * const { expect } = use([falsyAssertion]);
 *
 * expect('', 'to be nothing');
 * ```
 *
 * @group Schema
 * @see {@link TruthySchema}
 */
export const FalsySchema = z
  .any()
  .nullable()
  .refine((value) => !value)
  .describe('Falsy value')
  .register(BupkisRegistry, { name: 'falsy' });

/**
 * A Zod schema that validates primitive JavaScript values.
 *
 * This schema validates any of the seven primitive data types in JavaScript:
 * string, number, boolean, bigint, symbol, null, and undefined. Primitive
 * values are immutable and are passed by value rather than by reference,
 * distinguishing them from objects and functions which are non-primitive
 * reference types.
 *
 * @privateRemarks
 * The schema is registered in the `BupkisRegistry` with the name `Primitive`
 * and indicates that it accepts primitive values as valid input.
 * @example Direct Usage
 *
 * ```typescript
 * PrimitiveSchema.parse('hello'); // ✓ Valid (string)
 * PrimitiveSchema.parse(42); // ✓ Valid (number)
 * PrimitiveSchema.parse(true); // ✓ Valid (boolean)
 * PrimitiveSchema.parse(BigInt(123)); // ✓ Valid (bigint)
 * PrimitiveSchema.parse(Symbol('test')); // ✓ Valid (symbol)
 * PrimitiveSchema.parse(null); // ✓ Valid (null)
 * PrimitiveSchema.parse(undefined); // ✓ Valid (undefined)
 * PrimitiveSchema.parse({}); // ✗ Throws validation error (object)
 * PrimitiveSchema.parse([]); // ✗ Throws validation error (array)
 * PrimitiveSchema.parse(() => {}); // ✗ Throws validation error (function)
 * ```
 *
 * @example Assertion Creation
 *
 * ```ts
 * import { createAssertion, use } from 'bupkis';
 * import { PrimitiveSchema } from 'bupkis/schema';
 *
 * const primitiveAssertion = createAssertion(
 *   ['to be a primitive, Date, or RegExp'],
 *   PrimitiveSchema.or(z.instanceof(Date)).or(z.instanceof(RegExp)),
 * );
 *
 * const { expect } = use([primitiveAssertion]);
 *
 * expect('pants', 'to be a primitive, Date, or RegExp');
 * ```
 *
 * @group Schema
 */
export const PrimitiveSchema = z
  .union([
    z.string(),
    z.number(),
    z.boolean(),
    z.bigint(),
    z.symbol(),
    z.null(),
    z.undefined(),
  ])
  .describe('Primitive value')
  .register(BupkisRegistry, { name: 'primitive' });

/**
 * A Zod schema that validates array-like structures including mutable and
 * readonly variants.
 *
 * This schema validates values that behave like arrays, including standard
 * arrays, tuples with rest elements, and their readonly counterparts. It
 * accepts any array-like structure that can hold elements of any type, making
 * it useful for validating collections where the specific array mutability or
 * tuple structure is not critical.
 *
 * @privateRemarks
 * The schema is registered in the {@link BupkisRegistry} with the name
 * `ArrayLike` for later reference and type checking purposes. This schema is
 * particularly useful when you need to accept various forms of array-like data
 * without being restrictive about mutability or exact tuple structure.
 * @example Direct Usage
 *
 * ```typescript
 * ArrayLikeSchema.parse([1, 2, 3]); // ✓ Valid (mutable array)
 * ArrayLikeSchema.parse(['a', 'b'] as const); // ✓ Valid (readonly array)
 * ArrayLikeSchema.parse([]); // ✓ Valid (empty array)
 * ArrayLikeSchema.parse([42, 'mixed', true]); // ✓ Valid (mixed types)
 * ArrayLikeSchema.parse('not an array'); // ✗ Throws validation error
 * ArrayLikeSchema.parse({}); // ✗ Throws validation error
 * ArrayLikeSchema.parse(null); // ✗ Throws validation error
 * ```
 *
 * @example Assertion Creation
 *
 * ```ts
 * import { createAssertion, use } from 'bupkis';
 * import { ArrayLikeSchema } from 'bupkis/schema';
 *
 * const argsAssertion = createAssertion(
 *   [ArrayLikeSchema, 'to be a non-array arraylike object'],
 *   ArrayLikeSchema.refine((subject) => !Array.isArray(subject)),
 * );
 *
 * const { expect } = use([argsAssertion]);
 * expect(
 *   (function () {
 *     return arguments;
 *   })(),
 *   'to be a non-array arraylike object',
 * );
 * ```
 *
 * @group Schema
 */
export const ArrayLikeSchema = z
  .union([
    z.array(z.unknown()),
    z.tuple([z.unknown()], z.unknown()),
    z.looseObject({ length: z.number().nonnegative().int() }),
  ])
  .describe('Array-like value')
  .register(BupkisRegistry, {
    name: 'arraylike',
  });

/**
 * A Zod schema that validates RegExp instances.
 *
 * This schema validates values that are instances of the RegExp class,
 * including regular expressions created with both literal syntax
 * (`/pattern/flags`) and the RegExp constructor (`new RegExp(pattern, flags)`).
 * It ensures the validated value is a proper regular expression object with all
 * associated methods and properties.
 *
 * @privateRemarks
 * The schema is registered in the `BupkisRegistry` with the name `RegExp` for
 * later reference and type checking purposes.
 * @example Direct Usage
 *
 * ```typescript
 * RegExpSchema.parse(/abc/gi); // ✓ Valid (literal syntax)
 * RegExpSchema.parse(new RegExp('abc', 'gi')); // ✓ Valid (constructor)
 * RegExpSchema.parse(/test/); // ✓ Valid (no flags)
 * RegExpSchema.parse(new RegExp('')); // ✓ Valid (empty pattern)
 * RegExpSchema.parse('abc'); // ✗ Throws validation error (string)
 * RegExpSchema.parse(/abc/.source); // ✗ Throws validation error (string pattern)
 * RegExpSchema.parse({}); // ✗ Throws validation error (object)
 * ```
 *
 * @example Assertion Creation
 *
 * ```ts
 * import { createAssertion, use } from 'bupkis';
 * import { RegExpSchema } from 'bupkis/schema';
 *
 * const globalRegexAssertion = createAssertion(
 *   [RegExpSchema, 'to be a RegExp with the global flag'],
 *   RegExpSchema.refine((subject) => subject.flags.includes('g')),
 * );
 *
 * const { expect } = use([globalRegexAssertion]);
 *
 * expect(/pants/g, 'to be a RegExp with the global flag');
 * ```
 *
 * @group Schema
 */
export const RegExpSchema = z
  .instanceof(RegExp)
  .describe('A RegExp instance')
  .register(BupkisRegistry, { name: 'regexp' });

/**
 * A Zod schema that validates non-negative integer values.
 *
 * This schema validates numbers that are both integers (whole numbers without
 * decimal parts) and non-negative (greater than or equal to zero). It combines
 * Zod's integer validation with non-negative validation to ensure the value is
 * a valid count, index, or other non-negative discrete quantity.
 *
 * @privateRemarks
 * The schema is registered in the {@link BupkisRegistry} with the name
 * `nonnegative-integer` for later reference and type checking purposes.
 * @example Direct Usage
 *
 * ```typescript
 * NonNegativeIntegerSchema.parse(0); // ✓ Valid (zero)
 * NonNegativeIntegerSchema.parse(42); // ✓ Valid (positive integer)
 * NonNegativeIntegerSchema.parse(1000); // ✓ Valid (large positive integer)
 * NonNegativeIntegerSchema.parse(-1); // ✗ Throws validation error (negative)
 * NonNegativeIntegerSchema.parse(3.14); // ✗ Throws validation error (not integer)
 * NonNegativeIntegerSchema.parse(-3.14); // ✗ Throws validation error (negative and not integer)
 * NonNegativeIntegerSchema.parse('42'); // ✗ Throws validation error (string)
 * ```
 *
 * @example Assertion Creation
 *
 * ```ts
 * import { createAssertion, use } from 'bupkis';
 * import { NonNegativeIntegerSchema } from 'bupkis/schema';
 *
 * const arrayIndexAssertion = createAssertion(
 *   [NonNegativeIntegerSchema, 'to be a valid array index'],
 *   NonNegativeIntegerSchema,
 * );
 *
 * const { expect } = use([arrayIndexAssertion]);
 * expect(0, 'to be a valid array index'); // Valid array index
 * expect(5, 'to be a valid array index'); // Valid array index
 * ```
 *
 * @group Schema
 */
export const NonNegativeIntegerSchema = z
  .int()
  .nonnegative()
  .describe('A non-negative integer')
  .register(BupkisRegistry, { name: 'nonnegative-integer' });

const MIN_TIMESTAMP = -8640000000000000;
const MAX_TIMESTAMP = 8640000000000000;

/**
 * A Zod schema that validates numeric timestamps.
 *
 * This schema validates JavaScript timestamp values (milliseconds since Unix
 * epoch) within the valid range for JavaScript Date objects. It ensures the
 * timestamp is an integer between -8,640,000,000,000,000 and
 * 8,640,000,000,000,000 milliseconds, which corresponds to the range of dates
 * that can be represented by JavaScript's Date object (approximately April 20,
 * 271821 BCE to September 13, 275760 CE).
 *
 * @example
 *
 * ```typescript
 * TimestampFormatSchema.parse(Date.now()); // ✓ Valid current timestamp
 * TimestampFormatSchema.parse(0); // ✓ Valid Unix epoch
 * TimestampFormatSchema.parse(-62135596800000); // ✓ Valid timestamp (year 1 CE)
 * TimestampFormatSchema.parse(1.5); // ✗ Throws - not an integer
 * TimestampFormatSchema.parse(9e15); // ✗ Throws - exceeds maximum timestamp
 * TimestampFormatSchema.parse('1234567890000'); // ✗ Throws - string not number
 * ```
 *
 * @group Schema
 */
export const TimestampFormatSchema = z
  .number()
  .int()
  .min(MIN_TIMESTAMP)
  .max(MAX_TIMESTAMP);

/**
 * A Zod schema that validates ISO date strings.
 *
 * This schema validates ISO 8601 date and datetime strings in various formats.
 * It accepts both date-only formats (YYYY-MM-DD) and full datetime formats with
 * optional timezone information. The schema supports local datetime strings and
 * those with timezone offsets.
 *
 * @example
 *
 * ```typescript
 * ISODateFormatSchema.parse('2025-01-01'); // ✓ Valid ISO date
 * ISODateFormatSchema.parse('2025-01-01T10:30:00'); // ✓ Valid local datetime
 * ISODateFormatSchema.parse('2025-01-01T10:30:00Z'); // ✓ Valid UTC datetime
 * ISODateFormatSchema.parse('2025-01-01T10:30:00+05:30'); // ✓ Valid with offset
 * ISODateFormatSchema.parse('2025-01-01T10:30:00.123Z'); // ✓ Valid with milliseconds
 * ISODateFormatSchema.parse('01/01/2025'); // ✗ Throws - not ISO format
 * ISODateFormatSchema.parse('2025-13-01'); // ✗ Throws - invalid month
 * ISODateFormatSchema.parse('not-a-date'); // ✗ Throws - invalid format
 * ```
 *
 * @group Schema
 */
export const ISODateFormatSchema = z.union([
  z.iso.datetime({ local: true, offset: true }),
  z.iso.date(),
]);

/**
 * A Zod schema that validates date-like values.
 *
 * This schema accepts any value that can represent a date: native JavaScript
 * Date objects, ISO 8601 date strings, or numeric timestamps. It provides a
 * unified validation approach for date inputs across different assertion types.
 * The schema is registered in the BupkisRegistry for use in assertion
 * creation.
 *
 * @privateRemarks
 * This schema is registered with the name 'date-like' in the BupkisRegistry and
 * is commonly used in temporal assertions throughout the library.
 * @example
 *
 * ```typescript
 * DateLikeFormatSchema.parse(new Date()); // ✓ Valid Date object
 * DateLikeFormatSchema.parse('2025-01-01'); // ✓ Valid ISO date string
 * DateLikeFormatSchema.parse('2025-01-01T10:30:00Z'); // ✓ Valid ISO datetime
 * DateLikeFormatSchema.parse(Date.now()); // ✓ Valid timestamp
 * DateLikeFormatSchema.parse(0); // ✓ Valid Unix epoch
 * DateLikeFormatSchema.parse('invalid-date'); // ✗ Throws - invalid format
 * DateLikeFormatSchema.parse({}); // ✗ Throws - not date-like
 * DateLikeFormatSchema.parse(null); // ✗ Throws - null not accepted
 * ```
 *
 * @group Schema
 */
export const DateLikeFormatSchema = z
  .union([z.date(), ISODateFormatSchema, TimestampFormatSchema])
  .register(BupkisRegistry, { name: 'date-like' })
  .describe('Date, ISO string, or timestamp');

const DURATION_REGEX =
  /^(\d+)\s*(milliseconds?|ms|seconds?|s|minutes?|m|hours?|h|days?|d|weeks?|w|months?|months?|years?|y)$/i;

/**
 * A Zod schema that validates duration string formats.
 *
 * This schema validates human-readable duration strings using a flexible format
 * that supports various time units with both full names and abbreviations. The
 * format is "{amount} {unit}" where amount is a positive integer and unit can
 * be any supported time unit. Extra whitespace is automatically trimmed.
 *
 * Supported units (case-insensitive):
 *
 * - Milliseconds: `millisecond`, `milliseconds`, `ms`
 * - Seconds: `second`, `seconds`, `s`
 * - Minutes: `minute`, `minutes`, `m`
 * - Hours: `hour`, `hours`, `h`
 * - Days: `day`, `days`, `d`
 * - Weeks: `week`, `weeks`, `w`
 * - Months: `month`, `months` (approximate: 30 days)
 * - Years: `year`, `years`, `y` (approximate: 365 days)
 *
 * @privateRemarks
 * This schema only validates the format; it does not perform any
 * transformations. For converting to milliseconds, use {@link DurationSchema}
 * instead. The schema is registered with the name 'duration' in the
 * BupkisRegistry.
 * @example
 *
 * ```typescript
 * DurationFormatSchema.parse('1 hour'); // ✓ Valid
 * DurationFormatSchema.parse('30 minutes'); // ✓ Valid
 * DurationFormatSchema.parse('2 days'); // ✓ Valid
 * DurationFormatSchema.parse('  5 seconds  '); // ✓ Valid (whitespace trimmed)
 * DurationFormatSchema.parse('1h'); // ✓ Valid abbreviation
 * DurationFormatSchema.parse('10 ms'); // ✓ Valid milliseconds
 * DurationFormatSchema.parse('-5 minutes'); // ✗ Throws - negative not allowed
 * DurationFormatSchema.parse('1.5 hours'); // ✗ Throws - decimal not allowed
 * DurationFormatSchema.parse('5'); // ✗ Throws - missing unit
 * DurationFormatSchema.parse('five minutes'); // ✗ Throws - non-numeric amount
 * ```
 *
 * @group Schema
 */
export const DurationFormatSchema = z
  .stringFormat('duration', (val: string) => DURATION_REGEX.test(val.trim()))
  .register(BupkisRegistry, { name: 'duration' })
  .describe('Duration string format like "1 hour", "30 minutes", "2 days"');

/**
 * A Zod schema that validates and transforms duration strings to milliseconds.
 *
 * This schema extends {@link DurationFormatSchema} by adding a transformation
 * step that converts valid duration strings into their equivalent values in
 * milliseconds. It supports the same flexible duration format but returns a
 * numeric value representing the total duration in milliseconds.
 *
 * The transformation handles all supported time units with accurate
 * conversions, except for months and years which use approximate values (30
 * days per month, 365 days per year) due to the variability of these units.
 *
 * Conversion rates:
 *
 * - 1 millisecond = 1 ms
 * - 1 second = 1,000 ms
 * - 1 minute = 60,000 ms
 * - 1 hour = 3,600,000 ms
 * - 1 day = 86,400,000 ms
 * - 1 week = 604,800,000 ms
 * - 1 month ≈ 2,592,000,000 ms (30 days)
 * - 1 year ≈ 31,536,000,000 ms (365 days)
 *
 * @privateRemarks
 * The transformation function includes comprehensive error handling, though
 * errors should never occur in practice due to the format validation step. The
 * schema is registered with the name 'duration' in the BupkisRegistry.
 * @example
 *
 * ```typescript
 * DurationSchema.parse('1 hour'); // → 3600000
 * DurationSchema.parse('30 minutes'); // → 1800000
 * DurationSchema.parse('2 days'); // → 172800000
 * DurationSchema.parse('500 ms'); // → 500
 * DurationSchema.parse('1 week'); // → 604800000
 * DurationSchema.parse('1 year'); // → 31536000000 (approximate)
 * DurationSchema.parse('invalid'); // ✗ Throws - invalid format
 * ```
 *
 * @group Schema
 */
export const DurationSchema = DurationFormatSchema.transform(
  (duration: string): number => {
    const match = duration.trim().match(DURATION_REGEX);

    if (!match) {
      throw new Error('Invalid duration format'); // Should never happen due to format validation
    }

    const [, amountStr, unit] = match;
    const amount = parseInt(amountStr!, 10);

    switch (unit!.toLowerCase()) {
      case 'd':
      case 'day':
      case 'days':
        return amount * 24 * 60 * 60 * 1000;
      case 'h':
      case 'hour':
      case 'hours':
        return amount * 60 * 60 * 1000;
      case 'm':
      case 'minute':
      case 'minutes':
        return amount * 60 * 1000;
      case 'millisecond':
      case 'milliseconds':
      case 'ms':
        return amount;
      case 'month':
      case 'months':
        return amount * 30 * 24 * 60 * 60 * 1000; // Approximate
      case 's':
      case 'second':
      case 'seconds':
        return amount * 1000;
      case 'w':
      case 'week':
      case 'weeks':
        return amount * 7 * 24 * 60 * 60 * 1000;
      case 'y':
      case 'year':
      case 'years':
        return amount * 365 * 24 * 60 * 60 * 1000; // Approximate
      default:
        throw new Error(`Unrecognized duration unit: ${unit}`); // Should never happen
    }
  },
)
  .register(BupkisRegistry, { name: 'duration' })
  .describe(
    'Duration string like "1 hour", "30 minutes", "2 days" (transforms to milliseconds)',
  );

/**
 * Schema that matches any `Set` instance, including those with any element
 * types.
 *
 * This schema is designed for runtime type checking and assertion matching
 * rather than parsing or validation of Set contents. It uses `instanceof`
 * checking to verify that a value is a Set, regardless of what elements it
 * contains.
 *
 * **Usage in Assertions:**
 *
 * - Collection size validation: `expect(mySet, 'to have size', 3)`
 * - Set operations: `expect(setA, 'to be a subset of', setB)`
 * - Emptiness checks: `expect(mySet, 'to be empty')`
 * - Element containment: `expect(mySet, 'to contain', value)`
 *
 * **Why `instanceof` Instead of Zod's `z.set()`:**
 *
 * - `z.set()` requires knowing the element schema at compile time
 * - This schema works with Sets containing any element types
 * - Focuses on the Set structure rather than element validation
 * - Better performance for assertion matching scenarios
 *
 * @example
 *
 * ```ts
 * // Matches any Set regardless of element types
 * SetSchema.parse(new Set([1, 2, 3])); // ✓ passes
 * SetSchema.parse(new Set(['a', 'b'])); // ✓ passes
 * SetSchema.parse(new Set()); // ✓ passes (empty Set)
 * SetSchema.parse([]); // ✗ fails (not a Set)
 * SetSchema.parse(new WeakSet()); // ✗ fails (use AnySetSchema)
 * ```
 *
 * @group Schema
 */
export const SetSchema = z
  .instanceof(Set)
  .register(BupkisRegistry, { name: 'set' })
  .describe('A Set instance');

/**
 * Schema that matches either `Set` or `WeakSet` instances.
 *
 * This unified schema handles both strong and weak Set types, making it useful
 * for assertions that should work with either variant. The distinction between
 * Set and WeakSet is important for garbage collection behavior but often
 * irrelevant for structural assertions.
 *
 * **Key Differences Between Set and WeakSet:**
 *
 * - **Set**: Holds strong references, prevents GC, iterable, any value types
 * - **WeakSet**: Holds weak references, allows GC, not iterable, object keys only
 *
 * **Usage Scenarios:**
 *
 * - Generic containment checks that work with both types
 * - Polymorphic collection handling in assertion libraries
 * - APIs that accept either Set variant for flexibility
 *
 * **WeakSet Limitations:**
 *
 * - Only accepts object or symbol values (primitives will cause runtime errors)
 * - Cannot be iterated or have size checked
 * - Some Set-specific assertions may not work with WeakSet
 *
 * @example
 *
 * ```ts
 * // Accepts both Set and WeakSet
 * AnySetSchema.parse(new Set([1, 2, 3])); // ✓ passes
 * AnySetSchema.parse(new WeakSet([obj1, obj2])); // ✓ passes
 * AnySetSchema.parse(new Map()); // ✗ fails (wrong collection type)
 *
 * // Usage in assertions
 * expect(myWeakSet, 'to contain', someObject); // Works with WeakSet
 * expect(mySet, 'to contain', 'string'); // Works with Set
 * ```
 *
 * @group Schema
 */
export const AnySetSchema = SetSchema.or(z.instanceof(WeakSet))
  .register(BupkisRegistry, { name: 'set-or-weakset' })
  .describe('A Set or WeakSet instance');

/**
 * Schema that matches any `Map` instance, including those with any key-value
 * types.
 *
 * This schema provides runtime type checking for Map instances without
 * requiring compile-time knowledge of key or value schemas. It uses
 * `instanceof` checking to verify Map structure while being agnostic about the
 * contained data types.
 *
 * **Usage in Assertions:**
 *
 * - Size validation: `expect(myMap, 'to have size', 5)`
 * - Key presence: `expect(myMap, 'to have key', 'someKey')`
 * - Value containment: `expect(myMap, 'to have value', expectedValue)`
 * - Entry validation: `expect(myMap, 'to have entry', [key, value])`
 * - Map equality: `expect(mapA, 'to equal', mapB)`
 *
 * **Advantages Over `z.map()`:**
 *
 * - Works with Maps having heterogeneous key/value types
 * - No need to specify key and value schemas upfront
 * - Optimized for structural validation rather than content parsing
 * - Better error messages for type mismatches in assertions
 *
 * @example
 *
 * ```ts
 * // Matches any Map regardless of key/value types
 * MapSchema.parse(new Map([['key', 'value']])); // ✓ passes
 * MapSchema.parse(
 *   new Map([
 *     [1, 'one'],
 *     [2, 'two'],
 *   ]),
 * ); // ✓ passes
 * MapSchema.parse(new Map()); // ✓ passes (empty Map)
 * MapSchema.parse({}); // ✗ fails (plain object)
 * MapSchema.parse(new WeakMap()); // ✗ fails (use AnyMapSchema)
 * ```
 *
 * @group Schema
 */
export const MapSchema = z
  .instanceof(Map)
  .register(BupkisRegistry, { name: 'map' })
  .describe('A Map instance');

/**
 * Schema that matches either `Map` or `WeakMap` instances.
 *
 * This union schema accommodates both strong and weak Map variants, enabling
 * assertions to work polymorphically across both collection types. The choice
 * between Map and WeakMap affects memory management and iteration capabilities
 * but often doesn't impact structural validation logic.
 *
 * **Key Differences Between Map and WeakMap:**
 *
 * - **Map**: Strong references, enumerable, iterable, any key types, has `.size`
 * - **WeakMap**: Weak references, not enumerable, not iterable, object keys only,
 *   no `.size`
 *
 * **Usage Considerations:**
 *
 * - Use for assertions that need to work with either Map type
 * - Particularly useful in library code that accepts either variant
 * - Some Map-specific operations (iteration, size) won't work with WeakMap
 * - WeakMap key restrictions (objects/symbols only) should be considered
 *
 * **Memory Management Implications:**
 *
 * - Map entries prevent garbage collection of keys
 * - WeakMap entries allow garbage collection when keys become unreachable
 * - This affects long-lived caches and memory-sensitive applications
 *
 * @example
 *
 * ```ts
 * // Accepts both Map and WeakMap
 * AnyMapSchema.parse(new Map([['key', 'value']])); // ✓ passes
 * AnyMapSchema.parse(new WeakMap([[obj, 'value']])); // ✓ passes
 * AnyMapSchema.parse(new Set()); // ✗ fails (wrong collection type)
 *
 * // Usage in assertions
 * expect(myWeakMap, 'to have key', someObject); // Works with WeakMap
 * expect(myMap, 'to have key', 'stringKey'); // Works with Map
 * expect(myWeakMap, 'to have size', 3); // ✗ Fails - WeakMap has no size
 * ```
 *
 * @group Schema
 */
export const AnyMapSchema = MapSchema.or(z.instanceof(WeakMap))
  .register(BupkisRegistry, { name: 'map-or-weakmap' })
  .describe('A Map or WeakMap instance');
