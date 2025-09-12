/**
 * Callback-based assertion implementations.
 *
 * This module contains all built-in callback assertion implementations for
 * working with callback functions an (subject, expected) => { const { called,
 * error, value } = trapCallbackInvocation(subject); if (!called || error)
 * return false;
 *
 * ```
 *   if (isString(expected)) {
 *     return z.coerce.string().pipe(z.literal(expected)).safeParse(value)
 *       .success;
 *   } else if (isA(expected, RegExp)) {
 *     return z.coerce.string().regex(expected).safeParse(value).success;
 *   } else if (isNonNullObject(expected)) {
 *     return valueToSchema(expected, { literalPrimitives: true, strict: false }).safeParse(value)
 *       .success;
 *   }
 *   return Object.is(value, expected);
 * },erns. It provides assertions
 * ```
 *
 * For callback invocation, error handling, and value validation in both
 * synchronous and asynchronous contexts.
 *
 * @packageDocumentation
 */

import { z } from 'zod/v4';

import { isA, isNonNullObject, isString } from '../../guards.js';
import { ClassSchema, FunctionSchema } from '../../schema.js';
import { valueToSchema } from '../../util.js';
import { createAssertion, createAsyncAssertion } from '../create.js';

// Helper to trap single-parameter callback invocation
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

// Helper to trap nodeback (error-first) callback invocation
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

// Helper to trap async single-parameter callback invocation
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

// Helper to trap async nodeback (error-first) callback invocation
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

  // Callback with value - synchronous
  createAssertion(
    [
      FunctionSchema,
      ['to call callback with', 'to invoke callback with'],
      z.unknown(),
    ],
    (subject, expected) => {
      const { called, value } = trapCallbackInvocation(subject);
      if (!called) return false;

      if (isString(expected)) {
        return z.coerce.string().pipe(z.literal(expected)).safeParse(value)
          .success;
      } else if (isA(expected, RegExp)) {
        return z.coerce.string().regex(expected).safeParse(value).success;
      } else if (isNonNullObject(expected)) {
        return valueToSchema(expected, {
          literalPrimitives: true,
          strict: false,
        }).safeParse(value).success;
      }
      return Object.is(value, expected);
    },
  ),

  // Nodeback successfully - synchronous
  createAssertion(
    [
      FunctionSchema,
      ['to call nodeback successfully', 'to invoke nodeback successfully'],
      z.unknown(),
    ],
    (subject, expected) => {
      const { called, error, value } = trapNodebackInvocation(subject);
      if (!called || error) return false;

      if (isString(expected)) {
        return z.coerce.string().pipe(z.literal(expected)).safeParse(value)
          .success;
      } else if (isA(expected, RegExp)) {
        return z.coerce.string().regex(expected).safeParse(value).success;
      } else if (isNonNullObject(expected)) {
        return valueToSchema(expected, {
          literalPrimitives: true,
          strict: false,
        }).safeParse(value).success;
      }
      return Object.is(value, expected);
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
      return called && !!error;
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
      ClassSchema,
    ],
    (subject, ErrorClass) => {
      const { called, error } = trapNodebackInvocation(subject);
      if (!called || !error) return false;
      return isA(error, ErrorClass);
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
      if (!called || !error) return false;

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
        return valueToSchema(param, {
          literalPrimitives: true,
          strict: false,
        }).safeParse(error).success;
      }
      return false;
    },
  ),

  // Callback satisfying pattern - synchronous
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
      if (!called) return false;

      if (isString(param)) {
        return z.coerce.string().pipe(z.literal(param)).safeParse(value)
          .success;
      } else if (isA(param, RegExp)) {
        return z.coerce.string().regex(param).safeParse(value).success;
      } else if (isNonNullObject(param)) {
        return valueToSchema(param, {
          literalPrimitives: true,
          strict: false,
        }).safeParse(value).success;
      }
      return false;
    },
  ),

  // Nodeback satisfying pattern - synchronous
  createAssertion(
    [
      FunctionSchema,
      [
        'to call nodeback successfully satisfying',
        'to invoke nodeback successfully satisfying',
      ],
      z.union([z.string(), z.instanceof(RegExp), z.looseObject({})]),
    ],
    (subject, param) => {
      const { called, error, value } = trapNodebackInvocation(subject);
      if (!called || error) return false;

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
        return valueToSchema(param, {
          literalPrimitives: true,
          strict: false,
        }).safeParse(value).success;
      }
      return false;
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
      return called;
    },
  ),

  createAsyncAssertion(
    [
      FunctionSchema,
      ['to eventually call nodeback', 'to eventually invoke nodeback'],
    ],
    async (subject) => {
      const { called } = await trapAsyncNodebackInvocation(subject);
      return called;
    },
  ),

  createAsyncAssertion(
    [
      FunctionSchema,
      [
        'to eventually call callback with',
        'to eventually invoke callback with',
      ],
      z.unknown(),
    ],
    async (subject, expected) => {
      const { called, value } = await trapAsyncCallbackInvocation(subject);
      if (!called) return false;

      if (isString(expected)) {
        return z.coerce.string().pipe(z.literal(expected)).safeParse(value)
          .success;
      } else if (isA(expected, RegExp)) {
        return z.coerce.string().regex(expected).safeParse(value).success;
      } else if (isNonNullObject(expected)) {
        return valueToSchema(expected, {
          literalPrimitives: true,
          strict: false,
        }).safeParse(value).success;
      }
      return Object.is(value, expected);
    },
  ),

  createAsyncAssertion(
    [
      FunctionSchema,
      [
        'to eventually call nodeback successfully',
        'to eventually invoke nodeback successfully',
      ],
      z.unknown(),
    ],
    async (subject, expected) => {
      const { called, error, value } =
        await trapAsyncNodebackInvocation(subject);
      if (!called || error) return false;

      if (isString(expected)) {
        return z.coerce.string().pipe(z.literal(expected)).safeParse(value)
          .success;
      } else if (isA(expected, RegExp)) {
        return z.coerce.string().regex(expected).safeParse(value).success;
      } else if (isNonNullObject(expected)) {
        return valueToSchema(expected, {
          literalPrimitives: true,
          strict: false,
        }).safeParse(value).success;
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
      return called && !!error;
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
      ClassSchema,
    ],
    async (subject, ErrorClass) => {
      const { called, error } = await trapAsyncNodebackInvocation(subject);
      if (!called || !error) return false;
      return isA(error, ErrorClass);
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
      if (!called || !error) return false;

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
        return valueToSchema(param, {
          literalPrimitives: true,
          strict: false,
        }).safeParse(error).success;
      }
      return false;
    },
  ),

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
      if (!called) return false;

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
        return valueToSchema(param, {
          literalPrimitives: true,
          strict: false,
        }).safeParse(value).success;
      }
      return false;
    },
  ),

  createAsyncAssertion(
    [
      FunctionSchema,
      [
        'to eventually call nodeback successfully satisfying',
        'to eventually invoke nodeback successfully satisfying',
      ],
      z.union([z.string(), z.instanceof(RegExp), z.looseObject({})]),
    ],
    async (subject, param) => {
      const { called, error, value } =
        await trapAsyncNodebackInvocation(subject);
      if (!called || error) return false;

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
        const result = valueToSchema(param, {
          literalPrimitives: true,
          strict: false,
        }).safeParse(value);
        return result.success;
      }
      return false;
    },
  ),
] as const;
