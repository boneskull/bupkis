/**
 * Utility functions for assertion implementations
 *
 * @internal
 * @packageDocumentation
 */

import { inspect } from 'util';
import { z } from 'zod/v4';

import { isA, isNonNullObject, isString } from '../../guards.js';
import {
  valueToSchema,
  type ValueToSchemaOptions,
  valueToSchemaOptionsForDeepEqual,
} from '../../value-to-schema.js';

/**
 * Creates a standardized error object for when a callback or nodeback is not
 * called.
 *
 * @param type - The type of callback ('callback' or 'nodeback')
 * @returns Error object with consistent structure for sync assertions
 */
/* c8 ignore next */
export const createNotCalledError = (type: 'callback' | 'nodeback') => ({
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
export const createAsyncNotCalledError = (type: 'callback' | 'nodeback') => ({
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
export const createErrorMismatchError = (
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
export const createAsyncErrorMismatchError = (
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
export const createValueMismatchError = (
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
export const createErrorSchema = (param: unknown): z.ZodType => {
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
 * @param subject - The value to validate
 * @param param - The parameter to validate against
 * @param options - Options to pass to valueToSchema
 * @returns Undefined if validation succeeds, ZodError if validation fails
 */
export const validateValue = <T = unknown>(
  subject: T,
  param: unknown,
  options: ValueToSchemaOptions = {},
) => {
  const schema = valueToSchema(param, options);
  const result = schema.safeParse(subject);
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
export const trapCallbackInvocation = (fn: (...args: unknown[]) => unknown) => {
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
export const trapNodebackInvocation = (fn: (...args: unknown[]) => unknown) => {
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
export const trapAsyncCallbackInvocation = async (
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
export const trapAsyncNodebackInvocation = async (
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

/**
 * Executes & traps a `Promise` rejected from an async function, capturing the
 * error.
 *
 * @param fn The function to execute that may throw an error or return a
 *   `Promise`
 * @returns Rejection
 */
export const trapAsyncFnError = async (fn: () => unknown) => {
  try {
    await fn();
  } catch (err) {
    return err;
  }
};

/**
 * Awaits & traps a Promise, capturing any rejection error.
 *
 * @param promise The `Promise` to trap
 * @returns Rejection
 */
export const trapPromiseError = async (promise: PromiseLike<unknown>) => {
  try {
    await promise;
  } catch (err) {
    return err;
  }
};

/**
 * Executes & traps a synchronous function that may throw, capturing any thrown
 * error and discarding the result.
 *
 * @remarks
 * Avoids throwing `undefined` for some reason.
 * @param fn Function to execute
 * @returns Error
 */
export const trapError = (fn: () => unknown): unknown => {
  try {
    fn();
  } catch (err) {
    if (err === undefined) {
      return new Error('Function threw undefined');
    }
    return err;
  }
};
