/**
 * Property-based tests for @bupkis/supertest assertions.
 *
 * Uses fast-check to generate random inputs and validates that assertions
 * behave correctly across the input space.
 */

import {
  createPropertyTestHarness,
  extractPhrases,
  filteredObject,
  getVariants,
  type PropertyTestConfig,
  type PropertyTestConfigParameters,
} from '@bupkis/property-testing';
import { use } from 'bupkis';
import fc from 'fast-check';
import { describe, it } from 'node:test';

import type { HttpResponse } from '../src/guards.js';

import * as assertions from '../src/assertions.js';

const { expect, expectAsync } = use(assertions.supertestAssertions);
const { runVariant } = createPropertyTestHarness({ expect, expectAsync });

// Use 'small' run size to keep tests fast
const testConfigDefaults: PropertyTestConfigParameters = {
  runSize: 'small',
} as const;

// ─────────────────────────────────────────────────────────────
// HELPER ARBITRARIES
// ─────────────────────────────────────────────────────────────

/**
 * Valid HTTP status codes (100-599).
 */
const statusCodeArbitrary = fc.integer({ max: 599, min: 100 });

/**
 * Status codes in the OK range (2xx).
 */
const okStatusArbitrary = fc.integer({ max: 299, min: 200 });

/**
 * Status codes in the redirect range (3xx).
 */
const redirectStatusArbitrary = fc.integer({ max: 399, min: 300 });

/**
 * Status codes in the client error range (4xx).
 */
const clientErrorStatusArbitrary = fc.integer({ max: 499, min: 400 });

/**
 * Status codes in the server error range (5xx).
 */
const serverErrorStatusArbitrary = fc.integer({ max: 599, min: 500 });

/**
 * Non-redirect status codes (not 3xx).
 */
const nonRedirectStatusArbitrary = fc.oneof(
  fc.integer({ max: 299, min: 100 }),
  fc.integer({ max: 599, min: 400 }),
);

/**
 * Common HTTP header names for realistic tests.
 */
const headerNameArbitrary = fc.constantFrom(
  'content-type',
  'cache-control',
  'x-request-id',
  'authorization',
  'accept',
  'content-length',
  'x-custom-header',
  'Content-Type',
  'Cache-Control',
  'X-Request-Id',
);

/**
 * Diverse header values.
 */
const headerValueArbitrary = fc.oneof(
  fc.constant('application/json'),
  fc.constant('text/html'),
  fc.constant('text/plain'),
  fc.constant('no-cache'),
  fc.constant('max-age=3600'),
  fc.string({ maxLength: 50, minLength: 1 }),
);

/**
 * URL path arbitrary for redirect testing.
 */
const urlPathArbitrary = fc.oneof(
  fc.constant('/login'),
  fc.constant('/dashboard'),
  fc.constant('/api/users'),
  fc.constant('https://example.com/redirect'),
  fc.stringMatching(/^\/[a-z0-9-]{1,20}(\/[a-z0-9-]{1,20}){0,3}$/),
);

/**
 * JSON body arbitrary with diverse structures.
 */
const jsonBodyArbitrary = fc.oneof(
  fc.record({
    id: fc.integer({ max: 1000, min: 1 }),
    name: fc.string({ maxLength: 20, minLength: 1 }),
  }),
  fc.record({
    users: fc.array(fc.record({ id: fc.integer(), name: fc.string() }), {
      maxLength: 3,
    }),
  }),
  fc.record({
    data: filteredObject,
    status: fc.constantFrom('ok', 'error', 'pending'),
  }),
  fc.record({
    items: fc.array(filteredObject, { maxLength: 5 }),
    meta: fc.record({
      tags: fc.array(fc.string({ maxLength: 10, minLength: 1 }), {
        maxLength: 5,
      }),
    }),
  }),
  fc
    .array(fc.tuple(fc.stringMatching(/^[a-z]{1,8}$/), filteredObject), {
      maxLength: 5,
    })
    .map((entries) => Object.fromEntries(entries)),
  filteredObject,
);

