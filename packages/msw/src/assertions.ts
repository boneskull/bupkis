/**
 * MSW request verification assertions for Bupkis.
 *
 * @packageDocumentation
 */

import { createAsyncAssertion, expect, schema, z } from 'bupkis';

import type {
  PathMatcher,
  RequestMatchOptions,
  TrackedRequest,
} from './types.js';

import {
  PathMatcherSchema,
  RequestMatchOptionsSchema,
  TrackedServerSchema,
} from './schema.js';

/**
 * Checks if a request body satisfies the expected value.
 *
 * Uses deep equality for objects and strict equality for primitives.
 *
 * @function
 * @param actual - The actual request body
 * @param expected - The expected body value
 * @returns `true` if the body matches
 * @internal
 */
const bodySatisfies = (actual: unknown, expected: unknown): boolean => {
  if (expected === undefined) {
    return true;
  }
  if (actual === expected) {
    return true;
  }
  if (typeof actual === 'object' && typeof expected === 'object') {
    if (actual === null || expected === null) {
      return actual === expected;
    }
    const { entries } = Object;
    // Check if actual contains all properties from expected
    for (const [key, value] of entries(expected)) {
      const actualObj = actual as Record<string, unknown>;
      if (!(key in actualObj)) {
        return false;
      }
      if (!bodySatisfies(actualObj[key], value)) {
        return false;
      }
    }
    return true;
  }
  return false;
};

/**
 * Checks if request headers match expected headers.
 *
 * @function
 * @param actual - The actual request headers
 * @param expected - Expected headers (string for exact match, RegExp for
 *   pattern)
 * @returns `true` if all expected headers match
 * @internal
 */
const headersSatisfy = (
  actual: Record<string, string>,
  expected: Record<string, RegExp | string> | undefined,
): boolean => {
  if (!expected) {
    return true;
  }
  const { entries } = Object;
  for (const [key, expectedValue] of entries(expected)) {
    const actualValue = actual[key.toLowerCase()];
    if (actualValue === undefined) {
      return false;
    }
    if (expectedValue instanceof RegExp) {
      if (!expectedValue.test(actualValue)) {
        return false;
      }
    } else if (actualValue !== expectedValue) {
      return false;
    }
  }
  return true;
};

/**
 * Filters tracked requests that match the given path and options (sync
 * version).
 *
 * @function
 * @param requests - Array of tracked requests
 * @param path - Path matcher (string or RegExp)
 * @param options - Additional matching options
 * @returns Array of matching requests
 * @internal
 */
const filterMatchingRequests = (
  requests: TrackedRequest[],
  path: PathMatcher,
  options?: RequestMatchOptions,
): TrackedRequest[] => {
  return requests.filter((req) => {
    // Match path
    if (typeof path === 'string') {
      if (req.pathname !== path) {
        return false;
      }
    } else if (!path.test(req.pathname)) {
      return false;
    }

    // Match method (case-insensitive)
    if (options?.method) {
      if (req.method.toUpperCase() !== options.method.toUpperCase()) {
        return false;
      }
    }

    // Match body (sync version uses current value)
    if (options?.body !== undefined) {
      if (!bodySatisfies(req.body, options.body)) {
        return false;
      }
    }

    // Match headers
    if (options?.headers) {
      if (!headersSatisfy(req.headers, options.headers)) {
        return false;
      }
    }

    return true;
  });
};

/**
 * Filters tracked requests that match the given path and options (async
 * version).
 *
 * Awaits body promises when body matching is requested.
 *
 * @function
 * @param requests - Array of tracked requests
 * @param path - Path matcher (string or RegExp)
 * @param options - Additional matching options
 * @returns Promise resolving to array of matching requests
 * @internal
 */
