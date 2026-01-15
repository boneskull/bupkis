/**
 * Sinon spy assertions for Bupkis.
 *
 * @packageDocumentation
 */

import type { SinonSpy, SinonSpyCall } from 'sinon';

import { expect, schema, z } from 'bupkis';

import { SpyCallSchema, SpySchema } from './schema.js';

const { stringify } = JSON;

// #region Basic Call Assertions

/**
 * Asserts that a spy was called at least once.
 *
 * @example
 *
 * ```ts
 * const spy = sinon.spy();
 * spy();
 * expect(spy, 'was called'); // passes
 * ```
 */
export const wasCalledAssertion = expect.createAssertion(
  [SpySchema, ['was called', 'to have been called']],
  (spy: SinonSpy) => {
    if (spy.called) {
      return true;
    }
    return {
      actual: spy.callCount,
      expected: 'at least 1 call',
      message: `Expected spy to have been called, but it was never called`,
    };
  },
);

/**
 * Asserts that a spy was never called.
 *
 * @example
 *
 * ```ts
 * const spy = sinon.spy();
 * expect(spy, 'was not called'); // passes
 * ```
 */
export const wasNotCalledAssertion = expect.createAssertion(
  [SpySchema, ['was not called', 'to not have been called']],
  (spy: SinonSpy) => {
    if (spy.notCalled) {
      return true;
    }
    return {
      actual: spy.callCount,
      expected: 0,
      message: `Expected spy to not have been called, but it was called ${spy.callCount} time(s)`,
    };
  },
);

// #endregion

// #region Call Count Assertions

/**
 * Asserts that a spy was called a specific number of times.
 *
 * @example
 *
 * ```ts
 * const spy = sinon.spy();
 * spy();
 * spy();
 * spy();
 * expect(spy, 'was called times', 3); // passes
 * ```
 */
export const wasCalledTimesAssertion = expect.createAssertion(
  [SpySchema, 'was called times', schema.NonNegativeIntegerSchema],
  (spy: SinonSpy, expected: number) => {
    if (spy.callCount === expected) {
      return true;
    }
    return {
      actual: spy.callCount,
      expected,
      message: `Expected spy to have been called ${expected} time(s)`,
    };
  },
);

/**
 * Asserts that a spy was called exactly once.
 *
 * @example
 *
 * ```ts
 * const spy = sinon.spy();
 * spy();
 * expect(spy, 'was called once'); // passes
 * ```
 */
export const wasCalledOnceAssertion = expect.createAssertion(
  [SpySchema, ['was called once', 'to have been called once']],
  (spy: SinonSpy) => {
    if (spy.calledOnce) {
      return true;
    }
    return {
      actual: spy.callCount,
      expected: 1,
      message: `Expected spy to have been called exactly once`,
    };
  },
);

/**
 * Asserts that a spy was called exactly twice.
 */
export const wasCalledTwiceAssertion = expect.createAssertion(
  [SpySchema, 'was called twice'],
  (spy: SinonSpy) => {
    if (spy.calledTwice) {
      return true;
    }
    return {
      actual: spy.callCount,
      expected: 2,
      message: `Expected spy to have been called exactly twice`,
    };
  },
);

/**
 * Asserts that a spy was called exactly three times.
 */
export const wasCalledThriceAssertion = expect.createAssertion(
  [SpySchema, 'was called thrice'],
  (spy: SinonSpy) => {
    if (spy.calledThrice) {
      return true;
    }
    return {
      actual: spy.callCount,
      expected: 3,
      message: `Expected spy to have been called exactly three times`,
    };
  },
);

// #endregion

// #region Argument Assertions

/**
 * Asserts that a spy was called with specific arguments (prefix match).
 *
 * @example
 *
 * ```ts
 * const spy = sinon.spy();
 * spy('foo', 42);
 * expect(spy, 'was called with', 'foo', 42); // passes
 * expect(spy, 'was called with', 'foo'); // also passes (prefix match)
 * ```
 */
export const wasCalledWithAssertion = expect.createAssertion(
  [
    SpySchema,
    ['was called with', 'to have been called with'],
    z.array(schema.UnknownSchema),
  ],
  (spy: SinonSpy, args: unknown[]) => {
    if (spy.calledWith(...args)) {
      return true;
    }
    return {
      actual: spy.args,
      expected: args,
      message: `Expected spy to have been called with specified arguments`,
    };
  },
);

/**
 * Asserts that all calls to a spy included specific arguments.
 */
export const wasAlwaysCalledWithAssertion = expect.createAssertion(
  [SpySchema, 'was always called with', z.array(schema.UnknownSchema)],
  (spy: SinonSpy, args: unknown[]) => {
    if (spy.alwaysCalledWith(...args)) {
      return true;
    }
    return {
      actual: spy.args,
      expected: args,
      message: `Expected spy to always have been called with specified arguments`,
    };
  },
);

