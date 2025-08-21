import { type Constructor } from 'type-fest';
import { type z } from 'zod';
import { kSchemaFactory } from './assertion/assertion.js';
import {
  AssertionImpl,
  AssertionImplFn,
  AssertionParts,
  AssertionSchemaFactory,
} from './assertion/types.js';

/**
 * Returns true if the given value looks like a Zod schema (v4), determined by
 * the presence of an internal `def.type` field.
 *
 * Note: This relies on Zod's internal shape and is intended for runtime
 * discrimination within this library.
 *
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
 * Returns true if the given value is a `z.unknown()` schema.
 *
 * @param value - Value to test
 * @returns Whether the value is a Zod unknown schema
 */
export const isZodUnknown = (value: unknown): value is z.ZodUnknown =>
  isZodType(value) && value.def.type === 'unknown';

/**
 * Returns true if the given value is a `z.any()` schema.
 *
 * @param value - Value to test
 * @returns Whether the value is a Zod any schema
 */
export const isZodAny = (value: unknown): value is z.ZodAny =>
  isZodType(value) && value.def.type === 'any';

/**
 * Returns true if the given value is a `z.promise()` schema.
 *
 * @param value - Value to test
 * @returns Whether the value is a Zod promise schema
 */
export const isZodPromise = (value: unknown): value is z.ZodPromise =>
  isZodType(value) && value.def.type === 'promise';

/**
 * Returns true if the given value is a constructable function (i.e., a class).
 *
 * This may be the only way we can determine, at runtime, if a function is a
 * constructor without actually calling it.
 *
 * @param fn - Function to test
 * @returns Whether the function is constructable
 * @todo See if we can get better type inference here.
 */
export const isConstructable = (fn: any): fn is Constructor<any> => {
  try {
    // this will throw if there is no `[[construct]]` slot
    new new Proxy(fn, { construct: () => ({}) })();
    return true;
  } catch (err) {
    return false;
  }
};

export const isAssertionImplFn = <Parts extends AssertionParts>(
  value: AssertionImpl<Parts>,
): value is AssertionImplFn<Parts> =>
  typeof value === 'function' && !isAssertionSchemaFactory(value);

export const isAssertionSchemaFactory = (
  value: unknown,
): value is AssertionSchemaFactory<any> =>
  typeof value === 'function' &&
  kSchemaFactory in value &&
  value[kSchemaFactory] === true;
