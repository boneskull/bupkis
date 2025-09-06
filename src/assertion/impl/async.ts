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
import { valueToSchema } from '../../util.js';
import { createAsyncAssertion } from '../create.js';

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

export const AsyncAssertions = [
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
      ['to reject'],
      z.union([z.string(), z.instanceof(RegExp), z.looseObject({})]),
    ],
    // @ts-expect-error sort this out later
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
        return valueToSchema(param);
      } else {
        throw new TypeError(`Invalid parameter schema: ${inspect(param)}`);
      }
    },
  ),
  createAsyncAssertion(
    [
      WrappedPromiseLikeSchema,
      ['to reject'],
      z.union([z.string(), z.instanceof(RegExp), z.looseObject({})]),
    ],
    // @ts-expect-error sort this out later
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
        return valueToSchema(param);
      } else {
        throw new TypeError(`Invalid parameter schema: ${inspect(param)}`);
      }
    },
  ),
] as const;
