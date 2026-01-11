---
title: Testing Custom Assertions
category: Guides
---

Creating reliable assertions is only possible through the ancient and glorious art of _software testing_.

This guide shows you how to test your custom assertions using property-based testing with [fast-check][].

## Why Property-Based Testing?

Property-based testing is particularly well-suited for testing assertions because:

- **Exhaustive Coverage**: Tests your assertion with a wide range of inputs automatically
- **Edge Case Discovery**: Finds corner cases you might not think to test manually
- **Confidence**: Hundreds or thousands of test cases run automatically
- **Documentation**: Properties serve as executable specifications

<span class="bupkis">BUPKIS</span> recommends [fast-check][] for property-based testing due to its flexibility, popularity, and the sad fact that the author has no idea about any other property-based testing libraries.

This guide will use the built-in Node.js test runner [`node:test`][node-test], but you can use any test framework you prefer.

## Basic Example: Testing a Custom Assertion

Let's create and test a simple custom assertion that checks if a number is even:

### 1. Create the Custom Assertion

```ts
// even-assertion.ts
import { createAssertion, z, use } from 'bupkis';

export const evenAssertion = createAssertion(
  [z.number(), 'to be even'],
  (n) => n % 2 === 0,
);

export const { expect } = use([evenAssertion]);
```

### 2. Test with fast-check

```ts
// even-assertion.test.ts
import { describe, it } from 'node:test';
import fc from 'fast-check';
import { expect, evenAssertion } from './even-assertion.js';

describe('evenAssertion', () => {
  it('should pass for all even numbers', () => {
    fc.assert(
      fc.property(fc.integer(), (n) => {
        // Only test even numbers
        fc.pre(n % 2 === 0);

        // This should not throw
        expect(n, 'to be even');
      }),
    );
  });

  it('should fail for all odd numbers', () => {
    fc.assert(
      fc.property(fc.integer(), (n) => {
        // Only test odd numbers
        fc.pre(n % 2 === 1);

        // This should throw an AssertionError
        try {
          expect(n, 'to be even');
          return false; // Should not reach here
        } catch (error) {
          return error.name === 'AssertionError';
        }
      }),
    );
  });

  it('should reject non-numbers', () => {
    fc.assert(
      fc.property(
        fc.anything().filter((x) => typeof x !== 'number'),
        (value) => {
          try {
            expect(value, 'to be even');
            return false; // Should not reach here
          } catch (error) {
            // Should throw a TypeError for invalid arguments
            return error.name === 'TypeError';
          }
        },
      ),
    );
  });
});
```

## More Complex Example: Range Validation

Let's test a more complex assertion that validates a number is within a range:

### 1. Create the Range Assertion

```ts
// range-assertion.ts
import { createAssertion, z, use } from 'bupkis';

export const rangeAssertion = createAssertion(
  [z.number(), 'to be between', z.number(), 'and', z.number()],
  (value, min, max) => {
    if (min > max) {
      return {
        actual: { min, max },
        expected: 'min <= max',
        message: `Range is invalid: min (${min}) must be <= max (${max})`,
      };
    }

    return value >= min && value <= max;
  },
);

export const { expect } = use([rangeAssertion]);
```

### 2. Test with Coordinated Generators

```ts
// range-assertion.test.ts
import { describe, it } from 'node:test';
import * as fc from 'fast-check';
import { expect, rangeAssertion } from './range-assertion.js';

describe('rangeAssertion', () => {
  it('should pass for values within valid ranges', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -100, max: 100 }), // min
        fc.integer({ min: -100, max: 100 }), // max
        (min, max) => {
          // Ensure min <= max
          const [actualMin, actualMax] = min <= max ? [min, max] : [max, min];

          // Generate a value within the range
          const value = fc.sample(
            fc.integer({ min: actualMin, max: actualMax }),
            1,
          )[0];

          // This should not throw
          expect(value, 'to be between', actualMin, 'and', actualMax);
        },
      ),
    );
  });

  it('should fail for values outside valid ranges', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 10, max: 20 }), // min
        fc.integer({ min: 30, max: 40 }), // max
        fc.integer({ min: -100, max: 5 }), // value outside range
        (min, max, value) => {
          try {
            expect(value, 'to be between', min, 'and', max);
            return false; // Should not reach here
          } catch (error) {
            return error.name === 'AssertionError';
          }
        },
      ),
    );
  });

  it('should handle invalid ranges gracefully', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 10, max: 20 }), // min
        fc.integer({ min: 0, max: 5 }), // max < min
        fc.integer(), // any value
        (min, max, value) => {
          try {
            expect(value, 'to be between', min, 'and', max);
            return false; // Should not reach here
          } catch (error) {
            return (
              error.name === 'AssertionError' &&
              error.message.includes('Range is invalid')
            );
          }
        },
      ),
    );
  });
});
```