const filterMatchingRequestsAsync = async (
  requests: TrackedRequest[],
  path: PathMatcher,
  options?: RequestMatchOptions,
): Promise<TrackedRequest[]> => {
  const results: TrackedRequest[] = [];

  for (const req of requests) {
    // Match path
    if (typeof path === 'string') {
      if (req.pathname !== path) {
        continue;
      }
    } else if (!path.test(req.pathname)) {
      continue;
    }

    // Match method (case-insensitive)
    if (options?.method) {
      if (req.method.toUpperCase() !== options.method.toUpperCase()) {
        continue;
      }
    }

    // Match body - await the body promise to ensure parsing is complete
    if (options?.body !== undefined) {
      const body = await req.bodyPromise;
      if (!bodySatisfies(body, options.body)) {
        continue;
      }
    }

    // Match headers
    if (options?.headers) {
      if (!headersSatisfy(req.headers, options.headers)) {
        continue;
      }
    }

    results.push(req);
  }

  return results;
};

/**
 * Formats tracked requests for error output.
 *
 * @function
 * @param requests - Array of tracked requests
 * @returns Formatted string showing request details
 * @internal
 */
const formatTrackedRequests = (requests: TrackedRequest[]): string => {
  if (requests.length === 0) {
    return '(no requests tracked)';
  }
  return requests.map((r) => `${r.method} ${r.pathname}`).join('\n');
};

// #region Basic Path Assertions (without options)

/**
 * Asserts that a tracked server handled a request to a specific path.
 *
 * @example
 *
 * ```ts
 * expect(server, 'to have handled request to', '/api/users');
 * ```
 */
export const toHaveHandledRequestToBasicAssertion = expect.createAssertion(
  [TrackedServerSchema, 'to have handled request to', PathMatcherSchema],
  (server, path) => {
    const requests = server.trackedRequests;
    const matches = filterMatchingRequests(requests, path);

    if (matches.length > 0) {
      return true;
    }

    return {
      actual: formatTrackedRequests(requests),
      expected: `request to ${path}`,
      message: `Expected server to have handled request to "${path}"`,
    };
  },
);

/**
 * Asserts that a tracked server handled a request to a specific path with
 * options.
 *
 * @example
 *
 * ```ts
 * // With method
 * expect(server, 'to have handled request to', '/api/users', {
 *   method: 'POST',
 * });
 *
 * // With body
 * expect(server, 'to have handled request to', '/api/users', {
 *   method: 'POST',
 *   body: { name: 'Alice' },
 * });
 *
 * // With headers
 * expect(server, 'to have handled request to', '/api/users', {
 *   headers: { authorization: /^Bearer / },
 * });
 *
 * // Request count
 * expect(server, 'to have handled request to', '/api/users', { times: 3 });
 * expect(server, 'to have handled request to', '/api/users', {
 *   once: true,
 * });
 * ```
 */
export const toHaveHandledRequestToWithOptionsAssertion =
  expect.createAssertion(
    [
      TrackedServerSchema,
      'to have handled request to',
      PathMatcherSchema,
      RequestMatchOptionsSchema,
    ],
    (server, path, options) => {
      const requests = server.trackedRequests;
      const matches = filterMatchingRequests(
        requests,
        path,
        options as RequestMatchOptions,
      );

      // Check count requirements
      const expectedCount = options?.once ? 1 : options?.times;
      if (expectedCount !== undefined) {
        if (matches.length !== expectedCount) {
          return {
            actual: matches.length,
            expected: expectedCount,
            message: `Expected server to have handled request to "${path}" ${expectedCount} time(s), but found ${matches.length}`,
          };
        }
        return true;
      }

      // Just check at least one match exists
      if (matches.length > 0) {
        return true;
      }

      return {
        actual: formatTrackedRequests(requests),
        expected: `request to ${path}${options?.method ? ` with method ${options.method}` : ''}`,
        message: `Expected server to have handled request to "${path}"`,
      };
    },
  );

// #endregion

// #region RegExp Pattern Matching

/**
 * Asserts that a tracked server handled a request matching a RegExp pattern.
 *
 * @example
 *
 * ```ts
 * expect(server, 'to have handled request matching', /\/api\/users\/\d+/);
 * ```
 */
