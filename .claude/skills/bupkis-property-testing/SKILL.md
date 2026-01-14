---
name: bupkis-property-testing
description: This skill should be used when the user asks to "write property tests", "add property tests", "create property-based tests", "use @bupkis/property-testing", or mentions "PropertyTestConfig", "fast-check generators", or "property testing for bupkis assertions". Provides guidance for writing property-based tests for bupkis plugin assertions using @bupkis/property-testing and fast-check.
---

# Property Testing for Bupkis Plugins

This skill covers writing property-based tests for bupkis assertion plugins (like `@bupkis/events` or `@bupkis/sinon`) using `@bupkis/property-testing` and `fast-check`.

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
    "@bupkis/property-testing": "workspace:*",
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

Each assertion needs a `PropertyTestConfig` with `valid` and `invalid` variants:

```typescript
const config: PropertyTestConfig = {
  valid: {
    generators: fc.tuple(
      fc.constant(subject),
      fc.constant('assertion phrase'),
      // ...additional params
    ),
  },
  invalid: {
    generators: fc.tuple(
      fc.constant(invalidSubject),
      fc.constant('assertion phrase'),
      // ...additional params
    ),
  },
};
```

### Generator Tuple Order

Generators produce tuples matching assertion signature: `[subject, phrase, ...params]`

For `expect(emitter, 'to have listener for', eventName)`:

```typescript
generators: fc.tuple(
  fc.constant(emitter), // subject
  fc.constant('to have listener for'), // phrase
  fc.constant(eventName), // param
);
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

Sync assertions use the standard generator pattern:

```typescript
[
  assertions.hasListenersAssertion,
  {
    valid: {
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
      generators: [
        fc.constant(new EventEmitter()), // No chaining needed for fresh object
        fc.constantFrom(...extractPhrases(assertions.hasListenersAssertion)),
      ],
    },
  },
];
```

### Async Assertions

Async assertions require special handling because they involve triggers and timeouts.

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

## Additional Resources

### Reference Files

- **`references/generator-patterns.md`** - Detailed fast-check generator patterns
- **`references/async-patterns.md`** - Advanced async assertion testing

### Example Files

- **`examples/sync-config.ts`** - Complete sync assertion config
- **`examples/async-config.ts`** - Complete async assertion config

See `packages/events/test/property.test.ts` for a complete working implementation.
