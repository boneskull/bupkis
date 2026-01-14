/**
 * Property-based tests for @bupkis/events assertions.
 *
 * Uses fast-check to generate random inputs and validates that assertions
 * behave correctly across the input space.
 */

import {
  createPropertyTestHarness,
  extractPhrases,
  getVariants,
  type PropertyTestConfig,
  type PropertyTestConfigParameters,
} from '@bupkis/property-testing';
import { use } from 'bupkis';
import fc from 'fast-check';
import { EventEmitter } from 'node:events';
import { describe, it } from 'node:test';

import * as assertions from '../src/assertions.js';

const { expect, expectAsync } = use(assertions.eventAssertions);
const { runVariant } = createPropertyTestHarness({ expect, expectAsync });

// Use 'small' run size to keep tests fast (especially async tests with timeouts)
const testConfigDefaults: PropertyTestConfigParameters = {
  runSize: 'small',
} as const;

// Helper: Generate random Error instances
const errorArbitrary = fc
  .tuple(fc.string(), fc.constantFrom(Error, TypeError, RangeError))
  .map(([msg, ErrorClass]) => new ErrorClass(msg));

// Helper: Diverse event args
const eventArgsArbitrary = fc.array(
  fc.oneof(
    fc.string(),
    fc.integer(),
    fc.boolean(),
    fc.double({ noNaN: true }),
    fc.constant(null),
  ),
  { maxLength: 5, minLength: 0 },
);

// ─────────────────────────────────────────────────────────────
// SYNC ASSERTION CONFIGS
// ─────────────────────────────────────────────────────────────

const syncTestConfigs = new Map<
  (typeof assertions.eventAssertions)[number],
  PropertyTestConfig
