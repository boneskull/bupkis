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

import { type Primitive } from 'type-fest';
import { z } from 'zod/v4';

import type {
  AssertionFailure,
  AssertionPart,
  PhraseLiteralChoice,
} from './assertion/assertion-types.js';
import type { Constructor, ZodTypeMap } from './types.js';

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

  if (!isValid) return false;
  if (type === undefined) return true;

  return (value as z.ZodType).def.type === type;
}

/**
 * Type guard for a plain object.
 *
 * @param value Value to test
 * @returns `true` if the value is a plain object, `false` otherwise
 */
export const isObject = (value: unknown): value is NonNullable<object> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

/**
 * Returns `true` if the given value is a {@link z.ZodPromise} schema.
 *
 * @param value - Value to test
 * @returns `true` if the value is a `ZodPromise` schema; `false` otherwise
 */
export const isZodPromise = (value: unknown): value is z.ZodPromise =>
  isZodType(value, 'promise');

/**
 * Checks if a value is "promise-like", meaning it is a "thenable" object.
 *
 * @param value - Value to test
 * @returns `true` if the value is promise-like, `false` otherwise
 */
export const isPromiseLike = (value: unknown): value is PromiseLike<unknown> =>
  isObject(value) && 'then' in value && isFunction(value.then);

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
 * @param fn - Function to test
 * @returns Whether the function is constructable
 */
export const isConstructible = (fn: unknown): fn is Constructor => {
  if (fn === Symbol || fn === BigInt) {
    return false;
  }
  try {
    // this will throw if there is no `[[construct]]` slot.. or so I've heard.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    new new Proxy(fn as any, { construct: () => ({}) })();
    return true;
  } catch {
    return false;
  }
};

/**
 * Type guard for a boolean value
 *
 * @param value Value to check
 * @returns `true` if the value is a boolean, `false` otherwise
 */
export const isBoolean = (value: unknown): value is boolean =>
  typeof value === 'boolean';

/**
 * Type guard for a function value
 *
 * @param value Value to check
 * @returns `true` if the value is a function, `false` otherwise
 */
export const isFunction = (value: unknown): value is (...args: any[]) => any =>
  typeof value === 'function';

const AssertionFailureSchema: z.ZodType<AssertionFailure> = z.object({
  actual: z
    .unknown()
    .optional()
    .describe('The actual value or description of what actually occurred'),
  expected: z
    .unknown()
    .optional()
    .describe(
      'The expected value or description of what was expected to occur',
    ),
  message: z
    .string()
    .optional()
    .describe('A human-readable message describing the failure'),
});

/**
 * Type guard for a {@link AssertionFailure} object
 *
 * @param value Value to check
 * @returns `true` if the value is an `AssertionFailure`, `false` otherwise
 * @internal
 */
export const isAssertionFailure = (value: unknown): value is AssertionFailure =>
  AssertionFailureSchema.safeParse(value).success;

/**
 * Type guard for a string value
 *
 * @param value Value to check
 * @returns `true` if the value is a string, `false` otherwise
 */
export const isString = (value: unknown): value is string =>
  typeof value === 'string';

/**
 * Type guard for a non-null object value
 *
 * @param value Value to check
 * @returns `true` if the value is an object and not null, `false` otherwise
 */
export const isNonNullObject = (value: unknown): value is object =>
  typeof value === 'object' && value !== null;

/**
 * Type guard for a null or non-object value
 *
 * @param value Value to check
 * @returns `true` if the value is null or not an object, `false` otherwise
 */
export const isNullOrNonObject = (value: unknown): value is null | Primitive =>
  typeof value !== 'object' || value === null;

/**
 * Type guard for a {@link PhraseLiteralChoice}, which is a tuple of strings.
 *
 * @param value Assertion part to check
 * @returns `true` if the part is a `PhraseLiteralChoice`, `false` otherwise
 * @internal
 */
export const isPhraseLiteralChoice = (
  value: AssertionPart,
): value is PhraseLiteralChoice =>
  Array.isArray(value) && value.every(isPhraseLiteral);

/**
 * Type guard for a {@link PhraseLiteral}, which is just a string that does not
 * begin with `not `.
 *
 * @param value Assertion part to check
 * @returns `true` if the part is a `PhraseLiteral`, `false` otherwise
 * @internal
 */
export const isPhraseLiteral = (value: AssertionPart): value is string =>
  isString(value) && !value.startsWith('not ');

export const isA = <T extends Constructor>(
  value: unknown,
  ctor: T,
): value is InstanceType<T> => {
  return isNonNullObject(value) && value instanceof ctor;
};

export const isError = (value: unknown): value is Error => isA(value, Error);
