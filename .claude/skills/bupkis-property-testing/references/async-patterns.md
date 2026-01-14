# Async Assertion Testing Patterns

This reference covers patterns for testing async bupkis assertions with property-based testing.

## Async Assertion Structure

Async assertions have a trigger function as the first argument:

```typescript
await expectAsync(
  () => emitter.emit('event'), // trigger
  'to emit from',
  emitter,
  'event',
  { within: 1000 }, // optional timeout
);
```

## Valid Async Cases

Use the `async: true` flag with generators:

```typescript
{
  valid: {
    async: true,
    generators: fc.string({ minLength: 1 }).chain((eventName) => {
      const emitter = new EventEmitter();
      return fc.tuple(
        fc.constant(() => emitter.emit(eventName)),  // Trigger
        fc.constant('to emit from'),
        fc.constant(emitter),
        fc.constant(eventName),
      );
    }),
  },
}
```

### Key Points for Valid Cases

1. **Trigger is first tuple element** - The function that causes the event
2. **Same object reference** - Trigger uses same emitter/target as assertion
3. **`async: true` flag** - Tells harness this is an async assertion

## Invalid Async Cases

Invalid async tests require `asyncProperty` because:

1. They need short timeouts to fail quickly
2. The test must verify rejection rather than success
3. The harness cannot auto-wrap async failures

```typescript
{
  invalid: {
    asyncProperty: () =>
      fc.asyncProperty(fc.string({ minLength: 1 }), async (eventName) => {
        const emitter = new EventEmitter();
        await expectAsync(
          expectAsync(
            () => {},  // Empty trigger - no event emitted
            'to emit from',
            emitter,
            eventName,
            { within: 50 },  // Short timeout for fast failure
          ),
          'to reject',  // Expect the inner assertion to reject
        );
      }),
  },
}
```

### Key Points for Invalid Cases

1. **Nested expectAsync** - Outer expects rejection, inner is the actual assertion
2. **Short timeout** - Use `{ within: 50 }` to fail fast (50ms × 50 runs = 2.5s)
3. **Empty or wrong trigger** - Causes assertion to fail
4. **`fc.asyncProperty`** - Wraps the async test function

### asyncProperty Requires Arbitraries

`fc.asyncProperty()` must have at least one arbitrary before the async function:

```typescript
// WRONG: No arbitrary
fc.asyncProperty(async () => {
  /* ... */
});

// CORRECT: Has arbitrary (even if unused)
fc.asyncProperty(fc.constant(null), async () => {
  /* ... */
});

// CORRECT: Uses the arbitrary
fc.asyncProperty(fc.string({ minLength: 1 }), async (eventName) => {
  /* ... */
});
```

## Timeout Considerations

### Production Timeouts

Default timeout is typically 1000ms. For valid tests, this is fine:

```typescript
valid: {
  async: true,
  generators: /* ... includes { within: 1000 } or default */
}
```

### Test Timeouts

For invalid tests, use short timeouts to keep test suite fast:

```typescript
invalid: {
  asyncProperty: () =>
    fc.asyncProperty(/* ... */, async (/* ... */) => {
      await expectAsync(
        expectAsync(/* ... */, { within: 50 }),  // 50ms timeout
        'to reject',
      );
    }),
}
```

### Calculating Test Time

```
Total time ≈ timeout × runSize × number_of_timeout_tests

With runSize: 'small' (50 runs) and within: 50:
50ms × 50 runs = 2.5 seconds per invalid async test
```

## EventEmitter Patterns

### Basic Emit

```typescript
fc.string({ minLength: 1 }).chain((eventName) => {
  const emitter = new EventEmitter();
  return fc.tuple(
    fc.constant(() => emitter.emit(eventName)),
    fc.constant('to emit from'),
    fc.constant(emitter),
    fc.constant(eventName),
  );
});
```

### Emit with Arguments

