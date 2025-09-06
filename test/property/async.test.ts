import fc from 'fast-check';
import { describe } from 'node:test';

import { AsyncAssertions } from '../../src/assertion/impl/async.js';
import { keyBy } from '../../src/util.js';
import {
  type PropertyTestConfig,
  type PropertyTestConfigParameters,
} from './config.js';
import { extractPhrases } from './property-test-util.js';
import {
  assertExhaustiveTestConfig,
  runPropertyTestsAsync,
} from './property-test.macro.js';

const assertions = keyBy(AsyncAssertions, 'id');

/**
 * Test config defaults
 */
const testConfigDefaults: PropertyTestConfigParameters = {
  numRuns: 200,
} as const;

const testConfigs = {
  // Test functions that reject (to reject)
  'functionschema-to-reject-2s2p': {
    invalid: {
      generators: [
        // Generate functions that resolve (invalid for "to reject")
        fc.func(fc.string()).map(
          (fn) =>
            async (..._args: unknown[]) =>
              fn(), // Always resolves
        ),
        fc.constantFrom(
          ...extractPhrases(assertions['functionschema-to-reject-2s2p']!),
        ),
      ],
    },
    valid: {
      generators: [
        // Generate functions that throw/reject (valid for "to reject")
        fc.func(fc.string()).map((fn) => async (..._args: unknown[]) => {
          const value = fn();
          throw new Error('Generated error: ' + value);
        }),
        fc.constantFrom(
          ...extractPhrases(assertions['functionschema-to-reject-2s2p']!),
        ),
      ],
    },
  },

  // Test functions rejecting with string patterns
  'functionschema-to-reject-string-regexp-object-3s3p': {
    invalid: {
      generators: [
        // Generate function that throws with wrong message
        fc.func(fc.anything()).map((fn) => async (..._args: unknown[]) => {
          fn(); // Generate some behavior
          throw new Error('wrong message');
        }),
        fc.constantFrom(
          ...extractPhrases(
            assertions['functionschema-to-reject-string-regexp-object-3s3p']!,
          ),
        ),
        fc.constant('expected message'), // Expected message doesn't match actual
      ],
    },
    valid: {
      generators: [
        // Generate function that throws with correct message
        fc.func(fc.anything()).map((fn) => async (..._args: unknown[]) => {
          fn(); // Generate some behavior
          throw new Error('expected message');
        }),
        fc.constantFrom(
          ...extractPhrases(
            assertions['functionschema-to-reject-string-regexp-object-3s3p']!,
          ),
        ),
        fc.constant('expected message'), // Expected message matches actual
      ],
    },
  },

  // Test functions rejecting with specific error class
  'functionschema-to-reject-with-a-to-reject-with-an-classschema-3s3p': {
    invalid: {
      generators: [
        // Generate function that throws wrong error type
        fc.func(fc.anything()).map((fn) => async (..._args: unknown[]) => {
          fn(); // Generate some behavior
          throw new TypeError('type error');
        }),
        fc.constantFrom(
          ...extractPhrases(
            assertions[
              'functionschema-to-reject-with-a-to-reject-with-an-classschema-3s3p'
            ]!,
          ),
        ),
        fc.constant(RangeError), // Expecting RangeError but function throws TypeError
      ],
    },
    valid: {
      generators: [
        // Generate function that throws correct error type
        fc.func(fc.anything()).map((fn) => async (..._args: unknown[]) => {
          fn(); // Generate some behavior
          throw new TypeError('type error');
        }),
        fc.constantFrom(
          ...extractPhrases(
            assertions[
              'functionschema-to-reject-with-a-to-reject-with-an-classschema-3s3p'
            ]!,
          ),
        ),
        fc.constant(TypeError), // Expecting TypeError and function throws TypeError
      ],
    },
  },

  // Test functions that resolve (to resolve/to fulfill)
  'functionschema-to-resolve-to-fulfill-2s2p': {
    invalid: {
      generators: [
        // Generate functions that throw/reject (invalid for "to resolve")
        fc.func(fc.string()).map((fn) => async (..._args: unknown[]) => {
          const value = fn();
          throw new Error('Generated error: ' + value);
        }),
        fc.constantFrom(
          ...extractPhrases(
            assertions['functionschema-to-resolve-to-fulfill-2s2p']!,
          ),
        ),
      ],
    },
    valid: {
      generators: [
        // Generate functions that resolve (valid for "to resolve")
        fc.func(fc.string()).map(
          (fn) =>
            async (..._args: unknown[]) =>
              fn(), // Always resolves
        ),
        fc.constantFrom(
          ...extractPhrases(
            assertions['functionschema-to-resolve-to-fulfill-2s2p']!,
          ),
        ),
      ],
    },
  },

  // Test promises that reject (to reject)
  'wrappedpromiselikeschema-to-reject-2s2p': {
    invalid: {
      generators: [
        fc.anything().map((val) => Promise.resolve(val)),
        fc.constantFrom(
          ...extractPhrases(
            assertions['wrappedpromiselikeschema-to-reject-2s2p']!,
          ),
        ),
      ],
    },
    valid: {
      generators: [
        fc
          .string()
          .map((msg) => Promise.reject(new Error(msg || 'test error'))),
        fc.constantFrom(
          ...extractPhrases(
            assertions['wrappedpromiselikeschema-to-reject-2s2p']!,
          ),
        ),
      ],
    },
  },

  // Test promises rejecting with string patterns
  'wrappedpromiselikeschema-to-reject-string-regexp-object-3s3p': {
    invalid: {
      generators: [
        fc
          .string()
          .filter((s) => s !== 'expected message')
          .map((msg) => Promise.reject(new Error(msg))),
        fc.constantFrom(
          ...extractPhrases(
            assertions[
              'wrappedpromiselikeschema-to-reject-string-regexp-object-3s3p'
            ]!,
          ),
        ),
        fc.constant('expected message'), // Error message doesn't match
      ],
    },
    valid: {
      generators: [
        fc.constant(Promise.reject(new Error('expected message'))),
        fc.constantFrom(
          ...extractPhrases(
            assertions[
              'wrappedpromiselikeschema-to-reject-string-regexp-object-3s3p'
            ]!,
          ),
        ),
        fc.constant('expected message'), // Error message matches exactly
      ],
    },
  },

  // Test promises rejecting with specific error class
  'wrappedpromiselikeschema-to-reject-with-a-to-reject-with-an-classschema-3s3p':
    {
      invalid: {
        generators: [
          fc.string().map((msg) => Promise.reject(new TypeError(msg))),
          fc.constantFrom(
            ...extractPhrases(
              assertions[
                'wrappedpromiselikeschema-to-reject-with-a-to-reject-with-an-classschema-3s3p'
              ]!,
            ),
          ),
          fc.constant(RangeError), // Promise rejects with TypeError, not RangeError
        ],
      },
      valid: {
        generators: [
          fc.string().map((msg) => Promise.reject(new TypeError(msg))),
          fc.constantFrom(
            ...extractPhrases(
              assertions[
                'wrappedpromiselikeschema-to-reject-with-a-to-reject-with-an-classschema-3s3p'
              ]!,
            ),
          ),
          fc.constant(TypeError), // Promise rejects with TypeError, expecting TypeError
        ],
      },
    },

  // Test promises that resolve (to resolve/to fulfill)
  'wrappedpromiselikeschema-to-resolve-to-fulfill-2s2p': {
    invalid: {
      generators: [
        fc
          .string()
          .map((msg) => Promise.reject(new Error(msg || 'test error'))),
        fc.constantFrom(
          ...extractPhrases(
            assertions['wrappedpromiselikeschema-to-resolve-to-fulfill-2s2p']!,
          ),
        ),
      ],
    },
    valid: {
      generators: [
        fc.anything().map((val) => Promise.resolve(val)),
        fc.constantFrom(
          ...extractPhrases(
            assertions['wrappedpromiselikeschema-to-resolve-to-fulfill-2s2p']!,
          ),
        ),
      ],
    },
  },
} as const satisfies Record<string, PropertyTestConfig>;

describe('Property-based tests for async assertions', () => {
  assertExhaustiveTestConfig(assertions, testConfigs);

  runPropertyTestsAsync(testConfigs, assertions, testConfigDefaults);
});
