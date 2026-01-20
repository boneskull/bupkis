/**
 * HTTP response assertions for Bupkis.
 *
 * @packageDocumentation
 */

import { expect, schema, z } from 'bupkis';

import type { HttpResponse } from './guards.js';

const { isArray } = Array;
const { entries, keys } = Object;

import { HttpResponseSchema } from './schema.js';

// #region Status Code Assertions

/**
 * Valid status category names for status assertions.
 */
const StatusCategorySchema = z.enum([
  'ok',
  'redirect',
  'client error',
  'server error',
]);

type StatusCategory = z.infer<typeof StatusCategorySchema>;

/**
 * Maps status category names to their HTTP status code ranges.
 */
const STATUS_RANGES: Record<StatusCategory, { max: number; min: number }> = {
  'client error': { max: 499, min: 400 },
  ok: { max: 299, min: 200 },
  redirect: { max: 399, min: 300 },
  'server error': { max: 599, min: 500 },
};

/**
 * Determines the category name for a given status code.
 *
 * @function
 */
const getStatusCategory = (status: number): string => {
  if (status >= 200 && status < 300) {
    return 'ok (2xx)';
  }
  if (status >= 300 && status < 400) {
    return 'redirect (3xx)';
  }
  if (status >= 400 && status < 500) {
    return 'client error (4xx)';
  }
  if (status >= 500 && status < 600) {
    return 'server error (5xx)';
  }
  return `unknown (${status})`;
};

/**
 * Asserts that a response has a specific HTTP status code.
 *
 * @example
 *
 * ```ts
 * expect(response, 'to have status', 200);
 * expect(response, 'to have status', 404);
 * ```
 */
export const toHaveStatusAssertion = expect.createAssertion(
  [
    HttpResponseSchema,
    ['to have status', 'to respond with status'],
    z.number(),
  ],
  (response: HttpResponse, expected: number) => {
    if (response.status === expected) {
      return true;
    }
    return {
      actual: response.status,
      expected,
      message: `Expected response to have status ${expected}`,
    };
  },
);

/**
 * Asserts that a response has a status code within a category.
 *
 * @example
 *
 * ```ts
 * expect(response, 'to have status', 'ok'); // 2xx
 * expect(response, 'to have status', 'redirect'); // 3xx
 * expect(response, 'to have status', 'client error'); // 4xx
 * expect(response, 'to have status', 'server error'); // 5xx
 * ```
 */
export const toHaveStatusCategoryAssertion = expect.createAssertion(
  [
    HttpResponseSchema,
    ['to have status', 'to respond with status'],
    StatusCategorySchema,
  ],
  (response: HttpResponse, category: StatusCategory) => {
    const range = STATUS_RANGES[category];
    if (response.status >= range.min && response.status <= range.max) {
      return true;
    }
    return {
      actual: `${response.status} (${getStatusCategory(response.status)})`,
      expected: `${category} (${range.min}-${range.max})`,
      message: `Expected response to have ${category} status`,
    };
  },
);

// #endregion

// #region Header Assertions

/**
 * Gets the headers object from a response, handling both `headers` and `header`
 * property names.
 *
 * @function
 */
const getHeaders = (
  response: HttpResponse,
): Record<string, string | string[] | undefined> | undefined =>
  response.headers ?? response.header;

/**
 * Gets a header value by name (case-insensitive).
 *
 * @function
 * @param response - The HTTP response
 * @param name - The header name to look up
 * @returns The header value, or undefined if not found
 */
const getHeaderValue = (
  response: HttpResponse,
  name: string,
): string | string[] | undefined => {
  const headers = getHeaders(response);
  if (!headers) {
    return undefined;
  }

  // HTTP headers are case-insensitive, so we need to search
  const lowerName = name.toLowerCase();
  for (const [key, value] of entries(headers)) {
    if (key.toLowerCase() === lowerName) {
      return value;
    }
  }
  return undefined;
};

/**
 * Asserts that a response has a specific header (existence check only).
 *
 * @example
 *
 * ```ts
 * expect(response, 'to have header', 'content-type');
 * expect(response, 'to have header', 'X-Request-Id');
 * ```
 */
export const toHaveHeaderAssertion = expect.createAssertion(
  [HttpResponseSchema, ['to have header', 'to include header'], z.string()],
  (response: HttpResponse, headerName: string) => {
    const value = getHeaderValue(response, headerName);
    if (value !== undefined) {
      return true;
    }
    const headers = getHeaders(response);
    return {
      actual: headers ? keys(headers).join(', ') : 'no headers',
      expected: headerName,
      message: `Expected response to have header "${headerName}"`,
    };
  },
);

