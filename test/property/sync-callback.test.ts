import fc from 'fast-check';
import { describe } from 'node:test';

import * as assertions from '../../src/assertion/impl/sync-callback.js';
import { SyncCallbackAssertions } from '../../src/assertion/index.js';
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
 * Test config defaults for callback assertions
 */
const testConfigDefaults: PropertyTestConfigParameters = {} as const;

/**
 * Test configurations for each sync callback assertion.
 */
const testConfigs = new Map<AnyAssertion, PropertyTestConfig>([
  [
    assertions.functionCallCallbackAssertion,
    {
      invalid: {
        generators: [
          fc.constant(() => {}),
          fc.constantFrom(
            ...extractPhrases(assertions.functionCallCallbackAssertion),
          ),
        ] as const,
      },
      valid: {
        generators: [
          fc.constant((callback: () => void) => {
            callback();
          }),
          fc.constantFrom(
            ...extractPhrases(assertions.functionCallCallbackAssertion),
          ),
        ] as const,
      },
    },
  ],

  [
    assertions.functionCallCallbackWithExactValueAssertion,
    {
      invalid: {
        generators: [
          fc.constant((callback: (value: unknown) => void) => {
            callback('wrong value');
          }),
          fc.constantFrom(
            ...extractPhrases(
              assertions.functionCallCallbackWithExactValueAssertion,
            ),
          ),
          fc.constant('expected value'),
        ] as const,
      },
      valid: {
        generators: [
          fc.constant((callback: (value: unknown) => void) => {
            callback('expected value');
          }),
          fc.constantFrom(
            ...extractPhrases(
              assertions.functionCallCallbackWithExactValueAssertion,
            ),
          ),
          fc.constant('expected value'),
        ] as const,
      },
    },
  ],

  [
    assertions.functionCallCallbackWithValueAssertion,
    {
      invalid: {
        generators: [
          fc.constant((callback: (value: unknown) => void) => {
            callback(42);
          }),
          fc.constantFrom(
            ...extractPhrases(
              assertions.functionCallCallbackWithValueAssertion,
            ),
          ),
          fc.constant('string'),
        ] as const,
      },
      valid: {
        generators: [
          fc.constant((callback: (value: unknown) => void) => {
            callback('test value');
          }),
          fc.constantFrom(
            ...extractPhrases(
              assertions.functionCallCallbackWithValueAssertion,
            ),
          ),
          fc.constant('test value'),
        ] as const,
      },
    },
  ],

  [
    assertions.functionCallCallbackWithValueSatisfyingAssertion,
    {
      invalid: {
        generators: [
          fc.constant((callback: (value: unknown) => void) => {
            callback('wrong value');
          }),
          fc.constantFrom(
            ...extractPhrases(
              assertions.functionCallCallbackWithValueSatisfyingAssertion,
            ),
          ),
          fc.constant(/^test/),
        ] as const,
      },
      valid: {
        generators: [
          fc.constant((callback: (value: unknown) => void) => {
            callback('test value');
          }),
          fc.constantFrom(
            ...extractPhrases(
              assertions.functionCallCallbackWithValueSatisfyingAssertion,
            ),
          ),
          fc.constant(/^test/),
        ] as const,
      },
    },
  ],

  [
    assertions.functionCallNodebackAssertion,
    {
      invalid: {
        generators: [
          fc.constant(() => {}),
          fc.constantFrom(
            ...extractPhrases(assertions.functionCallNodebackAssertion),
          ),
        ] as const,
      },
      valid: {
        generators: [
          fc.constant(
            (callback: (err: Error | null, value?: unknown) => void) => {
              callback(null, 'success');
            },
          ),
          fc.constantFrom(
            ...extractPhrases(assertions.functionCallNodebackAssertion),
          ),
        ] as const,
      },
    },
  ],

  [
    assertions.functionCallNodebackWithErrorAssertion,
    {
      invalid: {
        generators: [
          fc.constant((callback: (err: Error | null) => void) => {
            callback(null);
          }),
          fc.constantFrom(
            ...extractPhrases(
              assertions.functionCallNodebackWithErrorAssertion,
            ),
          ),
        ] as const,
      },
      valid: {
        generators: [
          fc.constant((callback: (err: Error | null) => void) => {
            callback(new Error('test error'));
          }),
          fc.constantFrom(
            ...extractPhrases(
              assertions.functionCallNodebackWithErrorAssertion,
            ),
          ),
        ] as const,
      },
    },
  ],

  [
    assertions.functionCallNodebackWithErrorClassAssertion,
    {
      invalid: {
        generators: [
          fc.constant((callback: (err: Error | null) => void) => {
            callback(new TypeError('type error'));
          }),
          fc.constantFrom(
            ...extractPhrases(
              assertions.functionCallNodebackWithErrorClassAssertion,
            ),
          ),
          fc.constant(ReferenceError),
        ] as const,
      },
      valid: {
        generators: [
          fc.constant((callback: (err: Error | null) => void) => {
            callback(new TypeError('type error'));
          }),
          fc.constantFrom(
            ...extractPhrases(
              assertions.functionCallNodebackWithErrorClassAssertion,
            ),
          ),
          fc.constant(TypeError),
        ] as const,
      },
    },
  ],

  [
    assertions.functionCallNodebackWithErrorPatternAssertion,
    {
      invalid: {
        generators: [
          fc.constant((callback: (err: Error | null) => void) => {
            callback(new Error('wrong message'));
          }),
          fc.constantFrom(
            ...extractPhrases(
              assertions.functionCallNodebackWithErrorPatternAssertion,
            ),
          ),
          fc.constant(/^test/),
        ] as const,
      },
      valid: {
        generators: [
          fc.constant((callback: (err: Error | null) => void) => {
            callback(new Error('test message'));
          }),
          fc.constantFrom(
            ...extractPhrases(
              assertions.functionCallNodebackWithErrorPatternAssertion,
            ),
          ),
          fc.constant(/^test/),
        ] as const,
      },
    },
  ],

  [
    assertions.functionCallNodebackWithExactValueAssertion,
    {
      invalid: {
        generators: [
          fc.constant(
            (callback: (err: Error | null, value?: unknown) => void) => {
              callback(null, 'wrong value');
            },
          ),
          fc.constantFrom(
            ...extractPhrases(
              assertions.functionCallNodebackWithExactValueAssertion,
            ),
          ),
          fc.constant('expected value'),
        ] as const,
      },
      valid: {
        generators: [
          fc.constant(
            (callback: (err: Error | null, value?: unknown) => void) => {
              callback(null, 'expected value');
            },
          ),
          fc.constantFrom(
            ...extractPhrases(
              assertions.functionCallNodebackWithExactValueAssertion,
            ),
          ),
          fc.constant('expected value'),
        ] as const,
      },
    },
  ],

  [
    assertions.functionCallNodebackWithValueAssertion,
    {
      invalid: {
        generators: [
          fc.constant(
            (callback: (err: Error | null, value?: unknown) => void) => {
              callback(null, 42);
            },
          ),
          fc.constantFrom(
            ...extractPhrases(
              assertions.functionCallNodebackWithValueAssertion,
            ),
          ),
          fc.constant('string'),
        ] as const,
      },
      valid: {
        generators: [
          fc.constant(
            (callback: (err: Error | null, value?: unknown) => void) => {
              callback(null, 'test value');
            },
          ),
          fc.constantFrom(
            ...extractPhrases(
              assertions.functionCallNodebackWithValueAssertion,
            ),
          ),
          fc.constant('test value'),
        ] as const,
      },
    },
  ],

  [
    assertions.functionCallNodebackWithValueSatisfyingAssertion,
    {
      invalid: {
        generators: [
          fc.constant(
            (callback: (err: Error | null, value?: unknown) => void) => {
              callback(null, 'wrong value');
            },
          ),
          fc.constantFrom(
            ...extractPhrases(
              assertions.functionCallNodebackWithValueSatisfyingAssertion,
            ),
          ),
          fc.constant(/^test/),
        ] as const,
      },
      valid: {
        generators: [
          fc.constant(
            (callback: (err: Error | null, value?: unknown) => void) => {
              callback(null, 'test value');
            },
          ),
          fc.constantFrom(
            ...extractPhrases(
              assertions.functionCallNodebackWithValueSatisfyingAssertion,
            ),
          ),
          fc.constant(/^test/),
        ] as const,
      },
    },
  ],
]);

describe('Property-Based Tests for Sync Callback Assertions', () => {
  assertExhaustiveTestConfigs(
    'Sync Callback Assertions',
    SyncCallbackAssertions,
    testConfigs,
  );
  runPropertyTests(testConfigs, testConfigDefaults);
});
