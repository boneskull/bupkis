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

import { AssertionImplementationError } from '../error.js';
import { isFunction, isStandardSchema, isZodType } from '../guards.js';
import {
  CreateAssertionInputSchema,
  CreateAssertionInputSchemaAsync,
} from '../internal-schema.js';
import {
  BupkisAssertionFunctionAsync,
  BupkisAssertionSchemaAsync,
} from './assertion-async.js';
import { BupkisAssertionStandardSchemaAsync } from './assertion-standard-schema-async.js';
import { BupkisAssertionStandardSchemaSync } from './assertion-standard-schema-sync.js';
import {
  BupkisAssertionFunctionSync,
  BupkisAssertionSchemaSync,
} from './assertion-sync.js';
import {
  type CreateAssertionFn,
  type CreateAsyncAssertionFn,
} from './assertion-types.js';
import { slotify } from './slotify.js';

/**
 * {@inheritDoc CreateAssertionFn}
 *
 * @function
 * @throws {TypeError} Invalid assertion implementation type
 * @group Assertion Creation
 */
export const createAssertion: CreateAssertionFn = <
  Impl extends AssertionImplSync<Parts>,
  const Parts extends AssertionParts,
>(
  parts: Parts,
  impl: Impl,
) => {
  // Validate inputs using Zod schema
  try {
    CreateAssertionInputSchema.parse([parts, impl]);
  } catch (err) {
    if (err instanceof z.ZodError) {
      throw new AssertionImplementationError(
        `Invalid input parameters: ${z.prettifyError(err)}`,
        { cause: err },
      );
    }
    /* c8 ignore next */
    throw err;
  }

  const slots = slotify<Parts>(parts);

  if (isZodType(impl)) {
    return new BupkisAssertionSchemaSync(parts, slots, impl as any);
  } else if (isStandardSchema(impl)) {
    return new BupkisAssertionStandardSchemaSync(parts, slots, impl);
  } else if (isFunction(impl)) {
    return new BupkisAssertionFunctionSync(parts, slots, impl);
  }
  // should be impossible if CreateAssertionInputSchema is correct
  /* c8 ignore next */
  throw new AssertionImplementationError(
    'Assertion implementation must be a function, Zod schema, or Standard Schema',
  );
};

/**
 * {@inheritDoc CreateAsyncAssertionFn}
 *
 * @function
 * @throws {TypeError} Invalid assertion implementation type
 * @group Assertion Creation
 */
export const createAsyncAssertion: CreateAsyncAssertionFn = <
  const Parts extends AssertionParts,
  Impl extends AssertionImplAsync<Parts>,
>(
  parts: Parts,
  impl: Impl,
) => {
  // Validate inputs using Zod schema
  try {
    CreateAssertionInputSchemaAsync.parse([parts, impl]);
  } catch (err) {
    if (err instanceof z.ZodError) {
      throw new AssertionImplementationError(
        `Invalid input parameters: ${z.prettifyError(err)}`,
        { cause: err },
      );
    }
    /* c8 ignore next */
    throw err;
  }

  const slots = slotify<Parts>(parts);

  if (isZodType(impl)) {
    return new BupkisAssertionSchemaAsync(parts, slots, impl as any);
  } else if (isStandardSchema(impl)) {
    return new BupkisAssertionStandardSchemaAsync(parts, slots, impl);
  } else if (isFunction(impl)) {
    return new BupkisAssertionFunctionAsync(parts, slots, impl);
  }
  // should be impossible if CreateAssertionInputSchemaAsync is correct
  /* c8 ignore next */
  throw new AssertionImplementationError(
    'Assertion implementation must be a function, Zod schema, or Standard Schema',
  );
};
