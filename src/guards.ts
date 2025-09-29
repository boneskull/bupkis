/**
 * Type guard functions and runtime type checking utilities.
 *
 * This module provides various type guard functions for runtime type checking,
 * including guards for Zod schemas, constructors, {@link PromiseLike} objects,
 * and assertion parts. These are used throughout the library for safe type
 * narrowing and validation.
 *
 * @category API
 * @example
 *
 * ```ts
 * import * as guards from 'bupkis/guards';
 * ```
 *
 * @packageDocumentation
 */

import { type z } from 'zod/v4';

import type {
  AssertionPart,
  PhraseLiteralChoice,
} from './assertion/assertion-types.js';
import type {
  AssertionParts,
  Constructor,
  ExpectItExecutor,
  PhraseLiteral,
  ZodTypeMap,
} from './types.js';

import { kExpectIt } from './constant.js';

const { isArray } = Array;

/**
 * Returns `true` if the given value looks like a Zod v4 schema, determined by
 * the presence of an internal {@link z.core.$ZodTypeDef} field.
 *
 * Note: This relies on Zod's internal shape and is intended for runtime
 * discrimination within this library.
 *
 * @template T - The specific ZodType to check for (based on def.type)
 * @param value - Value to test
 * @returns Whether the value is `ZodType`-like
 */
export function isZodType<T extends keyof ZodTypeMap>(
  value: unknown,
  type: T,
): value is ZodTypeMap[T];

/**
 * Returns `true` if the given value looks like a Zod v4 schema, determined by
 * the presence of an internal {@link z.core.$ZodTypeDef} field.
 *
 * Note: This relies on Zod's internal shape and is intended for runtime
 * discrimination within this library.
 *
 * @param value - Value to test
 * @returns Whether the value is `ZodType`-like
 */
export function isZodType(value: unknown): value is z.ZodType;
export function isZodType<T extends keyof ZodTypeMap>(
  value: unknown,
  type?: T,
): value is T extends keyof ZodTypeMap ? ZodTypeMap[T] : z.ZodType {
  const isValid =
    isObject(value) &&
    'def' in value &&
    !!value.def &&
    typeof value.def === 'object' &&
    'type' in value.def;

  if (!isValid) {
    return false;
  }
  if (type === undefined) {
    return true;
  }

  return (value as z.ZodType).def.type === type;
}

/**
 * Type guard for a plain object.
 *
 * @function
 * @param value Value to test
 * @returns `true` if the value is a plain object, `false` otherwise
 */
export const isObject = (value: unknown): value is NonNullable<object> => {
  return typeof value === 'object' && value !== null && !isArray(value);
};

/**
 * Returns `true` if the given value is a {@link z.ZodPromise} schema.
 *
 * @function
 * @param value - Value to test
 * @returns `true` if the value is a `ZodPromise` schema; `false` otherwise
 */
export const isZodPromise = (value: unknown): value is z.ZodPromise =>
  isZodType(value, 'promise');

/**
 * Checks if a value is "promise-like", meaning it is a "thenable" object.
 *
 * @function
 * @param value - Value to test
 * @returns `true` if the value is promise-like, `false` otherwise
 */
export const isPromiseLike = (value: unknown): value is PromiseLike<unknown> =>
  isObject(value) &&
  'then' in value &&
  isFunction(value.then) &&
  value.then.length > 0;

/**
 * Returns `true` if the given value is a constructable function (i.e., a
 * class).
 *
 * This works by wrapping `fn` in a {@link Proxy}, attaching a no-op
 * {@link ProxyHandler.construct} trap to it, then attempting to construct the
 * proxy via `new`.
 *
 * @privateRemarks
 * This may be the only way we can determine, at runtime, if a function is a
 * constructor without actually calling it. I am unsure if this only works for
 * classes.
 * @function
 * @param fn - Function to test
 * @returns Whether the function is constructable
 */
export const isConstructible = (fn: unknown): fn is Constructor => {
  if (fn === Symbol || fn === BigInt) {
    return false;
  }
  try {
    // this will throw if there is no `[[construct]]` slot.. or so I've heard.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, custom/require-function-tag-in-arrow-functions
    new new Proxy(fn as any, { construct: () => ({}) })();
    return true;
  } catch {
    return false;
  }
};

/**
 * Type guard for a boolean value
 *
 * @function
 * @param value Value to check
 * @returns `true` if the value is a boolean, `false` otherwise
 */
export const isBoolean = (value: unknown): value is boolean =>
  typeof value === 'boolean';

/**
 * Type guard for a function value
 *
 * @function
 * @param value Value to check
 * @returns `true` if the value is a function, `false` otherwise
 */
export const isFunction = (value: unknown): value is (...args: any[]) => any =>
  typeof value === 'function';

/**
 * Type guard for a string value
 *
 * @function
 * @param value Value to check
 * @returns `true` if the value is a string, `false` otherwise
 */
export const isString = (value: unknown): value is string =>
  typeof value === 'string';

/**
 * Type guard for a non-null object value
 *
 * @function
 * @param value Value to check
 * @returns `true` if the value is an object and not null, `false` otherwise
 */
export const isNonNullObject = (value: unknown): value is object =>
  typeof value === 'object' && value !== null;