/**
 * Text body arbitrary.
 */
const textBodyArbitrary = fc.oneof(
  fc.string({ maxLength: 100, minLength: 1 }),
  fc.constant('Hello, World!'),
  fc.constant('{"id":123}'),
);

/**
 * Responses that should be considered "no body" by hasBody().
 */
const emptyBodyPropsArbitrary = fc.constantFrom(
  { body: undefined, text: undefined },
  { body: null, text: undefined },
  { body: '', text: undefined },
  { body: 0, text: undefined },
  { body: false, text: undefined },
  { body: undefined, text: '' },
);

/**
 * Creates an HttpResponse object with the given properties.
 */
const createResponse = (
  props: Partial<HttpResponse> & { status: number },
): HttpResponse => props;

// ─────────────────────────────────────────────────────────────
// STATUS CODE ASSERTIONS
// ─────────────────────────────────────────────────────────────

const statusCodeConfigs = new Map<
  (typeof assertions.supertestAssertions)[number],
  PropertyTestConfig
>([
  // toHaveStatusAssertion - exact status code
  [
    assertions.toHaveStatusAssertion,
    {
      invalid: {
        generators: fc
          .tuple(statusCodeArbitrary, statusCodeArbitrary)
          .filter(([actual, expected]) => actual !== expected)
          .chain(([actual, expected]) =>
            fc.tuple(
              fc.constant(createResponse({ status: actual })),
              fc.constantFrom(
                ...extractPhrases(assertions.toHaveStatusAssertion),
              ),
              fc.constant(expected),
            ),
          ),
      },
      valid: {
        generators: statusCodeArbitrary.chain((status) =>
          fc.tuple(
            fc.constant(createResponse({ status })),
            fc.constantFrom(
              ...extractPhrases(assertions.toHaveStatusAssertion),
            ),
            fc.constant(status),
          ),
        ),
      },
    },
  ],

  // toHaveStatusCategoryAssertion - status category
  [
    assertions.toHaveStatusCategoryAssertion,
    {
      invalid: {
        // Use a status from one category but expect a different category
        generators: fc
          .tuple(
            fc.constantFrom('ok', 'redirect', 'client error', 'server error'),
            fc.constantFrom('ok', 'redirect', 'client error', 'server error'),
          )
          .filter(([actual, expected]) => actual !== expected)
          .chain(([actualCategory, expectedCategory]) => {
            const statusArb =
              actualCategory === 'ok'
                ? okStatusArbitrary
                : actualCategory === 'redirect'
                  ? redirectStatusArbitrary
                  : actualCategory === 'client error'
                    ? clientErrorStatusArbitrary
                    : serverErrorStatusArbitrary;
            return statusArb.chain((status) =>
              fc.tuple(
                fc.constant(createResponse({ status })),
                fc.constantFrom(
                  ...extractPhrases(assertions.toHaveStatusCategoryAssertion),
                ),
                fc.constant(expectedCategory),
              ),
            );
          }),
      },
      valid: {
        generators: fc
          .constantFrom('ok', 'redirect', 'client error', 'server error')
          .chain((category) => {
            const statusArb =
              category === 'ok'
                ? okStatusArbitrary
                : category === 'redirect'
                  ? redirectStatusArbitrary
                  : category === 'client error'
                    ? clientErrorStatusArbitrary
                    : serverErrorStatusArbitrary;
            return statusArb.chain((status) =>
              fc.tuple(
                fc.constant(createResponse({ status })),
                fc.constantFrom(
                  ...extractPhrases(assertions.toHaveStatusCategoryAssertion),
                ),
                fc.constant(category),
              ),
            );
          }),
      },
    },
  ],
]);

// ─────────────────────────────────────────────────────────────
// HEADER ASSERTIONS
// ─────────────────────────────────────────────────────────────

const headerConfigs = new Map<
  (typeof assertions.supertestAssertions)[number],
  PropertyTestConfig
