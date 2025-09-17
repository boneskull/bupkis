import { inspect } from 'util';
import { z } from 'zod/v4';

import { isA } from '../../guards.js';
import { ConstructibleSchema, FunctionSchema } from '../../schema.js';
import {
  valueToSchemaOptionsForDeepEqual,
  valueToSchemaOptionsForSatisfies,
} from '../../value-to-schema.js';
import { createAssertion } from '../create.js';
import {
  createErrorMismatchError,
  createErrorSchema,
  createNotCalledError,
  createValueMismatchError,
  trapCallbackInvocation,
  trapNodebackInvocation,
  validateValue,
} from './assertion-util.js';

/**
 * Assertion for testing if a function calls a callback.
 *
 * @example
 *
 * ```typescript
 * function withCallback(cb) {
 *   cb('result');
 * }
 * expect(withCallback, 'to call callback'); // passes
 *
 * function withoutCallback(cb) {
 *   // doesn't call cb
 * }
 * expect(withoutCallback, 'to invoke callback'); // fails
 * ```
 *
 * @group Callback Assertions
 */

export const functionCallCallbackAssertion = createAssertion(
  [FunctionSchema, ['to call callback', 'to invoke callback']],
  (subject) => {
    const { called } = trapCallbackInvocation(subject);
    return called;
  },
);
/**
 * Assertion for testing if a function calls a nodeback (Node.js-style callback
 * with error-first signature).
 *
 * @example
 *
 * ```typescript
 * function withNodeback(cb) {
 *   cb(null, 'result');
 * }
 * expect(withNodeback, 'to call nodeback'); // passes
 *
 * function withoutNodeback(cb) {
 *   // doesn't call cb
 * }
 * expect(withoutNodeback, 'to invoke nodeback'); // fails
 * ```
 *
 * @group Callback Assertions
 */

export const functionCallNodebackAssertion = createAssertion(
  [FunctionSchema, ['to call nodeback', 'to invoke nodeback']],
  (subject) => {
    const { called } = trapNodebackInvocation(subject);
    return called;
  },
);
/**
 * Assertion for testing if a function calls a callback with a specific value
 * (deep equality).
 *
 * @example
 *
 * ```typescript
 * function withCallbackValue(cb) {
 *   cb({ data: 'test' });
 * }
 * expect(withCallbackValue, 'to call callback with', { data: 'test' }); // passes
 *
 * function wrongValue(cb) {
 *   cb({ data: 'wrong' });
 * }
 * expect(wrongValue, 'to invoke callback with', { data: 'test' }); // fails
 * ```
 *
 * @group Callback Assertions
 */

export const functionCallCallbackWithValueAssertion = createAssertion(
  [
    FunctionSchema,
    ['to call callback with', 'to invoke callback with'],
    z.any(),
  ],
  (subject, param) => {
    const { called, value } = trapCallbackInvocation(subject);
    /* c8 ignore next */
    if (!called) {
      return createNotCalledError('callback');
    }

    return validateValue(value, param, valueToSchemaOptionsForDeepEqual);
  },
);
/**
 * Assertion for testing if a function calls a callback with an exact value
 * (strict equality using Object.is()).
 *
 * @example
 *
 * ```typescript
 * function withExactValue(cb) {
 *   cb('exact');
 * }
 * expect(withExactValue, 'to call callback with exactly', 'exact'); // passes
 *
 * function withDifferentValue(cb) {
 *   cb('different');
 * }
 * expect(withDifferentValue, 'to call callback with exact value', 'exact'); // fails
 * ```
 *
 * @group Callback Assertions
 */

export const functionCallCallbackWithExactValueAssertion = createAssertion(
  [
    FunctionSchema,
    [
      'to call callback with exactly',
      'to call callback with exact value',
      'to invoke callback with exactly',
      'to invoke callback with exact value',
    ],
    z.unknown(),
  ],
  (subject, expected) => {
    const { called, value } = trapCallbackInvocation(subject);
    /* c8 ignore next */
    if (!called) {
      return createNotCalledError('callback');
    }

    if (!Object.is(value, expected)) {
      return createValueMismatchError(value, expected, 'callback');
    }
  },
);
/**
 * Assertion for testing if a function calls a nodeback with a specific value
 * (deep equality). Ensures the nodeback is called without an error.
 *
 * @example
 *
 * ```typescript
 * function withNodebackValue(cb) {
 *   cb(null, { data: 'test' });
 * }
 * expect(withNodebackValue, 'to call nodeback with', { data: 'test' }); // passes
 *
 * function withError(cb) {
 *   cb(new Error('oops'), { data: 'test' });
 * }
 * expect(withError, 'to invoke nodeback with', { data: 'test' }); // fails (has error)
 * ```
 *
 * @group Callback Assertions
 */

