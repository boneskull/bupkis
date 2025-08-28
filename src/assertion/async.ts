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

import { z } from 'zod/v4';

import { isA, isNonNullObject, isString } from '../guards.js';
import {
  ClassSchema,
  FunctionSchema,
  WrappedPromiseLikeSchema,
} from '../schema.js';
import { shallowSatisfiesShape } from '../util.js';
import { createAssertion } from './assertion.js';

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
  createAssertion(
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
  createAssertion(
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
  createAssertion([FunctionSchema, 'to reject'], async (subject) => {
    let rejected = false;
    try {
      await subject();
    } catch {
      rejected = true;
    }
    return rejected;
  }),
  createAssertion([WrappedPromiseLikeSchema, 'to reject'], async (subject) => {
    let rejected = false;
    try {
      await subject;
    } catch {
      rejected = true;
    }
    return rejected;
  }),
  // Parameterized "to reject" with class constructor
  createAssertion(
    [FunctionSchema, ['to reject with a', 'to reject with an'], ClassSchema],
    async (subject, ctor) => {
      const error = await trapAsyncFnError(subject);
      if (!error) {
        return false;
      }
      return isA(error, ctor);
    },
  ),
  createAssertion(
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
  createAssertion(
    [
      FunctionSchema,
      ['to reject'],
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
        return z.object(shallowSatisfiesShape(param)).safeParse(error).success;
      } else {
        return false;
      }
    },
  ),
  createAssertion(
    [
      WrappedPromiseLikeSchema,
      ['to reject'],
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
        return z.object(shallowSatisfiesShape(param)).safeParse(error).success;
      } else {
        return false;
      }
    },
  ),
] as const;