>([
  // toHaveHeaderAssertion - header existence
  [
    assertions.toHaveHeaderAssertion,
    {
      invalid: {
        generators: fc
          .tuple(headerNameArbitrary, statusCodeArbitrary)
          .chain(([headerName, status]) =>
            fc.tuple(
              fc.constant(createResponse({ headers: {}, status })),
              fc.constantFrom(
                ...extractPhrases(assertions.toHaveHeaderAssertion),
              ),
              fc.constant(headerName),
            ),
          ),
      },
      valid: {
        generators: fc
          .tuple(headerNameArbitrary, headerValueArbitrary, statusCodeArbitrary)
          .chain(([headerName, headerValue, status]) =>
            fc.tuple(
              fc.constant(
                createResponse({
                  headers: { [headerName]: headerValue },
                  status,
                }),
              ),
              fc.constantFrom(
                ...extractPhrases(assertions.toHaveHeaderAssertion),
              ),
              fc.constant(headerName),
            ),
          ),
      },
    },
  ],

  // toHaveHeaderMatchingAssertion - header matching regex
  [
    assertions.toHaveHeaderMatchingAssertion,
    {
      invalid: {
        generators: fc
          .tuple(
            fc.constantFrom(
              ['content-type', 'text/plain', /json/] as const,
              ['content-type', 'application/xml', /html/] as const,
              ['cache-control', 'no-cache', /max-age/] as const,
            ),
            statusCodeArbitrary,
          )
          .chain(([[headerName, headerValue, pattern], status]) =>
            fc.tuple(
              fc.constant(
                createResponse({
                  headers: { [headerName]: headerValue },
                  status,
                }),
              ),
              fc.constantFrom(
                ...extractPhrases(assertions.toHaveHeaderMatchingAssertion),
              ),
              fc.constant(headerName),
              fc.constant(pattern),
            ),
          ),
      },
      valid: {
        generators: fc
          .tuple(
            fc.constantFrom(
              ['content-type', 'application/json', /json/] as const,
              ['content-type', 'text/html; charset=utf-8', /html/] as const,
              ['cache-control', 'max-age=3600, public', /max-age=\d+/] as const,
              ['x-request-id', 'abc-123-def', /[a-z]+-\d+-[a-z]+/] as const,
              [
                'cache-control',
                ['max-age=3600', 'public'] as string[],
                /max-age=\d+/,
              ] as const,
            ),
            statusCodeArbitrary,
          )
          .chain(([[headerName, headerValue, pattern], status]) =>
            fc.tuple(
              fc.constant(
                createResponse({
                  headers: { [headerName]: headerValue },
                  status,
                }),
              ),
              fc.constantFrom(
                ...extractPhrases(assertions.toHaveHeaderMatchingAssertion),
              ),
              fc.constant(headerName),
              fc.constant(pattern),
            ),
          ),
      },
    },
  ],

  // toHaveHeaderValueAssertion - header with exact value
  [
    assertions.toHaveHeaderValueAssertion,
    {
      invalid: {
        generators: fc
          .tuple(
            headerNameArbitrary,
            headerValueArbitrary,
            headerValueArbitrary,
            statusCodeArbitrary,
          )
          .filter(([_, actual, expected]) => actual !== expected)
          .chain(([headerName, actualValue, expectedValue, status]) =>
            fc.tuple(
              fc.constant(
                createResponse({
                  headers: { [headerName]: actualValue },
                  status,
                }),
              ),
              fc.constantFrom(
                ...extractPhrases(assertions.toHaveHeaderValueAssertion),
              ),
              fc.constant(headerName),
              fc.constant(expectedValue),
            ),
          ),
      },
      valid: {
        generators: fc.oneof(
          fc
            .tuple(
              headerNameArbitrary,
              headerValueArbitrary,
              statusCodeArbitrary,
            )
            .chain(([headerName, headerValue, status]) =>
              fc.tuple(
                fc.constant(
                  createResponse({
                    headers: { [headerName]: headerValue },
                    status,
                  }),
                ),
                fc.constantFrom(
                  ...extractPhrases(assertions.toHaveHeaderValueAssertion),
                ),
                fc.constant(headerName),
                fc.constant(headerValue),
              ),
            ),
          fc
            .tuple(
              fc.constantFrom(
                [
                  'cache-control',
                  ['max-age=3600', 'public'] as string[],
                  'max-age=3600, public',
                ] as const,
                [
                  'content-type',
                  ['application/json'] as string[],
                  'application/json',
                ] as const,
              ),
              statusCodeArbitrary,
            )
            .chain(([[headerName, headerValue, expectedValue], status]) =>
              fc.tuple(
                fc.constant(
                  createResponse({
                    headers: { [headerName]: headerValue },
                    status,
                  }),
                ),
                fc.constantFrom(
                  ...extractPhrases(assertions.toHaveHeaderValueAssertion),
                ),
                fc.constant(headerName),
                fc.constant(expectedValue),
              ),
            ),
        ),
      },
    },
  ],
]);