>([
  // hasListenerCountAssertion
  [
    assertions.hasListenerCountAssertion,
    {
      invalid: {
        generators: fc
          .tuple(
            fc.string({ minLength: 1 }),
            fc.integer({ max: 5, min: 0 }), // actual count
            fc.integer({ max: 5, min: 0 }), // expected count
          )
          .filter(([_, actual, expected]) => actual !== expected)
          .chain(([eventName, actualCount, expectedCount]) => {
            const emitter = new EventEmitter();
            for (let i = 0; i < actualCount; i++) {
              emitter.on(eventName, () => {});
            }
            return fc.tuple(
              fc.constant(emitter),
              fc.constantFrom(
                ...extractPhrases(assertions.hasListenerCountAssertion),
              ),
              fc.constant(eventName),
              fc.constant(expectedCount),
            );
          }),
      },
      valid: {
        generators: fc
          .tuple(fc.string({ minLength: 1 }), fc.integer({ max: 5, min: 0 }))
          .chain(([eventName, count]) => {
            const emitter = new EventEmitter();
            for (let i = 0; i < count; i++) {
              emitter.on(eventName, () => {});
            }
            return fc.tuple(
              fc.constant(emitter),
              fc.constantFrom(
                ...extractPhrases(assertions.hasListenerCountAssertion),
              ),
              fc.constant(eventName),
              fc.constant(count),
            );
          }),
      },
    },
  ],

  // hasListenerForAssertion
  [
    assertions.hasListenerForAssertion,
    {
      invalid: {
        generators: fc.string({ minLength: 1 }).chain((eventName) =>
          fc.tuple(
            fc.constant(new EventEmitter()), // fresh, no listeners
            fc.constantFrom(
              ...extractPhrases(assertions.hasListenerForAssertion),
            ),
            fc.constant(eventName),
          ),
        ),
      },
      valid: {
        generators: fc.string({ minLength: 1 }).chain((eventName) => {
          const emitter = new EventEmitter();
          emitter.on(eventName, () => {});
          return fc.tuple(
            fc.constant(emitter),
            fc.constantFrom(
              ...extractPhrases(assertions.hasListenerForAssertion),
            ),
            fc.constant(eventName),
          );
        }),
      },
    },
  ],

  // hasListenersAssertion (non-parametric)
  [
    assertions.hasListenersAssertion,
    {
      invalid: {
        // Fresh emitter with no listeners - use chain to get fresh instance each run
        generators: fc.integer({ max: 100, min: 0 }).chain((maxListeners) => {
          const emitter = new EventEmitter();
          emitter.setMaxListeners(maxListeners); // Vary something at least
          return fc.tuple(
            fc.constant(emitter),
            fc.constantFrom(
              ...extractPhrases(assertions.hasListenersAssertion),
            ),
          );
        }),
      },
      valid: {
        generators: fc
          .tuple(fc.string({ minLength: 1 }), fc.integer({ max: 5, min: 1 }))
          .chain(([eventName, listenerCount]) => {
            const emitter = new EventEmitter();
            for (let i = 0; i < listenerCount; i++) {
              emitter.on(eventName, () => {});
            }
            return fc.tuple(
              fc.constant(emitter),
              fc.constantFrom(
                ...extractPhrases(assertions.hasListenersAssertion),
              ),
            );
          }),
      },
    },
  ],

  // hasListenersForAssertion
  [
    assertions.hasListenersForAssertion,
    {
      invalid: {
        generators: fc
          .array(fc.string({ minLength: 1 }), { maxLength: 5, minLength: 1 })
          .chain((eventNames) =>
            fc.tuple(
              fc.constant(new EventEmitter()), // fresh, no listeners
              fc.constantFrom(
                ...extractPhrases(assertions.hasListenersForAssertion),
              ),
              fc.constant(eventNames),
            ),
          ),
      },
      valid: {
        generators: fc
          .array(fc.string({ minLength: 1 }), { maxLength: 5, minLength: 1 })
          .chain((eventNames) => {
            const emitter = new EventEmitter();
            eventNames.forEach((name) => emitter.on(name, () => {}));
            return fc.tuple(
              fc.constant(emitter),
              fc.constantFrom(
                ...extractPhrases(assertions.hasListenersForAssertion),
              ),
              fc.constant(eventNames),
            );
          }),
      },
    },
  ],

  // hasMaxListenersAssertion
  [
    assertions.hasMaxListenersAssertion,
    {
      invalid: {
        generators: fc
          .tuple(
            fc.integer({ max: 50, min: 0 }),
            fc.integer({ max: 100, min: 51 }),
          )
          .chain(([actual, expected]) => {
            const emitter = new EventEmitter();
            emitter.setMaxListeners(actual);
            return fc.tuple(
              fc.constant(emitter),
              fc.constantFrom(
                ...extractPhrases(assertions.hasMaxListenersAssertion),
              ),
              fc.constant(expected),
            );
          }),
      },
      valid: {
        generators: fc.integer({ max: 100, min: 0 }).chain((maxListeners) => {
          const emitter = new EventEmitter();
          emitter.setMaxListeners(maxListeners);
          return fc.tuple(
            fc.constant(emitter),
            fc.constantFrom(
              ...extractPhrases(assertions.hasMaxListenersAssertion),
            ),
            fc.constant(maxListeners),
          );
        }),
      },
    },
  ],
]);

// ─────────────────────────────────────────────────────────────
// ASYNC ASSERTION CONFIGS
// ─────────────────────────────────────────────────────────────

// Note: Assertions that can ONLY fail by timeout (no "wrong data" case possible)
// are excluded from property tests. These include:
// - toDispatchFromAssertion (any event dispatch = pass)
// - toEmitFromAssertion (any event emit = pass)
// - toEmitErrorFromAssertion (any error emit = pass)
// - toEmitEventsFromAssertion (waits for all events before checking order)
//
// Their valid behavior is covered by the WithOptions variants, and invalid
// behavior (timeout) is tested in non-property unit tests.

const asyncTestConfigs = new Map<
  (typeof assertions.eventAssertions)[number],
  PropertyTestConfig
