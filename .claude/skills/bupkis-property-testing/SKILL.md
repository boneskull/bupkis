---
name: bupkis-property-testing
description: This skill should be used when the user asks to "write property tests", "add property tests", "create property-based tests", "use @bupkis/property-testing", or mentions "PropertyTestConfig", "fast-check generators", or "property testing for bupkis assertions". Provides guidance for writing property-based tests for bupkis plugin assertions using @bupkis/property-testing and fast-check.
---

# Property Testing for Bupkis Plugins

This skill covers writing property-based tests for bupkis assertion plugins (like `@bupkis/events` or `@bupkis/sinon`) using `@bupkis/property-testing` and `fast-check`.

## The Spirit of Property Testing

**The whole point of property testing is to exercise code with a wide variety of randomly generated inputs.** Every test config should have actual stochastic behavior - if a test just runs the same hardcoded values 50 times, you've missed the plot entirely.

### The Anti-Pattern: `fc.constant(null).chain(...)`

This pattern is a red flag that indicates zero randomness:

```typescript
// BAD: No randomness at all - just runs the same test 50 times
generators: fc.constant(null).chain(() => {
  const spy = sinon.spy();
  spy('hardcoded', 42);
  return fc.tuple(fc.constant(spy), fc.constant('was called'));
});
```

The only benefit over a regular unit test is exercising alternate phrase variants. That's weak sauce.

### The Fix: Always Generate Something

Even when the assertion logic seems simple, find something to randomize:

```typescript
// GOOD: Random args, random call counts - actually tests edge cases
generators: fc.tuple(
  fc.integer({ min: 1, max: 5 }),
  fc.array(fc.oneof(fc.string(), fc.integer(), fc.boolean()), { maxLength: 5 }),
).chain(([callCount, args]) => {
  const spy = sinon.spy();
  for (let i = 0; i < callCount; i++) {
    spy(...args, i);
  }
  return fc.tuple(
    fc.constant(spy),
    fc.constantFrom(...extractPhrases(assertions.wasCalledAssertion)),
  );
});
```

### What to Randomize

Look for opportunities to vary:

- **Arguments/parameters** - strings, numbers, objects, arrays with diverse values
- **Counts** - call counts, array lengths, iteration counts
- **Object shapes** - context objects, configuration objects
- **Error types and messages** - Error, TypeError, RangeError with random messages
- **Timing** - delays, timeouts (for async tests)

### Helper Arbitraries

Define reusable arbitraries for common patterns:

```typescript
// Diverse argument arrays
const argsArbitrary = fc.array(
  fc.oneof(
    fc.string(),
    fc.integer(),
    fc.boolean(),
    fc.double({ noNaN: true }),
    fc.constant(null),
    fc.constant(undefined),
  ),
  { maxLength: 5, minLength: 0 },
);

// Random context objects
const contextArbitrary = fc.record({
  id: fc.oneof(fc.string(), fc.integer()),
  name: fc.option(fc.string(), { nil: undefined }),
  value: fc.option(fc.integer(), { nil: undefined }),
});

// Random Error instances
const errorArbitrary = fc
  .tuple(fc.string(), fc.constantFrom(Error, TypeError, RangeError))
  .map(([msg, ErrorClass]) => new ErrorClass(msg));
```

## Overview

Property-based testing validates that assertions behave correctly across a wide range of randomly generated inputs. The `@bupkis/property-testing` package provides a test harness that automatically generates four test variants from each configuration:

| Variant          | Description                                              |
| ---------------- | -------------------------------------------------------- |
| `valid`          | Assertion passes with valid input                        |
| `invalid`        | Assertion fails with invalid input                       |
| `validNegated`   | Negated assertion passes (e.g., `not to have listeners`) |
| `invalidNegated` | Negated assertion fails                                  |

## Setup

### Dependencies

Add to `package.json`:

```json
{
  "devDependencies": {
    "@bupkis/property-testing": "0.15.0",
    "fast-check": "^4.5.2"
  }
}
```

### Test File Structure

Create `test/property.test.ts`:

```typescript
import {
  createPropertyTestHarness,
  extractPhrases,
  getVariants,
  type PropertyTestConfig,
  type PropertyTestConfigParameters,
} from '@bupkis/property-testing';
import { use } from 'bupkis';
import fc from 'fast-check';
import { describe, it } from 'node:test';

import * as assertions from '../src/assertions.js';

// Create harness with plugin's expect functions
const { expect, expectAsync } = use(assertions.myPluginAssertions);
const { runVariant } = createPropertyTestHarness({ expect, expectAsync });

// Configure run size ('small' recommended for fast tests)
const testConfigDefaults: PropertyTestConfigParameters = {
  runSize: 'small', // 50 runs; 'medium' = 100; 'large' = 250
} as const;
```