// ─────────────────────────────────────────────────────────────
// BODY ASSERTIONS
// ─────────────────────────────────────────────────────────────

const bodyConfigs = new Map<
  (typeof assertions.supertestAssertions)[number],
  PropertyTestConfig
>([
  // toHaveBodyAssertion - has any body
  [
    assertions.toHaveBodyAssertion,
    {
      invalid: {
        generators: fc
          .tuple(emptyBodyPropsArbitrary, statusCodeArbitrary)
          .chain(([bodyProps, status]) =>
            fc.tuple(
              fc.constant(createResponse({ status, ...bodyProps })),
              fc.constantFrom(
                ...extractPhrases(assertions.toHaveBodyAssertion),
              ),
            ),
          ),
      },
      valid: {
        generators: fc
          .tuple(
            fc.oneof(
              textBodyArbitrary.map((text) => ({ body: undefined, text })),
              jsonBodyArbitrary.map((body) => ({ body, text: undefined })),
              fc.constant({ body: {}, text: '' }),
              fc.constant({ body: [], text: undefined }),
              textBodyArbitrary.map((text) => ({ body: '', text })),
            ),
            statusCodeArbitrary,
          )
          .chain(([bodyProps, status]) =>
            fc.tuple(
              fc.constant(createResponse({ status, ...bodyProps })),
              fc.constantFrom(
                ...extractPhrases(assertions.toHaveBodyAssertion),
              ),
            ),
          ),
      },
    },
  ],

  // toHaveBodySatisfyingObjectAssertion - body partial object match
  [
    assertions.toHaveBodySatisfyingObjectAssertion,
    {
      invalid: {
        generators: fc
          .tuple(
            fc.record({ id: fc.integer({ max: 500, min: 1 }) }),
            fc.integer({ max: 1000, min: 501 }), // Different ID
            statusCodeArbitrary,
          )
          .chain(([body, wrongId, status]) =>
            fc.tuple(
              fc.constant(createResponse({ body, status })),
              fc.constantFrom(
                ...extractPhrases(
                  assertions.toHaveBodySatisfyingObjectAssertion,
                ),
              ),
              fc.constant({ id: wrongId }),
            ),
          ),
      },
      valid: {
        generators: fc
          .tuple(
            fc.record({
              id: fc.integer({ max: 1000, min: 1 }),
              ignored: fc.string(),
              name: fc.string({ maxLength: 20, minLength: 1 }),
            }),
            statusCodeArbitrary,
          )
          .chain(([body, status]) =>
            fc.tuple(
              fc.constant(createResponse({ body, status })),
              fc.constantFrom(
                ...extractPhrases(
                  assertions.toHaveBodySatisfyingObjectAssertion,
                ),
              ),
              fc.constant({ id: body.id }), // Partial match
            ),
          ),
      },
    },
  ],

  // toHaveBodySatisfyingRegexAssertion - body matches regex
  [
    assertions.toHaveBodySatisfyingRegexAssertion,
    {
      invalid: {
        generators: fc.oneof(
          fc
            .tuple(
              fc.constantFrom(
                ['Hello', /Goodbye/] as const,
                ['plain text', /json/] as const,
                ['no numbers here', /\d+/] as const,
              ),
              statusCodeArbitrary,
            )
            .chain(([[text, pattern], status]) =>
              fc.tuple(
                fc.constant(createResponse({ status, text })),
                fc.constantFrom(
                  ...extractPhrases(
                    assertions.toHaveBodySatisfyingRegexAssertion,
                  ),
                ),
                fc.constant(pattern),
              ),
            ),
          statusCodeArbitrary.chain((status) =>
            fc.tuple(
              fc.constant(createResponse({ status })),
              fc.constantFrom(
                ...extractPhrases(
                  assertions.toHaveBodySatisfyingRegexAssertion,
                ),
              ),
              fc.constant(/.+/),
            ),
          ),
        ),
      },
      valid: {
        generators: fc
          .tuple(
            fc.constantFrom(
              ['Hello, World!', /World/] as const,
              ['{"id":123}', /"id":\d+/] as const,
              ['success: true', /success/] as const,
              ['error code: 404', /\d+/] as const,
            ),
            statusCodeArbitrary,
          )
          .chain(([[text, pattern], status]) =>
            fc.tuple(
              fc.constant(createResponse({ status, text })),
              fc.constantFrom(
                ...extractPhrases(
                  assertions.toHaveBodySatisfyingRegexAssertion,
                ),
              ),
              fc.constant(pattern),
            ),
          ),
      },
    },
  ],

  // toHaveBodyStringAssertion - exact string body
  [
    assertions.toHaveBodyStringAssertion,
    {
      invalid: {
        generators: fc.oneof(
          fc
            .tuple(textBodyArbitrary, textBodyArbitrary, statusCodeArbitrary)
            .filter(([actual, expected]) => actual !== expected)
            .chain(([actualText, expectedText, status]) =>
              fc.tuple(
                fc.constant(createResponse({ status, text: actualText })),
                fc.constantFrom(
                  ...extractPhrases(assertions.toHaveBodyStringAssertion),
                ),
                fc.constant(expectedText),
              ),
            ),
          statusCodeArbitrary.chain((status) =>
            fc.tuple(
              fc.constant(createResponse({ status })),
              fc.constantFrom(
                ...extractPhrases(assertions.toHaveBodyStringAssertion),
              ),
              fc.constant('expected'),
            ),
          ),
        ),
      },
      valid: {
        generators: fc
          .tuple(textBodyArbitrary, statusCodeArbitrary)
          .chain(([text, status]) =>
            fc.tuple(
              fc.constant(createResponse({ status, text })),
              fc.constantFrom(
                ...extractPhrases(assertions.toHaveBodyStringAssertion),
              ),
              fc.constant(text),
            ),
          ),
      },
    },
  ],

  // toHaveJsonBodyAssertion - has JSON content-type and body
  [
    assertions.toHaveJsonBodyAssertion,
    {
      invalid: {
        // Non-JSON content type
        generators: fc.oneof(
          fc
            .tuple(
              fc.constantFrom('text/html', 'text/plain', 'application/xml'),
              statusCodeArbitrary,
            )
            .chain(([type, status]) =>
              fc.tuple(
                fc.constant(createResponse({ body: {}, status, type })),
                fc.constantFrom(
                  ...extractPhrases(assertions.toHaveJsonBodyAssertion),
                ),
              ),
            ),
          statusCodeArbitrary.chain((status) =>
            fc.tuple(
              fc.constant(createResponse({ status, type: 'application/json' })),
              fc.constantFrom(
                ...extractPhrases(assertions.toHaveJsonBodyAssertion),
              ),
            ),
          ),
          statusCodeArbitrary.chain((status) =>
            fc.tuple(
              fc.constant(
                createResponse({
                  body: '',
                  status,
                  type: 'application/json',
                }),
              ),
              fc.constantFrom(
                ...extractPhrases(assertions.toHaveJsonBodyAssertion),
              ),
            ),
          ),
        ),
      },
      valid: {
        generators: fc.oneof(
          fc
            .tuple(jsonBodyArbitrary, statusCodeArbitrary)
            .chain(([body, status]) =>
              fc.tuple(
                fc.constant(
                  createResponse({
                    body,
                    status,
                    type: 'application/json',
                  }),
                ),
                fc.constantFrom(
                  ...extractPhrases(assertions.toHaveJsonBodyAssertion),
                ),
              ),
            ),
          fc
            .tuple(jsonBodyArbitrary, statusCodeArbitrary)
            .chain(([body, status]) =>
              fc.tuple(
                fc.constant(
                  createResponse({
                    body,
                    status,
                    type: 'application/json; charset=utf-8',
                  }),
                ),
                fc.constantFrom(
                  ...extractPhrases(assertions.toHaveJsonBodyAssertion),
                ),
              ),
            ),
          fc
            .tuple(jsonBodyArbitrary, statusCodeArbitrary)
            .chain(([body, status]) =>
              fc.tuple(
                fc.constant(
                  createResponse({
                    body,
                    headers: { 'Content-Type': 'application/json' },
                    status,
                  }),
                ),
                fc.constantFrom(
                  ...extractPhrases(assertions.toHaveJsonBodyAssertion),
                ),
              ),
            ),
        ),
      },
    },
  ],

  // toHaveJsonBodySatisfyingAssertion - JSON body partial match
  [
    assertions.toHaveJsonBodySatisfyingAssertion,
    {
      invalid: {
        generators: fc
          .tuple(
            fc.record({
              id: fc.integer({ max: 1000, min: 1 }),
              name: fc.string({ maxLength: 20, minLength: 1 }),
            }),
            fc.integer({ max: 2000, min: 1001 }), // Different ID
            statusCodeArbitrary,
          )
          .chain(([body, wrongId, status]) =>
            fc.tuple(
              fc.constant(createResponse({ body, status })),
              fc.constantFrom(
                ...extractPhrases(assertions.toHaveJsonBodySatisfyingAssertion),
              ),
              fc.constant({ id: wrongId }), // Wrong ID
            ),
          ),
      },
      valid: {
        generators: fc
          .tuple(
            fc.record({
              extra: fc.string(),
              id: fc.integer({ max: 1000, min: 1 }),
              name: fc.string({ maxLength: 20, minLength: 1 }),
            }),
            statusCodeArbitrary,
          )
          .chain(([body, status]) =>
            fc.tuple(
              fc.constant(createResponse({ body, status })),
              fc.constantFrom(
                ...extractPhrases(assertions.toHaveJsonBodySatisfyingAssertion),
              ),
              // Partial match - only check id and name
              fc.constant({ id: body.id, name: body.name }),
            ),
          ),
      },
    },
  ],
]);

