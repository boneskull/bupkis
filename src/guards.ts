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

import { type Primitive } from 'type-fest';
import { type z } from 'zod';

import type { AssertionPart } from './assertion/assertion-types.js';
import type { Constructor } from './types.js';

import { type PhraseLiteralChoice } from '../dist/commonjs/assertion/assertion-types.js';

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
export const isConstructable = (fn: any): fn is Constructor => {
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
 * Type guard for a function value
 *
 * @param value Value to check
 * @returns `true` if the value is a function, `false` otherwise
 */
export const isFunction = (value: unknown): value is (...args: any[]) => any =>
  typeof value === 'function';

export const isAsyncFunction = (
  value: unknown,
): value is (...args: any[]) => Promise<any> =>
  isFunction(value) && value.constructor.name === 'AsyncFunction';

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

export type PrimitiveTypeName =
  | 'bigint'
  | 'boolean'
  | 'function'
  | 'null'
  | 'number'
  | 'object'
  | 'string'
  | 'symbol'
  | 'undefined';

export type PrimitiveTypeNameToType<T extends PrimitiveTypeName> =
  T extends 'undefined'
    ? undefined
    : T extends 'object'
      ? null | object
      : T extends 'function'
        ? (...args: any[]) => any
        : T extends 'string'
          ? string
          : T extends 'number'
            ? number
            : T extends 'boolean'
              ? boolean
              : T extends 'bigint'
                ? bigint
                : T extends 'symbol'
                  ? symbol
                  : never;

export const isType = <T extends PrimitiveTypeName>(
  a: unknown,
  b: T,
): a is PrimitiveTypeNameToType<T> => {
  return typeof a === b;
};

export const isA = <T extends Constructor>(
  value: unknown,
  ctor: T,
): value is InstanceType<T> => {
  return isNonNullObject(value) && value instanceof ctor;
};

export const isError = (value: unknown): value is Error => isA(value, Error);