## PropertyTestConfig Structure

Each assertion needs a `PropertyTestConfig` with `valid` and `invalid` variants. **Both variants should have randomness.**

### Generator Tuple Order

Generators produce tuples matching assertion signature: `[subject, phrase, ...params]`

For `expect(emitter, 'to have listener for', eventName)`:

```typescript
generators: fc.string({ minLength: 1 }).chain((eventName) => {
  const emitter = new EventEmitter();
  emitter.on(eventName, () => {});
  return fc.tuple(
    fc.constant(emitter),
    fc.constantFrom(...extractPhrases(assertions.hasListenerForAssertion)),
    fc.constant(eventName),
  );
});
```

## The Chain Pattern (Critical)

Use `fc.chain()` when generated values must share the same object reference. This is essential for assertions where the subject is configured based on generated values.

### Why Chain Matters

Without chaining, each `fc.constant()` creates independent values:

```typescript
// WRONG: emitter in tuple is different from configured emitter
generators: fc.tuple(
  fc.constant(new EventEmitter()), // Fresh emitter A
  fc.constant('to have listeners'),
);
// Meanwhile, emitter B was configured elsewhere...
```

With chaining, derived values share the same reference:

```typescript
// CORRECT: Same emitter is configured and returned
generators: fc.string({ minLength: 1 }).chain((eventName) => {
  const emitter = new EventEmitter();
  emitter.on(eventName, () => {});  // Configure THIS emitter
  return fc.tuple(
    fc.constant(emitter),  // Return SAME emitter
    fc.constant('to have listener for'),
    fc.constant(eventName),
  );
}),
```

### Chain Pattern Examples

**Single dependency:**

```typescript
fc.string({ minLength: 1 }).chain((name) => {
  const obj = createConfigured(name);
  return fc.tuple(fc.constant(obj), fc.constant(name));
});
```

**Multiple dependencies:**

```typescript
fc.tuple(fc.string({ minLength: 1 }), fc.integer({ min: 0, max: 10 })).chain(
  ([name, count]) => {
    const obj = configure(name, count);
    return fc.tuple(fc.constant(obj), fc.constant(name), fc.constant(count));
  },
);
```

## Sync vs Async Assertions

### Sync Assertions

Sync assertions use the standard generator pattern. Always include randomness:

```typescript
[
  assertions.hasListenersAssertion,
  {
    valid: {
      // Random event name - good!
      generators: fc.string({ minLength: 1 }).chain((eventName) => {
        const emitter = new EventEmitter();
        emitter.on(eventName, () => {});
        return fc.tuple(
          fc.constant(emitter),
          fc.constantFrom(...extractPhrases(assertions.hasListenersAssertion)),
        );
      }),
    },
    invalid: {
      // Still use chain to get fresh emitter per run
      generators: fc.string({ minLength: 1 }).chain(() => {
        const emitter = new EventEmitter();
        // Don't add any listeners - that's the invalid case
        return fc.tuple(
          fc.constant(emitter),
          fc.constantFrom(...extractPhrases(assertions.hasListenersAssertion)),
        );
      }),
    },
  },
];
```

### Async Assertions

Async assertions require special handling because they involve triggers and timeouts.

**⚠️ Critical: Never test async assertions where "nothing happens"**

Do not write tests for async assertions where the trigger is never fired. For example, if the assertion waits for an event that never gets emitted, it will cause timeouts, performance problems, and a world of pain. If you need to test the "invalid" case for an async assertion that waits on something, either:

1. Use a very short timeout (e.g., `within: 50`) and wrap in `'to reject'` (see invalid case example below)
2. Skip the variant entirely if it doesn't make sense to test

**Valid cases** use `async: true` flag:

```typescript
valid: {
  async: true,
  generators: fc.string({ minLength: 1 }).chain((eventName) => {
    const emitter = new EventEmitter();
    return fc.tuple(
      fc.constant(() => emitter.emit(eventName)),  // trigger function
      fc.constant('to emit from'),
      fc.constant(emitter),
      fc.constant(eventName),
    );
  }),
}
```

**Invalid cases** use `asyncProperty` with nested rejection:

```typescript
invalid: {
  asyncProperty: () =>
    fc.asyncProperty(fc.string({ minLength: 1 }), async (eventName) => {
      const emitter = new EventEmitter();
      await expectAsync(
        expectAsync(() => {}, 'to emit from', emitter, eventName, {
          within: 50,  // Short timeout for fast failure
        }),
        'to reject',
      );
    }),
}
```

The `asyncProperty` approach is necessary because:

1. Invalid async tests need short timeouts to fail quickly
2. The harness cannot automatically wrap async failures

## Test Harness Loop

Run all configs through the harness:

```typescript
describe('Property Tests', () => {
  for (const [assertion, testConfig] of testConfigs) {
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

## Common Patterns

### Using extractPhrases

`extractPhrases(assertion)` extracts phrase literals from an assertion definition. **Always prefer `extractPhrases()` over hardcoding phrases** to reduce maintenance burden - if the phrase changes in the assertion definition, tests automatically pick it up.

```typescript
// PREFERRED: Uses extractPhrases for maintainability
fc.constantFrom(...extractPhrases(assertions.hasListenerForAssertion));

// Works for single or multiple phrase variants
// e.g., ['to have listener for'] or ['to have listener for', 'to have a listener for']
```

### Compound Assertions (When to Hardcode)

Only hardcode phrases for compound assertions like `'to emit from' ... 'with args'` where `extractPhrases()` returns ALL phrases but you need them in separate tuple positions:

```typescript
generators: fc.tuple(eventName, args).chain(([eventName, args]) => {
  const emitter = new EventEmitter();
  return fc.tuple(
    fc.constant(() => emitter.emit(eventName, ...args)),
    fc.constant('to emit from'), // First phrase only
    fc.constant(emitter),
    fc.constant(eventName),
    fc.constant('with args'), // Second phrase literal
    fc.constant(args),
  );
});
```

### Testing Invalid Cases with Different Values

Generate distinct actual vs expected values:

```typescript
fc.tuple(
  fc.integer({ min: 0, max: 5 }), // actual
  fc.integer({ min: 0, max: 5 }), // expected
)
  .filter(([actual, expected]) => actual !== expected)
  .chain(([actual, expected]) => {
    const obj = configureWith(actual);
    return fc.tuple(fc.constant(obj), fc.constant(expected));
  });
```

### Ensuring Objects Don't Match (Deep Equality / Satisfies)

For invalid cases testing `'to satisfy'` or `'deep equal'` semantics, use fast-check's `size` parameter to guarantee mismatches. Generate a smaller object as the subject and a larger one as the expected value—a bigger object will never be a subset of a smaller one:

```typescript
fc.tuple(
  fc.object({ maxDepth: 1, size: 'small' }), // subject (fewer keys)
  fc.object({ maxDepth: 1, size: 'medium' }), // expected (more keys)
).chain(([subject, expected]) => {
  return fc.tuple(
    fc.constant(subject),
    fc.constantFrom(...extractPhrases(assertions.toSatisfyAssertion)),
    fc.constant(expected),
  );
});
```

This approach avoids flaky tests from random chance matches and doesn't require filtering (which can slow down generation).

### ⚠️ The NaN Trap

Remember that `NaN !== NaN` in JavaScript. Strict equality assertions won't behave as expected when `NaN` sneaks into your generated values:

```typescript
// This "invalid" case will PASS because NaN !== NaN
const subject = NaN;
const expected = NaN;
expect(subject, 'to be', expected); // Throws! But you wanted it to pass.
```

When using `fc.double()` or `fc.float()`, exclude `NaN` if you're testing strict equality:

```typescript
fc.double({ noNaN: true }); // Safe for 'to be' assertions
```

If you actually need to test `NaN` handling, use `Number.isNaN()` or bupkis's `'to be NaN'` assertion instead of strict equality.

## Checklist Before Submitting

Before considering property tests complete, verify:

1. **Every config has randomness** - No `fc.constant(null).chain(() => { hardcoded stuff })`
2. **Valid and invalid variants both vary** - Don't just randomize one side
3. **Helper arbitraries are defined** - Reuse common patterns (args, contexts, errors)
4. **Edge cases are possible** - Empty arrays, empty strings, zero, negative numbers
5. **ESLint passes** - Watch for `@typescript-eslint/no-unsafe-return` in forEach callbacks

## Additional Resources

### Reference Files

- **`references/generator-patterns.md`** - Detailed fast-check generator patterns
- **`references/async-patterns.md`** - Advanced async assertion testing

### Example Files

- **`packages/sinon/test/property.test.ts`** - Sync assertions with diverse randomness
- **`packages/events/test/property.test.ts`** - Mix of sync and async assertions