export const toHaveHandledRequestMatchingBasicAssertion =
  expect.createAssertion(
    [
      TrackedServerSchema,
      'to have handled request matching',
      schema.RegExpSchema,
    ],
    (server, pattern) => {
      const requests = server.trackedRequests;
      const matches = filterMatchingRequests(requests, pattern);

      if (matches.length > 0) {
        return true;
      }

      return {
        actual: formatTrackedRequests(requests),
        expected: `request matching ${pattern}`,
        message: `Expected server to have handled request matching ${pattern}`,
      };
    },
  );

/**
 * Asserts that a tracked server handled a request matching a RegExp pattern
 * with options.
 *
 * @example
 *
 * ```ts
 * expect(server, 'to have handled request matching', /\/api\/users\/\d+/, {
 *   method: 'DELETE',
 * });
 * ```
 */
export const toHaveHandledRequestMatchingWithOptionsAssertion =
  expect.createAssertion(
    [
      TrackedServerSchema,
      'to have handled request matching',
      schema.RegExpSchema,
      RequestMatchOptionsSchema,
    ],
    (server, pattern, options) => {
      const requests = server.trackedRequests;
      const matches = filterMatchingRequests(
        requests,
        pattern,
        options as RequestMatchOptions,
      );

      // Check count requirements
      const expectedCount = options?.once ? 1 : options?.times;
      if (expectedCount !== undefined) {
        if (matches.length !== expectedCount) {
          return {
            actual: matches.length,
            expected: expectedCount,
            message: `Expected server to have handled request matching ${pattern} ${expectedCount} time(s), but found ${matches.length}`,
          };
        }
        return true;
      }

      // Just check at least one match exists
      if (matches.length > 0) {
        return true;
      }

      return {
        actual: formatTrackedRequests(requests),
        expected: `request matching ${pattern}`,
        message: `Expected server to have handled request matching ${pattern}`,
      };
    },
  );

// #endregion

// #region Request Count Assertions

/**
 * Asserts that a tracked server handled exactly N requests total.
 *
 * @example
 *
 * ```ts
 * expect(server, 'to have handled', 3, 'requests');
 * ```
 */
export const toHaveHandledCountAssertion = expect.createAssertion(
  [
    TrackedServerSchema,
    'to have handled',
    schema.NonNegativeIntegerSchema,
    z.literal('requests'),
  ],
  (server, expected) => {
    const actual = server.trackedRequests.length;
    if (actual === expected) {
      return true;
    }
    return {
      actual,
      expected,
      message: `Expected server to have handled ${expected} request(s), but handled ${actual}`,
    };
  },
);

/**
 * Asserts that a tracked server has handled at least one request.
 *
 * Use negation (`'not to have handled requests'`) to assert no requests.
 *
 * @example
 *
 * ```ts
 * // Passes when at least one request was handled
 * expect(server, 'to have handled requests');
 *
 * // Passes when no requests were handled
 * expect(server, 'not to have handled requests');
 * ```
 */
export const toHaveHandledRequestsAssertion = expect.createAssertion(
  [TrackedServerSchema, 'to have handled requests'],
  (server) => {
    const actual = server.trackedRequests.length;
    if (actual > 0) {
      return true;
    }
    return {
      message:
        'Expected server to have handled requests, but none were tracked',
    };
  },
);

// #endregion

// #region Async Assertions (for body matching)

/**
 * Async version of `toHaveHandledRequestToWithOptionsAssertion`.
 *
 * Automatically awaits body parsing - no need for `waitForBodies`.
 *
 * @example
 *
 * ```ts
 * await expectAsync(server, 'to have handled request to', '/api/users', {
 *   method: 'POST',
 *   body: { name: 'Alice' },
 * });
 * ```
 */