/**
 * Asserts that a response has a header with an exact value.
 *
 * @example
 *
 * ```ts
 * expect(response, 'to have header', 'content-type', 'application/json');
 * expect(response, 'to have header', 'cache-control', 'no-cache');
 * ```
 */
export const toHaveHeaderValueAssertion = expect.createAssertion(
  [
    HttpResponseSchema,
    ['to have header', 'to include header'],
    z.string(),
    z.string(),
  ],
  (response: HttpResponse, headerName: string, expectedValue: string) => {
    const actualValue = getHeaderValue(response, headerName);

    if (actualValue === undefined) {
      const headers = getHeaders(response);
      return {
        actual: headers ? keys(headers).join(', ') : 'no headers',
        expected: `${headerName}: ${expectedValue}`,
        message: `Expected response to have header "${headerName}"`,
      };
    }

    // Handle array values (multiple headers with same name)
    const actualString = isArray(actualValue)
      ? actualValue.join(', ')
      : actualValue;

    if (actualString === expectedValue) {
      return true;
    }

    return {
      actual: actualString,
      expected: expectedValue,
      message: `Expected header "${headerName}" to equal "${expectedValue}"`,
    };
  },
);

/**
 * Asserts that a response has a header matching a regex pattern.
 *
 * @example
 *
 * ```ts
 * expect(response, 'to have header', 'content-type', /json/);
 * expect(response, 'to have header', 'cache-control', /max-age=\d+/);
 * ```
 */
export const toHaveHeaderMatchingAssertion = expect.createAssertion(
  [
    HttpResponseSchema,
    ['to have header', 'to include header'],
    z.string(),
    z.instanceof(RegExp),
  ],
  (response: HttpResponse, headerName: string, pattern: RegExp) => {
    const actualValue = getHeaderValue(response, headerName);

    if (actualValue === undefined) {
      const headers = getHeaders(response);
      return {
        actual: headers ? keys(headers).join(', ') : 'no headers',
        expected: `${headerName} matching ${pattern}`,
        message: `Expected response to have header "${headerName}"`,
      };
    }

    // Handle array values (multiple headers with same name)
    const actualString = isArray(actualValue)
      ? actualValue.join(', ')
      : actualValue;

    if (pattern.test(actualString)) {
      return true;
    }

    return {
      actual: actualString,
      expected: `matching ${pattern}`,
      message: `Expected header "${headerName}" to match ${pattern}`,
    };
  },
);

// #endregion

// #region Body Assertions

const { stringify } = JSON;

/**
 * Gets the body content as a string for display/comparison.
 *
 * @function
 */
const getBodyText = (response: HttpResponse): string | undefined => {
  if (response.text !== undefined) {
    return response.text;
  }
  if (response.body !== undefined) {
    if (typeof response.body === 'string') {
      return response.body;
    }
    try {
      return stringify(response.body);
    } catch {
      // Handle circular references or other unserializable values
      return '[unserializable body]';
    }
  }
  return undefined;
};

/**
 * Checks if the response has a non-empty body.
 *
 * @function
 */
const hasBody = (response: HttpResponse): boolean => {
  // Check text first (raw body)
  if (response.text !== undefined && response.text !== '') {
    return true;
  }
  // Check parsed body
  if (response.body !== undefined) {
    // Empty object {} or empty array [] still counts as "has body"
    if (typeof response.body === 'object' && response.body !== null) {
      return true;
    }
    // Non-empty string
    if (typeof response.body === 'string' && response.body !== '') {
      return true;
    }
    // Other truthy values
    if (response.body) {
      return true;
    }
  }
  return false;
};

/**
 * Checks if the response appears to be JSON based on content-type.
 *
 * @function
 */
const isJsonResponse = (response: HttpResponse): boolean => {
  // Check the type property (supertest normalizes this)
  if (response.type) {
    return response.type.includes('json');
  }

  // Fall back to checking headers
  const contentType = getHeaderValue(response, 'content-type');
  if (contentType) {
    const value = isArray(contentType) ? contentType.join(', ') : contentType;
    return value.includes('json');
  }

  return false;
};

/**
 * Performs a deep partial match - checks if all properties in expected exist in
 * actual with matching values.
 *
 * @function
 */
