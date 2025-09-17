/**
 * Callback-based assertion implementations.
 *
 * For callback invocation, error handling, and value validation in both
 * synchronous and asynchronous contexts.
 *
 * @packageDocumentation
 * @groupDescription Callback Assertions
 * Individual assertions are documented where they are exported.
 *
 * @showGroups
 */

import { inspect as assertions } from 'node:util';
import { z } from 'zod/v4';

import { isA } from '../../guards.js';
import { ConstructibleSchema, FunctionSchema } from '../../schema.js';
import {
  valueToSchemaOptionsForDeepEqual,
  valueToSchemaOptionsForSatisfies,
} from '../../value-to-schema.js';
import { createAsyncAssertion } from '../create.js';
import {
  createAsyncErrorMismatchError,
  createAsyncNotCalledError,
  createErrorSchema,
  trapAsyncCallbackInvocation,
  trapAsyncNodebackInvocation,
  validateValue,
} from './assertion-util.js';

/**
 * Async assertion for testing if a function eventually calls a callback.
 *
 * @example
 *
 * ```typescript
 * async function withAsyncCallback(cb) {
 *   setTimeout(() => cb('result'), 10);
 * }
 * await expectAsync(withAsyncCallback, 'to eventually call callback'); // passes
 * ```
 *
 * @group Callback Assertions
 */
export const functionEventuallyCallCallbackAssertion = createAsyncAssertion(
  [
    FunctionSchema,
    ['to eventually call callback', 'to eventually invoke callback'],
  ],
  async (subject) => {
    const { called } = await trapAsyncCallbackInvocation(subject);
    /* c8 ignore next */
    if (!called) {
      return {
        actual: 'callback not called',
        expected: 'callback to be called',
        message: `Expected callback to be called, but it was not`,
      };
    }
  },
);

/**
 * Async assertion for testing if a function eventually calls a nodeback.
 *
 * @example
 *
 * ```typescript
 * async function withAsyncNodeback(cb) {
 *   setTimeout(() => cb(null, 'result'), 10);
 * }
 * await expectAsync(withAsyncNodeback, 'to eventually call nodeback'); // passes
 * ```
 *
 * @group Callback Assertions
 */
export const functionEventuallyCallNodebackAssertion = createAsyncAssertion(
  [
    FunctionSchema,
    ['to eventually call nodeback', 'to eventually invoke nodeback'],
  ],
  async (subject) => {
    const { called } = await trapAsyncNodebackInvocation(subject);
    /* c8 ignore next */
    if (!called) {
      return {
        actual: 'nodeback not called',
        expected: 'nodeback to be called',
        message: `Expected nodeback to be called, but it was not`,
      };
    }
  },
);

/**
 * Async assertion for testing if a function eventually calls a callback with a
 * specific value (deep equality).
 *
 * @example
 *
 * ```typescript
 * async function withAsyncCallbackValue(cb) {
 *   setTimeout(() => cb({ data: 'test' }), 10);
 * }
 * await expectAsync(
 *   withAsyncCallbackValue,
 *   'to eventually call callback with',
 *   { data: 'test' },
 * ); // passes
 * ```
 *
 * @group Callback Assertions
 */
export const functionEventuallyCallCallbackWithValueAssertion =
  createAsyncAssertion(
    [
      FunctionSchema,
      [
        'to eventually call callback with',
        'to eventually invoke callback with',
      ],
      z.any(),
    ],
    async (subject, param) => {
      const { called, value } = await trapAsyncCallbackInvocation(subject);
      /* c8 ignore next */
      if (!called) {
        return createAsyncNotCalledError('callback');
      }

      return validateValue(value, param, valueToSchemaOptionsForDeepEqual);
    },
  );

/**
 * Async assertion for testing if a function eventually calls a callback with an
 * exact value (strict equality).
 *
 * @example
 *
 * ```typescript
 * async function withAsyncCallbackExact(cb) {
 *   setTimeout(() => cb('exact string'), 10);
 * }
 * await expectAsync(
 *   withAsyncCallbackExact,
 *   'to eventually call callback with exactly',
 *   'exact string',
 * ); // passes
 * ```
 *
 * @group Callback Assertions
 */
export const functionEventuallyCallCallbackWithExactValueAssertion =
  createAsyncAssertion(
    [
      FunctionSchema,
      [
        'to eventually call callback with exactly',
        'to eventually call callback with exact value',
        'to eventually invoke callback with exactly',
        'to eventually invoke callback with exact value',
      ],
      z.unknown(),
    ],
    async (subject, expected) => {
      const { called, value } = await trapAsyncCallbackInvocation(subject);
      /* c8 ignore next */
      if (!called) {
        return createAsyncNotCalledError('callback');
      }
      return Object.is(value, expected);
    },
  );