/**
 * Asserts that a spy was called with exactly the specified arguments (no
 * extra).
 */
export const wasCalledWithExactlyAssertion = expect.createAssertion(
  [SpySchema, 'was called with exactly', z.array(schema.UnknownSchema)],
  (spy: SinonSpy, args: unknown[]) => {
    if (spy.calledWithExactly(...args)) {
      return true;
    }
    return {
      actual: spy.args,
      expected: args,
      message: `Expected spy to have been called with exactly the specified arguments`,
    };
  },
);

/**
 * Asserts that a spy was never called with specific arguments.
 */
export const wasNeverCalledWithAssertion = expect.createAssertion(
  [SpySchema, 'was never called with', z.array(schema.UnknownSchema)],
  (spy: SinonSpy, args: unknown[]) => {
    if (spy.neverCalledWith(...args)) {
      return true;
    }
    return {
      actual: spy.args,
      expected: `not ${stringify(args)}`,
      message: `Expected spy to never have been called with specified arguments`,
    };
  },
);

// #endregion

// #region Context Assertions

/**
 * Asserts that a spy was called with a specific `this` context.
 */
export const wasCalledOnAssertion = expect.createAssertion(
  [
    SpySchema,
    ['was called on', 'to have been called on'],
    schema.UnknownSchema,
  ],
  (spy: SinonSpy, context: unknown) => {
    if (spy.calledOn(context)) {
      return true;
    }
    return {
      actual: spy.thisValues,
      expected: context,
      message: `Expected spy to have been called with specified this context`,
    };
  },
);

/**
 * Asserts that all calls to a spy used a specific `this` context.
 */
export const wasAlwaysCalledOnAssertion = expect.createAssertion(
  [SpySchema, 'was always called on', schema.UnknownSchema],
  (spy: SinonSpy, context: unknown) => {
    if (spy.alwaysCalledOn(context)) {
      return true;
    }
    return {
      actual: spy.thisValues,
      expected: context,
      message: `Expected spy to always have been called with specified this context`,
    };
  },
);

// #endregion

// #region Exception Assertions

/**
 * Asserts that a spy threw an exception.
 */
export const threwAssertion = expect.createAssertion(
  [SpySchema, ['threw', 'to have thrown']],
  (spy: SinonSpy) => {
    if (spy.threw()) {
      return true;
    }
    return {
      actual: spy.exceptions,
      expected: 'an exception',
      message: `Expected spy to have thrown an exception`,
    };
  },
);

/**
 * Asserts that a spy threw a specific error.
 *
 * @remarks
 * The `expected` parameter can be an Error instance or a string (error type
 * name). If a non-matching type is provided, the assertion will fail with a
 * type error message.
 */
export const threwWithAssertion = expect.createAssertion(
  [SpySchema, 'threw', schema.UnknownSchema],
  (spy: SinonSpy, expected: unknown) => {
    // Sinon's threw() accepts Error instances or string type names
    if (!(expected instanceof Error) && typeof expected !== 'string') {
      return {
        actual: typeof expected,
        expected: 'Error instance or string error type name',
        message: `Expected second argument to be an Error or string, got ${typeof expected}`,
      };
    }
    if (spy.threw(expected)) {
      return true;
    }
    return {
      actual: spy.exceptions,
      expected,
      message: `Expected spy to have thrown specified exception`,
    };
  },
);

/**
 * Asserts that a spy always threw an exception.
 */
export const alwaysThrewAssertion = expect.createAssertion(
  [SpySchema, 'always threw'],
  (spy: SinonSpy) => {
    if (spy.alwaysThrew()) {
      return true;
    }
    return {
      actual: spy.exceptions,
      expected: 'an exception on every call',
      message: `Expected spy to always have thrown an exception`,
    };
  },
);

// #endregion

// #region Return Assertions (Spy-level)

const { is } = Object;

/**
 * Asserts that a spy returned (without throwing) at least once.
 *
 * @example
 *
 * ```ts
 * const stub = sinon.stub().returns(42);
 * stub();
 * expect(stub, 'to have returned'); // passes
 * ```
 */
const spyReturnedAssertion = expect.createAssertion(
  [SpySchema, ['to have returned', 'returned']],
  (spy: SinonSpy) => {
    // Check if any call returned without throwing
    const returnCount = spy
      .getCalls()
      .filter((call) => call.exception === undefined).length;
    if (returnCount > 0) {
      return true;
    }
    return {
      actual: returnCount,
      expected: 'at least 1 return',
      message: `Expected spy to have returned at least once`,
    };
  },
);