const deepPartialMatch = (actual: unknown, expected: unknown): boolean => {
  // Exact match for primitives
  if (expected === actual) {
    return true;
  }

  // Handle null
  if (expected === null || actual === null) {
    return expected === actual;
  }

  // Both must be objects for partial matching
  if (typeof expected !== 'object' || typeof actual !== 'object') {
    return false;
  }

  // Handle arrays - must have same length and matching elements
  if (isArray(expected)) {
    if (!isArray(actual) || actual.length !== expected.length) {
      return false;
    }
    return expected.every((item, index) =>
      deepPartialMatch(actual[index], item),
    );
  }

  // Object partial match - all keys in expected must exist and match in actual
  const expectedObj = expected as Record<string, unknown>;
  const actualObj = actual as Record<string, unknown>;

  for (const key of keys(expectedObj)) {
    if (!(key in actualObj)) {
      return false;
    }
    if (!deepPartialMatch(actualObj[key], expectedObj[key])) {
      return false;
    }
  }

  return true;
};

/**
 * Asserts that a response has a non-empty body.
 *
 * @example
 *
 * ```ts
 * expect(response, 'to have body');
 * ```
 */
export const toHaveBodyAssertion = expect.createAssertion(
  [HttpResponseSchema, 'to have body'],
  (response: HttpResponse) => {
    if (hasBody(response)) {
      return true;
    }
    return {
      actual: 'empty or no body',
      expected: 'a response body',
      message: 'Expected response to have a body',
    };
  },
);

/**
 * Asserts that a response has an exact string body.
 *
 * @example
 *
 * ```ts
 * expect(response, 'to have body', 'Hello, World!');
 * expect(response, 'to have body', '{"users":[]}');
 * ```
 */
export const toHaveBodyStringAssertion = expect.createAssertion(
  [HttpResponseSchema, 'to have body', z.string()],
  (response: HttpResponse, expected: string) => {
    const bodyText = getBodyText(response);

    if (bodyText === expected) {
      return true;
    }

    return {
      actual: bodyText ?? 'no body',
      expected,
      message: 'Expected response body to equal string',
    };
  },
);

/**
 * Asserts that a response has a JSON content-type and a body.
 *
 * @example
 *
 * ```ts
 * expect(response, 'to have JSON body');
 * ```
 */
export const toHaveJsonBodyAssertion = expect.createAssertion(
  [HttpResponseSchema, 'to have JSON body'],
  (response: HttpResponse) => {
    if (!isJsonResponse(response)) {
      const contentType =
        response.type ?? getHeaderValue(response, 'content-type') ?? 'unknown';
      return {
        actual: contentType,
        expected: 'application/json',
        message: 'Expected response to have JSON content-type',
      };
    }

    if (!hasBody(response)) {
      return {
        actual: 'empty body',
        expected: 'JSON body',
        message: 'Expected response to have a JSON body',
      };
    }

    return true;
  },
);

/**
 * Asserts that a response has a JSON body satisfying a partial match.
 *
 * @example
 *
 * ```ts
 * expect(response, 'to have JSON body satisfying', { users: [] });
 * expect(response, 'to have JSON body satisfying', { status: 'ok' });
 * ```
 */
export const toHaveJsonBodySatisfyingAssertion = expect.createAssertion(
  [HttpResponseSchema, 'to have JSON body satisfying', schema.AnyObjectSchema],
  (response: HttpResponse, expected: Record<string, unknown>) => {
    const body = response.body;

    if (body === undefined || body === null) {
      return {
        actual: 'no body',
        expected: stringify(expected),
        message: 'Expected response to have a body',
      };
    }

    if (typeof body !== 'object') {
      return {
        actual: typeof body,
        expected: 'object',
        message: 'Expected response body to be an object',
      };
    }

    if (deepPartialMatch(body, expected)) {
      return true;
    }

    return {
      actual: stringify(body),
      expected: stringify(expected),
      message: 'Expected response body to satisfy specification',
    };
  },
);

/**
 * Asserts that a response body matches a regex pattern.
 *
 * @example
 *
 * ```ts
 * expect(response, 'to have body satisfying', /success/);
 * expect(response, 'to have body satisfying', /"id":\d+/);
 * ```
 */
export const toHaveBodySatisfyingRegexAssertion = expect.createAssertion(
  [HttpResponseSchema, 'to have body satisfying', z.instanceof(RegExp)],
  (response: HttpResponse, pattern: RegExp) => {
    const bodyText = getBodyText(response);

    if (bodyText === undefined) {
      return {
        actual: 'no body',
        expected: `matching ${pattern}`,
        message: 'Expected response to have a body',
      };
    }

    if (pattern.test(bodyText)) {
      return true;
    }

    return {
      actual: bodyText,
      expected: `matching ${pattern}`,
      message: `Expected response body to match ${pattern}`,
    };
  },
);

/**
 * Asserts that a response body satisfies a partial object match.
 *
 * @example
 *
 * ```ts
 * expect(response, 'to have body satisfying', { users: [] });
 * ```
 */
