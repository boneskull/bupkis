# @bupkis/supertest Property Tests Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add comprehensive property-based tests to `@bupkis/supertest` to validate HTTP response assertions across randomized inputs.

**Architecture:** Create a new `test/property.test.ts` file that mirrors the pattern established in `@bupkis/events` and `@bupkis/sinon`. Each assertion from `src/assertions.ts` gets a `PropertyTestConfig` with valid and invalid generators. All assertions are synchronous, avoiding async timeout issues.

**Tech Stack:** `@bupkis/property-testing`, `fast-check`, `node:test`, TypeScript

---

## Overview

The `@bupkis/supertest` package has **14 synchronous assertions** for HTTP responses:

### Status Code Assertions (2)
1. `toHaveStatusAssertion` - exact numeric status code
2. `toHaveStatusCategoryAssertion` - status category ('ok', 'redirect', 'client error', 'server error')

### Header Assertions (3)
3. `toHaveHeaderAssertion` - header existence
4. `toHaveHeaderValueAssertion` - header with exact value
5. `toHaveHeaderMatchingAssertion` - header matching regex

### Body Assertions (6)
6. `toHaveBodyAssertion` - has any body
7. `toHaveBodyStringAssertion` - exact string body
8. `toHaveJsonBodyAssertion` - has JSON content-type and body
9. `toHaveJsonBodySatisfyingAssertion` - JSON body partial match
10. `toHaveBodySatisfyingRegexAssertion` - body matches regex
11. `toHaveBodySatisfyingObjectAssertion` - body partial object match

### Redirect Assertions (3)
12. `toRedirectAssertion` - is a redirect (3xx)
13. `toRedirectToUrlAssertion` - redirects to exact URL
14. `toRedirectToPatternAssertion` - redirects to URL matching pattern

All assertions are synchronous, so we avoid the async timeout issues that plagued `@bupkis/events`.

---

## Task 1: Add devDependencies

**Files:**
- Modify: `packages/supertest/package.json`

**Step 1: Add property testing dependencies**

```json
{
  "devDependencies": {
    "@bupkis/property-testing": ">=0.15.0",
    "fast-check": "^4.5.2"
  }
}
```

**Step 2: Install dependencies**

Run: `npm install` (from repo root)

**Step 3: Commit**

```bash
git add packages/supertest/package.json package-lock.json
git commit -m "chore(supertest): add property testing dependencies"
```

---

## Task 2: Create test file scaffold and helper arbitraries

**Files:**
- Create: `packages/supertest/test/property.test.ts`

**Step 1: Create the test file with imports and helper arbitraries**

```typescript
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

import * as assertions from '../src/assertions.js';
import type { HttpResponse } from '../src/guards.js';

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
const statusCodeArbitrary = fc.integer({ min: 100, max: 599 });

/**
 * Status codes in the OK range (2xx).
 */
const okStatusArbitrary = fc.integer({ min: 200, max: 299 });

/**
 * Status codes in the redirect range (3xx).
 */
const redirectStatusArbitrary = fc.integer({ min: 300, max: 399 });

/**
 * Status codes in the client error range (4xx).
 */
const clientErrorStatusArbitrary = fc.integer({ min: 400, max: 499 });

/**
 * Status codes in the server error range (5xx).
 */
const serverErrorStatusArbitrary = fc.integer({ min: 500, max: 599 });

/**
 * Non-redirect status codes (not 3xx).
 */
const nonRedirectStatusArbitrary = fc.oneof(
  fc.integer({ min: 100, max: 299 }),
  fc.integer({ min: 400, max: 599 }),
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
  fc.string({ minLength: 1, maxLength: 50 }),
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
    id: fc.integer({ min: 1, max: 1000 }),
    name: fc.string({ minLength: 1, maxLength: 20 }),
  }),
  fc.record({
    users: fc.array(
      fc.record({ id: fc.integer(), name: fc.string() }),
      { maxLength: 3 },
    ),
  }),
  fc.record({
    status: fc.constantFrom('ok', 'error', 'pending'),
    data: filteredObject,
  }),
  filteredObject,
);

/**
 * Text body arbitrary.
 */
const textBodyArbitrary = fc.oneof(
  fc.string({ minLength: 1, maxLength: 100 }),
  fc.constant('Hello, World!'),
  fc.constant('{"id":123}'),
);

/**
 * Creates an HttpResponse object with the given properties.
 */
const createResponse = (props: Partial<HttpResponse> & { status: number }): HttpResponse => props;
```

**Step 2: Run the file to verify no syntax errors**

Run: `npx tsx packages/supertest/test/property.test.ts`
Expected: No output (empty test file runs successfully)

**Step 3: Commit**

```bash
git add packages/supertest/test/property.test.ts
git commit -m "feat(supertest): add property test scaffold and arbitraries"
```

