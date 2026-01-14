# Fast-Check Generator Patterns for Bupkis

This reference covers common fast-check generator patterns used in bupkis property tests.

## Basic Generators

### Constant Values

Use `fc.constant()` for fixed values:

```typescript
fc.constant(new EventEmitter()); // Always same fresh instance per run
fc.constant('to have listeners'); // Fixed string
fc.constant({ within: 1000 }); // Fixed options object
```

### Phrase Selection with extractPhrases

**Always prefer `extractPhrases()`** over hardcoding phrases for maintainability:

```typescript
// PREFERRED: Automatically adapts if assertion phrase changes
fc.constantFrom(...extractPhrases(assertion));

// Works whether assertion has one or multiple phrase variants
```

Only hardcode phrases for compound assertions where `extractPhrases()` returns all phrases but they need to be in separate tuple positions:

```typescript
// Compound assertion: 'to emit from' ... 'with args'
// extractPhrases() returns ['to emit from', 'with args'] but we need them split
fc.constant('to emit from'),  // First phrase slot
fc.constant('with args'),     // Second phrase slot (hardcoded)
```

### Primitive Generators

```typescript
fc.string({ minLength: 1 }); // Non-empty string
fc.integer({ min: 0, max: 100 }); // Bounded integer
fc.boolean(); // true/false
fc.oneof(fc.string(), fc.integer()); // Union type
```

### Array Generators

```typescript
fc.array(fc.string(), { minLength: 1, maxLength: 5 });
fc.array(fc.oneof(fc.string(), fc.integer()), { minLength: 1, maxLength: 3 });
```

## Chaining Patterns

### Why Chain?

`fc.chain()` creates dependent generators where later values derive from earlier ones. Critical when:

- An object must be configured based on generated values
- The same object reference must appear multiple times in the tuple
- Generated values need to be consistent with each other

### Single Value Chain

```typescript
fc.string({ minLength: 1 }).chain((eventName) => {
  const emitter = new EventEmitter();
  emitter.on(eventName, () => {});
  return fc.tuple(
    fc.constant(emitter),
    fc.constant('to have listener for'),
    fc.constant(eventName),
  );
});
```

### Multi-Value Chain

```typescript
fc.tuple(fc.string({ minLength: 1 }), fc.integer({ min: 0, max: 5 })).chain(
  ([eventName, count]) => {
    const emitter = new EventEmitter();
    for (let i = 0; i < count; i++) {
      emitter.on(eventName, () => {});
    }
    return fc.tuple(
      fc.constant(emitter),
      fc.constant('to have listener count'),
      fc.constant(eventName),
      fc.constant(count),
    );
  },
);
```

### Nested Chains

For complex dependencies:

```typescript
fc.string({ minLength: 1 }).chain((eventType) =>
  fc.oneof(fc.string(), fc.integer(), fc.object()).chain((detail) => {
    const target = new EventTarget();
    return fc.tuple(
      fc.constant(() =>
        target.dispatchEvent(new CustomEvent(eventType, { detail })),
      ),
      fc.constant('to dispatch from'),
      fc.constant(target),
      fc.constant(eventType),
      fc.constant('with detail'),
      fc.constant(detail),
    );
  }),
);
```

## Filtering Patterns

### Ensuring Different Values

For invalid test cases where actual ≠ expected:

```typescript
fc.tuple(fc.integer({ min: 0, max: 5 }), fc.integer({ min: 0, max: 5 }))
  .filter(([actual, expected]) => actual !== expected)
  .chain(([actualCount, expectedCount]) => {
    const emitter = new EventEmitter();
    for (let i = 0; i < actualCount; i++) {
      emitter.on('event', () => {});
    }
    return fc.tuple(
      fc.constant(emitter),
      fc.constant('to have listener count'),
      fc.constant('event'),
      fc.constant(expectedCount), // Different from actual
    );
  });
```

### Guaranteed Different Ranges

Alternative to filtering - use non-overlapping ranges:

```typescript
fc.tuple(
  fc.integer({ min: 0, max: 50 }), // actual: 0-50
  fc.integer({ min: 51, max: 100 }), // expected: 51-100 (always different)
).chain(([actual, expected]) => {
  // ...
});
```

