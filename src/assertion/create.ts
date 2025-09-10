/**
 * Assertion creation factory functions with type-safe sync/async separation.
 *
 * This module provides the core factory functions for creating both synchronous
 * and asynchronous assertions in the Bupkis assertion framework. It implements
 * a dual-creation pattern where `createAssertion()` creates synchronous-only
 * assertions and `createAsyncAssertion()` creates potentially asynchronous
 * assertions, using branded Zod schema types to enforce compile-time safety and
 * prevent accidental mixing of sync and async implementations.
 *
 * The module supports two primary assertion implementation types:
 *
 * - **Schema-based assertions**: Using {@link z.ZodType Zod schemas} for
 *   validation
 * - **Function-based assertions**: Using implementation functions that return
 *   boolean, void, or Zod schemas for dynamic validation
 *
 * @remarks
 * The factory functions use branded types to distinguish between synchronous
 * and asynchronous schema implementations at compile time. This prevents
 * accidentally passing async schemas to sync assertion creators and vice versa,
 * ensuring type safety throughout the assertion system.
 * @example Creating a synchronous string assertion:
 *
 * ```ts
 * import { createAssertion } from './create.js';
 * import { z } from 'zod/v4';
 *
 * const stringAssertion = createAssertion(['to be a string'], z.string());
 * ```
 *
 * @example Creating an asynchronous Promise resolution assertion:
 *
 * ```ts
 * import { createAsyncAssertion } from './create.js';
 *
 * const promiseAssertion = createAsyncAssertion(
 *   ['to resolve'],
 *   async (promise) => {
 *     try {
 *       await promise;
 *       return true;
 *     } catch {
 *       return false;
 *     }
 *   },
 * );
 * ```
 *
 * @example Creating parameterized assertions:
 *
 * ```ts
 * import { createAssertion } from './create.js';
 * import { z } from 'zod/v4';
 *
 * const greaterThanAssertion = createAssertion(
 *   [z.number(), 'to be greater than', z.number()],
 *   (subject, expected) => subject > expected,
 * );
 * ```
 *
 * @packageDocumentation
 * @see {@link AssertionParts} for assertion part structure
 * @see {@link AssertionSlots} for processed slot definitions
 * @see {@link AssertionImplSync} for synchronous implementation types
 * @see {@link AssertionImplAsync} for asynchronous implementation types
 */

import { z } from 'zod/v4';

import type {
  AssertionImplAsync,
  AssertionImplSync,
  AssertionParts,
} from './assertion-types.js';

import { isFunction, isString, isZodType } from '../guards.js';
import {
  type CreateAssertionFn,
  type CreateAsyncAssertionFn,
} from '../types.js';
import {
  BupkisAssertionFunctionAsync,
  BupkisAssertionSchemaAsync,
} from './assertion-async.js';
import {
  BupkisAssertionFunctionSync,
  BupkisAssertionSchemaSync,
} from './assertion-sync.js';
import { slotify } from './slotify.js';

/**
 * {@inheritDoc CreateAssertionFn}
 *
 * @throws {TypeError} Invalid assertion implementation type
 */
export const createAssertion: CreateAssertionFn = <
  Impl extends AssertionImplSync<Parts>,
  const Parts extends AssertionParts,
>(
  parts: Parts,
  impl: Impl,
) => {
  if (!Array.isArray(parts)) {
    throw new TypeError('First parameter must be an array');
  }
  if (parts.length === 0) {
    throw new TypeError('At least one value is required for an assertion');
  }
  if (
    !parts.every(
      (part) => isString(part) || Array.isArray(part) || isZodType(part),
    )
  ) {
    throw new TypeError('All assertion parts must be strings or Zod schemas');
  }
  if (!impl) {
    throw new TypeError('An assertion implementation is required');
  }
  try {
    const slots = slotify<Parts>(parts);

    if (isZodType(impl)) {
      return new BupkisAssertionSchemaSync(parts, slots, impl);
    } else if (isFunction(impl)) {
      return new BupkisAssertionFunctionSync(parts, slots, impl);
    }
  } catch (err) {
    if (err instanceof z.ZodError) {
      throw new TypeError(z.prettifyError(err));
    }
    throw err;
  }
  throw new TypeError(
    'Assertion implementation must be a function, Zod schema or Zod schema factory',
  );
};

/**
 * {@inheritDoc CreateAsyncAssertionFn}
 *
 * @throws {TypeError} Invalid assertion implementation type
 */
export const createAsyncAssertion: CreateAsyncAssertionFn = <
  const Parts extends AssertionParts,
  Impl extends AssertionImplAsync<Parts>,
>(
  parts: Parts,
  impl: Impl,
) => {
  if (!Array.isArray(parts)) {
    throw new TypeError('First parameter must be an array');
  }
  if (parts.length === 0) {
    throw new TypeError('At least one value is required for an assertion');
  }
  if (
    !parts.every(
      (part) => isString(part) || Array.isArray(part) || isZodType(part),
    )
  ) {
    throw new TypeError('All assertion parts must be strings or Zod schemas');
  }
  if (!impl) {
    throw new TypeError('An assertion implementation is required');
  }
  const slots = slotify<Parts>(parts);

  if (isZodType(impl)) {
    return new BupkisAssertionSchemaAsync(parts, slots, impl);
  } else if (isFunction(impl)) {
    return new BupkisAssertionFunctionAsync(parts, slots, impl);
  }
  throw new TypeError(
    'Assertion implementation must be a function, Zod schema or Zod schema factory',
  );
};