---

## Task 3: Add status code assertion configs

**Files:**
- Modify: `packages/supertest/test/property.test.ts`

**Step 1: Add status code assertion configs after the helper arbitraries**

```typescript
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
      valid: {
        generators: statusCodeArbitrary.chain((status) =>
          fc.tuple(
            fc.constant(createResponse({ status })),
            fc.constantFrom(...extractPhrases(assertions.toHaveStatusAssertion)),
            fc.constant(status),
          ),
        ),
      },
      invalid: {
        generators: fc
          .tuple(statusCodeArbitrary, statusCodeArbitrary)
          .filter(([actual, expected]) => actual !== expected)
          .chain(([actual, expected]) =>
            fc.tuple(
              fc.constant(createResponse({ status: actual })),
              fc.constantFrom(...extractPhrases(assertions.toHaveStatusAssertion)),
              fc.constant(expected),
            ),
          ),
      },
    },
  ],

  // toHaveStatusCategoryAssertion - status category
  [
    assertions.toHaveStatusCategoryAssertion,
    {
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
    },
  ],
]);
```

**Step 2: Run tests to verify configs work**

Run: `npm test -w packages/supertest`
Expected: Tests pass (no test harness loop yet, but no errors)

**Step 3: Commit**

```bash
git add packages/supertest/test/property.test.ts
git commit -m "feat(supertest): add status code property test configs"
```

---

## Task 4: Add header assertion configs

**Files:**
- Modify: `packages/supertest/test/property.test.ts`

**Step 1: Add header assertion configs**

```typescript
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
      valid: {
        generators: fc
          .tuple(headerNameArbitrary, headerValueArbitrary, statusCodeArbitrary)
          .chain(([headerName, headerValue, status]) =>
            fc.tuple(
              fc.constant(
                createResponse({
                  status,
                  headers: { [headerName]: headerValue },
                }),
              ),
              fc.constantFrom(...extractPhrases(assertions.toHaveHeaderAssertion)),
              fc.constant(headerName),
            ),
          ),
      },
      invalid: {
        generators: fc
          .tuple(headerNameArbitrary, statusCodeArbitrary)
          .chain(([headerName, status]) =>
            fc.tuple(
              fc.constant(createResponse({ status, headers: {} })),
              fc.constantFrom(...extractPhrases(assertions.toHaveHeaderAssertion)),
              fc.constant(headerName),
            ),
          ),
      },
    },
  ],

  // toHaveHeaderValueAssertion - header with exact value
  [
    assertions.toHaveHeaderValueAssertion,
    {
      valid: {
        generators: fc
          .tuple(headerNameArbitrary, headerValueArbitrary, statusCodeArbitrary)
          .chain(([headerName, headerValue, status]) =>
            fc.tuple(
              fc.constant(
                createResponse({
                  status,
                  headers: { [headerName]: headerValue },
                }),
              ),
              fc.constantFrom(
                ...extractPhrases(assertions.toHaveHeaderValueAssertion),
              ),
              fc.constant(headerName),
              fc.constant(headerValue),
            ),
          ),
      },
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
                  status,
                  headers: { [headerName]: actualValue },
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
    },
  ],

  // toHaveHeaderMatchingAssertion - header matching regex
  [
    assertions.toHaveHeaderMatchingAssertion,
    {
      valid: {
        generators: fc
          .tuple(
            fc.constantFrom(
              ['content-type', 'application/json', /json/] as const,
              ['content-type', 'text/html; charset=utf-8', /html/] as const,
              ['cache-control', 'max-age=3600, public', /max-age=\d+/] as const,
              ['x-request-id', 'abc-123-def', /[a-z]+-\d+-[a-z]+/] as const,
            ),
            statusCodeArbitrary,
          )
          .chain(([[headerName, headerValue, pattern], status]) =>
            fc.tuple(
              fc.constant(
                createResponse({
                  status,
                  headers: { [headerName]: headerValue },
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
                  status,
                  headers: { [headerName]: headerValue },
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
]);
```

**Step 2: Verify no syntax errors**

Run: `npx tsx --eval "import './packages/supertest/test/property.test.ts'"`
Expected: No errors

**Step 3: Commit**

```bash
git add packages/supertest/test/property.test.ts
git commit -m "feat(supertest): add header property test configs"
```

---

## Task 5: Add body assertion configs

**Files:**
- Modify: `packages/supertest/test/property.test.ts`

**Step 1: Add body assertion configs**

