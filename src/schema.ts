/**
 * Zod schema definitions for common types and validation patterns.
 *
 * This module provides reusable Zod schemas for validating constructors,
 * functions, property keys, promises, and other common JavaScript types used
 * throughout the assertion system. These tend to work around Zod's
 * limitations.
 *
 * These are used internally, but consumers may also find them useful.
 *
 * @document schema.md
 * @packageDocumentation
 */

import { z } from 'zod/v4';

import {
  isA,
  isConstructable,
  isFunction,
  isNonNullObject,
  isPromiseLike,
} from './guards.js';
import { BupkisRegistry } from './metadata.js';
import { type Constructor } from './types.js';

/**
 * A Zod schema that validates JavaScript classes or constructor functions.
 *
 * This schema validates values that can be used as constructors, including ES6
 * classes, traditional constructor functions, and built-in constructors. It
 * uses the {@link isConstructable} guard function to determine if a value can be
 * invoked with the `new` operator to create object instances.
 *
 * @remarks
 * The schema is registered in the {@link BupkisRegistry} with the name
 * `ClassSchema` for later reference and type checking purposes.
 * @category Schema
 * @example
 *
 * ```typescript
 * class MyClass {}
 * function MyConstructor() {}
 *
 * ClassSchema.parse(MyClass); // ✓ Valid
 * ClassSchema.parse(MyConstructor); // ✓ Valid
 * ClassSchema.parse(Array); // ✓ Valid
 * ClassSchema.parse(Date); // ✓ Valid
 * ClassSchema.parse(() => {}); // ✗ Throws validation error
 * ClassSchema.parse({}); // ✗ Throws validation error
 * ```
 */

export const ClassSchema = z
  .custom<Constructor>(isConstructable)
  .register(BupkisRegistry, { name: 'ClassSchema' })
  .describe('Class / Constructor');

/**
 * A Zod schema that validates any JavaScript function.
 *
 * This schema provides function validation capabilities similar to the
 * parseable-only `z.function()` from Zod v3.x, but works with Zod v4's
 * architecture. It validates that the input value is any callable function,
 * including regular functions, arrow functions, async functions, generator
 * functions, and methods.
 *
 * @remarks
 * The schema is registered in the {@link BupkisRegistry} with the name
 * `FunctionSchema` for later reference and type checking purposes.
 * @category Schema
 * @example
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
 */
export const FunctionSchema = z
  .custom<(...args: any[]) => any>(isFunction)
  .register(BupkisRegistry, {
    name: 'FunctionSchema',
  })
  .describe(
    'Any function; similar to parseable-only `z.function()` in Zod v3.x',
  );

/**
 * A Zod schema that validates JavaScript property keys.
 *
 * This schema validates values that can be used as object property keys in
 * JavaScript, which includes strings, numbers, and symbols. These are the three
 * types that JavaScript automatically converts to property keys when used in
 * object access or assignment operations.
 *
 * @remarks
 * The schema is registered in the `BupkisRegistry` with the name
 * `PropertyKeySchema` for later reference and type checking purposes.
 * @category Schema
 * @example
 *
 * ```typescript
 * PropertyKeySchema.parse('stringKey'); // ✓ Valid
 * PropertyKeySchema.parse(42); // ✓ Valid
 * PropertyKeySchema.parse(Symbol('symbolKey')); // ✓ Valid
 * PropertyKeySchema.parse({}); // ✗ Throws validation error
 * PropertyKeySchema.parse(null); // ✗ Throws validation error
 * ```
 */
export const PropertyKeySchema = z
  .union([z.string(), z.number(), z.symbol()])
  .describe('PropertyKey')
  .register(BupkisRegistry, { name: 'PropertyKeySchema' });