## Testing Async Assertions

For async assertions, use `fc.asyncProperty()`:

```ts
// async-assertion.test.ts
import { describe, it } from 'node:test';
import * as fc from 'fast-check';
import { createAsyncAssertion, z, use } from 'bupkis';

// Create an async assertion
const resolveToAssertion = createAsyncAssertion(
  ['to resolve to', z.unknown()],
  async (promise, expected) => {
    const result = await promise;
    return result === expected;
  },
);

const { expectAsync } = use([resolveToAssertion]);

describe('resolveToAssertion', () => {
  it('should pass when promise resolves to expected value', async () => {
    await fc.assert(
      fc.asyncProperty(fc.anything(), async (value) => {
        const promise = Promise.resolve(value);
        await expectAsync(promise, 'to resolve to', value);
      }),
    );
  });

  it('should fail when promise resolves to different value', async () => {
    await fc.assert(
      fc.asyncProperty(fc.anything(), fc.anything(), async (value1, value2) => {
        // Only test when values are different
        fc.pre(value1 !== value2);

        const promise = Promise.resolve(value1);
        try {
          await expectAsync(promise, 'to resolve to', value2);
          return false; // Should not reach here
        } catch (error) {
          return error.name === 'AssertionError';
        }
      }),
    );
  });
});
```

## Best Practices for Testing Assertions

### 1. Test Both Success and Failure Cases

Always test that your assertion passes when it should and fails when it should:

```ts
// Test success
expect(validInput, 'your assertion phrase');

// Test failure
try {
  expect(invalidInput, 'your assertion phrase');
  // Should not reach here
} catch (error) {
  // Verify it's the right kind of error
}
```

### 2. Use Preconditions Wisely

Use `fc.pre()` to filter inputs to specific test cases:

```ts
fc.property(fc.integer(), (n) => {
  fc.pre(n > 0); // Only test positive numbers
  expect(n, 'to be positive');
});
```

### 3. Test Error Messages

Verify that your assertion provides helpful error messages:

```ts
try {
  expect(42, 'to be a string');
} catch (error) {
  assert(error.message.includes('expected string'));
  assert(error.actual === 42);
}
```

### 4. Test Type Safety

Verify that your assertion rejects invalid input types:

```ts
fc.property(fc.string(), (str) => {
  try {
    expect(str, 'to be greater than', 5); // Should fail
    return false;
  } catch (error) {
    return error.name === 'TypeError';
  }
});
```

## Running the Tests

Add fast-check to your development dependencies:

```bash
npm install fast-check -D
```

Run your tests with your preferred test runner:

```bash
# Using Node.js built-in test runner
node --test --import tsx test/**/*.test.ts

# Using npm script
npm test
```

## Scaling Up: @bupkis/property-testing

If you're building a library of assertions and need to test them systematically, the [`@bupkis/property-testing`][property-testing] package provides a structured harness that handles the boilerplate for you.

### Installation

```bash
npm install @bupkis/property-testing fast-check -D
```

### The Four-Variant Pattern

Every assertion can be tested in four ways:

| Variant          | Description                               |
| ---------------- | ----------------------------------------- |
| `valid`          | Input that should **pass** the assertion  |
| `invalid`        | Input that should **fail** the assertion  |
| `validNegated`   | Input that should **pass** `not <phrase>` |
| `invalidNegated` | Input that should **fail** `not <phrase>` |

For most assertions, negation simply inverts the logic—so `validNegated` defaults to your `invalid` config and vice versa. You only need to specify them explicitly when the negated behavior differs.

### Example: Testing a Collection of Assertions

