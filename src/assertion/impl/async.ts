/**
 * Asynchronous assertion implementations.
 *
 * This module contains all built-in asynchronous assertion implementations for
 * working with Promises and async operations. It provides assertions for
 * Promise resolution, rejection, and async function behavior validation with
 * comprehensive error handling.
 *
 * @packageDocumentation
 */

import { inspect } from 'node:util';
import { z } from 'zod/v4';

import { isA, isNonNullObject, isString } from '../../guards.js';
import {
  ClassSchema,
  FunctionSchema,
  WrappedPromiseLikeSchema,
} from '../../schema.js';
import {
  valueToSchema,
  valueToSchemaOptionsForSatisfies,
} from '../../value-to-schema.js';
import { createAsyncAssertion } from '../create.js';
import { CallbackAsyncAssertions } from './callback.js';

const trapAsyncFnError = async (fn: () => unknown) => {
  try {
    await fn();
  } catch (err) {
    return err;
  }
};

const trapPromiseError = async (promise: PromiseLike<unknown>) => {
  try {
    await promise;
  } catch (err) {
    return err;
  }
};

export const PromiseAssertions = [
  createAsyncAssertion(
    [FunctionSchema, ['to resolve', 'to fulfill']],
    async (subject) => {
      try {
        await subject();
        return true;
      } catch {
        return false;
      }
    },
  ),
  createAsyncAssertion(
    [WrappedPromiseLikeSchema, ['to resolve', 'to fulfill']],
    async (subject) => {
      try {
        await subject;
        return true;
      } catch {
        return false;
      }
    },
  ),

  // Non-parameterized "to reject" assertions
  createAsyncAssertion([FunctionSchema, 'to reject'], async (subject) => {
    let rejected = false;
    try {
      await subject();
    } catch {
      rejected = true;
    }
    return rejected;
  }),
  createAsyncAssertion(
    [WrappedPromiseLikeSchema, 'to reject'],
    async (subject) => {
      let rejected = false;
      try {
        await subject;
      } catch {
        rejected = true;
      }
      return rejected;
    },
  ),
  // Parameterized "to reject" with class constructor
  createAsyncAssertion(
    [FunctionSchema, ['to reject with a', 'to reject with an'], ClassSchema],
    async (subject, ctor) => {
      const error = await trapAsyncFnError(subject);
      if (!error) {
        return false;
      }
      return isA(error, ctor);
    },
  ),
  createAsyncAssertion(
    [
      WrappedPromiseLikeSchema,
      ['to reject with a', 'to reject with an'],
      ClassSchema,
    ],
    async (subject, ctor) => {
      const error = await trapPromiseError(subject);
      if (!error) {
        return false;
      }
      return isA(error, ctor);
    },
  ),

  // Parameterized "to reject" with string, RegExp, or object patterns
  createAsyncAssertion(
    [
      FunctionSchema,
      ['to reject with'],
      z.union([z.string(), z.instanceof(RegExp), z.looseObject({})]),
    ],
    async (subject, param) => {
      const error = await trapAsyncFnError(subject);
      if (!error) {
        return false;
      }

      if (isString(param)) {
        return z
          .object({
            message: z.coerce.string().pipe(z.literal(param)),
          })
          .or(z.coerce.string().pipe(z.literal(param)))
          .safeParse(error).success;
      } else if (isA(param, RegExp)) {
        return z
          .object({
            message: z.coerce.string().regex(param),
          })
          .or(z.coerce.string().regex(param))
          .safeParse(error).success;
      } else if (isNonNullObject(param)) {
        return valueToSchema(param, { strict: false }).safeParse(error).success;
      } else {
        throw new TypeError(`Invalid parameter schema: ${inspect(param)}`);
      }
    },
  ),
  createAsyncAssertion(
    [
      WrappedPromiseLikeSchema,
      ['to reject with'],
      z.union([z.string(), z.instanceof(RegExp), z.looseObject({})]),
    ],
    async (subject, param) => {
      const error = await trapPromiseError(subject);
      if (!error) {
        return false;
      }

      if (isString(param)) {
        return z
          .object({
            message: z.coerce.string().pipe(z.literal(param)),
          })
          .or(z.coerce.string().pipe(z.literal(param)))
          .safeParse(error).success;
      } else if (isA(param, RegExp)) {
        return z
          .object({
            message: z.coerce.string().regex(param),
          })
          .or(z.coerce.string().regex(param))
          .safeParse(error).success;
      } else if (isNonNullObject(param)) {
        return valueToSchema(param, { strict: false }).safeParse(error).success;
      } else {
        throw new TypeError(`Invalid parameter schema: ${inspect(param)}`);
      }
    },
  ),

  createAsyncAssertion(
    [
      WrappedPromiseLikeSchema,
      ['to fulfill with value satisfying', 'to resolve with value satisfying'],
      z.union([z.string(), z.instanceof(RegExp), z.looseObject({})]),
    ],
    async (promise, param) => {
      let value: unknown;
      try {
        value = await promise;
      } catch (err) {
        return {
          actual: err,
          expect: 'promise to not reject',
          message: `Expected promise to not reject, but it rejected with ${inspect(
            err,
          )}`,
        };
      }
      if (isString(param)) {
        return z
          .object({
            message: z.coerce.string().pipe(z.literal(param)),
          })
          .or(z.coerce.string().pipe(z.literal(param)))
          .safeParse(value).success;
      } else if (isA(param, RegExp)) {
        return z
          .object({
            message: z.coerce.string().regex(param),
          })
          .or(z.coerce.string().regex(param))
          .safeParse(value).success;
      } else if (isNonNullObject(param)) {
        const schema = valueToSchema(param);
        const result = schema.safeParse(value);
        if (!result.success) {
          return {
            actual: value,
            expected: param,
            message: `Expected resolved value to satisfy schema ${inspect(
              param,
            )}, but it does not`,
          };
        }
        return true;
      } else {
        throw new TypeError(`Invalid parameter schema: ${inspect(param)}`);
      }
    },
  ),

  createAsyncAssertion(
    [
      FunctionSchema,
      ['to fulfill with value satisfying', 'to resolve with value satisfying'],
      z.union([z.string(), z.instanceof(RegExp), z.looseObject({})]),
    ],
    async (subject, param) => {
      let value: unknown;
      try {
        value = await subject();
      } catch (err) {
        return {
          actual: err,
          expect: 'function to not throw',
          message: `Expected function to not throw, but it threw ${inspect(
            err,
          )}`,
        };
      }

      if (isString(param)) {
        return z
          .object({
            message: z.coerce.string().pipe(z.literal(param)),
          })
          .or(z.coerce.string().pipe(z.literal(param)))
          .safeParse(value).success;
      } else if (isA(param, RegExp)) {
        return z
          .object({
            message: z.coerce.string().regex(param),
          })
          .or(z.coerce.string().regex(param))
          .safeParse(value).success;
      } else if (isNonNullObject(param)) {
        const schema = valueToSchema(param);
        const result = schema.safeParse(value);
        if (!result.success) {
          return {
            actual: value,
            expected: param,
            message: `Expected resolved value to satisfy schema ${inspect(
              param,
            )}, but it does not`,
          };
        }
        return true;
      } else {
        throw new TypeError(`Invalid parameter schema: ${inspect(param)}`);
      }
    },
  ),
] as const;

export const AsyncAssertions = [
  ...PromiseAssertions,
  ...CallbackAsyncAssertions,
] as const;

export { CallbackAsyncAssertions };
