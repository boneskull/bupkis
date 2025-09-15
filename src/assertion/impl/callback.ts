/**
 * Callback-based assertion implementations.
 *
 * For callback invocation, error handling, and value validation in both
 * synchronous and asynchronous contexts.
 *
 * @packageDocumentation
 */

import { inspect } from 'node:util';
import { z } from 'zod/v4';

import { isA, isNonNullObject, isString } from '../../guards.js';
import { ConstructibleSchema, FunctionSchema } from '../../schema.js';
import {
  valueToSchema,
  type ValueToSchemaOptions,
  valueToSchemaOptionsForDeepEqual,
  valueToSchemaOptionsForSatisfies,
} from '../../value-to-schema.js';
import { createAssertion, createAsyncAssertion } from '../create.js';

/**
 * Creates a standardized error object for when a callback or nodeback is not
 * called.
 *
 * @param type - The type of callback ('callback' or 'nodeback')
 * @returns Error object with consistent structure for sync assertions
 */
/* c8 ignore next */
const createNotCalledError = (type: 'callback' | 'nodeback') => ({
  actual: 'not called',
  expected: `${type} to be called`,
  message: `Expected ${type} to be called, but it was not called`,
});

/**
 * Creates a standardized error object for when a callback or nodeback is not
 * called in async contexts. Uses consistent field naming for async assertions.
 *
 * @param type - The type of callback ('callback' or 'nodeback')
 * @returns Error object with consistent structure for async assertions
 */
/* c8 ignore next */
const createAsyncNotCalledError = (type: 'callback' | 'nodeback') => ({
  actual: `${type} not called`,
  expected: `${type} to be called`,
  message: `Expected ${type} to be called, but it was not`,
});

/**
 * Creates error objects for nodeback error state mismatches in sync contexts.
 * Handles cases where an error is expected but not present, or vice versa.
 *
 * @param hasError - Whether the nodeback was called with an error
 * @param expectError - Whether an error was expected
 * @param error - The actual error value (if any)
 * @returns Error object if there's a mismatch, undefined if the state matches
 *   expectations
 */
const createErrorMismatchError = (
  hasError: boolean,
  expectError: boolean,
  error?: unknown,
) => {
  if (hasError && !expectError) {
    return {
      actual: 'called with error',
      expected: 'called without error',
      message: `Expected nodeback to be called without error, but it was called with error: ${inspect(
        error,
        { depth: 2 },
      )}`,
    };
  }
  if (!hasError && expectError) {
    return {
      actual: 'called without error',
      expected: 'called with error',
      message:
        'Expected nodeback to be called with an error, but it was called without error',
    };
  }
  return undefined;
};

/**
 * Creates error objects for nodeback error state mismatches in async contexts.
 * Handles cases where an error is expected but not present, or vice versa. Uses
 * consistent field naming and messaging for async assertions.
 *
 * @param hasError - Whether the nodeback was called with an error
 * @param expectError - Whether an error was expected
 * @param error - The actual error value (if any)
 * @returns Error object if there's a mismatch, undefined if the state matches
 *   expectations
 */
const createAsyncErrorMismatchError = (
  hasError: boolean,
  expectError: boolean,
  error?: unknown,
) => {
  if (hasError && !expectError) {
    return {
      actual: 'called with error',
      expected: 'called without error',
      message: `Expected nodeback to be called without error, but it was called with error: ${inspect(
        error,
        { depth: 2 },
      )}`,
    };
  }
  if (!hasError && expectError) {
    return {
      actual: 'called without error',
      expected: 'called with error',
      message:
        'Expected nodeback to be called with an error, but it was called without an error',
    };
  }
  return undefined;
};

/**
 * Creates a standardized error object for exact value comparison failures. Used
 * when a callback/nodeback is called with a value that doesn't match the
 * expected value using Object.is() strict equality.
 *
 * @param actual - The actual value the callback was called with
 * @param expected - The expected value
 * @param callbackType - The type of callback for error messaging
 * @returns Error object with formatted comparison message
 */
const createValueMismatchError = (
  actual: unknown,
  expected: unknown,
  callbackType: 'callback' | 'nodeback',
) => ({
  actual,
  expected,
  message: `Expected ${callbackType} to be called with exactly ${inspect(
    expected,
    { depth: 2 },
  )}, but it was called with ${inspect(actual, { depth: 2 })}`,
});

/**
 * Creates a Zod schema for validating error parameters in callback assertions.
 * Handles string literals, RegExp patterns, and object structures for error
 * matching.
 *
 * @param param - The error parameter to create a schema for
 * @returns Zod schema that can validate the error against the parameter
 * @throws TypeError if the parameter type is not supported
 */
const createErrorSchema = (param: unknown): z.ZodType => {
  if (isString(param)) {
    return z
      .looseObject({
        message: z.coerce.string().pipe(z.literal(param)),
      })
      .or(z.coerce.string().pipe(z.literal(param)));
  }
  if (isA(param, RegExp)) {
    return z
      .looseObject({
        message: z.coerce.string().regex(param),
      })
      .or(z.coerce.string().regex(param));
  }
  if (isNonNullObject(param)) {
    return valueToSchema(param, valueToSchemaOptionsForDeepEqual);
  }
  throw new TypeError(
    `Invalid parameter schema: ${inspect(param, { depth: 2 })}`,
  );
};

