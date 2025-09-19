/**
 * Asynchronous assertion implementations.
 *
 * This module contains all built-in asynchronous assertion implementations for
 * working with Promises and async operations. It provides assertions for
 * Promise resolution, rejection, and async function behavior validation with
 * comprehensive error handling.
 *
 * @module
 * @groupDescription Parametric Assertions (Async)
 * Asynchronous assertions for Promise resolution, rejection, and async function behavior.
 *
 * @showGroups
 */

import { inspect } from 'node:util';
import { z } from 'zod/v4';

import { isA, isNonNullObject, isString } from '../../guards.js';
import {
  ConstructibleSchema,
  FunctionSchema,
  WrappedPromiseLikeSchema,
} from '../../schema.js';
import {
  valueToSchema,
  valueToSchemaOptionsForSatisfies,
} from '../../value-to-schema.js';
import { createAsyncAssertion } from '../create.js';
import { trapAsyncFnError, trapPromiseError } from './assertion-util.js';

/**
 * Assertion for testing if a function returns a fulfilled Promise.
 *
 * @example
 *
 * ```typescript
 * await expectAsync(() => Promise.resolve('success'), 'to resolve'); // passes
 * await expectAsync(() => Promise.reject('error'), 'to fulfill'); // fails
 * ```
 *
 * @group Parametric Assertions (Async)
 */
export const functionResolveAssertion = createAsyncAssertion(
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
  {
    anchor: 'to-resolve',
    category: 'promise',
  },
);

/**
 * Assertion for testing if a Promise is fulfilled.
 *
 * @example
 *
 * ```typescript
 * await expectAsync(Promise.resolve('success'), 'to resolve'); // passes
 * await expectAsync(Promise.reject('error'), 'to fulfill'); // fails
 * ```
 *
 * @group Parametric Assertions (Async)
 */
export const promiseResolveAssertion = createAsyncAssertion(
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
);

/**
 * Assertion for testing if a function returns a rejected Promise.
 *
 * @example
 *
 * ```typescript
 * await expectAsync(() => Promise.reject('error'), 'to reject'); // passes
 * await expectAsync(() => Promise.resolve('success'), 'to reject'); // fails
 * ```
 *
 * @group Parametric Assertions (Async)
 */
export const functionRejectAssertion = createAsyncAssertion(
  [FunctionSchema, 'to reject'],
  async (subject) => {
    try {
      await subject();
      return {
        actual: 'function fulfilled',
        expected: 'function to reject',
        message: 'Expected function to reject, but it fulfilled instead',
      };
    } catch {}
  },
);

/**
 * Assertion for testing if a Promise is rejected.
 *
 * @example
 *
 * ```typescript
 * await expectAsync(Promise.reject('error'), 'to reject'); // passes
 * await expectAsync(Promise.resolve('success'), 'to reject'); // fails
 * ```
 *
 * @group Parametric Assertions (Async)
 */
export const promiseRejectAssertion = createAsyncAssertion(
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
);

/**
 * Assertion for testing if a function rejects with a specific error type.
 *
 * @example
 *
 * ```typescript
 * await expectAsync(
 *   () => Promise.reject(new TypeError('wrong')),
 *   'to reject with a',
 *   TypeError,
 * ); // passes
 * await expectAsync(
 *   () => Promise.reject(new Error('wrong')),
 *   'to reject with an',
 *   TypeError,
 * ); // fails
 * ```
 *
 * @group Parametric Assertions (Async)
 */
export const functionRejectWithTypeAssertion = createAsyncAssertion(
  [
    FunctionSchema,
    ['to reject with a', 'to reject with an'],
    ConstructibleSchema,
  ],
  async (subject, ctor) => {
    const error = await trapAsyncFnError(subject);
    if (!error) {
      return false;
    }
    return isA(error, ctor);
  },
);

/**
 * Assertion for testing if a Promise rejects with a specific error type.
 *
 * @example
 *
 * ```typescript
 * await expectAsync(
 *   Promise.reject(new TypeError('wrong')),
 *   'to reject with a',
 *   TypeError,
 * ); // passes
 * await expectAsync(
 *   Promise.reject(new Error('wrong')),
 *   'to reject with an',
 *   TypeError,
 * ); // fails
 * ```
 *
 * @group Parametric Assertions (Async)
 */
