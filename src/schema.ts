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
 * @packageDocumentation
 */

import type { Constructor } from 'type-fest';

import { z } from 'zod/v4';

import {
  isA,
  isConstructable,
  isFunction,
  isNonNullObject,
  isPromiseLike,
} from './guards.js';
import { BupkisRegistry } from './metadata.js';

/**
 * A Zod Schema that validates JavaScript classes or constructor functions.
 */
export const ClassSchema = z
  .custom<Constructor<unknown>>(isConstructable)
  .register(BupkisRegistry, { name: 'ClassSchema' })
  .describe('Class / Constructor');

/**
 * A Zod Schema that validates JavaScript functions.
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
 * A Zod Schema that validates valid JavaScript property keys, i.e. strings,
 * numbers, or symbols.
 */
export const PropertyKeySchema = z
  .union([z.string(), z.number(), z.symbol()])
  .register(BupkisRegistry, { name: 'PropertyKeySchema' })
  .describe('PropertyKey');

/**
 * A Zod Schema that validates "thenable" objects, i.e. those with a `.then()`
 * method. Unlike `z.promise()`, this does not unwrap the resolved value (the
 * result of calling `WrappedPromiseLikeSchema.parse(Promise.resolve())` will be
 * a `Promise`).
 */
export const WrappedPromiseLikeSchema = z
  .custom<PromiseLike<unknown>>((value) => isPromiseLike(value))
  .register(BupkisRegistry, { name: 'WrappedPromiseLikeSchema' })
  .describe(
    'PromiseLike; unlike z.promise(), does not unwrap the resolved value',
  );

/**
 * A Zod Schema that validates `Map` objects that are _not_ `WeakMap`s.
 */
export const StrongMapSchema = z
  .instanceof(Map)
  .refine((value) => !isA(value, WeakMap))
  .register(BupkisRegistry, { name: 'StrongMapSchema' });

/**
 * A Zod Schema that validates `Set` objects that are _not_ `WeakSet`s.
 */
export const StrongSetSchema = z
  .instanceof(Set)
  .refine((value) => !isA(value, WeakSet))
  .register(BupkisRegistry, { name: 'StrongSetSchema' });

export const NullProtoObjectSchema = z
  .custom<object>(
    (value) => isNonNullObject(value) && Object.getPrototypeOf(value) === null,
  )
  .register(BupkisRegistry, { name: 'ObjectWithNullPrototype' })
  .describe('Object with null prototype');
