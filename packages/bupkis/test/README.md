# Test Suite Documentation

This directory contains comprehensive tests for the Bupkis assertion library, organized by testing strategy and functionality.

## Core API Tests

Tests for the core API:

- `expect()`
- `expect.fail()`
- `expect.use()`
- `createAssertion()`
- `AssertionError`

…including async versions where appropriate.

## Property-Based Tests

This directory contains property-based tests for Bupkis assertions using [fast-check](https://fast-check.dev/). Property-based testing validates assertions against a wide range of generated inputs, ensuring robustness and catching edge cases that might be missed in traditional unit tests.

The test harness and utilities are provided by the [`@bupkis/property-testing`](../property-testing) package.

### Overview

Property-based tests verify that assertions behave correctly across four different scenarios:

1. **Valid inputs** - Should pass the assertion
2. **Invalid inputs** - Should fail the assertion (throw `AssertionError`)
3. **Valid inputs (negated)** - Should pass the negated assertion (`not ...`)
4. **Invalid inputs (negated)** - Should fail the negated assertion

Tests are organized by assertion category:

- `property/sync-basic.test.ts` - Basic type assertions (string, number, boolean, etc.)
- `property/sync-collection.test.ts` - Array and object assertions (contains, length, etc.)
- `property/sync-date.test.ts` - Date-related assertions
- `property/sync-esoteric.test.ts` - Advanced assertions (instanceof, satisfies, etc.)
- `property/sync-parametric.test.ts` - Parameterized assertions (greater than, matches, etc.)
- `property/async-parametric.test.ts` - Promise-based assertions (resolve, reject, etc.)

Additional property test files:

- `property/guards.test.ts` - Property tests for runtime type guards
- `property/util.test.ts` - Property tests for utility functions
- `property/value-to-schema.test.ts` - Property tests for value-to-schema conversion

### Key Files

#### Test Configurations (`property/configs/`)

Test configurations are defined separately from test files and live in `property/configs/`:

- `sync-basic.ts` - Configurations for basic type assertions
- `sync-collection.ts` - Configurations for collection assertions
- `sync-date.ts` - Configurations for date assertions
- `sync-esoteric.ts` - Configurations for esoteric assertions
- `sync-parametric.ts` - Configurations for parametric assertions
- `async-parametric.ts` - Configurations for async assertions

These configs export a `Map<AnyAssertion, PropertyTestConfig>` that maps each assertion to its test configuration:

```typescript
import {
  extractPhrases,
  filteredAnything,
  type PropertyTestConfig,
} from '@bupkis/property-testing';
import fc from 'fast-check';

import { toBeAString, toBeANumber } from '../../src/assertion/index.js';

export const testConfigs = new Map<AnyAssertion, PropertyTestConfig>([
  [
    toBeAString,
    {
      valid: {
        generators: [
          fc.string(),
          fc.constantFrom(...extractPhrases(toBeAString)),
        ],
      },
      invalid: {
        generators: [
          filteredAnything.filter((v) => typeof v !== 'string'),
          fc.constantFrom(...extractPhrases(toBeAString)),
        ],
      },
    },
  ],
  // ... more assertions
]);
```

#### `custom-assertions.ts`

Contains custom assertions for testing, including assertions specific to the test suite itself.

**Key exports:**

- **`exhaustiveAssertionTestAssertion`** - Custom assertion `"to exhaustively test collection"` that validates test configurations cover all assertions in a collection
- Uses set difference logic to identify missing test coverage
- Integrates with property-based testing to ensure comprehensive test coverage

**Testing Pattern**:

Property tests use this custom assertion to verify that all assertions in a collection have test configurations:

```typescript
import {
  createPropertyTestHarness,
  getVariants,
} from '@bupkis/property-testing';
import { describe, it } from 'node:test';

import { SyncBasicAssertions } from '../../src/assertion/index.js';
import { expect, expectAsync } from '../custom-assertions.js';
import { testConfigs } from './configs/sync-basic.js';

const { runVariant } = createPropertyTestHarness({ expect, expectAsync });

describe('Property-Based Tests for Basic Assertions', () => {
  // Verify all assertions have test configs
  it('should test all available assertions', () => {
    expect(
      testConfigs,
      'to exhaustively test collection',
      'SyncBasicAssertions',
      'from',
      SyncBasicAssertions,
    );
  });

  // Run tests for each assertion
  for (const [assertion, testConfig] of testConfigs) {
    const { params, variants } = getVariants(testConfig);
    describe(`Assertion: ${assertion}`, () => {
      for (const [name, variant] of variants) {
        it(`should pass ${name} checks`, async () => {
          await runVariant(variant, {}, params, name, assertion);
        });
      }
    });
  }
});
```

### Testing Strategy

#### Generator Optimization

The tests have been optimized to minimize static `fc.constant()` usage in favor of dynamic generators:

- **Dynamic Functions**: Use `fc.func().map()` to generate diverse function behaviors
- **Dynamic Values**: Use `fc.anything().map()`, `fc.string().map()` for broader input coverage
- **Strategic Constants**: Retain `fc.constant()` only where exact values are required (error classes, specific strings)

#### Coordinated Generation

Complex assertions use coordinated generators to ensure meaningful test scenarios:

```typescript
// Example: Testing error message matching
invalid: {
  generators: [
    fc.string().filter(s => s !== 'expected').map(msg =>
      Promise.reject(new Error(msg))
    ),
    fc.constant('expected'), // Expected message that won't match
  ],
}
```

#### Async Testing

Async assertions use `fc.asyncProperty()` and `expectAsync()` to properly handle Promise-based scenarios:

- Promise resolution/rejection testing
- Async function generation and testing
- Proper error handling for async assertion failures
- Safe thenable object usage to avoid unhandled Promise rejections

**Important**: Async property tests use thenable objects instead of immediately-executing async functions to prevent unhandled Promise rejections during test setup:

```typescript
// Safe thenable pattern for rejection scenarios
fc.constant({
  then(_resolve: (value: any) => void, reject: (reason: any) => void) {
    reject(new Error('rejection'));
  },
});
```

### Running Property Tests

```bash
# Run all property tests
npm run test:property

# Run property tests in watch mode
npm run test:property:dev

# Run individual property test file
node --import tsx --test test/property/sync-basic.test.ts

# Run async property tests specifically
node --import tsx --test test/property/async-parametric.test.ts
```

**Note**: Property-based tests integrate with Wallaby through the `@bupkis/property-testing` harness. The test structure keeps test registration separate from utility code for better Wallaby compatibility.

### Configuration Examples

#### Basic Type Assertion

```typescript
const testConfig: PropertyTestConfig = {
  valid: {
    generators: [fc.string(), fc.constantFrom(...extractPhrases(toBeAString))],
  },
  invalid: {
    generators: [
      filteredAnything.filter((v) => typeof v !== 'string'),
      fc.constantFrom(...extractPhrases(toBeAString)),
    ],
  },
};
```

#### Async Assertion

```typescript
const testConfig: PropertyTestConfig = {
  valid: {
    async: true,
    generators: [
      // Safe thenable pattern to avoid unhandled rejections
      fc.string().map((error) => ({
        then(_resolve: any, reject: any) {
          reject(new Error(error));
        },
      })),
      fc.constantFrom(...extractPhrases(promiseToReject)),
    ],
  },
  invalid: {
    async: true,
    generators: [
      fc.string().map((str) => Promise.resolve(str)), // Should reject but resolves
      fc.constantFrom(...extractPhrases(promiseToReject)),
    ],
  },
};
```

This systematic approach ensures comprehensive testing coverage while maintaining the natural language expressiveness that makes Bupkis unique.

### Run Count

The run count is dependent on several environment variables, _in order of precedence_:

- `WALLABY`: If set, will decrease the number of runs drastically to speed up responsiveness in WallabyJS.
- `CI`: If set, will decrease the number of runs to avoid excessive resource usage.
- `NUM_RUNS`: If set, this integer value will determine the number of runs.

See `@bupkis/property-testing`'s `calculateNumRuns()` for details.

## Snapshot Tests for `AssertionError` Messages

This directory contains error snapshot tests that complement the property-based testing approach. Error snapshot tests capture consistent error message formatting for assertion failures.

### Error Test Files

- `assertion-error/sync-basic-error.test.ts` - Error snapshots for basic type assertions
- `assertion-error/sync-collection-error.test.ts` - Error snapshots for collection assertions
- `assertion-error/sync-date-error.test.ts` - Error snapshots for date assertions
- `assertion-error/sync-esoteric-error.test.ts` - Error snapshots for esoteric assertions
- `assertion-error/sync-parametric-error.test.ts` - Error snapshots for parametric assertions
- `assertion-error/async-parametric-error.test.ts` - Error snapshots for async assertions

### Error Snapshot Utilities

The `assertion-error/error-snapshot-util.ts` provides the `takeErrorSnapshot()` function for capturing and serializing assertion errors:

```typescript
import { describe, it } from 'node:test';

import { expect } from '../custom-assertions.js';
import { takeErrorSnapshot } from './error-snapshot-util.js';

describe('Error snapshots', () => {
  it(
    'should capture string assertion error',
    takeErrorSnapshot(() => {
      expect(42, 'to be a string');
    }),
  );

  // For async assertions
  it(
    'should capture rejection error',
    takeErrorSnapshot(async () => {
      await expectAsync(Promise.resolve('foo'), 'to reject');
    }),
  );
});
```

The serializer:

- Strips ANSI control characters from error messages
- Removes stack traces for stable snapshots
- Handles nested Error objects in `actual`/`expected` properties

### Updating Snapshots

Execute the following command to update error snapshots after making changes impacting the snapshots:

> Always _check the snapshots_ before updating to ensure the change was intentional!

```sh
npm run test:update-snapshots
```