/**
 * A Zod schema that validates "thenable" objects with a `.then()` method.
 *
 * This schema validates objects that implement the PromiseLike interface by
 * having a `.then()` method, which includes Promises and other thenable
 * objects. Unlike Zod's built-in `z.promise()`, this schema does not unwrap the
 * resolved value, meaning the result of parsing remains a Promise or thenable
 * object.
 *
 * @remarks
 * The schema is registered in the `BupkisRegistry` with the name
 * `WrappedPromiseLikeSchema` for later reference and type checking purposes.
 * This is useful when you need to validate that something is thenable without
 * automatically resolving it.
 * @category Schema
 * @example
 *
 * ```typescript
 * WrappedPromiseLikeSchema.parse(Promise.resolve(42)); // ✓ Valid (returns Promise)
 * WrappedPromiseLikeSchema.parse({ then: () => {} }); // ✓ Valid (thenable)
 * WrappedPromiseLikeSchema.parse(42); // ✗ Throws validation error
 * WrappedPromiseLikeSchema.parse({}); // ✗ Throws validation error
 * ```
 */
export const WrappedPromiseLikeSchema = z
  .custom<PromiseLike<unknown>>((value) => isPromiseLike(value))
  .describe(
    'PromiseLike; unlike z.promise(), does not unwrap the resolved value',
  )
  .register(BupkisRegistry, { name: 'WrappedPromiseLikeSchema' });

/**
 * A Zod schema that validates Map instances excluding WeakMap instances.
 *
 * This schema ensures that the validated value is a Map and specifically
 * excludes WeakMap instances through refinement validation. This is useful when
 * you need to ensure you're working with a regular Map that allows iteration
 * and enumeration of keys, unlike WeakMaps which are not enumerable.
 *
 * @remarks
 * The schema is registered in the `BupkisRegistry` with the name
 * `StrongMapSchema` for later reference and type checking purposes.
 * @category Schema
 * @example
 *
 * ```typescript
 * const validMap = new Map([
 *   ['key1', 'value1'],
 *   ['key2', 'value2'],
 * ]);
 * StrongMapSchema.parse(validMap); // ✓ Valid
 *
 * const weakMap = new WeakMap();
 * StrongMapSchema.parse(weakMap); // ✗ Throws validation error
 * ```
 */
export const StrongMapSchema = z
  .instanceof(Map)
  .refine((value) => !isA(value, WeakMap))
  .describe('A Map that is not a WeakMap')
  .register(BupkisRegistry, { name: 'StrongMapSchema' });

/**
 * A Zod schema that validates Set instances excluding WeakSet instances.
 *
 * This schema ensures that the validated value is a Set and specifically
 * excludes WeakSet instances through refinement validation. This is useful when
 * you need to ensure you're working with a regular Set that allows iteration
 * and enumeration of values, unlike WeakSets which are not enumerable.
 *
 * @remarks
 * The schema is registered in the `BupkisRegistry` with the name
 * `StrongSetSchema` for later reference and type checking purposes.
 * @category Schema
 * @example
 *
 * ```typescript
 * const validSet = new Set([1, 2, 3]);
 * StrongSetSchema.parse(validSet); // ✓ Valid
 *
 * const weakSet = new WeakSet();
 * StrongSetSchema.parse(weakSet); // ✗ Throws validation error
 * ```
 */
export const StrongSetSchema = z
  .instanceof(Set)
  .refine((value) => !isA(value, WeakSet))
  .describe('A Set that is not a WeakSet')
  .register(BupkisRegistry, { name: 'StrongSetSchema' });

/**
 * A Zod schema that validates plain objects with null prototypes.
 *
 * This schema validates objects that have been created with
 * `Object.create(null)` or otherwise have their prototype set to `null`. Such
 * objects are "plain" objects without any inherited properties or methods from
 * `Object.prototype`, making them useful as pure data containers or
 * dictionaries.
 *
 * @remarks
 * The schema is registered in the `BupkisRegistry` with the name
 * `ObjectWithNullPrototype` for later reference and type checking purposes.
 * @category Schema
 * @example
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
 */
export const NullProtoObjectSchema = z
  .custom<Record<PropertyKey, unknown>>(
    (value) => isNonNullObject(value) && Object.getPrototypeOf(value) === null,
  )
  .describe('Object with null prototype')
  .register(BupkisRegistry, { name: 'ObjectWithNullPrototype' });