export const promiseRejectWithTypeAssertion = createAsyncAssertion(
  [
    WrappedPromiseLikeSchema,
    ['to reject with a', 'to reject with an'],
    ConstructibleSchema,
  ],
  async (subject, ctor) => {
    const error = await trapPromiseError(subject);
    if (!error) {
      return false;
    }
    return isA(error, ctor);
  },
);

/**
 * Assertion for testing if a function rejects with an error satisfying specific
 * criteria.
 *
 * @example
 *
 * ```typescript
 * await expectAsync(
 *   () => Promise.reject(new Error('oops')),
 *   'to reject with error satisfying',
 *   'oops',
 * ); // passes
 * await expectAsync(
 *   () => Promise.reject(new Error('fail')),
 *   'to reject with error satisfying',
 *   /error/i,
 * ); // passes
 * await expectAsync(
 *   () => Promise.reject(new Error('oops')),
 *   'to reject with error satisfying',
 *   { message: 'oops' },
 * ); // passes
 * ```
 *
 * @group Parametric Assertions (Async)
 */
export const functionRejectWithErrorSatisfyingAssertion = createAsyncAssertion(
  [FunctionSchema, ['to reject with error satisfying'], z.any()],
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
    /* c8 ignore next 5 */
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
);

/**
 * Assertion for testing if a Promise rejects with an error satisfying specific
 * criteria.
 *
 * @example
 *
 * ```typescript
 * await expectAsync(
 *   Promise.reject(new Error('oops')),
 *   'to reject with error satisfying',
 *   'oops',
 * ); // passes
 * await expectAsync(
 *   Promise.reject(new Error('fail')),
 *   'to reject with error satisfying',
 *   /error/i,
 * ); // passes
 * await expectAsync(
 *   Promise.reject(new Error('oops')),
 *   'to reject with error satisfying',
 *   { message: 'oops' },
 * ); // passes
 * ```
 *
 * @group Parametric Assertions (Async)
 */
export const promiseRejectWithErrorSatisfyingAssertion = createAsyncAssertion(
  [WrappedPromiseLikeSchema, ['to reject with error satisfying'], z.any()],
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
    /* c8 ignore next 5 */
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
);

/**
 * Assertion for testing if a Promise fulfills with a value satisfying specific
 * criteria.
 *
 * @example
 *
 * ```typescript
 * await expectAsync(
 *   Promise.resolve('hello'),
 *   'to fulfill with value satisfying',
 *   'hello',
 * ); // passes
 * await expectAsync(
 *   Promise.resolve('world'),
 *   'to resolve with value satisfying',
 *   /wor/,
 * ); // passes
 * await expectAsync(
 *   Promise.resolve({ name: 'John' }),
 *   'to fulfill with value satisfying',
 *   { name: 'John' },
 * ); // passes
 * ```
 *
 * @group Parametric Assertions (Async)
 */
export const promiseFulfillWithValueSatisfyingAssertion = createAsyncAssertion(
  [
    WrappedPromiseLikeSchema,
    ['to fulfill with value satisfying', 'to resolve with value satisfying'],
    z.any(),
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
    /* c8 ignore next 5 */
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
);

/**
 * Assertion for testing if a function returns a Promise that fulfills with a
 * value satisfying specific criteria.
 *
 * @example
 *
 * ```typescript
 * await expectAsync(
 *   () => Promise.resolve('hello'),
 *   'to fulfill with value satisfying',
 *   'hello',
 * ); // passes
 * await expectAsync(
 *   () => Promise.resolve('world'),
 *   'to resolve with value satisfying',
 *   /wor/,
 * ); // passes
 * await expectAsync(
 *   () => Promise.resolve({ name: 'John' }),
 *   'to fulfill with value satisfying',
 *   { name: 'John' },
 * ); // passes
 * ```
 *
 * @group Parametric Assertions (Async)
 */
export const functionFulfillWithValueSatisfyingAssertion = createAsyncAssertion(
  [
    FunctionSchema,
    ['to fulfill with value satisfying', 'to resolve with value satisfying'],
    z.any(),
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
    /* c8 ignore next 5 */
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
);
