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

_BUPKIS_ recommends [fast-check][] for property-based testing due to its flexibility, popularity, and the sad fact that the author has no idea about any other property-based testing libraries.

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

## Next Steps

- **[fast-check Documentation][fast-check]** - Learn more about property-based testing

[fast-check]: https://fast-check.dev
[node-test]: https://nodejs.org/api/test.html