/**
 * A Zod schema that validates functions declared with the `async` keyword.
 *
 * This schema validates functions that are explicitly declared as asynchronous
 * using the `async` keyword. It uses runtime introspection to check the
 * function's internal `[[ToString]]` representation to distinguish async
 * functions from regular functions that might return Promises.
 *
 * @remarks
 * The schema is registered in the `BupkisRegistry` with the name
 * `AsyncFunctionSchema` for later reference and type checking purposes. This
 * schema cannot reliably detect functions that return Promises but are not
 * declared with `async`, as this determination requires static analysis that is
 * not available at runtime.
 * @category Schema
 * @example
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
 */
export const AsyncFunctionSchema = FunctionSchema.refine(
  (value) => Object.prototype.toString.call(value) === '[object AsyncFunction]',
)
  .describe('Function declared with the `async` keyword')
  .register(BupkisRegistry, { name: 'AsyncFunctionSchema' });

/**
 * A Zod schema that validates truthy JavaScript values.
 *
 * This schema accepts any input value but only validates successfully if the
 * value is truthy according to JavaScript's truthiness rules. A value is truthy
 * if it converts to `true` when evaluated in a boolean context - essentially
 * any value that is not one of the eight falsy values.
 *
 * @remarks
 * The schema is registered in the `BupkisRegistry` with the name `Truthy` and
 * indicates that it accepts anything as valid input for evaluation.
 * @category Schema
 * @example
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
 */
export const TruthySchema = z
  .any()
  .nonoptional()
  .refine((value) => !!value)
  .describe('Truthy value')
  .register(BupkisRegistry, {
    name: 'Truthy',
  });

/**
 * A Zod schema that validates falsy JavaScript values.
 *
 * This schema accepts any input value but only validates successfully if the
 * value is falsy according to JavaScript's truthiness rules. The falsy values
 * in JavaScript are: `false`, `0`, `-0`, `0n`, `""` (empty string), `null`,
 * `undefined`, and `NaN`.
 *
 * @remarks
 * The schema is registered in the `BupkisRegistry` with the name `Falsy` and
 * indicates that it accepts anything as valid input for evaluation.
 * @category Schema
 * @example
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
 */
export const FalsySchema = z
  .any()
  .nullable()
  .refine((value) => !value)
  .describe('Falsy value')
  .register(BupkisRegistry, { name: 'Falsy' });

/**
 * A Zod schema that validates primitive JavaScript values.
 *
 * This schema validates any of the seven primitive data types in JavaScript:
 * string, number, boolean, bigint, symbol, null, and undefined. Primitive
 * values are immutable and are passed by value rather than by reference,
 * distinguishing them from objects and functions which are non-primitive
 * reference types.
 *
 * @remarks
 * The schema is registered in the `BupkisRegistry` with the name `Primitive`
 * and indicates that it accepts primitive values as valid input.
 * @category Schema
 * @example
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
  .register(BupkisRegistry, { name: 'Primitive' });

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
 * @remarks
 * The schema is registered in the {@link BupkisRegistry} with the name
 * `ArrayLike` for later reference and type checking purposes. This schema is
 * particularly useful when you need to accept various forms of array-like data
 * without being restrictive about mutability or exact tuple structure.
 * @category Schema
 * @example
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
 */
export const ArrayLikeSchema = z
  .union([
    z.array(z.any()),
    z.tuple([z.any()], z.any()),
    z.looseObject({ length: z.number().nonnegative().int() }),
  ])
  .describe('Array-like value')
  .register(BupkisRegistry, {
    name: 'ArrayLike',
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
 * @remarks
 * The schema is registered in the `BupkisRegistry` with the name `RegExp` for
 * later reference and type checking purposes.
 * @category Schema
 * @example
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
 */
export const RegExpSchema = z
  .instanceof(RegExp)
  .describe('A RegExp instance')
  .register(BupkisRegistry, { name: 'RegExp' });