/**
 * Validates a value against a parameter using valueToSchema with specified
 * options. Centralizes the common pattern of schema creation and validation
 * used across many callback assertions.
 *
 * @param value - The value to validate
 * @param param - The parameter to validate against
 * @param options - Options to pass to valueToSchema
 * @returns Undefined if validation succeeds, ZodError if validation fails
 */
const validateValue = (
  value: unknown,
  param: unknown,
  options: ValueToSchemaOptions = {},
) => {
  const schema = valueToSchema(param, options);
  const result = schema.safeParse(value);
  return result.success ? undefined : result.error;
};

/**
 * Traps the invocation of a single-parameter callback function for synchronous
 * testing. Executes the provided function with a callback and captures whether
 * it was called, what arguments it received, and any errors thrown during
 * execution.
 *
 * @param fn - The function to execute that should call the provided callback
 * @returns Object containing invocation details: args, called, error, and value
 */
const trapCallbackInvocation = (fn: (...args: unknown[]) => unknown) => {
  let called = false;
  let error: unknown;
  let value: unknown;
  let args: unknown[] = [];

  const callback = (...cbArgs: unknown[]) => {
    called = true;
    args = cbArgs;
    if (cbArgs.length >= 1) {
      value = cbArgs[0];
    }
  };

  try {
    fn(callback);
  } catch (thrownError) {
    error = thrownError;
  }

  return { args, called, error, value };
};

/**
 * Traps the invocation of a nodeback (error-first callback) function for
 * synchronous testing. Executes the provided function with a nodeback and
 * captures whether it was called, what arguments it received, and any errors
 * thrown during execution.
 *
 * @param fn - The function to execute that should call the provided nodeback
 * @returns Object containing invocation details: args, called, error, and value
 */
const trapNodebackInvocation = (fn: (...args: unknown[]) => unknown) => {
  let called = false;
  let error: unknown;
  let value: unknown;
  let args: unknown[] = [];

  const nodeback = (err: unknown, val?: unknown) => {
    called = true;
    args = [err, val];
    error = err;
    value = val;
  };

  try {
    fn(nodeback);
  } catch (thrownError) {
    error = thrownError;
  }

  return { args, called, error, value };
};

/**
 * Traps the invocation of a single-parameter callback function for asynchronous
 * testing. Returns a Promise that resolves with invocation details once the
 * callback is called or an error occurs. Uses a Proxy to catch errors during
 * function execution.
 *
 * @param fn - The function to execute that should call the provided callback
 * @returns Promise resolving to object with invocation details: args, called,
 *   error, and value
 */
const trapAsyncCallbackInvocation = async (
  fn: (...args: unknown[]) => unknown,
) => {
  return new Promise<{
    args: unknown[];
    called: boolean;
    error: unknown;
    value: unknown;
  }>((resolve, _reject) => {
    let called = false;
    let error: unknown;
    let value: unknown;
    let args: unknown[] = [];

    const callback = (...cbArgs: unknown[]) => {
      called = true;
      args = cbArgs;
      if (cbArgs.length >= 1) {
        value = cbArgs[0];
      }
      resolve({ args, called, error, value });
    };

    const proxiedFn = new Proxy(fn, {
      apply(target, thisArg, argumentsList) {
        try {
          return Reflect.apply(target, thisArg, argumentsList);
        } catch (thrownError) {
          error = thrownError;
          resolve({ args, called, error, value });
        }
      },
    });

    try {
      proxiedFn(callback);
    } catch (thrownError) {
      error = thrownError;
      resolve({ args, called, error, value });
    }
  });
};

/**
 * Traps the invocation of a nodeback (error-first callback) function for
 * asynchronous testing. Returns a Promise that resolves with invocation details
 * once the nodeback is called or an error occurs. Uses a Proxy to catch errors
 * during function execution. Always resolves (never rejects) to allow assertion
 * logic to handle error conditions.
 *
 * @param fn - The function to execute that should call the provided nodeback
 * @returns Promise resolving to object with invocation details: args, called,
 *   error, and value
 */
const trapAsyncNodebackInvocation = async (
  fn: (...args: unknown[]) => unknown,
) => {
  return new Promise<{
    args: unknown[];
    called: boolean;
    error: unknown;
    value: unknown;
  }>((resolve, _reject) => {
    let called = false;
    let error: unknown;
    let value: unknown;
    let args: unknown[] = [];

    const nodeback = (err: unknown, val?: unknown) => {
      called = true;
      args = [err, val];
      error = err;
      value = val;

      // Always resolve with the result data, don't reject on nodeback errors
      // The assertion logic will check if error is truthy
      resolve({ args, called, error, value });
    };

    const proxiedFn = new Proxy(fn, {
      apply(target, thisArg, argumentsList) {
        try {
          return Reflect.apply(target, thisArg, argumentsList);
        } catch (thrownError) {
          error = thrownError;
          resolve({ args, called, error, value });
        }
      },
    });

    try {
      proxiedFn(nodeback);
    } catch (thrownError) {
      error = thrownError;
      resolve({ args, called, error, value });
    }
  });
};