/**
 * Async assertion for testing if a function eventually calls a nodeback with a
 * specific value (deep equality). Ensures the nodeback is called without an
 * error.
 *
 * @example
 *
 * ```typescript
 * async function withAsyncNodebackValue(cb) {
 *   setTimeout(() => cb(null, { data: 'test' }), 10);
 * }
 * await expectAsync(
 *   withAsyncNodebackValue,
 *   'to eventually call nodeback with',
 *   { data: 'test' },
 * ); // passes
 * ```
 *
 * @group Callback Assertions
 */
export const functionEventuallyCallNodebackWithValueAssertion =
  createAsyncAssertion(
    [
      FunctionSchema,
      [
        'to eventually call nodeback with',
        'to eventually invoke nodeback with',
      ],
      z.any(),
    ],
    async (subject, param) => {
      const { called, error, value } =
        await trapAsyncNodebackInvocation(subject);
      /* c8 ignore next */
      if (!called) {
        return createAsyncNotCalledError('nodeback');
      }

      const errorResult = createAsyncErrorMismatchError(!!error, false, error);
      if (errorResult) {
        return errorResult;
      }

      return validateValue(value, param, valueToSchemaOptionsForDeepEqual);
    },
  );

/**
 * Async assertion for testing if a function eventually calls a nodeback with an
 * exact value (strict equality). Ensures the nodeback is called without an
 * error.
 *
 * @example
 *
 * ```typescript
 * async function withAsyncNodebackExact(cb) {
 *   setTimeout(() => cb(null, 'exact string'), 10);
 * }
 * await expectAsync(
 *   withAsyncNodebackExact,
 *   'to eventually call nodeback with exactly',
 *   'exact string',
 * ); // passes
 * ```
 *
 * @group Callback Assertions
 */
export const functionEventuallyCallNodebackWithExactValueAssertion =
  createAsyncAssertion(
    [
      FunctionSchema,
      [
        'to eventually call nodeback with exactly',
        'to eventually call nodeback with exact value',
        'to eventually invoke nodeback with exactly',
        'to eventually invoke nodeback with exact value',
      ],
      z.unknown(),
    ],
    async (subject, expected) => {
      const { called, error, value } =
        await trapAsyncNodebackInvocation(subject);
      /* c8 ignore next */
      if (!called) {
        return createAsyncNotCalledError('nodeback');
      }

      const errorResult = createAsyncErrorMismatchError(!!error, false, error);
      if (errorResult) {
        return errorResult;
      }

      return Object.is(value, expected);
    },
  );

/**
 * Async assertion for testing if a function eventually calls a nodeback with an
 * error. Ensures the nodeback is called with an error as the first argument.
 *
 * @example
 *
 * ```typescript
 * async function withAsyncError(cb) {
 *   setTimeout(() => cb(new Error('something went wrong')), 10);
 * }
 * await expectAsync(
 *   withAsyncError,
 *   'to eventually call nodeback with error',
 * ); // passes
 * ```
 *
 * @group Callback Assertions
 */
export const functionEventuallyCallNodebackWithErrorAssertion =
  createAsyncAssertion(
    [
      FunctionSchema,
      [
        'to eventually call nodeback with error',
        'to eventually invoke nodeback with error',
      ],
    ],
    async (subject) => {
      const { called, error } = await trapAsyncNodebackInvocation(subject);
      /* c8 ignore next */
      if (!called) {
        return createAsyncNotCalledError('nodeback');
      }

      return createAsyncErrorMismatchError(!!error, true, error);
    },
  );

/**
 * Async assertion for testing if a function eventually calls a nodeback with a
 * specific error class. Ensures the nodeback is called with an error instance
 * of the specified constructor.
 *
 * @example
 *
 * ```typescript
 * async function withAsyncTypeError(cb) {
 *   setTimeout(() => cb(new TypeError('invalid type')), 10);
 * }
 * await expectAsync(
 *   withAsyncTypeError,
 *   'to eventually call nodeback with a',
 *   TypeError,
 * ); // passes
 * ```
 *
 * @group Callback Assertions
 */