```typescript
fc.tuple(
  fc.string({ minLength: 1 }),
  fc.array(fc.oneof(fc.string(), fc.integer()), { minLength: 1, maxLength: 3 }),
).chain(([eventName, args]) => {
  const emitter = new EventEmitter();
  return fc.tuple(
    fc.constant(() => emitter.emit(eventName, ...args)),
    fc.constant('to emit from'),
    fc.constant(emitter),
    fc.constant(eventName),
    fc.constant('with args'),
    fc.constant(args),
  );
});
```

### Error Events

Error events need a listener to prevent unhandled errors:

```typescript
fc.constant(null).chain(() => {
  const emitter = new EventEmitter();
  emitter.on('error', () => {}); // Prevent unhandled error crash
  return fc.tuple(
    fc.constant(() => emitter.emit('error', new Error('test'))),
    fc.constant('to emit error from'),
    fc.constant(emitter),
  );
});
```

### Multiple Events in Order

```typescript
fc.array(fc.string({ minLength: 1 }), { minLength: 1, maxLength: 3 }).chain(
  (events) => {
    const emitter = new EventEmitter();
    return fc.tuple(
      fc.constant(() => events.forEach((e) => emitter.emit(e))),
      fc.constant('to emit events from'),
      fc.constant(emitter),
      fc.constant(events),
    );
  },
);
```

## EventTarget Patterns

### Basic Dispatch

```typescript
fc.string({ minLength: 1 }).chain((eventType) => {
  const target = new EventTarget();
  return fc.tuple(
    fc.constant(() => target.dispatchEvent(new Event(eventType))),
    fc.constant('to dispatch from'),
    fc.constant(target),
    fc.constant(eventType),
  );
});
```

### CustomEvent with Detail

```typescript
fc.tuple(
  fc.string({ minLength: 1 }),
  fc.oneof(fc.string(), fc.integer(), fc.object()),
).chain(([eventType, detail]) => {
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
});
```

## Invalid Case Strategies

### Wrong Arguments

```typescript
fc.asyncProperty(
  fc.string({ minLength: 1 }),
  fc.array(fc.string(), { minLength: 1, maxLength: 3 }),
  async (eventName, args) => {
    const emitter = new EventEmitter();
    await expectAsync(
      expectAsync(
        () => emitter.emit(eventName, 'wrong'), // Wrong args
        'to emit from',
        emitter,
        eventName,
        'with args',
        args, // Expected args
        { within: 50 },
      ),
      'to reject',
    );
  },
);
```

### Wrong Order

```typescript
fc.asyncProperty(
  fc.array(fc.string({ minLength: 1 }), { minLength: 2, maxLength: 3 }),
  async (events) => {
    const emitter = new EventEmitter();
    await expectAsync(
      expectAsync(
        () => {
          emitter.emit(events[events.length - 1]!); // Last first
          emitter.emit(events[0]!); // First second
        },
        'to emit events from',
        emitter,
        events, // Expected in original order
        { within: 50 },
      ),
      'to reject',
    );
  },
);
```

### Wrong Detail

```typescript
fc.asyncProperty(
  fc.string({ minLength: 1 }),
  fc.string(),
  async (eventType, detail) => {
    const target = new EventTarget();
    await expectAsync(
      expectAsync(
        () =>
          target.dispatchEvent(
            new CustomEvent(eventType, { detail: 'wrong' }), // Wrong detail
          ),
        'to dispatch from',
        target,
        eventType,
        'with detail',
        detail, // Expected detail
        { within: 50 },
      ),
      'to reject',
    );
  },
);
```

### No Event (Timeout)

```typescript
fc.asyncProperty(fc.string({ minLength: 1 }), async (eventName) => {
  const emitter = new EventEmitter();
  await expectAsync(
    expectAsync(
      () => {}, // No event emitted
      'to emit from',
      emitter,
      eventName,
      { within: 50 },
    ),
    'to reject',
  );
});
```
