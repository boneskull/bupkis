# Technical Specification: @bupkis/events

> EventEmitter and EventTarget assertions for Bupkis

**Issue:** [#315](https://github.com/boneskull/bupkis/issues/315)
**Author:** Claude (analyzed from issue by boneskull)
**Date:** 2026-01-11
**Status:** Draft

---

## Issue Summary

Create a `@bupkis/events` package providing assertions for Node.js `EventEmitter` and DOM `EventTarget`. This is a spiritual successor to [unexpected-eventemitter](https://github.com/IBM/unexpected-eventemitter) with a modernized API for bupkis.

## Problem Statement

Testing event-driven code requires:
1. Verifying emitter state (listeners registered, max listeners configured)
2. Asserting that specific events are emitted with expected arguments
3. Handling async event timing with configurable timeouts
4. Supporting both Node.js `EventEmitter` and browser `EventTarget` APIs

Currently, bupkis has no built-in support for these patterns, forcing users to write boilerplate listener setup/teardown code.

## Technical Approach

### Architecture

The package will follow the established bupkis plugin pattern (see `@bupkis/sinon`):

```
packages/events/
├── src/
│   ├── index.ts           # Public exports
│   ├── assertions.ts      # Sync + async assertion implementations
│   ├── schema.ts          # Zod schemas for EventEmitter/EventTarget
│   ├── guards.ts          # Type guards and duck-typing utilities
│   └── types.ts           # TypeScript type definitions
├── test/
│   ├── emitter.test.ts    # EventEmitter assertion tests
│   ├── target.test.ts     # EventTarget assertion tests
│   └── async.test.ts      # Async assertion + timeout tests
├── package.json
├── tsconfig.json
├── README.md
└── LICENSE.md
```

### Key Design Decisions

1. **Duck-typed detection**: Use structural checks rather than `instanceof` to support custom EventEmitter implementations and cross-realm objects.

2. **Two assertion categories**:
   - **Sync assertions**: Check current emitter state (listener counts, etc.)
   - **Async assertions**: Wait for events to be emitted within a timeout

3. **Trigger-based async API**: Following `unexpected-eventemitter`, async assertions take a "trigger" function/Promise that causes the emission, rather than just waiting passively.

4. **"to satisfy" semantics**: Event argument matching uses flexible satisfaction rather than strict equality, allowing partial matching.

5. **Configurable timeouts**: Default timeout with per-assertion override via options object.

---

## Implementation Plan

### Phase 1: Foundation

#### 1.1 Package Scaffolding
- Create `packages/events/` directory structure
- Set up `package.json` with peer dependency on `bupkis`
- Configure `tsconfig.json` extending base config
- Add to `release-please-config.json`

#### 1.2 Type Guards and Schemas (`guards.ts`, `schema.ts`)

```typescript
// guards.ts
export function isEventEmitter(value: unknown): value is EventEmitterLike {
  return (
    value !== null &&
    typeof value === 'object' &&
    typeof (value as any).on === 'function' &&
    typeof (value as any).once === 'function' &&
    typeof (value as any).emit === 'function' &&
    typeof (value as any).removeListener === 'function'
  );
}

export function isEventTarget(value: unknown): value is EventTarget {
  return (
    value !== null &&
    typeof value === 'object' &&
    typeof (value as any).addEventListener === 'function' &&
    typeof (value as any).removeEventListener === 'function' &&
    typeof (value as any).dispatchEvent === 'function'
  );
}
```

```typescript
// schema.ts
import { z } from 'bupkis';
import { isEventEmitter, isEventTarget } from './guards.js';

export const EventEmitterSchema = z.custom<EventEmitterLike>(
  isEventEmitter,
  'Expected an EventEmitter-like object'
);

export const EventTargetSchema = z.custom<EventTarget>(
  isEventTarget,
  'Expected an EventTarget'
);

export const EventNameSchema = z.union([z.string(), z.symbol()]);

export const TimeoutOptionsSchema = z.object({
  within: z.number().positive().optional(),
}).optional();
```

### Phase 2: Sync Assertions

#### 2.1 Listener State Assertions

| Assertion | Description |
|-----------|-------------|
| `to have listener for <event>` | Emitter has at least one listener for event |
| `to have listeners for <...events>` | Emitter has listeners for all specified events |
| `to have listener count <event> <n>` | Emitter has exactly n listeners for event |
| `to have no listeners` | Emitter has zero listeners total |
| `to have no listeners for <event>` | Emitter has zero listeners for specific event |
| `to have max listeners <n>` | Emitter's maxListeners is set to n |

```typescript
// Example implementation
export const hasListenerForAssertion = expect.createAssertion(
  [EventEmitterSchema, 'to have listener for', EventNameSchema],
  (emitter: EventEmitterLike, eventName: string | symbol) => {
    const count = emitter.listenerCount(eventName);
    if (count > 0) {
      return true;
    }
    return {
      actual: count,
      expected: 'at least 1 listener',
      message: `Expected emitter to have listener for '${String(eventName)}', but found none`,
    };
  }
);
```

### Phase 3: Async Assertions

#### 3.1 Core Emission Assertions

The key insight from `unexpected-eventemitter`: async assertions need a **trigger** that causes the emission. This avoids race conditions and makes tests deterministic.

**API Pattern:**
```typescript
// Trigger is a function or Promise that causes the event
await expectAsync(trigger, 'to emit from', emitter, 'eventName');
await expectAsync(trigger, 'to emit from', emitter, 'eventName', { within: 1000 });
```

| Assertion | Description |
|-----------|-------------|
| `to emit from <emitter> <event>` | Trigger causes emitter to emit event |
| `to emit from <emitter> <event> with args <args>` | Event emitted with specific arguments |
| `to emit from <emitter> <event> with args satisfying <matchers>` | Event args satisfy matchers |
| `to emit error from <emitter>` | Trigger causes emitter to emit 'error' event |
| `to emit error from <emitter> satisfying <matcher>` | Error event satisfies matcher |
| `to emit events from <emitter> <sequence>` | Events emitted in order |
| `not to emit from <emitter> <event>` | Event is NOT emitted within timeout |

```typescript
// Example: to emit from
export const toEmitFromAssertion = expect.createAsyncAssertion(
  [
    z.union([z.function(), z.promise(z.unknown())]),
    'to emit from',
    EventEmitterSchema,
    EventNameSchema,
    TimeoutOptionsSchema,
  ],
  async (
    trigger: (() => unknown) | Promise<unknown>,
    emitter: EventEmitterLike,
    eventName: string | symbol,
    options?: { within?: number }
  ) => {
    const timeout = options?.within ?? DEFAULT_TIMEOUT;

    return new Promise((resolve) => {
      let emitted = false;
      let receivedArgs: unknown[] = [];

      const timer = setTimeout(() => {
        cleanup();
        resolve({
          actual: 'no emission',
          expected: `'${String(eventName)}' event`,
          message: `Expected '${String(eventName)}' to be emitted within ${timeout}ms`,
        });
      }, timeout);

      const listener = (...args: unknown[]) => {
        emitted = true;
        receivedArgs = args;
        cleanup();
        resolve(true);
      };

      const cleanup = () => {
        clearTimeout(timer);
        emitter.removeListener(eventName, listener);
      };

      emitter.once(eventName, listener);

      // Execute trigger
      const result = typeof trigger === 'function' ? trigger() : trigger;
      if (result instanceof Promise) {
        result.catch(() => {/* handled by timeout */});
      }
    });
  }
);
```

#### 3.2 EventTarget Assertions

| Assertion | Description |
|-----------|-------------|
| `to dispatch from <target> <type>` | Trigger causes target to dispatch event |
| `to dispatch from <target> <type> with detail <detail>` | CustomEvent with specific detail |

### Phase 4: Integration

#### 4.1 Assertion Bundle Export

```typescript
// index.ts
export const eventAssertions = {
  // Sync
  hasListenerForAssertion,
  hasListenersForAssertion,
  hasListenerCountAssertion,
  hasNoListenersAssertion,
  hasNoListenersForAssertion,
  hasMaxListenersAssertion,

  // Async - EventEmitter
  toEmitFromAssertion,
  toEmitWithArgsFromAssertion,
  toEmitWithArgsSatisfyingFromAssertion,
  toEmitErrorFromAssertion,
  toEmitEventsFromAssertion,
  notToEmitFromAssertion,

  // Async - EventTarget
  toDispatchFromAssertion,
  toDispatchWithDetailFromAssertion,
};
```

#### 4.2 Configuration

```typescript
// Default timeout for async assertions (ms)
export const DEFAULT_TIMEOUT = 2000;

// Allow users to configure
export function setDefaultTimeout(ms: number): void {
  // Implementation
}
```

---

## Test Plan

### Unit Tests

#### Sync Assertions (`emitter.test.ts`)

```typescript
describe('@bupkis/events', () => {
  describe('sync assertions', () => {
    describe('to have listener for', () => {
      it('should pass when listener exists', () => {
        const emitter = new EventEmitter();
        emitter.on('data', () => {});
        e(emitter, 'to have listener for', 'data');
      });

      it('should fail when no listener exists', () => {
        const emitter = new EventEmitter();
        expect(() => e(emitter, 'to have listener for', 'data'), 'to throw');
      });

      it('should work with symbol events', () => {
        const emitter = new EventEmitter();
        const sym = Symbol('test');
        emitter.on(sym, () => {});
        e(emitter, 'to have listener for', sym);
      });
    });

    describe('to have listener count', () => {
      it('should pass with correct count', () => {
        const emitter = new EventEmitter();
        emitter.on('data', () => {});
        emitter.on('data', () => {});
        e(emitter, 'to have listener count', 'data', 2);
      });

      it('should fail with wrong count', () => {
        const emitter = new EventEmitter();
        emitter.on('data', () => {});
        expect(() => e(emitter, 'to have listener count', 'data', 5), 'to throw');
      });
    });

    describe('to have no listeners', () => {
      it('should pass for fresh emitter', () => {
        e(new EventEmitter(), 'to have no listeners');
      });

      it('should fail when listeners exist', () => {
        const emitter = new EventEmitter();
        emitter.on('x', () => {});
        expect(() => e(emitter, 'to have no listeners'), 'to throw');
      });
    });

    describe('to have max listeners', () => {
      it('should pass with matching value', () => {
        const emitter = new EventEmitter();
        emitter.setMaxListeners(20);
        e(emitter, 'to have max listeners', 20);
      });
    });
  });
});
```

#### Async Assertions (`async.test.ts`)

```typescript
describe('async assertions', () => {
  describe('to emit from', () => {
    it('should pass when event is emitted', async () => {
      const emitter = new EventEmitter();
      await expectAsync(
        () => emitter.emit('ready'),
        'to emit from', emitter, 'ready'
      );
    });

    it('should pass with async trigger', async () => {
      const emitter = new EventEmitter();
      await expectAsync(
        async () => {
          await delay(10);
          emitter.emit('ready');
        },
        'to emit from', emitter, 'ready'
      );
    });

    it('should pass with Promise trigger', async () => {
      const emitter = new EventEmitter();
      await expectAsync(
        delay(10).then(() => emitter.emit('ready')),
        'to emit from', emitter, 'ready'
      );
    });

    it('should fail on timeout', async () => {
      const emitter = new EventEmitter();
      await expect(
        expectAsync(() => {}, 'to emit from', emitter, 'nope', { within: 50 }),
        'to be rejected'
      );
    });
  });

  describe('to emit from with args', () => {
    it('should pass with matching args', async () => {
      const emitter = new EventEmitter();
      await expectAsync(
        () => emitter.emit('data', 'hello', 42),
        'to emit from', emitter, 'data',
        'with args', ['hello', 42]
      );
    });

    it('should use satisfy semantics for partial matching', async () => {
      const emitter = new EventEmitter();
      await expectAsync(
        () => emitter.emit('data', { name: 'test', extra: 'ignored' }),
        'to emit from', emitter, 'data',
        'with args satisfying', [{ name: 'test' }]
      );
    });
  });

  describe('not to emit from', () => {
    it('should pass when event not emitted', async () => {
      const emitter = new EventEmitter();
      await expectAsync(
        () => emitter.emit('other'),
        'not to emit from', emitter, 'target', { within: 50 }
      );
    });

    it('should fail when event is emitted', async () => {
      const emitter = new EventEmitter();
      await expect(
        expectAsync(
          () => emitter.emit('oops'),
          'not to emit from', emitter, 'oops', { within: 50 }
        ),
        'to be rejected'
      );
    });
  });

  describe('to emit events from (sequence)', () => {
    it('should pass when events emitted in order', async () => {
      const emitter = new EventEmitter();
      await expectAsync(
        () => {
          emitter.emit('start');
          emitter.emit('data');
          emitter.emit('end');
        },
        'to emit events from', emitter, ['start', 'data', 'end']
      );
    });

    it('should fail when order is wrong', async () => {
      const emitter = new EventEmitter();
      await expect(
        expectAsync(
          () => {
            emitter.emit('end');
            emitter.emit('start');
          },
          'to emit events from', emitter, ['start', 'end']
        ),
        'to be rejected'
      );
    });
  });
});
```

#### EventTarget Tests (`target.test.ts`)

```typescript
describe('EventTarget assertions', () => {
  describe('to dispatch from', () => {
    it('should pass when event is dispatched', async () => {
      const target = new EventTarget();
      await expectAsync(
        () => target.dispatchEvent(new Event('click')),
        'to dispatch from', target, 'click'
      );
    });
  });

  describe('to dispatch from with detail', () => {
    it('should pass with matching CustomEvent detail', async () => {
      const target = new EventTarget();
      await expectAsync(
        () => target.dispatchEvent(
          new CustomEvent('custom', { detail: { foo: 'bar' } })
        ),
        'to dispatch from', target, 'custom',
        'with detail', { foo: 'bar' }
      );
    });
  });
});
```

### Edge Cases to Test

1. **Duck-typed emitters**: Custom objects with emit/on/once methods
2. **Symbol event names**: Both EventEmitter and assertions handle symbols
3. **Multiple emissions**: Verify only first emission triggers pass
4. **Cleanup on timeout**: Listeners removed after timeout
5. **Error propagation**: Trigger errors don't mask assertion failures
6. **Zero timeout**: `{ within: 0 }` should immediately check/fail
7. **Concurrent assertions**: Multiple async assertions on same emitter

---

## Files to Modify/Create

### Create

| File | Purpose |
|------|---------|
| `packages/events/package.json` | Package manifest |
| `packages/events/tsconfig.json` | TypeScript config |
| `packages/events/README.md` | Documentation |
| `packages/events/LICENSE.md` | BlueOak-1.0.0 license |
| `packages/events/src/index.ts` | Public exports |
| `packages/events/src/assertions.ts` | Assertion implementations |
| `packages/events/src/schema.ts` | Zod schemas |
| `packages/events/src/guards.ts` | Type guards |
| `packages/events/src/types.ts` | TypeScript types |
| `packages/events/test/emitter.test.ts` | EventEmitter tests |
| `packages/events/test/target.test.ts` | EventTarget tests |
| `packages/events/test/async.test.ts` | Async assertion tests |

### Modify

| File | Change |
|------|--------|
| `release-please-config.json` | Add `packages/events` entry |
| `.release-please-manifest.json` | Add initial version |

---

## Success Criteria

- [ ] All sync assertions implemented and tested
- [ ] All async assertions implemented and tested
- [ ] EventTarget support working
- [ ] Configurable timeouts functioning
- [ ] Duck-typed EventEmitter detection working
- [ ] TypeScript types provide good DX (event name inference where possible)
- [ ] All tests passing
- [ ] Documentation complete with examples
- [ ] Package builds successfully (ESM + CJS via zshy)
- [ ] No regressions in existing packages

---

## Out of Scope

1. **Browser-specific event types**: Focus on generic EventTarget, not specific DOM events (MouseEvent, KeyboardEvent, etc.)
2. **Stream assertions**: `Readable`/`Writable` stream assertions are a separate concern
3. **RxJS/Observable support**: Different paradigm, would be separate package
4. **Event recording/history**: Not storing all emissions, just assertion-relevant ones
5. **Automatic cleanup registration**: Users manage their own listener cleanup outside assertions

---

## Open Questions

1. **Default timeout value**: 2000ms seems reasonable, but should it be configurable globally?
   - **Proposed**: Yes, via `setDefaultTimeout()` function

2. **Trigger execution timing**: Should trigger be executed before or after listener setup?
   - **Proposed**: After, to catch synchronous emissions

3. **Multiple emissions of same event**: Should we support `to emit N times`?
   - **Proposed**: Defer to v2, keep v1 simple

4. **AbortController support**: Should timeout use AbortController internally?
   - **Proposed**: Yes, for clean cancellation semantics

---

## Dependencies

### Runtime
- `bupkis` (peer dependency) - Core assertion library
- `zod` (via bupkis) - Schema validation

### Development
- `tsx` - TypeScript execution for tests
- `zshy` - Dual ESM/CJS builds
- Standard monorepo tooling (inherited)

---

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Timing-sensitive tests flaky in CI | Use generous default timeout, document CI considerations |
| Memory leaks from orphaned listeners | Ensure cleanup in all code paths (success, timeout, error) |
| Cross-realm EventEmitter detection | Duck-typing rather than instanceof |
| Async assertion ordering | Document that assertion resolves on first matching emission |