```ts
// my-assertions.test.ts
import {
  createPropertyTestHarness,
  extractPhrases,
  filteredAnything,
  getVariants,
  type PropertyTestConfig,
} from '@bupkis/property-testing';
import fc from 'fast-check';
import { describe, it } from 'node:test';

import { expect, expectAsync } from './my-assertions.js';
import {
  evenAssertion,
  oddAssertion,
  positiveAssertion,
} from './assertions.js';

// Create the harness with your expect functions
const { runVariant } = createPropertyTestHarness({ expect, expectAsync });

// Define configs for each assertion
const testConfigs = new Map([
  [
    evenAssertion,
    {
      valid: {
        generators: [
          fc.integer().map((n) => n * 2), // always even
          fc.constantFrom(...extractPhrases(evenAssertion)),
        ],
      },
      invalid: {
        generators: [
          fc.integer().map((n) => n * 2 + 1), // always odd
          fc.constantFrom(...extractPhrases(evenAssertion)),
        ],
      },
    } satisfies PropertyTestConfig,
  ],
  [
    positiveAssertion,
    {
      valid: {
        generators: [
          fc.integer({ min: 1 }),
          fc.constantFrom(...extractPhrases(positiveAssertion)),
        ],
      },
      invalid: {
        generators: [
          fc.integer({ max: 0 }),
          fc.constantFrom(...extractPhrases(positiveAssertion)),
        ],
      },
    } satisfies PropertyTestConfig,
  ],
]);

// Run all tests
for (const [assertion, testConfig] of testConfigs) {
  const phrases = extractPhrases(assertion);
  const { variants, params } = getVariants(testConfig);

  describe(`assertion: "${phrases[0]}"`, () => {
    for (const [variantName, variant] of variants) {
      it(`should handle ${variantName} inputs`, async () => {
        await runVariant(variant, {}, params, variantName);
      });
    }
  });
}
```

### Testing Parametric Assertions

For assertions with parameters, include generators for each parameter:

```ts
import { rangeAssertion } from './range-assertion.js';

const rangeConfig: PropertyTestConfig = {
  valid: {
    generators: fc
      .tuple(
        fc.integer({ min: -100, max: 100 }),
        fc.integer({ min: -100, max: 100 }),
      )
      .chain(([a, b]) => {
        const [min, max] = a <= b ? [a, b] : [b, a];
        return fc.tuple(
          fc.integer({ min, max }), // value in range
          fc.constantFrom(...extractPhrases(rangeAssertion)),
          fc.constant(min),
          fc.constant(max),
        );
      }),
  },
  invalid: {
    generators: fc
      .tuple(fc.integer({ min: 0, max: 50 }), fc.integer({ min: 51, max: 100 }))
      .chain(([min, max]) =>
        fc.tuple(
          fc.integer({ max: min - 1 }), // value below range
          fc.constantFrom(...extractPhrases(rangeAssertion)),
          fc.constant(min),
          fc.constant(max),
        ),
      ),
  },
};
```

### Async Variant Configuration

Mark your variant as async:

```ts
const asyncConfig: PropertyTestConfig = {
  valid: {
    async: true,
    generators: [
      fc.anything().map((v) => Promise.resolve(v)),
      fc.constantFrom('to resolve'),
    ],
  },
  invalid: {
    async: true,
    generators: [
      fc.anything().map((v) => Promise.reject(new Error(`${v}`))),
      fc.constantFrom('to resolve'),
    ],
  },
};
```

### Utility Functions

The package provides several helpers for common testing scenarios:

```ts
import {
  filteredAnything, // fc.anything() minus problematic objects
  filteredObject, // fc.object() minus problematic objects
  objectFilter, // the filter function itself
  hasKeyDeep, // recursively search for a key
  hasValueDeep, // recursively search for a value
  safeRegexStringFilter, // remove regex metacharacters
  calculateNumRuns, // environment-aware run count
} from '@bupkis/property-testing';

// Filter out objects that break Zod validation
const safeValue = filteredAnything.filter((v) => v !== null);

// Check if generated object has problematic keys
const isSafe = objectFilter(generatedObject);

// Search nested structures
hasKeyDeep({ a: { b: { c: 1 } } }, 'c'); // true
hasValueDeep({ a: [{ b: 42 }] }, 42); // true
```

### Controlling Test Runs

The `runSize` option adjusts the number of property test iterations:

```ts
const config: PropertyTestConfig = {
  runSize: 'small', // 50 runs (vs 250 for 'medium', 500 for 'large')
  valid: {
    /* ... */
  },
  invalid: {
    /* ... */
  },
};
```

Run counts automatically scale down in CI (÷5) and Wallaby (÷10) for faster feedback.

## Next Steps

- **[fast-check Documentation][fast-check]** - Learn more about property-based testing
- **[@bupkis/property-testing][property-testing]** - Full API reference

[fast-check]: https://fast-check.dev
[node-test]: https://nodejs.org/api/test.html
[property-testing]: https://github.com/boneskull/bupkis/tree/main/packages/property-testing