/**
 * Asserts that a spy returned (without throwing) exactly N times.
 *
 * @example
 *
 * ```ts
 * const stub = sinon.stub().returns(42);
 * stub();
 * stub();
 * expect(stub, 'to have returned times', 2); // passes
 * ```
 */
const spyReturnedTimesAssertion = expect.createAssertion(
  [SpySchema, 'to have returned times', schema.NonNegativeIntegerSchema],
  (spy: SinonSpy, expected: number) => {
    const returnCount = spy
      .getCalls()
      .filter((call) => call.exception === undefined).length;
    if (returnCount === expected) {
      return true;
    }
    return {
      actual: returnCount,
      expected,
      message: `Expected spy to have returned ${expected} time(s)`,
    };
  },
);

/**
 * Asserts that a spy returned a specific value at least once.
 *
 * @example
 *
 * ```ts
 * const stub = sinon.stub().returns(42);
 * stub();
 * expect(stub, 'to have returned with', 42); // passes
 * ```
 */
const spyReturnedWithAssertion = expect.createAssertion(
  [SpySchema, 'to have returned with', schema.UnknownSchema],
  (spy: SinonSpy, expected: unknown) => {
    if (spy.returned(expected)) {
      return true;
    }
    return {
      actual: spy.returnValues,
      expected,
      message: `Expected spy to have returned specified value at least once`,
    };
  },
);

// #endregion

// #region SpyCall Assertions

/**
 * Asserts that a spy call had specific arguments.
 */
export const callHasArgsAssertion = expect.createAssertion(
  [SpyCallSchema, 'to have args', z.array(schema.UnknownSchema)],
  (call: SinonSpyCall, expected: unknown[]) => {
    const actual = call.args;
    if (
      actual.length === expected.length &&
      actual.every((arg, i) => is(arg, expected[i]))
    ) {
      return true;
    }
    return {
      actual,
      expected,
      message: `Expected spy call to have specified arguments`,
    };
  },
);

/**
 * Asserts that a spy call returned a specific value.
 */
export const callReturnedAssertion = expect.createAssertion(
  [SpyCallSchema, 'to have returned', schema.UnknownSchema],
  (call: SinonSpyCall, expected: unknown) => {
    if (is(call.returnValue, expected)) {
      return true;
    }
    return {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- Sinon types returnValue as any
      actual: call.returnValue,
      expected,
      message: `Expected spy call to have returned specified value`,
    };
  },
);

/**
 * Asserts that a spy call threw an exception.
 */
export const callThrewAssertion = expect.createAssertion(
  [SpyCallSchema, 'to have thrown'],
  (call: SinonSpyCall) => {
    if (call.exception !== undefined) {
      return true;
    }
    return {
      actual: 'no exception',
      expected: 'an exception',
      message: `Expected spy call to have thrown an exception`,
    };
  },
);

/**
 * Asserts that a spy call had a specific `this` context.
 */
export const callHasThisAssertion = expect.createAssertion(
  [SpyCallSchema, 'to have this', schema.UnknownSchema],
  (call: SinonSpyCall, expected: unknown) => {
    if (is(call.thisValue, expected)) {
      return true;
    }
    return {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- Sinon types thisValue as any
      actual: call.thisValue,
      expected,
      message: `Expected spy call to have specified this context`,
    };
  },
);

// #endregion

// #region Call Order Assertions

/**
 * Asserts that one spy was called before another.
 */
export const wasCalledBeforeAssertion = expect.createAssertion(
  [SpySchema, 'was called before', SpySchema],
  (spy1: SinonSpy, spy2: SinonSpy) => {
    if (spy1.calledBefore(spy2)) {
      return true;
    }
    return {
      actual: 'called after or not called',
      expected: 'called before',
      message: `Expected first spy to have been called before second spy`,
    };
  },
);

/**
 * Asserts that one spy was called after another.
 */
export const wasCalledAfterAssertion = expect.createAssertion(
  [SpySchema, 'was called after', SpySchema],
  (spy1: SinonSpy, spy2: SinonSpy) => {
    if (spy1.calledAfter(spy2)) {
      return true;
    }
    return {
      actual: 'called before or not called',
      expected: 'called after',
      message: `Expected first spy to have been called after second spy`,
    };
  },
);

/**
 * Asserts that an array of spies were called in the specified order.
 */
export const givenCallOrderAssertion = expect.createAssertion(
  [z.array(SpySchema), 'given call order'],
  (spies: SinonSpy[]) => {
    for (let i = 0; i < spies.length - 1; i++) {
      const current = spies[i];
      const next = spies[i + 1];
      if (current && next && !current.calledBefore(next)) {
        return {
          actual: 'incorrect order',
          expected: 'sequential call order',
          message: `Expected spies to have been called in order, but spy ${i} was not called before spy ${i + 1}`,
        };
      }
    }
    return true;
  },
);