// ─────────────────────────────────────────────────────────────
// REDIRECT ASSERTIONS
// ─────────────────────────────────────────────────────────────

const redirectConfigs = new Map<
  (typeof assertions.supertestAssertions)[number],
  PropertyTestConfig
>([
  // toRedirectAssertion - is a redirect (3xx)
  [
    assertions.toRedirectAssertion,
    {
      invalid: {
        generators: nonRedirectStatusArbitrary.chain((status) =>
          fc.tuple(
            fc.constant(createResponse({ status })),
            fc.constantFrom(...extractPhrases(assertions.toRedirectAssertion)),
          ),
        ),
      },
      valid: {
        generators: redirectStatusArbitrary.chain((status) =>
          fc.tuple(
            fc.constant(createResponse({ status })),
            fc.constantFrom(...extractPhrases(assertions.toRedirectAssertion)),
          ),
        ),
      },
    },
  ],

  // toRedirectToPatternAssertion - redirects to URL matching pattern
  [
    assertions.toRedirectToPatternAssertion,
    {
      invalid: {
        generators: fc.oneof(
          fc
            .tuple(
              redirectStatusArbitrary,
              fc.constantFrom(
                ['/dashboard', /login/] as const,
                ['/api/users', /admin/] as const,
                ['https://other.com', /example\.com/] as const,
              ),
            )
            .chain(([status, [location, pattern]]) =>
              fc.tuple(
                fc.constant(
                  createResponse({
                    headers: { location },
                    status,
                  }),
                ),
                fc.constantFrom(
                  ...extractPhrases(assertions.toRedirectToPatternAssertion),
                ),
                fc.constant(pattern),
              ),
            ),
          redirectStatusArbitrary.chain((status) =>
            fc.tuple(
              fc.constant(createResponse({ status })),
              fc.constantFrom(
                ...extractPhrases(assertions.toRedirectToPatternAssertion),
              ),
              fc.constant(/.*/),
            ),
          ),
        ),
      },
      valid: {
        generators: fc
          .tuple(
            redirectStatusArbitrary,
            fc.constantFrom(
              ['/auth/login?redirect=/dashboard', /\/auth/] as const,
              ['/api/v1/users', /\/api\/v\d+/] as const,
              ['https://example.com/callback', /example\.com/] as const,
              ['/login', /login/] as const,
            ),
          )
          .chain(([status, [location, pattern]]) =>
            fc.tuple(
              fc.constant(
                createResponse({
                  headers: { location },
                  status,
                }),
              ),
              fc.constantFrom(
                ...extractPhrases(assertions.toRedirectToPatternAssertion),
              ),
              fc.constant(pattern),
            ),
          ),
      },
    },
  ],

  // toRedirectToUrlAssertion - redirects to exact URL
  [
    assertions.toRedirectToUrlAssertion,
    {
      invalid: {
        generators: fc.oneof(
          fc
            .tuple(redirectStatusArbitrary, urlPathArbitrary, urlPathArbitrary)
            .filter(([_, actual, expected]) => actual !== expected)
            .chain(([status, actualLocation, expectedLocation]) =>
              fc.tuple(
                fc.constant(
                  createResponse({
                    headers: { location: actualLocation },
                    status,
                  }),
                ),
                fc.constantFrom(
                  ...extractPhrases(assertions.toRedirectToUrlAssertion),
                ),
                fc.constant(expectedLocation),
              ),
            ),
          redirectStatusArbitrary.chain((status) =>
            fc.tuple(
              fc.constant(createResponse({ status })),
              fc.constantFrom(
                ...extractPhrases(assertions.toRedirectToUrlAssertion),
              ),
              fc.constant('/missing'),
            ),
          ),
        ),
      },
      valid: {
        generators: fc
          .tuple(redirectStatusArbitrary, urlPathArbitrary)
          .chain(([status, location]) =>
            fc.tuple(
              fc.constant(
                createResponse({
                  headers: { location },
                  status,
                }),
              ),
              fc.constantFrom(
                ...extractPhrases(assertions.toRedirectToUrlAssertion),
              ),
              fc.constant(location),
            ),
          ),
      },
    },
  ],
]);

// ─────────────────────────────────────────────────────────────
// TEST HARNESS
// ─────────────────────────────────────────────────────────────

// Combine all configs
const allConfigs = new Map([
  ...statusCodeConfigs,
  ...headerConfigs,
  ...bodyConfigs,
  ...redirectConfigs,
]);

describe('@bupkis/supertest Property Tests', () => {
  for (const [assertion, testConfig] of allConfigs) {
    const { id } = assertion;
    const { params, variants } = getVariants(testConfig);
    describe(`Assertion: ${assertion} [${id}]`, () => {
      for (const [name, variant] of variants) {
        it(`should pass ${name} checks [${id}]`, async () => {
          await runVariant(
            variant,
            testConfigDefaults,
            params,
            name,
            assertion,
          );
        });
      }
    });
  }
});