export const CallbackSyncAssertions = [
  // Basic callback invocation - synchronous
  createAssertion(
    [FunctionSchema, ['to call callback', 'to invoke callback']],
    (subject) => {
      const { called } = trapCallbackInvocation(subject);
      return called;
    },
  ),

  createAssertion(
    [FunctionSchema, ['to call nodeback', 'to invoke nodeback']],
    (subject) => {
      const { called } = trapNodebackInvocation(subject);
      return called;
    },
  ),

  // Callback with value - deep equality check
  createAssertion(
    [
      FunctionSchema,
      ['to call callback with', 'to invoke callback with'],
      z.unknown(),
    ],
    (subject, param) => {
      const { called, value } = trapCallbackInvocation(subject);
      /* c8 ignore next */
      if (!called) {
        return createNotCalledError('callback');
      }

      return validateValue(value, param, valueToSchemaOptionsForDeepEqual);
    },
  ),

  // Callback with exact value - strict equality check
  createAssertion(
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
  ),

  // Nodeback with value - deep equality check
  createAssertion(
    [
      FunctionSchema,
      ['to call nodeback with', 'to invoke nodeback with'],
      z.unknown(),
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
  ),

  // Nodeback with exact value - strict equality check
  createAssertion(
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
  ),

  // Nodeback with error - synchronous
  createAssertion(
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
  ),

  // Nodeback with specific error class - synchronous
  createAssertion(
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
  ),

  // Nodeback with specific error pattern - synchronous
  createAssertion(
    [
      FunctionSchema,
      ['to call nodeback with error', 'to invoke nodeback with error'],
      z.union([z.string(), z.instanceof(RegExp), z.looseObject({})]),
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
  ),

  // Callback satisfying pattern - partial matching
  createAssertion(
    [
      FunctionSchema,
      [
        'to call callback with value satisfying',
        'to invoke callback with value satisfying',
      ],
      z.union([z.string(), z.instanceof(RegExp), z.looseObject({})]),
    ],
    (subject, param) => {
      const { called, value } = trapCallbackInvocation(subject);
      /* c8 ignore next */
      if (!called) {
        return createNotCalledError('callback');
      }

      return validateValue(value, param, valueToSchemaOptionsForSatisfies);
    },
  ),

  // Nodeback satisfying pattern - partial matching
  createAssertion(
    [
      FunctionSchema,
      [
        'to call nodeback with value satisfying',
        'to invoke nodeback with value satisfying',
      ],
      z.union([z.string(), z.instanceof(RegExp), z.looseObject({})]),
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
  ),
] as const;

export const CallbackAsyncAssertions = [
  // Async versions
  createAsyncAssertion(
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
  ),

  createAsyncAssertion(
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
  ),

  // Async callback with value - deep equality check
  createAsyncAssertion(
    [
      FunctionSchema,
      [
        'to eventually call callback with',
        'to eventually invoke callback with',
      ],
      z.unknown(),
    ],
    async (subject, param) => {
      const { called, value } = await trapAsyncCallbackInvocation(subject);
      /* c8 ignore next */
      if (!called) {
        return createAsyncNotCalledError('callback');
      }

      return validateValue(value, param, valueToSchemaOptionsForDeepEqual);
    },
  ),

  // Async callback with exact value - strict equality check
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
  ),

  // Async nodeback with value - deep equality check
  createAsyncAssertion(
    [
      FunctionSchema,
      [
        'to eventually call nodeback with',
        'to eventually invoke nodeback with',
      ],
      z.unknown(),
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
  ),

  // Async nodeback with exact value - strict equality check
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
  ),

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
  ),

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
          message: `Expected nodeback to be called with an instance of ${ctor.name}, but it was called with ${inspect(
            error,
            { depth: 2 },
          )}`,
        };
      }
    },
  ),

  createAsyncAssertion(
    [
      FunctionSchema,
      [
        'to eventually call nodeback with error',
        'to eventually invoke nodeback with error',
      ],
      z.union([z.string(), z.instanceof(RegExp), z.looseObject({})]),
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
  ),

  // Async callback satisfying pattern - partial matching
  createAsyncAssertion(
    [
      FunctionSchema,
      [
        'to eventually call callback with value satisfying',
        'to eventually invoke callback with value satisfying',
      ],
      z.union([z.string(), z.instanceof(RegExp), z.looseObject({})]),
    ],
    async (subject, param) => {
      const { called, value } = await trapAsyncCallbackInvocation(subject);
      /* c8 ignore next */
      if (!called) {
        return createAsyncNotCalledError('callback');
      }

      return validateValue(value, param, valueToSchemaOptionsForSatisfies);
    },
  ),

  // Async nodeback satisfying pattern - partial matching
  createAsyncAssertion(
    [
      FunctionSchema,
      [
        'to eventually call nodeback with value satisfying',
        'to eventually invoke nodeback with value satisfying',
      ],
      z.union([z.string(), z.instanceof(RegExp), z.looseObject({})]),
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
  ),
] as const;