```typescript
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
      valid: {
        generators: fc
          .tuple(
            fc.oneof(
              textBodyArbitrary.map((text) => ({ text, body: undefined })),
              jsonBodyArbitrary.map((body) => ({ body, text: undefined })),
            ),
            statusCodeArbitrary,
          )
          .chain(([bodyProps, status]) =>
            fc.tuple(
              fc.constant(createResponse({ status, ...bodyProps })),
              fc.constantFrom(...extractPhrases(assertions.toHaveBodyAssertion)),
            ),
          ),
      },
      invalid: {
        generators: statusCodeArbitrary.chain((status) =>
          fc.tuple(
            fc.constant(createResponse({ status })),
            fc.constantFrom(...extractPhrases(assertions.toHaveBodyAssertion)),
          ),
        ),
      },
    },
  ],

  // toHaveBodyStringAssertion - exact string body
  [
    assertions.toHaveBodyStringAssertion,
    {
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
      invalid: {
        generators: fc
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
      },
    },
  ],

  // toHaveJsonBodyAssertion - has JSON content-type and body
  [
    assertions.toHaveJsonBodyAssertion,
    {
      valid: {
        generators: fc
          .tuple(jsonBodyArbitrary, statusCodeArbitrary)
          .chain(([body, status]) =>
            fc.tuple(
              fc.constant(
                createResponse({
                  status,
                  body,
                  type: 'application/json',
                }),
              ),
              fc.constantFrom(
                ...extractPhrases(assertions.toHaveJsonBodyAssertion),
              ),
            ),
          ),
      },
      invalid: {
        // Non-JSON content type
        generators: fc
          .tuple(
            fc.constantFrom('text/html', 'text/plain', 'application/xml'),
            statusCodeArbitrary,
          )
          .chain(([type, status]) =>
            fc.tuple(
              fc.constant(createResponse({ status, type, body: {} })),
              fc.constantFrom(
                ...extractPhrases(assertions.toHaveJsonBodyAssertion),
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
      valid: {
        generators: fc
          .tuple(
            fc.record({
              id: fc.integer({ min: 1, max: 1000 }),
              name: fc.string({ minLength: 1, maxLength: 20 }),
              extra: fc.string(),
            }),
            statusCodeArbitrary,
          )
          .chain(([body, status]) =>
            fc.tuple(
              fc.constant(createResponse({ status, body })),
              fc.constantFrom(
                ...extractPhrases(assertions.toHaveJsonBodySatisfyingAssertion),
              ),
              // Partial match - only check id and name
              fc.constant({ id: body.id, name: body.name }),
            ),
          ),
      },
      invalid: {
        generators: fc
          .tuple(
            fc.record({
              id: fc.integer({ min: 1, max: 1000 }),
              name: fc.string({ minLength: 1, maxLength: 20 }),
            }),
            fc.integer({ min: 1001, max: 2000 }), // Different ID
            statusCodeArbitrary,
          )
          .chain(([body, wrongId, status]) =>
            fc.tuple(
              fc.constant(createResponse({ status, body })),
              fc.constantFrom(
                ...extractPhrases(assertions.toHaveJsonBodySatisfyingAssertion),
              ),
              fc.constant({ id: wrongId }), // Wrong ID
            ),
          ),
      },
    },
  ],

  // toHaveBodySatisfyingRegexAssertion - body matches regex
  [
    assertions.toHaveBodySatisfyingRegexAssertion,
    {
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
                ...extractPhrases(assertions.toHaveBodySatisfyingRegexAssertion),
              ),
              fc.constant(pattern),
            ),
          ),
      },
      invalid: {
        generators: fc
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
                ...extractPhrases(assertions.toHaveBodySatisfyingRegexAssertion),
              ),
              fc.constant(pattern),
            ),
          ),
      },
    },
  ],

  // toHaveBodySatisfyingObjectAssertion - body partial object match
  [
    assertions.toHaveBodySatisfyingObjectAssertion,
    {
      valid: {
        generators: fc
          .tuple(
            fc.record({
              id: fc.integer({ min: 1, max: 1000 }),
              name: fc.string({ minLength: 1, maxLength: 20 }),
              ignored: fc.string(),
            }),
            statusCodeArbitrary,
          )
          .chain(([body, status]) =>
            fc.tuple(
              fc.constant(createResponse({ status, body })),
              fc.constantFrom(
                ...extractPhrases(assertions.toHaveBodySatisfyingObjectAssertion),
              ),
              fc.constant({ id: body.id }), // Partial match
            ),
          ),
      },
      invalid: {
        generators: fc
          .tuple(
            fc.record({ id: fc.integer({ min: 1, max: 500 }) }),
            fc.integer({ min: 501, max: 1000 }), // Different ID
            statusCodeArbitrary,
          )
          .chain(([body, wrongId, status]) =>
            fc.tuple(
              fc.constant(createResponse({ status, body })),
              fc.constantFrom(
                ...extractPhrases(assertions.toHaveBodySatisfyingObjectAssertion),
              ),
              fc.constant({ id: wrongId }),
            ),
          ),
      },
    },
  ],
]);
```

**Step 2: Verify no syntax errors**

