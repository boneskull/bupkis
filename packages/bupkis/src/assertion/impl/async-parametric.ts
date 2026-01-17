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
import { type z } from 'zod';

import { isA, isNonNullObject, isString } from '../../guards.js';
import {
  ConstructibleSchema,
  createErrorMessageRegexSchema,
  createErrorMessageSchema,
  FunctionSchema,
  UnknownSchema,
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
 * @bupkisAnchor function-to-resolve
 * @bupkisAssertionCategory promise
 */
export const functionResolveAssertion = createAsyncAssertion(
  [FunctionSchema, ['to resolve', 'to fulfill']],
  async (subject) => {
    try {
      await subject();
    } catch {
      return {
        message: 'Expected function to fulfill, but it rejected instead',
      };
    }
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
 * @bupkisAssertionCategory promise
 * @bupkisAnchor promise-to-resolve
 * @group Parametric Assertions (Async)
 */
export const promiseResolveAssertion = createAsyncAssertion(
  [WrappedPromiseLikeSchema, ['to resolve', 'to fulfill']],
  async (subject) => {
    try {
      await subject;
    } catch {
      return {
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
  [FunctionSchema, ['to reject', 'to be rejected']],
  async (subject) => {
    const { error, result } = await trapAsyncFnError(subject);
    if (error === undefined) {
      return {
        message: `Expected function to reject, but it fulfilled with ${inspect(result)}`,
      };
    }
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
  [WrappedPromiseLikeSchema, ['to reject', 'to be rejected']],
  async (subject) => {
    const { error, result } = await trapPromiseError(subject);
    if (error === undefined) {
      return {
        message: `Expected Promise to reject, but it fulfilled with ${inspect(result)}`,
      };
    }
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
    [
      'to reject with a',
      'to reject with an',
      'to be rejected with a',
      'to be rejected with an',
    ],
    ConstructibleSchema,
  ],
  async (subject, ctor) => {
    const { error, result } = await trapAsyncFnError(subject);
    if (error === undefined) {
      return {
        message: `Expected function to reject, but it fulfilled with ${inspect(result)}`,
      };
    }
    if (!isA(error, ctor)) {
      if (isNonNullObject(error)) {
        const err = error as object;
        return {
          actual: err.constructor.name,
          expected: ctor.name,
          message: `Expected function to reject with an instance of ${ctor.name}, but it rejected with a ${err.constructor.name}`,
        };
      }
      return {
        actual: typeof error,
        expected: ctor.name,
        message: `Expected function to reject with an instance of ${ctor.name}, but it rejected with a value of type ${typeof error}: ${inspect(error)}`,
      };
    }
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
    [
      'to reject with a',
      'to reject with an',
      'to be rejected with a',
      'to be rejected with an',
    ],
    ConstructibleSchema,
  ],
  async (subject, ctor) => {
    const { error, result } = await trapPromiseError(subject);
    if (error === undefined) {
      return {
        message: `Expected Promise to reject, but it fulfilled with ${inspect(result)}`,
      };
    }
    if (!isA(error, ctor)) {
      if (isNonNullObject(error)) {
        const err = error as object;
        return {
          actual: err.constructor.name,
          expected: ctor.name,
          message: `Expected Promise to reject with an instance of ${ctor.name}, but it rejected with a ${err.constructor.name}`,
        };
      }
      return {
        actual: typeof error,
        expected: ctor.name,
        message: `Expected Promise to reject with an instance of ${ctor.name}, but it rejected with a value of type ${typeof error}: ${inspect(error)}`,
      };
    }
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
  [
    FunctionSchema,
    ['to reject with error satisfying', 'to be rejected with error satisfying'],
    UnknownSchema,
  ],
  async (subject, param) => {
    const { error, result } = await trapAsyncFnError(subject);
    if (error === undefined) {
      return {
        message: `Expected function to reject, but it fulfilled with ${inspect(result)}`,
      };
    }

    let schema: z.ZodType;
    if (isString(param)) {
      schema = createErrorMessageSchema(param);
    } else if (isA(param, RegExp)) {
      schema = createErrorMessageRegexSchema(param);
    } else {
      schema = valueToSchema(param, valueToSchemaOptionsForSatisfies);
    }

    return {
      schema,
      subject: error,
    };
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
  [
    WrappedPromiseLikeSchema,
    ['to reject with error satisfying', 'to be rejected with error satisfying'],
    UnknownSchema,
  ],
  async (subject, param) => {
    const { error, result } = await trapPromiseError(subject);
    if (error === undefined) {
      return {
        message: `Expected Promise to reject, but it fulfilled with ${inspect(result)}`,
      };
    }
    let schema: z.ZodType;
    if (isString(param)) {
      schema = createErrorMessageSchema(param);
    } else if (isA(param, RegExp)) {
      schema = createErrorMessageRegexSchema(param);
    } else {
      schema = valueToSchema(param, valueToSchemaOptionsForSatisfies);
    }

    return {
      schema,
      subject: error,
    };
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
export const promiseResolveWithValueSatisfyingAssertion = createAsyncAssertion(
  [
    WrappedPromiseLikeSchema,
    ['to fulfill with value satisfying', 'to resolve with value satisfying'],
    UnknownSchema,
  ],
  async (promise, param) => {
    let value: unknown;
    try {
      value = await promise;
    } catch (err) {
      return {
        message: `Expected Promise to fulfill, but it rejected with ${inspect(
          err,
        )}`,
      };
    }

    const schema = valueToSchema(param, valueToSchemaOptionsForSatisfies);

    return {
      schema,
      subject: value,
    };
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
    UnknownSchema,
  ],
  async (subject, param) => {
    let value: unknown;
    try {
      value = await subject();
    } catch (err) {
      return {
        message: `Expected function to fulfill, but it rejected with ${inspect(
          err,
        )}`,
      };
    }

    const schema = valueToSchema(param, valueToSchemaOptionsForSatisfies);
    return {
      schema,
      subject: value,
    };
  },
);