// #endregion

// #region Complex Assertions

/**
 * Specification for a single spy call.
 */
interface CallSpec {
  args?: unknown[];
  returned?: unknown;
  thisValue?: unknown;
  threw?: unknown;
}

type CallSpecOrArgs = CallSpec | unknown[];

const { isArray } = Array;

/**
 * Normalizes a call spec or args array to a CallSpec object.
 *
 * @function
 */
const normalizeCallSpec = (spec: CallSpecOrArgs): CallSpec =>
  isArray(spec) ? { args: spec } : spec;

/**
 * Asserts that a spy's calls match a specification array.
 *
 * Each element can be either:
 *
 * - An object with `args`, `returned`, `threw`, `thisValue` properties
 * - An array (shorthand for `{ args: [...] }`)
 *
 * @example
 *
 * ```ts
 * const spy = sinon.spy();
 * spy(1);
 * spy(2);
 * spy(3);
 * expect(spy, 'to have calls satisfying', [
 *   { args: [1] },
 *   { args: [2] },
 *   { args: [3] },
 * ]);
 * ```
 */
export const toHaveCallsSatisfyingAssertion = expect.createAssertion(
  [SpySchema, 'to have calls satisfying', z.array(schema.UnknownSchema)],
  (spy: SinonSpy, rawSpecs: unknown[]) => {
    const calls = spy.getCalls();
    const normalizedSpecs = (rawSpecs as CallSpecOrArgs[]).map(
      normalizeCallSpec,
    );

    if (calls.length !== normalizedSpecs.length) {
      return {
        actual: calls.length,
        expected: normalizedSpecs.length,
        message: `Expected spy to have ${normalizedSpecs.length} call(s), but it had ${calls.length}`,
      };
    }

    for (let i = 0; i < calls.length; i++) {
      const call = calls[i];
      const spec = normalizedSpecs[i];

      if (!call || !spec) {
        continue;
      }

      if (spec.args !== undefined) {
        const actualArgs = call.args;
        const expectedArgs = spec.args;
        for (let j = 0; j < expectedArgs.length; j++) {
          if (!is(actualArgs[j], expectedArgs[j])) {
            return {
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- Sinon types args as any[]
              actual: actualArgs[j],
              expected: expectedArgs[j],
              message: `Call ${i}: argument ${j} did not match`,
            };
          }
        }
      }

      if (spec.returned !== undefined) {
        if (!is(call.returnValue, spec.returned)) {
          return {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- Sinon types returnValue as any
            actual: call.returnValue,
            expected: spec.returned,
            message: `Call ${i}: return value did not match`,
          };
        }
      }

      if (spec.threw !== undefined) {
        if (spec.threw === true && call.exception === undefined) {
          return {
            actual: 'no exception',
            expected: 'an exception',
            message: `Call ${i}: expected to throw but did not`,
          };
        }
      }

      if (spec.thisValue !== undefined) {
        if (!is(call.thisValue, spec.thisValue)) {
          return {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- Sinon types thisValue as any
            actual: call.thisValue,
            expected: spec.thisValue,
            message: `Call ${i}: this context did not match`,
          };
        }
      }
    }

    return true;
  },
);

// #endregion

/**
 * All Sinon assertions for use with `expect.use()`.
 */
export const sinonAssertions = [
  // Basic
  wasCalledAssertion,
  wasNotCalledAssertion,
  // Call count
  wasCalledTimesAssertion,
  wasCalledOnceAssertion,
  wasCalledTwiceAssertion,
  wasCalledThriceAssertion,
  // Arguments
  wasCalledWithAssertion,
  wasAlwaysCalledWithAssertion,
  wasCalledWithExactlyAssertion,
  wasNeverCalledWithAssertion,
  // Context
  wasCalledOnAssertion,
  wasAlwaysCalledOnAssertion,
  // Exceptions
  threwAssertion,
  threwWithAssertion,
  alwaysThrewAssertion,
  // Returns (Spy-level)
  spyReturnedAssertion,
  spyReturnedTimesAssertion,
  spyReturnedWithAssertion,
  // SpyCall
  callHasArgsAssertion,
  callReturnedAssertion,
  callThrewAssertion,
  callHasThisAssertion,
  // Call Order
  wasCalledBeforeAssertion,
  wasCalledAfterAssertion,
  givenCallOrderAssertion,
  // Complex
  toHaveCallsSatisfyingAssertion,
] as const;