/**
 * Type guard for a valid WeakKey (object, function, or symbol).
 *
 * WeakMaps and WeakSets can only use objects (including functions) or symbols
 * as keys, not primitives like strings, numbers, booleans, null, or undefined.
 *
 * @function
 * @param value Value to check
 * @returns `true` if the value is a valid WeakKey (object, function, or
 *   symbol), `false` otherwise
 */
export const isWeakKey = (value: unknown): value is WeakKey =>
  (typeof value === 'object' && value !== null) ||
  typeof value === 'function' ||
  typeof value === 'symbol';

/**
 * Type guard for a {@link PhraseLiteralChoice}, which is a tuple of strings.
 *
 * @function
 * @param value Assertion part to check
 * @returns `true` if the part is a `PhraseLiteralChoice`, `false` otherwise
 * @internal
 */
export const isPhraseLiteralChoice = (
  value: unknown,
): value is PhraseLiteralChoice =>
  isArray(value) && value.every(isPhraseLiteral);

/**
 * Type guard for a {@link PhraseLiteral}, which is just a string that does not
 * begin with `not `.
 *
 * @function
 * @param value Assertion part to check
 * @returns `true` if the part is a `PhraseLiteral`, `false` otherwise
 * @internal
 */
export const isPhraseLiteral = (value: unknown): value is PhraseLiteral =>
  isString(value) && !value.startsWith('not ') && value !== 'and';

/**
 * Type guard for a {@link PhraseLiteral} or {@link PhraseLiteralChoice}.
 *
 * @function
 * @param value Value to check
 * @returns `true` if the value is a `PhraseLiteral` or `PhraseLiteralChoice`,
 *   `false` otherwise
 */
export const isPhrase = (
  value: unknown,
): value is PhraseLiteral | PhraseLiteralChoice =>
  isPhraseLiteral(value) || isPhraseLiteralChoice(value);

/**
 * Generic type guard for instanceof checks.
 *
 * This function provides a type-safe way to check if a value is an instance of
 * a given constructor, with proper type narrowing for TypeScript. It combines
 * the null/object check with instanceof to ensure the value is a valid object
 * before performing the instance check.
 *
 * @example
 *
 * ```typescript
 * const obj = new Date();
 * if (isA(obj, Date)) {
 *   // obj is now typed as Date
 *   console.log(obj.getTime());
 * }
 * ```
 *
 * @template T - The constructor type to check against
 * @function
 * @param value - Value to test
 * @param ctor - Constructor function to check instanceof
 * @returns `true` if the value is an instance of the constructor, `false`
 *   otherwise
 */
export const isA = <T extends Constructor>(
  value: unknown,
  ctor: T,
): value is InstanceType<T> => {
  return isNonNullObject(value) && value instanceof ctor;
};

/**
 * Type guard for Error instances.
 *
 * This function checks if a value is an instance of the Error class or any of
 * its subclasses. It's useful for error handling and type narrowing when
 * working with unknown values that might be errors.
 *
 * @example
 *
 * ```typescript
 * try {
 *   throw new TypeError('Something went wrong');
 * } catch (err) {
 *   if (isError(err)) {
 *     // err is now typed as Error
 *     console.log(err.message);
 *   }
 * }
 * ```
 *
 * @function
 * @param value - Value to test
 * @returns `true` if the value is an Error instance, `false` otherwise
 */
export const isError = (value: unknown): value is Error => isA(value, Error);

/**
 * Type guard for {@link ExpectItExecutor} functions.
 *
 * This function checks if a value is an {@link ExpectItExecutor} function
 * created by {@link bupkis!expect.it | expect.it()}. {@link ExpectItExecutor}
 * functions are special functions that contain assertion logic and are marked
 * with an internal symbol for identification. They are used in nested
 * assertions within "to satisfy" patterns and other complex assertion
 * scenarios.
 *
 * @example
 *
 * ```typescript
 * const executor = expect.it('to be a string');
 * if (isExpectItExecutor(executor)) {
 *   // executor is now typed as ExpectItExecutor
 *   // Can be used in satisfaction patterns
 * }
 * ```
 *
 * @template Subject - The subject type that the executor function operates on
 * @function
 * @param value - Value to test
 * @returns `true` if the value is an ExpectItExecutor function, `false`
 *   otherwise
 */
export const isExpectItExecutor = <Subject extends z.ZodType = z.ZodUnknown>(
  value: unknown,
): value is ExpectItExecutor<Subject> => {
  return isFunction(value) && kExpectIt in value && value[kExpectIt] === true;
};

/**
 * Type guard for an {@link AssertionPart}, which can be a {@link PhraseLiteral},
 * {@link PhraseLiteralChoice}, or a Zod schema.
 *
 * @function
 * @param value Value to check
 * @returns `true` if the value is an `AssertionPart`, `false` otherwise
 * @internal
 */
export const isAssertionPart = (value: unknown): value is AssertionPart =>
  isPhraseLiteral(value) || isPhraseLiteralChoice(value) || isZodType(value);

/**
 * Type guard for {@link AssertionParts}, which is an array of
 * {@link AssertionPart}.
 *
 * @function
 * @param value Value to check
 * @returns `true` if the value is an `AssertionParts`, `false` otherwise
 * @internal
 */
export const isAssertionParts = (value: unknown): value is AssertionParts =>
  isArray(value) && !!value.length && value.every(isAssertionPart);