## Trigger Function Patterns

### Sync Trigger

For async assertions that need a trigger:

```typescript
fc.constant(() => emitter.emit(eventName));
fc.constant(() => target.dispatchEvent(new Event(eventType)));
```

### Trigger with Arguments

```typescript
fc.constant(() => emitter.emit(eventName, ...args));
fc.constant(() => target.dispatchEvent(new CustomEvent(type, { detail })));
```

### Empty Trigger (for invalid cases)

```typescript
fc.constant(() => {}); // Does nothing - assertion should timeout/fail
```

## Array vs fc.tuple() for Generators

### Array Syntax for Non-Parametric Assertions

Use array syntax `[...]` for non-parametric assertions (only subject + phrase, no additional parameters):

```typescript
// Non-parametric: expect(emitter, 'to have listeners')
// No parameters beyond subject and phrase - array is appropriate
generators: [
  fc.constant(new EventEmitter()),
  fc.constantFrom(...extractPhrases(assertion)),
];
```

### fc.tuple() for Parametric Assertions

Use `fc.tuple()` when the assertion has parameters or when chaining:

```typescript
// Parametric: expect(emitter, 'to have listener for', eventName)
// Has parameter (eventName) - use tuple with chain
generators: fc.string({ minLength: 1 }).chain((eventName) => {
  const emitter = new EventEmitter();
  emitter.on(eventName, () => {});
  return fc.tuple(
    fc.constant(emitter),
    fc.constantFrom(...extractPhrases(assertion)),
    fc.constant(eventName), // Parameter
  );
});
```

### Summary

| Assertion Type                            | Generator Syntax              |
| ----------------------------------------- | ----------------------------- |
| Non-parametric (`subject, phrase`)        | Array `[...]` or `fc.tuple()` |
| Parametric (`subject, phrase, ...params`) | `fc.tuple()` with `.chain()`  |

## Common Mistakes

### Mistake 1: Independent Objects Instead of Shared

```typescript
// WRONG: Different emitter configured vs returned
const emitter = new EventEmitter();
emitter.on('foo', () => {});
generators: fc.tuple(
  fc.constant(new EventEmitter()), // Fresh emitter, not configured!
  fc.constant('to have listeners'),
);
```

```typescript
// CORRECT: Same emitter configured and returned
generators: fc.constant(null).chain(() => {
  const emitter = new EventEmitter();
  emitter.on('foo', () => {});
  return fc.tuple(fc.constant(emitter), fc.constant('to have listeners'));
});
```

### Mistake 2: Using constantFrom for Single Value

```typescript
// UNNECESSARY: constantFrom with single value
fc.constantFrom('to emit from');

// BETTER: constant for single value
fc.constant('to emit from');
```

### Mistake 3: Forgetting to Chain When Needed

```typescript
// WRONG: eventName used but not captured in chain
fc.tuple(
  fc.string({ minLength: 1 }),
  fc.constant(new EventEmitter()), // Can't configure with eventName!
);

// CORRECT: Chain to access generated value
fc.string({ minLength: 1 }).chain((eventName) => {
  const emitter = new EventEmitter();
  emitter.on(eventName, () => {}); // Can configure with eventName
  return fc.tuple(fc.constant(emitter), fc.constant(eventName));
});
```

## Performance Tips

### Use Bounded Ranges

```typescript
// Slower: Large range
fc.integer();

// Faster: Bounded range
fc.integer({ min: 0, max: 10 });
```

### Limit Array Lengths

```typescript
// Slower: Unbounded arrays
fc.array(fc.string());

// Faster: Bounded arrays
fc.array(fc.string(), { minLength: 1, maxLength: 5 });
```

### Use runSize

```typescript
const testConfigDefaults: PropertyTestConfigParameters = {
  runSize: 'small', // 50 runs - fastest
  // runSize: 'medium',  // 100 runs
  // runSize: 'large',   // 250 runs
} as const;
```

**Note on async assertions:** Async assertion tests are inherently slower due to timeouts, especially invalid cases that must wait for the timeout to expire. With `within: 50` and `runSize: 'small'` (50 runs), each invalid async test takes ~2.5 seconds. Consider using `'small'` for async-heavy test suites, or even smaller custom values if the harness supports it.
