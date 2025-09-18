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
    (value) => isNonNullObject(value) && Object.getPrototypeOf(value) === null,
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
  (value) => Object.prototype.toString.call(value) === '[object AsyncFunction]',
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