export const functionEventuallyCallNodebackWithErrorClassAssertion =
  createAsyncAssertion(
    [
      FunctionSchema,
      [
        'to eventually call nodeback with a',
        'to eventually call nodeback with an',
        'to eventually invoke nodeback with a',
        'to eventually invoke nodeback with an',
      ],
      ConstructibleSchema,
    ],
    async (subject, ctor) => {
      const { called, error } = await trapAsyncNodebackInvocation(subject);
      /* c8 ignore next */
      if (!called) {
        return createAsyncNotCalledError('nodeback');
      }

      const errorResult = createAsyncErrorMismatchError(!!error, true, error);
      if (errorResult) {
        return errorResult;
      }

      if (!isA(error, ctor)) {
        return {
          actual: error,
          expected: `instance of ${ctor.name}`,
          message: `Expected nodeback to be called with an instance of ${ctor.name}, but it was called with ${assertions(
            error,
            { depth: 2 },
          )}`,
        };
      }
    },
  );

/**
 * Async assertion for testing if a function eventually calls a nodeback with an
 * error matching a pattern. Supports string, regexp, or object patterns for
 * error matching.
 *
 * @example
 *
 * ```typescript
 * async function withAsyncPatternError(cb) {
 *   setTimeout(() => cb(new Error('network timeout')), 10);
 * }
 * await expectAsync(
 *   withAsyncPatternError,
 *   'to eventually call nodeback with error',
 *   /timeout/,
 * ); // passes
 * ```
 *
 * @group Callback Assertions
 */
export const functionEventuallyCallNodebackWithErrorPatternAssertion =
  createAsyncAssertion(
    [
      FunctionSchema,
      [
        'to eventually call nodeback with error',
        'to eventually call nodeback with error satisfying',
        'to eventually invoke nodeback with error',
        'to eventually invoke nodeback with error satisfying',
      ],
      z.any(),
    ],
    async (subject, param) => {
      const { called, error } = await trapAsyncNodebackInvocation(subject);
      /* c8 ignore next */
      if (!called) {
        return createAsyncNotCalledError('nodeback');
      }

      const errorResult = createAsyncErrorMismatchError(!!error, true, error);
      if (errorResult) {
        return errorResult;
      }

      const schema = createErrorSchema(param);
      const result = schema.safeParse(error);
      if (!result.success) {
        return result.error;
      }
    },
  );

/**
 * Async assertion for testing if a function eventually calls a callback with a
 * value satisfying a pattern. Supports partial matching using string, regexp,
 * or object patterns.
 *
 * @example
 *
 * ```typescript
 * async function withAsyncCallbackValue(cb) {
 *   setTimeout(() => cb({ user: { name: 'John', age: 30 } }), 10);
 * }
 * await expectAsync(
 *   withAsyncCallbackValue,
 *   'to eventually call callback with value satisfying',
 *   { user: { name: 'John' } },
 * ); // passes
 * ```
 *
 * @group Callback Assertions
 */
export const functionEventuallyCallCallbackWithValueSatisfyingAssertion =
  createAsyncAssertion(
    [
      FunctionSchema,
      [
        'to eventually call callback with value satisfying',
        'to eventually invoke callback with value satisfying',
      ],
      z.any(),
    ],
    async (subject, param) => {
      const { called, value } = await trapAsyncCallbackInvocation(subject);
      /* c8 ignore next */
      if (!called) {
        return createAsyncNotCalledError('callback');
      }

      return validateValue(value, param, valueToSchemaOptionsForSatisfies);
    },
  );

/**
 * Async assertion for testing if a function eventually calls a nodeback with a
 * value satisfying a pattern. Supports partial matching using string, regexp,
 * or object patterns.
 *
 * @example
 *
 * ```typescript
 * async function withAsyncNodebackValue(cb) {
 *   setTimeout(() => cb(null, { data: { items: ['a', 'b'] } }), 10);
 * }
 * await expectAsync(
 *   withAsyncNodebackValue,
 *   'to eventually call nodeback with value satisfying',
 *   { data: { items: Array } },
 * ); // passes
 * ```
 *
 * @group Callback Assertions
 */
export const functionEventuallyCallNodebackWithValueSatisfyingAssertion =
  createAsyncAssertion(
    [
      FunctionSchema,
      [
        'to eventually call nodeback with value satisfying',
        'to eventually invoke nodeback with value satisfying',
      ],
      z.any(),
    ],
    async (subject, param) => {
      const { called, error, value } =
        await trapAsyncNodebackInvocation(subject);
      /* c8 ignore next */
      if (!called) {
        return createAsyncNotCalledError('nodeback');
      }

      const errorResult = createAsyncErrorMismatchError(!!error, false, error);
      if (errorResult) {
        return errorResult;
      }

      return validateValue(value, param, valueToSchemaOptionsForSatisfies);
    },
  );