export const toHaveHandledRequestToWithOptionsAsyncAssertion =
  createAsyncAssertion(
    [
      TrackedServerSchema,
      'to have handled request to',
      PathMatcherSchema,
      RequestMatchOptionsSchema,
    ],
    async (server, path, options) => {
      const requests = server.trackedRequests;
      const matches = await filterMatchingRequestsAsync(
        requests,
        path,
        options as RequestMatchOptions,
      );

      // Check count requirements
      const expectedCount = options?.once ? 1 : options?.times;
      if (expectedCount !== undefined) {
        if (matches.length !== expectedCount) {
          return {
            actual: matches.length,
            expected: expectedCount,
            message: `Expected server to have handled request to "${path}" ${expectedCount} time(s), but found ${matches.length}`,
          };
        }
        return true;
      }

      // Just check at least one match exists
      if (matches.length > 0) {
        return true;
      }

      return {
        actual: formatTrackedRequests(requests),
        expected: `request to ${path}${options?.method ? ` with method ${options.method}` : ''}`,
        message: `Expected server to have handled request to "${path}"`,
      };
    },
  );

/**
 * Async version of `toHaveHandledRequestMatchingWithOptionsAssertion`.
 *
 * Automatically awaits body parsing - no need for `waitForBodies`.
 *
 * @example
 *
 * ```ts
 * await expectAsync(
 *   server,
 *   'to have handled request matching',
 *   /\/api\/users\/\d+/,
 *   {
 *     method: 'POST',
 *     body: { name: 'Alice' },
 *   },
 * );
 * ```
 */
export const toHaveHandledRequestMatchingWithOptionsAsyncAssertion =
  createAsyncAssertion(
    [
      TrackedServerSchema,
      'to have handled request matching',
      schema.RegExpSchema,
      RequestMatchOptionsSchema,
    ],
    async (server, pattern, options) => {
      const requests = server.trackedRequests;
      const matches = await filterMatchingRequestsAsync(
        requests,
        pattern,
        options as RequestMatchOptions,
      );

      // Check count requirements
      const expectedCount = options?.once ? 1 : options?.times;
      if (expectedCount !== undefined) {
        if (matches.length !== expectedCount) {
          return {
            actual: matches.length,
            expected: expectedCount,
            message: `Expected server to have handled request matching ${pattern} ${expectedCount} time(s), but found ${matches.length}`,
          };
        }
        return true;
      }

      // Just check at least one match exists
      if (matches.length > 0) {
        return true;
      }

      return {
        actual: formatTrackedRequests(requests),
        expected: `request matching ${pattern}`,
        message: `Expected server to have handled request matching ${pattern}`,
      };
    },
  );

// #endregion

/**
 * All MSW assertions for use with `expect.use()`.
 *
 * Includes both sync and async assertions. Use `expect` for sync assertions and
 * `expectAsync` for assertions that check body content.
 *
 * @example
 *
 * ```ts
 * import { use } from 'bupkis';
 * import mswAssertions from '@bupkis/msw';
 *
 * const { expect, expectAsync } = use(mswAssertions);
 *
 * // Sync - for path/method/header checking
 * expect(server, 'to have handled request to', '/api/users');
 *
 * // Async - for body checking (awaits body parsing automatically)
 * await expectAsync(server, 'to have handled request to', '/api/users', {
 *   body: { name: 'Bob' },
 * });
 * ```
 */
export const mswAssertions = [
  // Basic path assertions (sync)
  toHaveHandledRequestToBasicAssertion,
  toHaveHandledRequestToWithOptionsAssertion,
  // RegExp pattern matching (sync)
  toHaveHandledRequestMatchingBasicAssertion,
  toHaveHandledRequestMatchingWithOptionsAssertion,
  // Request count (sync)
  toHaveHandledCountAssertion,
  toHaveHandledRequestsAssertion,
  // Async versions (for body matching)
  toHaveHandledRequestToWithOptionsAsyncAssertion,
  toHaveHandledRequestMatchingWithOptionsAsyncAssertion,
] as const;