export const toHaveBodySatisfyingObjectAssertion = expect.createAssertion(
  [HttpResponseSchema, 'to have body satisfying', schema.AnyObjectSchema],
  (response: HttpResponse, expected: Record<string, unknown>) => {
    const body = response.body;

    if (body === undefined || body === null) {
      return {
        actual: 'no body',
        expected: stringify(expected),
        message: 'Expected response to have a body',
      };
    }

    if (typeof body !== 'object') {
      return {
        actual: typeof body,
        expected: 'object',
        message: 'Expected response body to be an object',
      };
    }

    if (deepPartialMatch(body, expected)) {
      return true;
    }

    return {
      actual: stringify(body),
      expected: stringify(expected),
      message: 'Expected response body to satisfy specification',
    };
  },
);

// #endregion

// #region Redirect Assertions

/**
 * Checks if the response is a redirect (3xx status code).
 *
 * @function
 */
const isRedirect = (response: HttpResponse): boolean =>
  response.status >= 300 && response.status < 400;

/**
 * Asserts that a response is a redirect (3xx status code).
 *
 * @example
 *
 * ```ts
 * expect(response, 'to redirect');
 * ```
 */
export const toRedirectAssertion = expect.createAssertion(
  [HttpResponseSchema, 'to redirect'],
  (response: HttpResponse) => {
    if (isRedirect(response)) {
      return true;
    }
    return {
      actual: response.status,
      expected: '3xx redirect status',
      message: `Expected response to be a redirect, but got status ${response.status}`,
    };
  },
);

/**
 * Asserts that a response redirects to a specific URL.
 *
 * @example
 *
 * ```ts
 * expect(response, 'to redirect to', '/login');
 * expect(response, 'to redirect to', 'https://example.com/auth');
 * ```
 */
export const toRedirectToUrlAssertion = expect.createAssertion(
  [HttpResponseSchema, 'to redirect to', z.string()],
  (response: HttpResponse, expectedUrl: string) => {
    if (!isRedirect(response)) {
      return {
        actual: response.status,
        expected: '3xx redirect status',
        message: `Expected response to be a redirect, but got status ${response.status}`,
      };
    }

    const location = getHeaderValue(response, 'location');
    if (location === undefined) {
      return {
        actual: 'no Location header',
        expected: expectedUrl,
        message: 'Expected redirect response to have a Location header',
      };
    }

    const locationString = isArray(location) ? (location[0] ?? '') : location;

    if (locationString === expectedUrl) {
      return true;
    }

    return {
      actual: locationString,
      expected: expectedUrl,
      message: `Expected redirect to "${expectedUrl}"`,
    };
  },
);

/**
 * Asserts that a response redirects to a URL matching a pattern.
 *
 * @example
 *
 * ```ts
 * expect(response, 'to redirect to', /\/auth/);
 * expect(response, 'to redirect to', /login\?redirect=/);
 * ```
 */
export const toRedirectToPatternAssertion = expect.createAssertion(
  [HttpResponseSchema, 'to redirect to', z.instanceof(RegExp)],
  (response: HttpResponse, pattern: RegExp) => {
    if (!isRedirect(response)) {
      return {
        actual: response.status,
        expected: '3xx redirect status',
        message: `Expected response to be a redirect, but got status ${response.status}`,
      };
    }

    const location = getHeaderValue(response, 'location');
    if (location === undefined) {
      return {
        actual: 'no Location header',
        expected: `matching ${pattern}`,
        message: 'Expected redirect response to have a Location header',
      };
    }

    const locationString = isArray(location) ? (location[0] ?? '') : location;

    if (pattern.test(locationString)) {
      return true;
    }

    return {
      actual: locationString,
      expected: `matching ${pattern}`,
      message: `Expected redirect Location to match ${pattern}`,
    };
  },
);

// #endregion

/**
 * All HTTP response assertions for use with `expect.use()`.
 */
export const httpAssertions = [
  toHaveStatusAssertion,
  toHaveStatusCategoryAssertion,
  toHaveHeaderAssertion,
  toHaveHeaderValueAssertion,
  toHaveHeaderMatchingAssertion,
  toHaveBodyAssertion,
  toHaveBodyStringAssertion,
  toHaveJsonBodyAssertion,
  toHaveJsonBodySatisfyingAssertion,
  toHaveBodySatisfyingRegexAssertion,
  toHaveBodySatisfyingObjectAssertion,
  toRedirectAssertion,
  toRedirectToUrlAssertion,
  toRedirectToPatternAssertion,
] as const;