>([
  // toDispatchFromWithOptionsAssertion
  [
    assertions.toDispatchFromWithOptionsAssertion,
    {
      invalid: {
        async: true,
        generators: fc.string({ minLength: 1 }).chain((eventType) => {
          const target = new EventTarget();
          return fc.tuple(
            fc.constant(() => {}), // Empty trigger - won't dispatch
            fc.constantFrom(
              ...extractPhrases(assertions.toDispatchFromWithOptionsAssertion),
            ),
            fc.constant(target),
            fc.constant(eventType),
            fc.constant({ within: 50 }), // Short timeout for faster tests
          );
        }),
      },
      valid: {
        async: true,
        generators: fc.string({ minLength: 1 }).chain((eventType) => {
          const target = new EventTarget();
          return fc.tuple(
            fc.constant(() => target.dispatchEvent(new Event(eventType))),
            fc.constantFrom(
              ...extractPhrases(assertions.toDispatchFromWithOptionsAssertion),
            ),
            fc.constant(target),
            fc.constant(eventType),
            fc.constant({ within: 1000 }),
          );
        }),
      },
    },
  ],

  // toDispatchWithDetailFromAssertion
  // Note: Use [0] to get only the first phrase ('to dispatch from'), since
  // extractPhrases also returns 'with detail' which is a separate position.
  [
    assertions.toDispatchWithDetailFromAssertion,
    {
      invalid: {
        async: true,
        generators: fc
          .tuple(
            fc.string({ minLength: 1 }),
            fc.oneof(fc.string(), fc.integer(), fc.boolean()),
          )
          .chain(([eventType, actualDetail]) =>
            fc
              .oneof(fc.string(), fc.integer(), fc.boolean())
              .filter((expectedDetail) => expectedDetail !== actualDetail)
              .chain((expectedDetail) => {
                const target = new EventTarget();
                return fc.tuple(
                  fc.constant(() =>
                    target.dispatchEvent(
                      new CustomEvent(eventType, { detail: actualDetail }),
                    ),
                  ),
                  fc.constant(
                    extractPhrases(
                      assertions.toDispatchWithDetailFromAssertion,
                    )[0],
                  ),
                  fc.constant(target),
                  fc.constant(eventType),
                  fc.constant('with detail'),
                  fc.constant(expectedDetail),
                );
              }),
          ),
      },
      valid: {
        async: true,
        generators: fc
          .tuple(
            fc.string({ minLength: 1 }),
            fc.oneof(fc.string(), fc.integer(), fc.object(), fc.boolean()),
          )
          .chain(([eventType, detail]) => {
            const target = new EventTarget();
            return fc.tuple(
              fc.constant(() =>
                target.dispatchEvent(new CustomEvent(eventType, { detail })),
              ),
              fc.constant(
                extractPhrases(assertions.toDispatchWithDetailFromAssertion)[0],
              ),
              fc.constant(target),
              fc.constant(eventType),
              fc.constant('with detail'),
              fc.constant(detail),
            );
          }),
      },
    },
  ],
  // toDispatchWithDetailFromWithOptionsAssertion
  [
    assertions.toDispatchWithDetailFromWithOptionsAssertion,
    {
      invalid: {
        async: true,
        generators: fc
          .tuple(
            fc.string({ minLength: 1 }),
            fc.oneof(fc.string(), fc.integer(), fc.boolean()),
          )
          .chain(([eventType, actualDetail]) =>
            fc
              .oneof(fc.string(), fc.integer(), fc.boolean())
              .filter((expectedDetail) => expectedDetail !== actualDetail)
              .chain((expectedDetail) => {
                const target = new EventTarget();
                return fc.tuple(
                  fc.constant(() =>
                    target.dispatchEvent(
                      new CustomEvent(eventType, { detail: actualDetail }),
                    ),
                  ),
                  fc.constant(
                    extractPhrases(
                      assertions.toDispatchWithDetailFromWithOptionsAssertion,
                    )[0],
                  ),
                  fc.constant(target),
                  fc.constant(eventType),
                  fc.constant('with detail'),
                  fc.constant(expectedDetail),
                  fc.constant({ within: 50 }),
                );
              }),
          ),
      },
      valid: {
        async: true,
        generators: fc
          .tuple(
            fc.string({ minLength: 1 }),
            fc.oneof(fc.string(), fc.integer(), fc.object(), fc.boolean()),
          )
          .chain(([eventType, detail]) => {
            const target = new EventTarget();
            return fc.tuple(
              fc.constant(() =>
                target.dispatchEvent(new CustomEvent(eventType, { detail })),
              ),
              fc.constant(
                extractPhrases(
                  assertions.toDispatchWithDetailFromWithOptionsAssertion,
                )[0],
              ),
              fc.constant(target),
              fc.constant(eventType),
              fc.constant('with detail'),
              fc.constant(detail),
              fc.constant({ within: 1000 }),
            );
          }),
      },
    },
  ],
  // toEmitErrorFromWithOptionsAssertion
  [
    assertions.toEmitErrorFromWithOptionsAssertion,
    {
      invalid: {
        async: true,
        generators: fc.integer({ max: 100, min: 1 }).chain((maxListeners) => {
          const emitter = new EventEmitter();
          emitter.setMaxListeners(maxListeners);
          emitter.on('error', () => {}); // Prevent unhandled error
          return fc.tuple(
            fc.constant(() => {}), // Empty trigger - no error emitted
            fc.constantFrom(
              ...extractPhrases(assertions.toEmitErrorFromWithOptionsAssertion),
            ),
            fc.constant(emitter),
            fc.constant({ within: 50 }),
          );
        }),
      },
      valid: {
        async: true,
        generators: errorArbitrary.chain((error) => {
          const emitter = new EventEmitter();
          emitter.on('error', () => {});
          return fc.tuple(
            fc.constant(() => emitter.emit('error', error)),
            fc.constantFrom(
              ...extractPhrases(assertions.toEmitErrorFromWithOptionsAssertion),
            ),
            fc.constant(emitter),
            fc.constant({ within: 1000 }),
          );
        }),
      },
    },
  ],
  // toEmitEventsFromWithOptionsAssertion
  [
    assertions.toEmitEventsFromWithOptionsAssertion,
    {
      invalid: {
        async: true,
        // Emit ALL events in reverse order to trigger immediate order-mismatch failure
        generators: fc
          .array(fc.string({ minLength: 1 }), { maxLength: 3, minLength: 2 })
          .chain((events) => {
            const emitter = new EventEmitter();
            const reversed = [...events].reverse();
            return fc.tuple(
              fc.constant(() => {
                for (const e of reversed) {
                  emitter.emit(e);
                }
              }),
              fc.constantFrom(
                ...extractPhrases(
                  assertions.toEmitEventsFromWithOptionsAssertion,
                ),
              ),
              fc.constant(emitter),
              fc.constant(events),
              fc.constant({ within: 1000 }), // Longer timeout since we emit all events
            );
          }),
      },
      valid: {
        async: true,
        generators: fc
          .array(fc.string({ minLength: 1 }), { maxLength: 3, minLength: 1 })
          .chain((events) => {
            const emitter = new EventEmitter();
            return fc.tuple(
              fc.constant(() => {
                for (const e of events) {
                  emitter.emit(e);
                }
              }),
              fc.constantFrom(
                ...extractPhrases(
                  assertions.toEmitEventsFromWithOptionsAssertion,
                ),
              ),
              fc.constant(emitter),
              fc.constant(events),
              fc.constant({ within: 1000 }),
            );
          }),
      },
    },
  ],
  // toEmitFromWithOptionsAssertion
  [
    assertions.toEmitFromWithOptionsAssertion,
    {
      invalid: {
        async: true,
        generators: fc.string({ minLength: 1 }).chain((eventName) => {
          const emitter = new EventEmitter();
          return fc.tuple(
            fc.constant(() => {}), // Empty trigger - won't emit
            fc.constantFrom(
              ...extractPhrases(assertions.toEmitFromWithOptionsAssertion),
            ),
            fc.constant(emitter),
            fc.constant(eventName),
            fc.constant({ within: 50 }),
          );
        }),
      },
      valid: {
        async: true,
        generators: fc.string({ minLength: 1 }).chain((eventName) => {
          const emitter = new EventEmitter();
          return fc.tuple(
            fc.constant(() => emitter.emit(eventName)),
            fc.constantFrom(
              ...extractPhrases(assertions.toEmitFromWithOptionsAssertion),
            ),
            fc.constant(emitter),
            fc.constant(eventName),
            fc.constant({ within: 1000 }),
          );
        }),
      },
    },
  ],

  // toEmitWithArgsFromAssertion
  // Note: Use [0] to get only the first phrase ('to emit from'), since
  // extractPhrases also returns 'with args' which is a separate position.
  [
    assertions.toEmitWithArgsFromAssertion,
    {
      invalid: {
        async: true,
        generators: fc
          .tuple(fc.string({ minLength: 1 }), eventArgsArbitrary)
          .chain(([eventName, expectedArgs]) => {
            const emitter = new EventEmitter();
            return fc.tuple(
              // Emit with wrong args to cause mismatch
              fc.constant(() =>
                emitter.emit(eventName, 'wrong_arg_not_in_expected'),
              ),
              fc.constant(
                extractPhrases(assertions.toEmitWithArgsFromAssertion)[0],
              ),
              fc.constant(emitter),
              fc.constant(eventName),
              fc.constant('with args'),
              fc.constant(expectedArgs),
            );
          }),
      },
      valid: {
        async: true,
        generators: fc
          .tuple(fc.string({ minLength: 1 }), eventArgsArbitrary)
          .chain(([eventName, args]) => {
            const emitter = new EventEmitter();
            return fc.tuple(
              fc.constant(() => emitter.emit(eventName, ...args)),
              fc.constant(
                extractPhrases(assertions.toEmitWithArgsFromAssertion)[0],
              ),
              fc.constant(emitter),
              fc.constant(eventName),
              fc.constant('with args'),
              fc.constant(args),
            );
          }),
      },
    },
  ],
  // toEmitWithArgsFromWithOptionsAssertion
  [
    assertions.toEmitWithArgsFromWithOptionsAssertion,
    {
      invalid: {
        async: true,
        generators: fc
          .tuple(fc.string({ minLength: 1 }), eventArgsArbitrary)
          .chain(([eventName, expectedArgs]) => {
            const emitter = new EventEmitter();
            return fc.tuple(
              fc.constant(() =>
                emitter.emit(eventName, 'wrong_arg_not_in_expected'),
              ),
              fc.constant(
                extractPhrases(
                  assertions.toEmitWithArgsFromWithOptionsAssertion,
                )[0],
              ),
              fc.constant(emitter),
              fc.constant(eventName),
              fc.constant('with args'),
              fc.constant(expectedArgs),
              fc.constant({ within: 50 }),
            );
          }),
      },
      valid: {
        async: true,
        generators: fc
          .tuple(fc.string({ minLength: 1 }), eventArgsArbitrary)
          .chain(([eventName, args]) => {
            const emitter = new EventEmitter();
            return fc.tuple(
              fc.constant(() => emitter.emit(eventName, ...args)),
              fc.constant(
                extractPhrases(
                  assertions.toEmitWithArgsFromWithOptionsAssertion,
                )[0],
              ),
              fc.constant(emitter),
              fc.constant(eventName),
              fc.constant('with args'),
              fc.constant(args),
              fc.constant({ within: 1000 }),
            );
          }),
      },
    },
  ],
]);

// ─────────────────────────────────────────────────────────────
// TEST HARNESS
// ─────────────────────────────────────────────────────────────

describe('@bupkis/events Property Tests', () => {
  describe('Sync Assertions', () => {
    for (const [assertion, testConfig] of syncTestConfigs) {
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

  describe('Async Assertions', () => {
    for (const [assertion, testConfig] of asyncTestConfigs) {
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
});