Run: `npx tsx --eval "import './packages/supertest/test/property.test.ts'"`
Expected: No errors

**Step 3: Commit**

```bash
git add packages/supertest/test/property.test.ts
git commit -m "feat(supertest): add body property test configs"
```

---

## Task 6: Add redirect assertion configs

**Files:**
- Modify: `packages/supertest/test/property.test.ts`

**Step 1: Add redirect assertion configs**

```typescript
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
      valid: {
        generators: redirectStatusArbitrary.chain((status) =>
          fc.tuple(
            fc.constant(createResponse({ status })),
            fc.constantFrom(...extractPhrases(assertions.toRedirectAssertion)),
          ),
        ),
      },
      invalid: {
        generators: nonRedirectStatusArbitrary.chain((status) =>
          fc.tuple(
            fc.constant(createResponse({ status })),
            fc.constantFrom(...extractPhrases(assertions.toRedirectAssertion)),
          ),
        ),
      },
    },
  ],

  // toRedirectToUrlAssertion - redirects to exact URL
  [
    assertions.toRedirectToUrlAssertion,
    {
      valid: {
        generators: fc
          .tuple(redirectStatusArbitrary, urlPathArbitrary)
          .chain(([status, location]) =>
            fc.tuple(
              fc.constant(
                createResponse({
                  status,
                  headers: { location },
                }),
              ),
              fc.constantFrom(
                ...extractPhrases(assertions.toRedirectToUrlAssertion),
              ),
              fc.constant(location),
            ),
          ),
      },
      invalid: {
        generators: fc
          .tuple(redirectStatusArbitrary, urlPathArbitrary, urlPathArbitrary)
          .filter(([_, actual, expected]) => actual !== expected)
          .chain(([status, actualLocation, expectedLocation]) =>
            fc.tuple(
              fc.constant(
                createResponse({
                  status,
                  headers: { location: actualLocation },
                }),
              ),
              fc.constantFrom(
                ...extractPhrases(assertions.toRedirectToUrlAssertion),
              ),
              fc.constant(expectedLocation),
            ),
          ),
      },
    },
  ],

  // toRedirectToPatternAssertion - redirects to URL matching pattern
  [
    assertions.toRedirectToPatternAssertion,
    {
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
                  status,
                  headers: { location },
                }),
              ),
              fc.constantFrom(
                ...extractPhrases(assertions.toRedirectToPatternAssertion),
              ),
              fc.constant(pattern),
            ),
          ),
      },
      invalid: {
        generators: fc
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
                  status,
                  headers: { location },
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
]);
```

**Step 2: Verify no syntax errors**

Run: `npx tsx --eval "import './packages/supertest/test/property.test.ts'"`
Expected: No errors

**Step 3: Commit**

```bash
git add packages/supertest/test/property.test.ts
git commit -m "feat(supertest): add redirect property test configs"
```

---

## Task 7: Add test harness loop and run tests

**Files:**
- Modify: `packages/supertest/test/property.test.ts`

**Step 1: Add the test harness loop at the end of the file**

```typescript
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
```

**Step 2: Run the property tests**

Run: `npm test -w packages/supertest`
Expected: All tests pass

**Step 3: Verify all 14 assertions are covered**

Count the assertions in `allConfigs`:
- statusCodeConfigs: 2 assertions
- headerConfigs: 3 assertions
- bodyConfigs: 6 assertions
- redirectConfigs: 3 assertions
- Total: 14 assertions (matches the 14 in `supertestAssertions`)

**Step 4: Commit**

```bash
git add packages/supertest/test/property.test.ts
git commit -m "feat(supertest): add property test harness and run all tests"
```

---

## Task 8: Run full test suite and lint

**Files:**
- None (verification only)

**Step 1: Run ESLint**

Run: `npm run lint -w packages/supertest`
Expected: No errors

**Step 2: Run all tests from repo root**

Run: `npm test -w packages/supertest`
Expected: All tests pass (both unit tests and property tests)

**Step 3: Final commit if any lint fixes were needed**

```bash
git add packages/supertest/test/property.test.ts
git commit -m "fix(supertest): address lint issues in property tests"
```

---

## Summary

This plan adds property-based tests to `@bupkis/supertest` covering all 14 assertions:

| Category | Assertions | Configs |
|----------|------------|---------|
| Status Code | 2 | `statusCodeConfigs` |
| Header | 3 | `headerConfigs` |
| Body | 6 | `bodyConfigs` |
| Redirect | 3 | `redirectConfigs` |
| **Total** | **14** | |

Key design decisions:
1. **All sync** - No async assertions means no timeout issues
2. **Randomized inputs** - Each config generates diverse HTTP responses
3. **Pattern from sinon/events** - Same structure as existing property tests
4. **Helper arbitraries** - Reusable generators for status codes, headers, bodies, URLs
