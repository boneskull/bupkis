import escapeStringRegexp from 'escape-string-regexp';
import fc from 'fast-check';
import { describe } from 'node:test';

import * as assertions from '../../src/assertion/impl/async-parametric.js';
import { AsyncParametricAssertions } from '../../src/assertion/index.js';
import { type AnyAssertion } from '../../src/types.js';
import { expectExhaustiveAssertionTests } from '../exhaustive.macro.js';
import {
  type PropertyTestConfig,
  type PropertyTestConfigParameters,
} from './property-test-config.js';
import { extractPhrases } from './property-test-util.js';
import { runPropertyTests } from './property-test.macro.js';

/**
 * Test config defaults
 */
const testConfigDefaults: PropertyTestConfigParameters = {} as const;

/**
 * Test configurations for each async parametric assertion.
 */
const testConfigs = new Map<AnyAssertion, PropertyTestConfig>([
  [
    assertions.functionFulfillWithValueSatisfyingAssertion,
    {
      invalid: {
        async: true,
        generators: fc.string().chain((expected) =>
          fc
            .string()
            .filter((str) => str !== expected)
            .chain((actual) =>
              fc.tuple(
                fc.oneof(
                  // wrong value
                  fc.constant(async () => actual),
                  // rejects instead of fulfilling
                  fc.constant(async () => {
                    throw new Error(expected);
                  }),
                ),
                fc.constantFrom(
                  ...extractPhrases(
                    assertions.functionFulfillWithValueSatisfyingAssertion,
                  ),
                ),
                fc.constant(expected),
              ),
            ),
        ),
      },
      valid: {
        async: true,
        generators: fc.string().chain((str) =>
          fc.tuple(
            fc.constant(async () => str),
            fc.constantFrom(
              ...extractPhrases(
                assertions.functionFulfillWithValueSatisfyingAssertion,
              ),
            ),
            fc.constant(str),
          ),
        ),
      },
    },
  ],

  [
    assertions.functionRejectAssertion,
    {
      invalid: {
        async: true,
        generators: [
          fc.oneof(
            fc.string().map((str) => async () => str),
            fc.string().map((str) => () => str),
          ),
          fc.constantFrom(
            ...extractPhrases(assertions.functionRejectAssertion),
          ),
        ],
      },
      valid: {
        async: true,
        generators: fc.string().chain((expected) =>
          fc.tuple(
            fc.constant(async () => {
              throw new Error(expected);
            }),
            fc.constantFrom(
              ...extractPhrases(assertions.functionRejectAssertion),
            ),
          ),
        ),
      },
    },
  ],

  [
    assertions.functionRejectWithErrorSatisfyingAssertion,
    {
      invalid: {
        async: true,
        generators: fc
          .string({ maxLength: 5, minLength: 2 })
          .chain((expected) =>
            fc.string({ maxLength: 10, minLength: 6 }).chain((actual) =>
              fc.tuple(
                fc.oneof(
                  fc.constant(async () => {
                    throw new Error(actual);
                  }),
                  fc.constant(async () => expected),
                ),
                fc.constantFrom(
                  ...extractPhrases(
                    assertions.functionRejectWithErrorSatisfyingAssertion,
                  ),
                ),
                fc.oneof(
                  fc.constant(expected),
                  fc.constant(new RegExp(escapeStringRegexp(expected))),
                  fc.constant({ message: expected }),
                  fc.constant({
                    message: new RegExp(escapeStringRegexp(expected)),
                  }),
                ),
              ),
            ),
          ),
      },
      valid: {
        async: true,
        generators: fc
          .string({ maxLength: 5, minLength: 2 })
          .chain((expected) =>
            fc.tuple(
              fc.constant(async () => {
                throw new Error(expected);
              }),
              fc.constantFrom(
                ...extractPhrases(
                  assertions.functionRejectWithErrorSatisfyingAssertion,
                ),
              ),
              fc.oneof(
                fc.constant(expected),
                fc.constant(new RegExp(escapeStringRegexp(expected))),
                fc.constant({ message: expected }),
                fc.constant({
                  message: new RegExp(escapeStringRegexp(expected)),
                }),
              ),
            ),
          ),
      },
    },
  ],

  [
    assertions.functionRejectWithTypeAssertion,
    {
      invalid: {
        async: true,
        generators: fc
          .constantFrom(TypeError, ReferenceError, RangeError, SyntaxError)
          .chain((ActualCtor) =>
            fc
              .constantFrom(TypeError, ReferenceError, RangeError, SyntaxError)
              .filter((ExpectedCtor) => ExpectedCtor !== ActualCtor)
              .chain((ExpectedCtor) =>
                fc.tuple(
                  fc.constant(async () => {
                    throw new ActualCtor('error');
                  }),
                  fc.constantFrom(
                    ...extractPhrases(
                      assertions.functionRejectWithTypeAssertion,
                    ),
                  ),
                  fc.constant(ExpectedCtor),
                ),
              ),
          ),
      },
      valid: {
        async: true,
        generators: fc
          .constantFrom(TypeError, ReferenceError, RangeError, SyntaxError)
          .chain((ErrorCtor) =>
            fc.tuple(
              fc.constant(async () => {
                throw new ErrorCtor('error');
              }),
              fc.constantFrom(
                ...extractPhrases(assertions.functionRejectWithTypeAssertion),
              ),
              fc.constant(ErrorCtor),
            ),
          ),
      },
    },
  ],

  [
    assertions.functionResolveAssertion,
    {
      invalid: {
        async: true,
        generators: [
          fc.constant(async () => {
            throw new Error('rejection');
          }),
          fc.constantFrom(
            ...extractPhrases(assertions.functionResolveAssertion),
          ),
        ],
      },
      valid: {
        async: true,
        generators: [
          fc.constant(async () => 'success'),
          fc.constantFrom(
            ...extractPhrases(assertions.functionResolveAssertion),
          ),
        ],
      },
    },
  ],

  [
    assertions.promiseFulfillWithValueSatisfyingAssertion,
    {
      invalid: {
        async: true,
        generators: fc
          .string({ maxLength: 20, minLength: 10 })
          .chain((expected) =>
            fc
              .string({ maxLength: 30, minLength: 21 })
              .filter((actual) => !expected.includes(actual))
              .chain((actual) =>
                fc.tuple(
                  fc.oneof(
                    fc.constant(Promise.resolve(actual)),
                    // Use a thenable object instead of Promise.reject() to avoid
                    // unhandled rejection warnings during test setup. The rejection
                    // only occurs when the assertion uses `await` on this object
                    fc.constant({
                      then(
                        _resolve: (value: any) => void,
                        reject: (reason: any) => void,
                      ) {
                        reject(new Error('rejection'));
                      },
                    }),
                  ),
                  fc.constantFrom(
                    ...extractPhrases(
                      assertions.promiseFulfillWithValueSatisfyingAssertion,
                    ),
                  ),
                  fc.oneof(
                    fc.constant(expected),
                    fc.constant(new RegExp(escapeStringRegexp(expected))),
                  ),
                ),
              ),
          ),
      },
      valid: {
        async: true,
        generators: fc
          .string({ maxLength: 20, minLength: 10 })
          .chain((expected) =>
            fc.tuple(
              fc.constant(Promise.resolve(expected)),
              fc.constantFrom(
                ...extractPhrases(
                  assertions.promiseFulfillWithValueSatisfyingAssertion,
                ),
              ),
              fc.oneof(
                fc.constant(expected),
                fc.constant(new RegExp(escapeStringRegexp(expected))),
              ),
            ),
          ),
      },
    },
  ],

  [
    assertions.promiseRejectAssertion,
    {
      invalid: {
        async: true,
        generators: [
          fc.constant(Promise.resolve('success')),
          fc.constantFrom(...extractPhrases(assertions.promiseRejectAssertion)),
        ],
      },
      valid: {
        async: true,
        generators: [
          fc.constant({
            then(
              _resolve: (value: any) => void,
              reject: (reason: any) => void,
            ) {
              reject(new Error('rejection'));
            },
          }),
          fc.constantFrom(...extractPhrases(assertions.promiseRejectAssertion)),
        ],
      },
    },
  ],

  [
    assertions.promiseRejectWithErrorSatisfyingAssertion,
    {
      invalid: {
        async: true,
        generators: fc.string().chain((expectedMessage) =>
          fc
            .string()
            .filter((actualMessage) => actualMessage !== expectedMessage)
            .chain((actualMessage) =>
              fc.tuple(
                fc.constant({
                  then(
                    _resolve: (value: any) => void,
                    reject: (reason: any) => void,
                  ) {
                    reject(new Error(actualMessage));
                  },
                }),
                fc.constantFrom(
                  ...extractPhrases(
                    assertions.promiseRejectWithErrorSatisfyingAssertion,
                  ),
                ),
                fc.constant(expectedMessage),
              ),
            ),
        ),
      },
      valid: {
        async: true,
        generators: fc.string().chain((message) =>
          fc.tuple(
            fc.constant({
              then(
                _resolve: (value: any) => void,
                reject: (reason: any) => void,
              ) {
                reject(new Error(message));
              },
            }),
            fc.constantFrom(
              ...extractPhrases(
                assertions.promiseRejectWithErrorSatisfyingAssertion,
              ),
            ),
            fc.constant(message),
          ),
        ),
      },
    },
  ],

  [
    assertions.promiseRejectWithTypeAssertion,
    {
      invalid: {
        async: true,
        generators: fc
          .constantFrom(TypeError, ReferenceError, RangeError, SyntaxError)
          .chain((ActualCtor) =>
            fc
              .constantFrom(TypeError, ReferenceError, RangeError, SyntaxError)
              .filter((ExpectedCtor) => ExpectedCtor !== ActualCtor)
              .chain((ExpectedCtor) =>
                fc.tuple(
                  fc.constant({
                    then(
                      _resolve: (value: any) => void,
                      reject: (reason: any) => void,
                    ) {
                      reject(new ActualCtor('error'));
                    },
                  }),
                  fc.constantFrom(
                    ...extractPhrases(
                      assertions.promiseRejectWithTypeAssertion,
                    ),
                  ),
                  fc.constant(ExpectedCtor),
                ),
              ),
          ),
      },
      valid: {
        async: true,
        generators: fc
          .constantFrom(TypeError, ReferenceError, RangeError, SyntaxError)
          .chain((ExpectedCtor) =>
            fc.tuple(
              fc.constant({
                then(
                  _resolve: (value: any) => void,
                  reject: (reason: any) => void,
                ) {
                  reject(new ExpectedCtor('error'));
                },
              }),
              fc.constantFrom(
                ...extractPhrases(assertions.promiseRejectWithTypeAssertion),
              ),
              fc.constant(ExpectedCtor),
            ),
          ),
      },
    },
  ],

  [
    assertions.promiseResolveAssertion,
    {
      invalid: {
        async: true,
        generators: [
          fc.constant({
            then(
              _resolve: (value: any) => void,
              reject: (reason: any) => void,
            ) {
              reject(new Error('rejection'));
            },
          }),
          fc.constantFrom(
            ...extractPhrases(assertions.promiseResolveAssertion),
          ),
        ],
      },
      valid: {
        async: true,
        generators: [
          fc.constant(Promise.resolve('success')),
          fc.constantFrom(
            ...extractPhrases(assertions.promiseResolveAssertion),
          ),
        ],
      },
    },
  ],
]);

describe('Property-Based Tests for Async Parametric Assertions', () => {
  expectExhaustiveAssertionTests(
    'Async Parametric Assertions',
    AsyncParametricAssertions,
    testConfigs,
  );
  runPropertyTests(testConfigs, testConfigDefaults);
});