export const functionCallNodebackWithValueAssertion = createAssertion(
  [
    FunctionSchema,
    ['to call nodeback with', 'to invoke nodeback with'],
    z.any(),
  ],
  (subject, param) => {
    const { called, error, value } = trapNodebackInvocation(subject);
    /* c8 ignore next */
    if (!called) {
      return createNotCalledError('nodeback');
    }

    const errorResult = createErrorMismatchError(!!error, false, error);
    if (errorResult) {
      return errorResult;
    }

    return validateValue(value, param, valueToSchemaOptionsForDeepEqual);
  },
);
/**
 * Assertion for testing if a function calls a nodeback with an exact value
 * (strict equality). Ensures the nodeback is called without an error.
 *
 * @example
 *
 * ```typescript
 * function withNodebackExact(cb) {
 *   cb(null, 'exact string');
 * }
 * expect(
 *   withNodebackExact,
 *   'to call nodeback with exactly',
 *   'exact string',
 * ); // passes
 *
 * function withSimilar(cb) {
 *   cb(null, 'exact string');
 * }
 * expect(
 *   withSimilar,
 *   'to invoke nodeback with exact value',
 *   new String('exact string'),
 * ); // fails (different objects)
 * ```
 *
 * @group Callback Assertions
 */

export const functionCallNodebackWithExactValueAssertion = createAssertion(
  [
    FunctionSchema,
    [
      'to call nodeback with exactly',
      'to call nodeback with exact value',
      'to invoke nodeback with exactly',
      'to invoke nodeback with exact value',
    ],
    z.unknown(),
  ],
  (subject, expected) => {
    const { called, error, value } = trapNodebackInvocation(subject);
    /* c8 ignore next */
    if (!called) {
      return createNotCalledError('nodeback');
    }

    const errorResult = createErrorMismatchError(!!error, false, error);
    if (errorResult) {
      return errorResult;
    }

    if (!Object.is(value, expected)) {
      return createValueMismatchError(value, expected, 'nodeback');
    }
  },
);
/**
 * Assertion for testing if a function calls a nodeback with an error. Ensures
 * the nodeback is called with an error as the first argument.
 *
 * @example
 *
 * ```typescript
 * function withError(cb) {
 *   cb(new Error('something went wrong'));
 * }
 * expect(withError, 'to call nodeback with error'); // passes
 *
 * function withoutError(cb) {
 *   cb(null, 'success');
 * }
 * expect(withoutError, 'to invoke nodeback with error'); // fails
 * ```
 *
 * @group Callback Assertions
 */

export const functionCallNodebackWithErrorAssertion = createAssertion(
  [
    FunctionSchema,
    ['to call nodeback with error', 'to invoke nodeback with error'],
  ],
  (subject) => {
    const { called, error } = trapNodebackInvocation(subject);
    /* c8 ignore next */
    if (!called) {
      return createNotCalledError('nodeback');
    }

    return createErrorMismatchError(!!error, true, error);
  },
);
/**
 * Assertion for testing if a function calls a nodeback with a specific error
 * class. Ensures the nodeback is called with an error instance of the specified
 * constructor.
 *
 * @example
 *
 * ```typescript
 * function withTypeError(cb) {
 *   cb(new TypeError('invalid type'));
 * }
 * expect(withTypeError, 'to call nodeback with a', TypeError); // passes
 *
 * function withGenericError(cb) {
 *   cb(new Error('generic error'));
 * }
 * expect(withGenericError, 'to invoke nodeback with an', TypeError); // fails
 * ```
 *
 * @group Callback Assertions
 */

