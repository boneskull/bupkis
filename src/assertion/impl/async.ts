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
      } catch {
        return {
          actual: 'function rejected',
          expected: 'function to fulfill',
          message: 'Expected function to fulfill, but it rejected instead',
        };
      }
    },
  ),
  createAsyncAssertion(
    [WrappedPromiseLikeSchema, ['to resolve', 'to fulfill']],
    async (subject) => {
      try {
        await subject;
      } catch {
        return {
          actual: 'promise rejected',
          expected: 'promise to not reject',
          message: 'Expected promise to fulfill, but it rejected instead',
        };
      }
    },
  ),

  // Non-parameterized "to reject" assertions
  createAsyncAssertion([FunctionSchema, 'to reject'], async (subject) => {
    try {
      await subject();
      return {
        actual: 'function fulfilled',
        expected: 'function to reject',
        message: 'Expected function to reject, but it fulfilled instead',
      };
    } catch {}
  }),
  createAsyncAssertion(
    [WrappedPromiseLikeSchema, 'to reject'],
    async (subject) => {
      try {
        await subject;
        return {
          actual: 'function fulfilled',
          expected: 'function to reject',
          message: 'Expected function to reject, but it fulfilled instead',
        };
      } catch {}
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
      ['to reject with error satisfying'],
      z.union([z.string(), z.instanceof(RegExp), z.looseObject({})]),
    ],
    async (subject, param) => {
      const error = await trapAsyncFnError(subject);
      if (!error) {
        return {
          actual: 'function fulfilled',
          expect: 'function to reject',
          message: 'Expected function to reject, but it fulfilled instead',
        };
      }

      let schema: undefined | z.ZodType;
      // TODO: can valueToSchema handle the first two conditional branches?
      if (isString(param)) {
        schema = z
          .looseObject({
            message: z.coerce.string().pipe(z.literal(param)),
          })
          .or(z.coerce.string().pipe(z.literal(param)));
      } else if (isA(param, RegExp)) {
        schema = z
          .looseObject({
            message: z.coerce.string().regex(param),
          })
          .or(z.coerce.string().regex(param));
      } else if (isNonNullObject(param)) {
        schema = valueToSchema(param, valueToSchemaOptionsForSatisfies);
      }
      if (!schema) {
        throw new TypeError(
          `Invalid parameter schema: ${inspect(param, { depth: 2 })}`,
        );
      }

      const result = schema.safeParse(error);
      if (!result.success) {
        return result.error;
      }
    },
  ),
  createAsyncAssertion(
    [
      WrappedPromiseLikeSchema,
      ['to reject with error satisfying'],
      z.union([z.string(), z.instanceof(RegExp), z.looseObject({})]),
    ],
    async (subject, param) => {
      const error = await trapPromiseError(subject);
      if (!error) {
        return {
          actual: 'promise fulfilled',
          expect: 'promise to reject',
          message: 'Expected promise to reject, but it fulfilled instead',
        };
      }
      let schema: undefined | z.ZodType;
      // TODO: can valueToSchema handle the first two conditional branches?
      if (isString(param)) {
        schema = z
          .looseObject({
            message: z.coerce.string().pipe(z.literal(param)),
          })
          .or(z.coerce.string().pipe(z.literal(param)));
      } else if (isA(param, RegExp)) {
        schema = z
          .looseObject({
            message: z.coerce.string().regex(param),
          })
          .or(z.coerce.string().regex(param));
      } else if (isNonNullObject(param)) {
        schema = valueToSchema(param, valueToSchemaOptionsForSatisfies);
      }
      if (!schema) {
        throw new TypeError(
          `Invalid parameter schema: ${inspect(param, { depth: 2 })}`,
        );
      }

      const result = schema.safeParse(error);
      if (!result.success) {
        return result.error;
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
      let schema: undefined | z.ZodType;
      // TODO: can valueToSchema handle the first two conditional branches?
      if (isString(param)) {
        schema = z
          .looseObject({
            message: z.coerce.string().pipe(z.literal(param)),
          })
          .or(z.coerce.string().pipe(z.literal(param)));
      } else if (isA(param, RegExp)) {
        schema = z
          .looseObject({
            message: z.coerce.string().regex(param),
          })
          .or(z.coerce.string().regex(param));
      } else if (isNonNullObject(param)) {
        schema = valueToSchema(param, valueToSchemaOptionsForSatisfies);
      }
      if (!schema) {
        throw new TypeError(
          `Invalid parameter schema: ${inspect(param, { depth: 2 })}`,
        );
      }

      const result = schema.safeParse(value);
      if (!result.success) {
        return result.error;
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
          actual: 'function rejected',
          expect: 'function to fulfill',
          message: `Expected function to fulfill, but it rejected with ${inspect(
            err,
          )}`,
        };
      }

      let schema: undefined | z.ZodType;
      // TODO: can valueToSchema handle the first two conditional branches?
      if (isString(param)) {
        schema = z
          .looseObject({
            message: z.coerce.string().pipe(z.literal(param)),
          })
          .or(z.coerce.string().pipe(z.literal(param)));
      } else if (isA(param, RegExp)) {
        schema = z
          .looseObject({
            message: z.coerce.string().regex(param),
          })
          .or(z.coerce.string().regex(param));
      } else if (isNonNullObject(param)) {
        schema = valueToSchema(param, valueToSchemaOptionsForSatisfies);
      }
      if (!schema) {
        throw new TypeError(
          `Invalid parameter schema: ${inspect(param, { depth: 2 })}`,
        );
      }

      const result = schema.safeParse(value);
      if (!result.success) {
        return result.error;
      }
    },
  ),
] as const;

export const AsyncAssertions = [
  ...PromiseAssertions,
  ...CallbackAsyncAssertions,
] as const;

export { CallbackAsyncAssertions };
