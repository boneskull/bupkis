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

const asyncTestConfigs = new Map<
  (typeof assertions.eventAssertions)[number],
  PropertyTestConfig
>([
  // toDispatchFromAssertion
  [
    assertions.toDispatchFromAssertion,
    {
      invalid: {
        asyncProperty: () =>
          fc.asyncProperty(fc.string({ minLength: 1 }), async (eventType) => {
            const target = new EventTarget();
            await expectAsync(
              expectAsync(() => {}, 'to dispatch from', target, eventType, {
                within: 50,
              }),
              'to reject',
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
              ...extractPhrases(assertions.toDispatchFromAssertion),
            ),
            fc.constant(target),
            fc.constant(eventType),
          );
        }),
      },
    },
  ],

  // toDispatchFromWithOptionsAssertion
  [
    assertions.toDispatchFromWithOptionsAssertion,
    {
      invalid: {
        asyncProperty: () =>
          fc.asyncProperty(fc.string({ minLength: 1 }), async (eventType) => {
            const target = new EventTarget();
            await expectAsync(
              expectAsync(() => {}, 'to dispatch from', target, eventType, {
                within: 50,
              }),
              'to reject',
            );
          }),
      },
      valid: {
        async: true,
        generators: fc.string({ minLength: 1 }).chain((eventType) => {
          const target = new EventTarget();
          return fc.tuple(
            fc.constant(() => target.dispatchEvent(new Event(eventType))),
            fc.constant('to dispatch from'),
            fc.constant(target),
            fc.constant(eventType),
            fc.constant({ within: 1000 }),
          );
        }),
      },
    },
  ],

  // toDispatchWithDetailFromAssertion
  [
    assertions.toDispatchWithDetailFromAssertion,
    {
      invalid: {
        asyncProperty: () =>
          fc.asyncProperty(
            fc.string({ minLength: 1 }),
            fc.oneof(fc.string(), fc.integer(), fc.boolean()),
            fc.oneof(fc.string(), fc.integer(), fc.boolean()),
            async (eventType, actualDetail, expectedDetail) => {
              // Ensure actual !== expected for a guaranteed mismatch
              const target = new EventTarget();
              await expectAsync(
                expectAsync(
                  () =>
                    target.dispatchEvent(
                      new CustomEvent(eventType, { detail: actualDetail }),
                    ),
                  'to dispatch from',
                  target,
                  eventType,
                  'with detail',
                  // Use something definitely different from actualDetail
                  { definitelyDifferent: expectedDetail },
                  { within: 50 },
                ),
                'to reject',
              );
            },
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
              fc.constant('to dispatch from'), // Only the main phrase
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
        asyncProperty: () =>
          fc.asyncProperty(
            fc.string({ minLength: 1 }),
            fc.oneof(fc.string(), fc.integer(), fc.boolean()),
            fc.oneof(fc.string(), fc.integer(), fc.boolean()),
            async (eventType, actualDetail, expectedDetail) => {
              const target = new EventTarget();
              await expectAsync(
                expectAsync(
                  () =>
                    target.dispatchEvent(
                      new CustomEvent(eventType, { detail: actualDetail }),
                    ),
                  'to dispatch from',
                  target,
                  eventType,
                  'with detail',
                  { definitelyDifferent: expectedDetail },
                  { within: 50 },
                ),
                'to reject',
              );
            },
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
              fc.constant('to dispatch from'),
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

  // toEmitErrorFromAssertion
  [
    assertions.toEmitErrorFromAssertion,
    {
      invalid: {
        // Not much to vary here - we're testing "no error emitted"
        // At least vary maxListeners to get fresh emitter each run
        asyncProperty: () =>
          fc.asyncProperty(
            fc.integer({ max: 100, min: 1 }),
            async (maxListeners) => {
              const emitter = new EventEmitter();
              emitter.setMaxListeners(maxListeners);
              emitter.on('error', () => {});
              await expectAsync(
                expectAsync(() => {}, 'to emit error from', emitter, {
                  within: 50,
                }),
                'to reject',
              );
            },
          ),
      },
      valid: {
        async: true,
        generators: errorArbitrary.chain((error) => {
          const emitter = new EventEmitter();
          emitter.on('error', () => {}); // Prevent unhandled error
          return fc.tuple(
            fc.constant(() => emitter.emit('error', error)),
            fc.constantFrom(
              ...extractPhrases(assertions.toEmitErrorFromAssertion),
            ),
            fc.constant(emitter),
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
        asyncProperty: () =>
          fc.asyncProperty(
            fc.integer({ max: 100, min: 1 }),
            async (maxListeners) => {
              const emitter = new EventEmitter();
              emitter.setMaxListeners(maxListeners);
              emitter.on('error', () => {});
              await expectAsync(
                expectAsync(() => {}, 'to emit error from', emitter, {
                  within: 50,
                }),
                'to reject',
              );
            },
          ),
      },
      valid: {
        async: true,
        generators: errorArbitrary.chain((error) => {
          const emitter = new EventEmitter();
          emitter.on('error', () => {});
          return fc.tuple(
            fc.constant(() => emitter.emit('error', error)),
            fc.constant('to emit error from'),
            fc.constant(emitter),
            fc.constant({ within: 1000 }),
          );
        }),
      },
    },
  ],
  // toEmitEventsFromAssertion
  [
    assertions.toEmitEventsFromAssertion,
    {
      invalid: {
        asyncProperty: () =>
          fc.asyncProperty(
            fc.array(fc.string({ minLength: 1 }), {
              maxLength: 3,
              minLength: 2,
            }),
            async (events) => {
              const emitter = new EventEmitter();
              // Emit in wrong order
              await expectAsync(
                expectAsync(
                  () => {
                    emitter.emit(events[events.length - 1]!);
                    emitter.emit(events[0]!);
                  },
                  'to emit events from',
                  emitter,
                  events,
                  { within: 50 },
                ),
                'to reject',
              );
            },
          ),
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
                ...extractPhrases(assertions.toEmitEventsFromAssertion),
              ),
              fc.constant(emitter),
              fc.constant(events),
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
        asyncProperty: () =>
          fc.asyncProperty(
            fc.array(fc.string({ minLength: 1 }), {
              maxLength: 3,
              minLength: 2,
            }),
            async (events) => {
              const emitter = new EventEmitter();
              await expectAsync(
                expectAsync(
                  () => {
                    emitter.emit(events[events.length - 1]!);
                    emitter.emit(events[0]!);
                  },
                  'to emit events from',
                  emitter,
                  events,
                  { within: 50 },
                ),
                'to reject',
              );
            },
          ),
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
              fc.constant('to emit events from'),
              fc.constant(emitter),
              fc.constant(events),
              fc.constant({ within: 1000 }),
            );
          }),
      },
    },
  ],
  // toEmitFromAssertion
  [
    assertions.toEmitFromAssertion,
    {
      invalid: {
        asyncProperty: () =>
          fc.asyncProperty(fc.string({ minLength: 1 }), async (eventName) => {
            const emitter = new EventEmitter();
            await expectAsync(
              expectAsync(() => {}, 'to emit from', emitter, eventName, {
                within: 50,
              }),
              'to reject',
            );
          }),
      },
      valid: {
        async: true,
        generators: fc.string({ minLength: 1 }).chain((eventName) => {
          const emitter = new EventEmitter();
          return fc.tuple(
            fc.constant(() => emitter.emit(eventName)),
            fc.constantFrom(...extractPhrases(assertions.toEmitFromAssertion)),
            fc.constant(emitter),
            fc.constant(eventName),
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
        asyncProperty: () =>
          fc.asyncProperty(fc.string({ minLength: 1 }), async (eventName) => {
            const emitter = new EventEmitter();
            await expectAsync(
              expectAsync(() => {}, 'to emit from', emitter, eventName, {
                within: 50,
              }),
              'to reject',
            );
          }),
      },
      valid: {
        async: true,
        generators: fc.string({ minLength: 1 }).chain((eventName) => {
          const emitter = new EventEmitter();
          return fc.tuple(
            fc.constant(() => emitter.emit(eventName)),
            fc.constant('to emit from'),
            fc.constant(emitter),
            fc.constant(eventName),
            fc.constant({ within: 1000 }),
          );
        }),
      },
    },
  ],
  // toEmitWithArgsFromAssertion
  [
    assertions.toEmitWithArgsFromAssertion,
    {
      invalid: {
        asyncProperty: () =>
          fc.asyncProperty(
            fc.string({ minLength: 1 }),
            fc.array(eventArgsArbitrary, { maxLength: 3, minLength: 1 }),
            async (eventName, argsList) => {
              const emitter = new EventEmitter();
              // Emit with different args (wrong_arg ensures mismatch)
              await expectAsync(
                expectAsync(
                  () => emitter.emit(eventName, 'wrong_arg_not_in_expected'),
                  'to emit from',
                  emitter,
                  eventName,
                  'with args',
                  argsList[0] ?? [],
                  { within: 50 },
                ),
                'to reject',
              );
            },
          ),
      },
      valid: {
        async: true,
        generators: fc
          .tuple(fc.string({ minLength: 1 }), eventArgsArbitrary)
          .chain(([eventName, args]) => {
            const emitter = new EventEmitter();
            return fc.tuple(
              fc.constant(() => emitter.emit(eventName, ...args)),
              fc.constant('to emit from'), // Only the main phrase, not 'with args'
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
        asyncProperty: () =>
          fc.asyncProperty(
            fc.string({ minLength: 1 }),
            fc.array(eventArgsArbitrary, { maxLength: 3, minLength: 1 }),
            async (eventName, argsList) => {
              const emitter = new EventEmitter();
              await expectAsync(
                expectAsync(
                  () => emitter.emit(eventName, 'wrong_arg_not_in_expected'),
                  'to emit from',
                  emitter,
                  eventName,
                  'with args',
                  argsList[0] ?? [],
                  { within: 50 },
                ),
                'to reject',
              );
            },
          ),
      },
      valid: {
        async: true,
        generators: fc
          .tuple(fc.string({ minLength: 1 }), eventArgsArbitrary)
          .chain(([eventName, args]) => {
            const emitter = new EventEmitter();
            return fc.tuple(
              fc.constant(() => emitter.emit(eventName, ...args)),
              fc.constant('to emit from'),
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
