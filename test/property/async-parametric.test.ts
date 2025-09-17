import fc from 'fast-check';
import { describe } from 'node:test';

import * as assertions from '../../src/assertion/impl/async-parametric.js';
import { AsyncParametricAssertions } from '../../src/assertion/index.js';
import { type AnyAssertion } from '../../src/types.js';
import {
  type PropertyTestConfig,
  type PropertyTestConfigParameters,
} from './property-test-config.js';
import { extractPhrases } from './property-test-util.js';
import {
  assertExhaustiveTestConfigs,
  runPropertyTests,
} from './property-test.macro.js';

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
        generators: [
          fc.constant(async () => {
            throw new Error('Generated error');
          }),
          fc.constantFrom(
            ...extractPhrases(
              assertions.functionFulfillWithValueSatisfyingAssertion,
            ),
          ),
          fc.constant('expected message'),
        ] as const,
      },
      valid: {
        async: true,
        generators: [
          fc.constant(async () => 'expected value'),
          fc.constantFrom(
            ...extractPhrases(
              assertions.functionFulfillWithValueSatisfyingAssertion,
            ),
          ),
          fc.constant('expected value'),
        ] as const,
      },
    },
  ],

  [
    assertions.functionRejectAssertion,
    {
      invalid: {
        async: true,
        generators: [
          fc.constant(async () => 'success'),
          fc.constantFrom(
            ...extractPhrases(assertions.functionRejectAssertion),
          ),
        ] as const,
      },
      valid: {
        async: true,
        generators: [
          fc.constant(async () => {
            throw new Error('Generated error');
          }),
          fc.constantFrom(
            ...extractPhrases(assertions.functionRejectAssertion),
          ),
        ] as const,
      },
    },
  ],

  [
    assertions.functionRejectWithErrorSatisfyingAssertion,
    {
      invalid: {
        async: true,
        generators: [
          fc.constant(async () => {
            throw new Error('wrong message');
          }),
          fc.constantFrom(
            ...extractPhrases(
              assertions.functionRejectWithErrorSatisfyingAssertion,
            ),
          ),
          fc.constant('expected message'),
        ] as const,
      },
      valid: {
        async: true,
        generators: [
          fc.constant(async () => {
            throw new Error('expected message');
          }),
          fc.constantFrom(
            ...extractPhrases(
              assertions.functionRejectWithErrorSatisfyingAssertion,
            ),
          ),
          fc.constant('expected message'),
        ] as const,
      },
    },
  ],

  [
    assertions.functionRejectWithTypeAssertion,
    {
      invalid: {
        async: true,
        generators: [
          fc.constant(async () => {
            throw new TypeError('type error');
          }),
          fc.constantFrom(
            ...extractPhrases(assertions.functionRejectWithTypeAssertion),
          ),
          fc.constant(ReferenceError),
        ] as const,
      },
      valid: {
        async: true,
        generators: [
          fc.constant(async () => {
            throw new TypeError('type error');
          }),
          fc.constantFrom(
            ...extractPhrases(assertions.functionRejectWithTypeAssertion),
          ),
          fc.constant(TypeError),
        ] as const,
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
        ] as const,
      },
      valid: {
        async: true,
        generators: [
          fc.constant(async () => 'success'),
          fc.constantFrom(
            ...extractPhrases(assertions.functionResolveAssertion),
          ),
        ] as const,
      },
    },
  ],

  [
    assertions.promiseFulfillWithValueSatisfyingAssertion,
    {
      invalid: {
        async: true,
        generators: [
          fc.constant(Promise.reject(new Error('rejection'))),
          fc.constantFrom(
            ...extractPhrases(
              assertions.promiseFulfillWithValueSatisfyingAssertion,
            ),
          ),
          fc.constant('expected value'),
        ] as const,
      },
      valid: {
        async: true,
        generators: [
          fc.constant(Promise.resolve('expected value')),
          fc.constantFrom(
            ...extractPhrases(
              assertions.promiseFulfillWithValueSatisfyingAssertion,
            ),
          ),
          fc.constant('expected value'),
        ] as const,
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
        ] as const,
      },
      valid: {
        async: true,
        generators: [
          fc.constant(Promise.reject(new Error('rejection'))),
          fc.constantFrom(...extractPhrases(assertions.promiseRejectAssertion)),
        ] as const,
      },
    },
  ],

  [
    assertions.promiseRejectWithErrorSatisfyingAssertion,
    {
      invalid: {
        async: true,
        generators: [
          fc.constant(Promise.reject(new Error('wrong message'))),
          fc.constantFrom(
            ...extractPhrases(
              assertions.promiseRejectWithErrorSatisfyingAssertion,
            ),
          ),
          fc.constant('expected message'),
        ] as const,
      },
      valid: {
        async: true,
        generators: [
          fc.constant(Promise.reject(new Error('expected message'))),
          fc.constantFrom(
            ...extractPhrases(
              assertions.promiseRejectWithErrorSatisfyingAssertion,
            ),
          ),
          fc.constant('expected message'),
        ] as const,
      },
    },
  ],

  [
    assertions.promiseRejectWithTypeAssertion,
    {
      invalid: {
        async: true,
        generators: [
          fc.constant(Promise.reject(new TypeError('type error'))),
          fc.constantFrom(
            ...extractPhrases(assertions.promiseRejectWithTypeAssertion),
          ),
          fc.constant(ReferenceError),
        ] as const,
      },
      valid: {
        async: true,
        generators: [
          fc.constant(Promise.reject(new TypeError('type error'))),
          fc.constantFrom(
            ...extractPhrases(assertions.promiseRejectWithTypeAssertion),
          ),
          fc.constant(TypeError),
        ] as const,
      },
    },
  ],

  [
    assertions.promiseResolveAssertion,
    {
      invalid: {
        async: true,
        generators: [
          fc.constant(Promise.reject(new Error('rejection'))),
          fc.constantFrom(
            ...extractPhrases(assertions.promiseResolveAssertion),
          ),
        ] as const,
      },
      valid: {
        async: true,
        generators: [
          fc.constant(Promise.resolve('success')),
          fc.constantFrom(
            ...extractPhrases(assertions.promiseResolveAssertion),
          ),
        ] as const,
      },
    },
  ],
]);

describe('Property-Based Tests for Async Parametric Assertions', () => {
  assertExhaustiveTestConfigs(
    'Async Parametric Assertions',
    AsyncParametricAssertions,
    testConfigs,
  );
  runPropertyTests(testConfigs, testConfigDefaults);
});
