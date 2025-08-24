/**
 * Type guard functions and runtime type checking utilities.
 *
 * This module provides various type guard functions for runtime type checking,
 * including guards for Zod schemas, constructors, Promise-like objects, and
 * assertion parts. These are used throughout the library for safe type
 * narrowing and validation.
 *
 * @packageDocumentation
 */

import { type Constructor } from 'type-fest';
import { type z } from 'zod';

import type { AssertionPart } from './assertion/types.js';

/**
 * Returns true if the given value looks like a Zod schema (v4), determined by
 * the presence of an internal `def.type` field.
 *
 * Note: This relies on Zod's internal shape and is intended for runtime
 * discrimination within this library.
 *
 * @template T
 * @param value - Value to test
 * @returns Whether the value is Zod-like
 */
export const isZodType = (value: unknown): value is z.ZodType =>
  !!(
    value &&
    typeof value === 'object' &&
    'def' in value &&
    value.def &&
    typeof value.def === 'object' &&
    'type' in value.def
  );

/**
 * Returns true if the given value is a {@link ZodPromise} schema.
 *
 * @param value - Value to test
 * @returns `true` if the value is a `ZodPromise` schema; `false` otherwise
 */
export const isZodPromise = (value: unknown): value is z.ZodPromise =>
  isZodType(value) && value.def.type === 'promise';

/**
 * Checks if a value is "promise-like", meaning it is a "thenable" object.
 *
 * @param value - Value to test
 * @returns `true` if the value is promise-like, `false` otherwise
 */
export const isPromiseLike = (value: unknown): value is PromiseLike<unknown> =>
  !!(
    value &&
    typeof value === 'object' &&
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    typeof (value as any).then === 'function'
  );

/**
 * Returns true if the given value is a constructable function (i.e., a class).
 *
 * This may be the only way we can determine, at runtime, if a function is a
 * constructor without actually calling it.
 *
 * @param fn - Function to test
 * @returns Whether the function is constructable
 */
export const isConstructable = (
  fn: any,
): fn is Constructor<InstanceType<typeof fn>> => {
  try {
    // this will throw if there is no `[[construct]]` slot.. or so I've heard.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    new new Proxy(fn, { construct: () => ({}) })();
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
 * Checks if a {@link AssertionPart} is a string tuple (which will be converted
 * to a Zod enum of literals)
 *
 * @param value Assertion part to check
 * @returns `true` if the part is a string tuple, `false` otherwise
 * @internal
 */
export const isStringTupleAssertionPart = (
  value: AssertionPart,
): value is readonly [string, ...string[]] => Array.isArray(value);