export const functionCallNodebackWithErrorClassAssertion = createAssertion(
  [
    FunctionSchema,
    [
      'to call nodeback with a',
      'to call nodeback with an',
      'to invoke nodeback with a',
      'to invoke nodeback with an',
    ],
    ConstructibleSchema,
  ],
  (subject, ctor) => {
    const { called, error } = trapNodebackInvocation(subject);
    /* c8 ignore next */
    if (!called) {
      return createNotCalledError('nodeback');
    }

    const errorResult = createErrorMismatchError(!!error, true, error);
    if (errorResult) {
      return errorResult;
    }

    if (!isA(error, ctor)) {
      return {
        actual: error,
        expected: `instance of ${ctor.name}`,
        message: `Expected nodeback to be called with an instance of ${ctor.name}, but it was called with ${inspect(
          error,
          { depth: 2 },
        )}`,
      };
    }
  },
);
/**
 * Assertion for testing if a function calls a nodeback with an error matching a
 * pattern. Supports string, regexp, or object patterns for error matching.
 *
 * @example
 *
 * ```typescript
 * function withPatternError(cb) {
 *   cb(new Error('network timeout'));
 * }
 * expect(withPatternError, 'to call nodeback with error', /timeout/); // passes
 * expect(withPatternError, 'to invoke nodeback with error', {
 *   message: 'network timeout',
 * }); // passes
 * ```
 *
 * @group Callback Assertions
 */

export const functionCallNodebackWithErrorPatternAssertion = createAssertion(
  [
    FunctionSchema,
    ['to call nodeback with error', 'to invoke nodeback with error'],
    z.any(),
  ],
  (subject, param) => {
    const { called, error } = trapNodebackInvocation(subject);
    /* c8 ignore next */
    if (!called) {
      return createNotCalledError('nodeback');
    }

    const errorResult = createErrorMismatchError(!!error, true, error);
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
 * Assertion for testing if a function calls a callback with a value satisfying
 * a pattern. Supports partial matching using string, regexp, or object
 * patterns.
 *
 * @example
 *
 * ```typescript
 * function withCallbackValue(cb) {
 *   cb({ user: { name: 'John', age: 30 } });
 * }
 * expect(withCallbackValue, 'to call callback with value satisfying', {
 *   user: { name: 'John' },
 * }); // passes (partial match)
 * expect(
 *   withCallbackValue,
 *   'to invoke callback with value satisfying',
 *   /John/,
 * ); // passes (regexp match)
 * ```
 *
 * @group Callback Assertions
 */

export const functionCallCallbackWithValueSatisfyingAssertion = createAssertion(
  [
    FunctionSchema,
    [
      'to call callback with value satisfying',
      'to invoke callback with value satisfying',
    ],
    z.any(),
  ],
  (subject, param) => {
    const { called, value } = trapCallbackInvocation(subject);
    /* c8 ignore next */
    if (!called) {
      return createNotCalledError('callback');
    }

    return validateValue(value, param, valueToSchemaOptionsForSatisfies);
  },
);
/**
 * Assertion for testing if a function calls a nodeback with a value satisfying
 * a pattern. Supports partial matching using string, regexp, or object
 * patterns.
 *
 * @example
 *
 * ```typescript
 * function withNodebackValue(cb) {
 *   cb(null, { data: { items: ['a', 'b'] } });
 * }
 * expect(withNodebackValue, 'to call nodeback with value satisfying', {
 *   data: { items: Array },
 * }); // passes
 * expect(
 *   withNodebackValue,
 *   'to invoke nodeback with value satisfying',
 *   /items/,
 * ); // passes
 * ```
 *
 * @group Callback Assertions
 */

export const functionCallNodebackWithValueSatisfyingAssertion = createAssertion(
  [
    FunctionSchema,
    [
      'to call nodeback with value satisfying',
      'to invoke nodeback with value satisfying',
    ],
    z.any(),
  ],
  (subject, param) => {
    const { called, error, value } = trapNodebackInvocation(subject);
    /* c8 ignore next */
    if (!called) {
      return createNotCalledError('nodeback');
    }

    const errorResult = createErrorMismatchError(!!error, false, error);
    if (errorResult) {
      return errorResult;
    }

    return validateValue(value, param, valueToSchemaOptionsForSatisfies);
  },
);
