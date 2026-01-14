/**
 * Property-based tests for @bupkis/sinon assertions.
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
import { describe, it } from 'node:test';
import sinon from 'sinon';

import * as assertions from '../src/assertions.js';

const { expect, expectAsync } = use(assertions.sinonAssertions);
const { runVariant } = createPropertyTestHarness({ expect, expectAsync });

// Use 'small' run size to keep tests fast
const testConfigDefaults: PropertyTestConfigParameters = {
  runSize: 'small',
} as const;

// Helper: Generate diverse argument arrays
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

// Helper: Generate random context objects
const contextArbitrary = fc.record({
  id: fc.oneof(fc.string(), fc.integer()),
  name: fc.option(fc.string(), { nil: undefined }),
  value: fc.option(fc.integer(), { nil: undefined }),
});

// Helper: Generate random Error instances
const errorArbitrary = fc
  .tuple(fc.string(), fc.constantFrom(Error, TypeError, RangeError))
  .map(([msg, ErrorClass]) => new ErrorClass(msg));

// ─────────────────────────────────────────────────────────────
// BASIC CALL ASSERTIONS
// ─────────────────────────────────────────────────────────────

const basicCallConfigs = new Map<
  (typeof assertions.sinonAssertions)[number],
  PropertyTestConfig
>([
  // wasCalledAssertion
  [
    assertions.wasCalledAssertion,
    {
      invalid: {
        // Fresh spy each run, never called
        generators: argsArbitrary.chain(() => {
          const spy = sinon.spy();
          // Don't call it - that's the point
          return fc.tuple(
            fc.constant(spy),
            fc.constantFrom(...extractPhrases(assertions.wasCalledAssertion)),
          );
        }),
      },
      valid: {
        // Call spy with random args, random number of times
        generators: fc
          .tuple(fc.integer({ max: 5, min: 1 }), argsArbitrary)
          .chain(([callCount, args]) => {
            const spy = sinon.spy();
            for (let i = 0; i < callCount; i++) {
              spy(...args, i);
            }
            return fc.tuple(
              fc.constant(spy),
              fc.constantFrom(...extractPhrases(assertions.wasCalledAssertion)),
            );
          }),
      },
    },
  ],

  // wasNotCalledAssertion
  [
    assertions.wasNotCalledAssertion,
    {
      invalid: {
        generators: fc
          .tuple(fc.integer({ max: 5, min: 1 }), argsArbitrary)
          .chain(([callCount, args]) => {
            const spy = sinon.spy();
            for (let i = 0; i < callCount; i++) {
              spy(...args);
            }
            return fc.tuple(
              fc.constant(spy),
              fc.constantFrom(
                ...extractPhrases(assertions.wasNotCalledAssertion),
              ),
            );
          }),
      },
      valid: {
        // Fresh spy each run
        generators: argsArbitrary.chain(() => {
          const spy = sinon.spy();
          return fc.tuple(
            fc.constant(spy),
            fc.constantFrom(
              ...extractPhrases(assertions.wasNotCalledAssertion),
            ),
          );
        }),
      },
    },
  ],
]);

// ─────────────────────────────────────────────────────────────
// CALL COUNT ASSERTIONS
// ─────────────────────────────────────────────────────────────

const callCountConfigs = new Map<
  (typeof assertions.sinonAssertions)[number],
  PropertyTestConfig
>([
  // wasCalledOnceAssertion
  [
    assertions.wasCalledOnceAssertion,
    {
      invalid: {
        generators: fc
          .tuple(
            fc.integer({ max: 5, min: 0 }).filter((count) => count !== 1),
            argsArbitrary,
          )
          .chain(([callCount, args]) => {
            const spy = sinon.spy();
            for (let i = 0; i < callCount; i++) {
              spy(...args);
            }
            return fc.tuple(
              fc.constant(spy),
              fc.constantFrom(
                ...extractPhrases(assertions.wasCalledOnceAssertion),
              ),
            );
          }),
      },
      valid: {
        generators: argsArbitrary.chain((args) => {
          const spy = sinon.spy();
          spy(...args);
          return fc.tuple(
            fc.constant(spy),
            fc.constantFrom(
              ...extractPhrases(assertions.wasCalledOnceAssertion),
            ),
          );
        }),
      },
    },
  ],

  // wasCalledThriceAssertion
  [
    assertions.wasCalledThriceAssertion,
    {
      invalid: {
        generators: fc
          .tuple(
            fc.integer({ max: 5, min: 0 }).filter((count) => count !== 3),
            argsArbitrary,
          )
          .chain(([callCount, args]) => {
            const spy = sinon.spy();
            for (let i = 0; i < callCount; i++) {
              spy(...args);
            }
            return fc.tuple(
              fc.constant(spy),
              fc.constantFrom(
                ...extractPhrases(assertions.wasCalledThriceAssertion),
              ),
            );
          }),
      },
      valid: {
        generators: argsArbitrary.chain((args) => {
          const spy = sinon.spy();
          spy(...args, 1);
          spy(...args, 2);
          spy(...args, 3);
          return fc.tuple(
            fc.constant(spy),
            fc.constantFrom(
              ...extractPhrases(assertions.wasCalledThriceAssertion),
            ),
          );
        }),
      },
    },
  ],

  // wasCalledTimesAssertion
  [
    assertions.wasCalledTimesAssertion,
    {
      invalid: {
        generators: fc
          .tuple(
            fc.integer({ max: 5, min: 0 }), // actual count
            fc.integer({ max: 5, min: 0 }), // expected count
            argsArbitrary,
          )
          .filter(([actual, expected]) => actual !== expected)
          .chain(([actualCount, expectedCount, args]) => {
            const spy = sinon.spy();
            for (let i = 0; i < actualCount; i++) {
              spy(...args);
            }
            return fc.tuple(
              fc.constant(spy),
              fc.constantFrom(
                ...extractPhrases(assertions.wasCalledTimesAssertion),
              ),
              fc.constant(expectedCount),
            );
          }),
      },
      valid: {
        generators: fc
          .tuple(fc.integer({ max: 5, min: 0 }), argsArbitrary)
          .chain(([count, args]) => {
            const spy = sinon.spy();
            for (let i = 0; i < count; i++) {
              spy(...args, i);
            }
            return fc.tuple(
              fc.constant(spy),
              fc.constantFrom(
                ...extractPhrases(assertions.wasCalledTimesAssertion),
              ),
              fc.constant(count),
            );
          }),
      },
    },
  ],

  // wasCalledTwiceAssertion
  [
    assertions.wasCalledTwiceAssertion,
    {
      invalid: {
        generators: fc
          .tuple(
            fc.integer({ max: 5, min: 0 }).filter((count) => count !== 2),
            argsArbitrary,
          )
          .chain(([callCount, args]) => {
            const spy = sinon.spy();
            for (let i = 0; i < callCount; i++) {
              spy(...args);
            }
            return fc.tuple(
              fc.constant(spy),
              fc.constantFrom(
                ...extractPhrases(assertions.wasCalledTwiceAssertion),
              ),
            );
          }),
      },
      valid: {
        generators: argsArbitrary.chain((args) => {
          const spy = sinon.spy();
          spy(...args, 1);
          spy(...args, 2);
          return fc.tuple(
            fc.constant(spy),
            fc.constantFrom(
              ...extractPhrases(assertions.wasCalledTwiceAssertion),
            ),
          );
        }),
      },
    },
  ],
]);

// ─────────────────────────────────────────────────────────────
// ARGUMENT ASSERTIONS
// ─────────────────────────────────────────────────────────────

const argumentConfigs = new Map<
  (typeof assertions.sinonAssertions)[number],
  PropertyTestConfig
>([
  // wasAlwaysCalledWithAssertion
  [
    assertions.wasAlwaysCalledWithAssertion,
    {
      invalid: {
        generators: fc
          .tuple(
            fc.string({ minLength: 1 }),
            fc.integer({ max: 3, min: 2 }), // at least 2 calls
          )
          .chain(([prefix, callCount]) => {
            const spy = sinon.spy();
            // First calls with prefix
            for (let i = 0; i < callCount - 1; i++) {
              spy(prefix, i);
            }
            // Last call without prefix
            spy('different');
            return fc.tuple(
              fc.constant(spy),
              fc.constantFrom(
                ...extractPhrases(assertions.wasAlwaysCalledWithAssertion),
              ),
              fc.constant([prefix]),
            );
          }),
      },
      valid: {
        generators: fc
          .tuple(fc.string({ minLength: 1 }), fc.integer({ max: 5, min: 1 }))
          .chain(([prefix, callCount]) => {
            const spy = sinon.spy();
            for (let i = 0; i < callCount; i++) {
              spy(prefix, i);
            }
            return fc.tuple(
              fc.constant(spy),
              fc.constantFrom(
                ...extractPhrases(assertions.wasAlwaysCalledWithAssertion),
              ),
              fc.constant([prefix]),
            );
          }),
      },
    },
  ],

  // wasCalledWithAssertion
  [
    assertions.wasCalledWithAssertion,
    {
      invalid: {
        generators: fc
          .array(fc.oneof(fc.string(), fc.integer()), {
            maxLength: 3,
            minLength: 1,
          })
          .chain((args) => {
            const spy = sinon.spy();
            // Call with different args
            spy('__never_match__');
            return fc.tuple(
              fc.constant(spy),
              fc.constantFrom(
                ...extractPhrases(assertions.wasCalledWithAssertion),
              ),
              fc.constant(args),
            );
          }),
      },
      valid: {
        generators: fc
          .array(fc.oneof(fc.string(), fc.integer()), {
            maxLength: 3,
            minLength: 1,
          })
          .chain((args) => {
            const spy = sinon.spy();
            spy(...args);
            return fc.tuple(
              fc.constant(spy),
              fc.constantFrom(
                ...extractPhrases(assertions.wasCalledWithAssertion),
              ),
              fc.constant(args),
            );
          }),
      },
    },
  ],

  // wasCalledWithExactlyAssertion
  [
    assertions.wasCalledWithExactlyAssertion,
    {
      invalid: {
        generators: fc
          .array(fc.oneof(fc.string(), fc.integer()), {
            maxLength: 3,
            minLength: 1,
          })
          .chain((args) => {
            const spy = sinon.spy();
            // Call with extra arg
            spy(...args, 'extra');
            return fc.tuple(
              fc.constant(spy),
              fc.constantFrom(
                ...extractPhrases(assertions.wasCalledWithExactlyAssertion),
              ),
              fc.constant(args),
            );
          }),
      },
      valid: {
        generators: fc
          .array(fc.oneof(fc.string(), fc.integer()), {
            maxLength: 3,
            minLength: 1,
          })
          .chain((args) => {
            const spy = sinon.spy();
            spy(...args);
            return fc.tuple(
              fc.constant(spy),
              fc.constantFrom(
                ...extractPhrases(assertions.wasCalledWithExactlyAssertion),
              ),
              fc.constant(args),
            );
          }),
      },
    },
  ],

  // wasNeverCalledWithAssertion
  [
    assertions.wasNeverCalledWithAssertion,
    {
      invalid: {
        generators: fc
          .array(fc.oneof(fc.string(), fc.integer()), {
            maxLength: 3,
            minLength: 1,
          })
          .chain((args) => {
            const spy = sinon.spy();
            spy(...args);
            return fc.tuple(
              fc.constant(spy),
              fc.constantFrom(
                ...extractPhrases(assertions.wasNeverCalledWithAssertion),
              ),
              fc.constant(args),
            );
          }),
      },
      valid: {
        generators: fc
          .array(fc.oneof(fc.string(), fc.integer()), {
            maxLength: 3,
            minLength: 1,
          })
          .chain((args) => {
            const spy = sinon.spy();
            // Call with different args
            spy('__never_match__');
            return fc.tuple(
              fc.constant(spy),
              fc.constantFrom(
                ...extractPhrases(assertions.wasNeverCalledWithAssertion),
              ),
              fc.constant(args),
            );
          }),
      },
    },
  ],
]);

// ─────────────────────────────────────────────────────────────
// CONTEXT ASSERTIONS
// ─────────────────────────────────────────────────────────────

const contextConfigs = new Map<
  (typeof assertions.sinonAssertions)[number],
  PropertyTestConfig
>([
  // wasAlwaysCalledOnAssertion
  [
    assertions.wasAlwaysCalledOnAssertion,
    {
      invalid: {
        generators: fc
          .tuple(
            fc.integer({ max: 3, min: 2 }),
            contextArbitrary,
            contextArbitrary,
          )
          .chain(([callCount, context, otherContext]) => {
            const spy = sinon.spy();
            for (let i = 0; i < callCount - 1; i++) {
              spy.call(context);
            }
            spy.call(otherContext);
            return fc.tuple(
              fc.constant(spy),
              fc.constantFrom(
                ...extractPhrases(assertions.wasAlwaysCalledOnAssertion),
              ),
              fc.constant(context),
            );
          }),
      },
      valid: {
        generators: fc
          .tuple(fc.integer({ max: 5, min: 1 }), contextArbitrary)
          .chain(([callCount, context]) => {
            const spy = sinon.spy();
            for (let i = 0; i < callCount; i++) {
              spy.call(context);
            }
            return fc.tuple(
              fc.constant(spy),
              fc.constantFrom(
                ...extractPhrases(assertions.wasAlwaysCalledOnAssertion),
              ),
              fc.constant(context),
            );
          }),
      },
    },
  ],

  // wasCalledOnAssertion
  [
    assertions.wasCalledOnAssertion,
    {
      invalid: {
        generators: fc
          .tuple(contextArbitrary, contextArbitrary)
          .chain(([context1, context2]) => {
            const spy = sinon.spy();
            spy.call(context1);
            return fc.tuple(
              fc.constant(spy),
              fc.constantFrom(
                ...extractPhrases(assertions.wasCalledOnAssertion),
              ),
              fc.constant(context2),
            );
          }),
      },
      valid: {
        generators: contextArbitrary.chain((context) => {
          const spy = sinon.spy();
          spy.call(context);
          return fc.tuple(
            fc.constant(spy),
            fc.constantFrom(...extractPhrases(assertions.wasCalledOnAssertion)),
            fc.constant(context),
          );
        }),
      },
    },
  ],
]);

// ─────────────────────────────────────────────────────────────
// EXCEPTION ASSERTIONS
// ─────────────────────────────────────────────────────────────

const exceptionConfigs = new Map<
  (typeof assertions.sinonAssertions)[number],
  PropertyTestConfig
>([
  // alwaysThrewAssertion
  [
    assertions.alwaysThrewAssertion,
    {
      invalid: {
        generators: fc
          .tuple(errorArbitrary, fc.oneof(fc.string(), fc.integer()))
          .chain(([error, returnVal]) => {
            const stub = sinon.stub();
            stub.onFirstCall().throws(error);
            stub.onSecondCall().returns(returnVal);
            try {
              stub();
            } catch {
              // expected
            }
            stub();
            return fc.tuple(
              fc.constant(stub),
              fc.constantFrom(
                ...extractPhrases(assertions.alwaysThrewAssertion),
              ),
            );
          }),
      },
      valid: {
        generators: fc
          .tuple(fc.integer({ max: 3, min: 1 }), errorArbitrary)
          .chain(([callCount, error]) => {
            const stub = sinon.stub().throws(error);
            for (let i = 0; i < callCount; i++) {
              try {
                stub();
              } catch {
                // expected
              }
            }
            return fc.tuple(
              fc.constant(stub),
              fc.constantFrom(
                ...extractPhrases(assertions.alwaysThrewAssertion),
              ),
            );
          }),
      },
    },
  ],

  // threwAssertion
  [
    assertions.threwAssertion,
    {
      invalid: {
        generators: argsArbitrary.chain((args) => {
          const spy = sinon.spy();
          spy(...args);
          return fc.tuple(
            fc.constant(spy),
            fc.constantFrom(...extractPhrases(assertions.threwAssertion)),
          );
        }),
      },
      valid: {
        generators: errorArbitrary.chain((error) => {
          const stub = sinon.stub().throws(error);
          try {
            stub();
          } catch {
            // expected
          }
          return fc.tuple(
            fc.constant(stub),
            fc.constantFrom(...extractPhrases(assertions.threwAssertion)),
          );
        }),
      },
    },
  ],

  // threwWithAssertion (with Error instance)
  [
    assertions.threwWithAssertion,
    {
      invalid: {
        generators: fc
          .tuple(errorArbitrary, errorArbitrary)
          .chain(([thrownError, expectedError]) => {
            const stub = sinon.stub().throws(thrownError);
            try {
              stub();
            } catch {
              // expected
            }
            return fc.tuple(
              fc.constant(stub),
              fc.constantFrom(...extractPhrases(assertions.threwWithAssertion)),
              fc.constant(expectedError),
            );
          }),
      },
      valid: {
        generators: errorArbitrary.chain((error) => {
          const stub = sinon.stub().throws(error);
          let thrownError: Error | undefined;
          try {
            stub();
          } catch (e) {
            thrownError = e as Error;
          }
          return fc.tuple(
            fc.constant(stub),
            fc.constantFrom(...extractPhrases(assertions.threwWithAssertion)),
            fc.constant(thrownError),
          );
        }),
      },
    },
  ],
]);

// ─────────────────────────────────────────────────────────────
// SPYCALL ASSERTIONS
// ─────────────────────────────────────────────────────────────

const spyCallConfigs = new Map<
  (typeof assertions.sinonAssertions)[number],
  PropertyTestConfig
>([
  // callHasArgsAssertion
  [
    assertions.callHasArgsAssertion,
    {
      invalid: {
        generators: fc
          .tuple(
            fc.array(fc.oneof(fc.string(), fc.integer()), {
              maxLength: 3,
              minLength: 1,
            }),
            fc.array(fc.oneof(fc.string(), fc.integer()), {
              maxLength: 3,
              minLength: 1,
            }),
          )
          .filter(
            ([actual, expected]) =>
              JSON.stringify(actual) !== JSON.stringify(expected),
          )
          .chain(([actualArgs, expectedArgs]) => {
            const spy = sinon.spy();
            spy(...actualArgs);
            return fc.tuple(
              fc.constant(spy.firstCall),
              fc.constantFrom(
                ...extractPhrases(assertions.callHasArgsAssertion),
              ),
              fc.constant(expectedArgs),
            );
          }),
      },
      valid: {
        generators: fc
          .array(fc.oneof(fc.string(), fc.integer()), {
            maxLength: 3,
            minLength: 1,
          })
          .chain((args) => {
            const spy = sinon.spy();
            spy(...args);
            return fc.tuple(
              fc.constant(spy.firstCall),
              fc.constantFrom(
                ...extractPhrases(assertions.callHasArgsAssertion),
              ),
              fc.constant(args),
            );
          }),
      },
    },
  ],

  // callHasThisAssertion
  [
    assertions.callHasThisAssertion,
    {
      invalid: {
        generators: fc
          .tuple(contextArbitrary, contextArbitrary)
          .chain(([context1, context2]) => {
            const spy = sinon.spy();
            spy.call(context1);
            return fc.tuple(
              fc.constant(spy.firstCall),
              fc.constantFrom(
                ...extractPhrases(assertions.callHasThisAssertion),
              ),
              fc.constant(context2),
            );
          }),
      },
      valid: {
        generators: contextArbitrary.chain((context) => {
          const spy = sinon.spy();
          spy.call(context);
          return fc.tuple(
            fc.constant(spy.firstCall),
            fc.constantFrom(...extractPhrases(assertions.callHasThisAssertion)),
            fc.constant(context),
          );
        }),
      },
    },
  ],

  // callReturnedAssertion
  [
    assertions.callReturnedAssertion,
    {
      invalid: {
        generators: fc
          .tuple(
            fc.oneof(fc.string(), fc.integer()),
            fc.oneof(fc.string(), fc.integer()),
          )
          .filter(([actual, expected]) => actual !== expected)
          .chain(([actualReturn, expectedReturn]) => {
            const stub = sinon.stub().returns(actualReturn);
            stub();
            return fc.tuple(
              fc.constant(stub.firstCall),
              fc.constantFrom(
                ...extractPhrases(assertions.callReturnedAssertion),
              ),
              fc.constant(expectedReturn),
            );
          }),
      },
      valid: {
        generators: fc.oneof(fc.string(), fc.integer()).chain((returnVal) => {
          const stub = sinon.stub().returns(returnVal);
          stub();
          return fc.tuple(
            fc.constant(stub.firstCall),
            fc.constantFrom(
              ...extractPhrases(assertions.callReturnedAssertion),
            ),
            fc.constant(returnVal),
          );
        }),
      },
    },
  ],

  // callThrewAssertion
  [
    assertions.callThrewAssertion,
    {
      invalid: {
        generators: argsArbitrary.chain((args) => {
          const spy = sinon.spy();
          spy(...args);
          return fc.tuple(
            fc.constant(spy.firstCall),
            fc.constantFrom(...extractPhrases(assertions.callThrewAssertion)),
          );
        }),
      },
      valid: {
        generators: errorArbitrary.chain((error) => {
          const stub = sinon.stub().throws(error);
          try {
            stub();
          } catch {
            // expected
          }
          return fc.tuple(
            fc.constant(stub.firstCall),
            fc.constantFrom(...extractPhrases(assertions.callThrewAssertion)),
          );
        }),
      },
    },
  ],
]);

// ─────────────────────────────────────────────────────────────
// CALL ORDER ASSERTIONS
// ─────────────────────────────────────────────────────────────

const callOrderConfigs = new Map<
  (typeof assertions.sinonAssertions)[number],
  PropertyTestConfig
>([
  // givenCallOrderAssertion
  [
    assertions.givenCallOrderAssertion,
    {
      invalid: {
        generators: fc
          .tuple(
            fc.integer({ max: 4, min: 2 }),
            fc.array(argsArbitrary, { maxLength: 4, minLength: 2 }),
          )
          .chain(([count, argsArray]) => {
            const spies = Array.from({ length: count }, () => sinon.spy());
            // Call in reverse order
            for (let i = spies.length - 1; i >= 0; i--) {
              spies[i]!(...(argsArray[i] ?? []));
            }
            return fc.tuple(
              fc.constant(spies),
              fc.constantFrom(
                ...extractPhrases(assertions.givenCallOrderAssertion),
              ),
            );
          }),
      },
      valid: {
        generators: fc
          .tuple(
            fc.integer({ max: 4, min: 2 }),
            fc.array(argsArbitrary, { maxLength: 4, minLength: 2 }),
          )
          .chain(([count, argsArray]) => {
            const spies = Array.from({ length: count }, () => sinon.spy());
            for (let i = 0; i < spies.length; i++) {
              spies[i]!(...(argsArray[i] ?? []));
            }
            return fc.tuple(
              fc.constant(spies),
              fc.constantFrom(
                ...extractPhrases(assertions.givenCallOrderAssertion),
              ),
            );
          }),
      },
    },
  ],

  // wasCalledAfterAssertion
  [
    assertions.wasCalledAfterAssertion,
    {
      invalid: {
        generators: fc
          .tuple(argsArbitrary, argsArbitrary)
          .chain(([args1, args2]) => {
            const spy1 = sinon.spy();
            const spy2 = sinon.spy();
            // Call spy1 first (invalid for "after")
            spy1(...args1);
            spy2(...args2);
            return fc.tuple(
              fc.constant(spy1),
              fc.constantFrom(
                ...extractPhrases(assertions.wasCalledAfterAssertion),
              ),
              fc.constant(spy2),
            );
          }),
      },
      valid: {
        generators: fc
          .tuple(argsArbitrary, argsArbitrary)
          .chain(([args1, args2]) => {
            const spy1 = sinon.spy();
            const spy2 = sinon.spy();
            spy2(...args2);
            spy1(...args1);
            return fc.tuple(
              fc.constant(spy1),
              fc.constantFrom(
                ...extractPhrases(assertions.wasCalledAfterAssertion),
              ),
              fc.constant(spy2),
            );
          }),
      },
    },
  ],

  // wasCalledBeforeAssertion
  [
    assertions.wasCalledBeforeAssertion,
    {
      invalid: {
        generators: fc
          .tuple(argsArbitrary, argsArbitrary)
          .chain(([args1, args2]) => {
            const spy1 = sinon.spy();
            const spy2 = sinon.spy();
            // Call in reverse order (invalid for "before")
            spy2(...args2);
            spy1(...args1);
            return fc.tuple(
              fc.constant(spy1),
              fc.constantFrom(
                ...extractPhrases(assertions.wasCalledBeforeAssertion),
              ),
              fc.constant(spy2),
            );
          }),
      },
      valid: {
        generators: fc
          .tuple(argsArbitrary, argsArbitrary)
          .chain(([args1, args2]) => {
            const spy1 = sinon.spy();
            const spy2 = sinon.spy();
            spy1(...args1);
            spy2(...args2);
            return fc.tuple(
              fc.constant(spy1),
              fc.constantFrom(
                ...extractPhrases(assertions.wasCalledBeforeAssertion),
              ),
              fc.constant(spy2),
            );
          }),
      },
    },
  ],
]);

// ─────────────────────────────────────────────────────────────
// COMPLEX ASSERTIONS
// ─────────────────────────────────────────────────────────────

const complexConfigs = new Map<
  (typeof assertions.sinonAssertions)[number],
  PropertyTestConfig
>([
  // toHaveCallsSatisfyingAssertion
  [
    assertions.toHaveCallsSatisfyingAssertion,
    {
      invalid: {
        generators: fc
          .array(
            fc.array(fc.oneof(fc.string(), fc.integer()), {
              maxLength: 2,
              minLength: 1,
            }),
            { maxLength: 3, minLength: 1 },
          )
          .chain((callArgs) => {
            const spy = sinon.spy();
            for (const args of callArgs) {
              spy(...args);
            }
            // Create wrong spec (wrong number of calls)
            const wrongSpec = [...callArgs, ['extra']].map((args) => ({
              args,
            }));
            return fc.tuple(
              fc.constant(spy),
              fc.constantFrom(
                ...extractPhrases(assertions.toHaveCallsSatisfyingAssertion),
              ),
              fc.constant(wrongSpec),
            );
          }),
      },
      valid: {
        generators: fc
          .array(
            fc.array(fc.oneof(fc.string(), fc.integer()), {
              maxLength: 2,
              minLength: 1,
            }),
            { maxLength: 3, minLength: 1 },
          )
          .chain((callArgs) => {
            const spy = sinon.spy();
            for (const args of callArgs) {
              spy(...args);
            }
            const spec = callArgs.map((args) => ({ args }));
            return fc.tuple(
              fc.constant(spy),
              fc.constantFrom(
                ...extractPhrases(assertions.toHaveCallsSatisfyingAssertion),
              ),
              fc.constant(spec),
            );
          }),
      },
    },
  ],
]);

// ─────────────────────────────────────────────────────────────
// TEST HARNESS
// ─────────────────────────────────────────────────────────────

// Combine all configs
const allConfigs = new Map([
  ...basicCallConfigs,
  ...callCountConfigs,
  ...argumentConfigs,
  ...contextConfigs,
  ...exceptionConfigs,
  ...spyCallConfigs,
  ...callOrderConfigs,
  ...complexConfigs,
]);

describe('@bupkis/sinon Property Tests', () => {
  for (const [assertion, testConfig] of allConfigs) {
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
