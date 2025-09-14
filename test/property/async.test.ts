import fc from 'fast-check';
import { describe } from 'node:test';

import { PromiseAssertions } from '../../src/assertion/impl/async.js';
import { keyBy } from '../../src/util.js';
import {
  type PropertyTestConfig,
  type PropertyTestConfigParameters,
} from './property-test-config.js';
import { createPhraseExtractor } from './property-test-util.js';
import {
  assertExhaustiveTestConfig,
  runPropertyTests,
} from './property-test.macro.js';

const assertions = keyBy(PromiseAssertions, 'id');

const extractPhrases = createPhraseExtractor(assertions);

/**
 * Test config defaults
 */
const testConfigDefaults: PropertyTestConfigParameters = {} as const;

const testConfigs = {
  'functionschema-to-fulfill-with-value-satisfying-to-resolve-with-value-satisfying-string-regexp-object-3s3p':
    {
      invalid: {
        async: true,
        generators: [
          // Generate functions that throw/reject (invalid for "to resolve")
          fc.func(fc.anything()).map((fn) => async (..._args: unknown[]) => {
            fn(); // Generate some behavior
            throw new Error('Generated error');
          }),
          fc.constantFrom(
            ...extractPhrases(
              'functionschema-to-fulfill-with-value-satisfying-to-resolve-with-value-satisfying-string-regexp-object-3s3p',
            ),
          ),
          fc.constant('expected value'), // Expected value doesn't match actual
        ],
      },
      valid: {
        async: true,
        generators: [
          // Generate functions that resolve (valid for "to resolve")
          fc.func(fc.constant('expected value')).map(
            (fn) =>
              async (..._args: unknown[]) =>
                fn(), // Always resolves to 'expected value'
          ),
          fc.constantFrom(
            ...extractPhrases(
              'functionschema-to-fulfill-with-value-satisfying-to-resolve-with-value-satisfying-string-regexp-object-3s3p',
            ),
          ),
          fc.constant('expected value'), // Expected value matches actual exactly
        ],
      },
    },

  // Test functions that reject (to reject)
  'functionschema-to-reject-2s2p': {
    invalid: {
      async: true,
      generators: [
        // Generate functions that resolve (invalid for "to reject")
        fc.func(fc.string()).map(
          (fn) =>
            async (..._args: unknown[]) =>
              fn(), // Always resolves
        ),
        fc.constantFrom(...extractPhrases('functionschema-to-reject-2s2p')),
      ],
    },
    valid: {
      async: true,
      generators: [
        // Generate functions that throw/reject (valid for "to reject")
        fc.func(fc.string()).map((fn) => async (..._args: unknown[]) => {
          const value = fn();
          throw new Error('Generated error: ' + value);
        }),
        fc.constantFrom(...extractPhrases('functionschema-to-reject-2s2p')),
      ],
    },
  },

  // Test functions rejecting with specific error class
  'functionschema-to-reject-with-a-to-reject-with-an-classschema-3s3p': {
    invalid: {
      async: true,
      generators: [
        // Generate function that throws wrong error type
        fc.func(fc.anything()).map((fn) => async (..._args: unknown[]) => {
          fn(); // Generate some behavior
          throw new TypeError('type error');
        }),
        fc.constantFrom(
          ...extractPhrases(
            'functionschema-to-reject-with-a-to-reject-with-an-classschema-3s3p',
          ),
        ),
        fc.constant(RangeError), // Expecting RangeError but function throws TypeError
      ],
    },
    valid: {
      async: true,
      generators: [
        // Generate function that throws correct error type
        fc.func(fc.anything()).map((fn) => async (..._args: unknown[]) => {
          fn(); // Generate some behavior
          throw new TypeError('type error');
        }),
        fc.constantFrom(
          ...extractPhrases(
            'functionschema-to-reject-with-a-to-reject-with-an-classschema-3s3p',
          ),
        ),
        fc.constant(TypeError), // Expecting TypeError and function throws TypeError
      ],
    },
  },
  // Test functions rejecting with string patterns
  'functionschema-to-reject-with-error-satisfying-string-regexp-object-3s3p': {
    invalid: {
      async: true,
      generators: [
        // Generate functions that don't reject or reject with wrong value
        fc.func(fc.anything()).map((fn) => async (..._args: unknown[]) => {
          fn(); // Function that resolves instead of rejecting (invalid for "to reject with")
          return 'resolved value';
        }),
        fc.constantFrom(
          ...extractPhrases(
            'functionschema-to-reject-with-error-satisfying-string-regexp-object-3s3p',
          ),
        ),
        fc.constant({ baz: 'quux' }), // Expected rejection value
      ],
    },
    valid: {
      async: true,
      generators: [
        // Generate functions that reject with the expected value
        fc
          .func(fc.constant({ baz: 'quux', foo: 'bar' }))
          .map((fn) => async (..._args: unknown[]) => {
            const obj = fn();
            // eslint-disable-next-line @typescript-eslint/only-throw-error
            throw obj; // Reject with the object for testing rejection patterns
          }),
        fc.constantFrom(
          ...extractPhrases(
            'functionschema-to-reject-with-error-satisfying-string-regexp-object-3s3p',
          ),
        ),
        fc.constant({ baz: 'quux' }), // Expected rejection value matches
      ],
    },
  },
  // Test functions that resolve (to resolve/to fulfill)
  'functionschema-to-resolve-to-fulfill-2s2p': {
    invalid: {
      async: true,
      generators: [
        // Generate functions that throw/reject (invalid for "to resolve")
        fc.func(fc.string()).map((fn) => async (..._args: unknown[]) => {
          const value = fn();
          throw new Error('Generated error: ' + value);
        }),
        fc.constantFrom(
          ...extractPhrases('functionschema-to-resolve-to-fulfill-2s2p'),
        ),
      ],
    },
    valid: {
      async: true,
      generators: [
        // Generate functions that resolve (valid for "to resolve")
        fc.func(fc.string()).map(
          (fn) =>
            async (..._args: unknown[]) =>
              fn(), // Always resolves
        ),
        fc.constantFrom(
          ...extractPhrases('functionschema-to-resolve-to-fulfill-2s2p'),
        ),
      ],
    },
  },

  'wrappedpromiselikeschema-to-fulfill-with-value-satisfying-to-resolve-with-value-satisfying-string-regexp-object-3s3p':
    {
      invalid: {
        async: true,
        generators: [
          // Generate promises that resolve to incorrect values
          fc
            .object()
            .filter((v) => !('baz' in v) || v.baz !== 'quux')
            .map((val) => Promise.resolve(val)),
          fc.constantFrom(
            ...extractPhrases(
              'wrappedpromiselikeschema-to-fulfill-with-value-satisfying-to-resolve-with-value-satisfying-string-regexp-object-3s3p',
            ),
          ),
          fc.constant({ baz: 'quux' }), // Expected value matches actual exactly
        ],
      },
      valid: {
        async: true,
        generators: [
          // Generate promises that resolve to correct values
          fc.constant(Promise.resolve({ baz: 'quux', foo: 'bar' })),
          fc.constantFrom(
            ...extractPhrases(
              'wrappedpromiselikeschema-to-fulfill-with-value-satisfying-to-resolve-with-value-satisfying-string-regexp-object-3s3p',
            ),
          ),
          fc.constant({ baz: 'quux' }), // Expected value matches actual exactly
        ],
      },
    },

  // Test promises that reject (to reject)
  'wrappedpromiselikeschema-to-reject-2s2p': {
    invalid: {
      async: true,
      generators: [
        fc.anything().map((val) => Promise.resolve(val)),
        fc.constantFrom(
          ...extractPhrases('wrappedpromiselikeschema-to-reject-2s2p'),
        ),
      ],
    },
    valid: {
      async: true,
      generators: [
        fc
          .string()
          .map((msg) => Promise.reject(new Error(msg || 'test error'))),
        fc.constantFrom(
          ...extractPhrases('wrappedpromiselikeschema-to-reject-2s2p'),
        ),
      ],
    },
  },

  // Test promises rejecting with specific error class
  'wrappedpromiselikeschema-to-reject-with-a-to-reject-with-an-classschema-3s3p':
    {
      invalid: {
        async: true,
        generators: [
          fc.string().map((msg) => Promise.reject(new TypeError(msg))),
          fc.constantFrom(
            ...extractPhrases(
              'wrappedpromiselikeschema-to-reject-with-a-to-reject-with-an-classschema-3s3p',
            ),
          ),
          fc.constant(RangeError), // Promise rejects with TypeError, not RangeError
        ],
      },
      valid: {
        async: true,
        generators: [
          fc.string().map((msg) => Promise.reject(new TypeError(msg))),
          fc.constantFrom(
            ...extractPhrases(
              'wrappedpromiselikeschema-to-reject-with-a-to-reject-with-an-classschema-3s3p',
            ),
          ),
          fc.constant(TypeError), // Promise rejects with TypeError, expecting TypeError
        ],
      },
    },

  // Test promises rejecting with string patterns
  'wrappedpromiselikeschema-to-reject-with-error-satisfying-string-regexp-object-3s3p':
    {
      invalid: {
        async: true,
        generators: [
          fc
            .string()
            .filter((s) => s !== 'expected message')
            .map((msg) => {
              // Create a thenable that defers promise creation to avoid unhandled rejections
              return {
                then: (onfulfilled?: () => void, onrejected?: () => void) =>
                  Promise.reject(new Error(msg)).then(onfulfilled, onrejected),
              };
            }),
          fc.constantFrom(
            ...extractPhrases(
              'wrappedpromiselikeschema-to-reject-with-error-satisfying-string-regexp-object-3s3p',
            ),
          ),
          fc.constant('expected message'), // Error message doesn't match
        ],
      },
      valid: {
        async: true,
        generators: [
          // Create a thenable that defers promise creation to avoid unhandled rejections
          fc.constant({
            then: (onfulfilled?: () => void, onrejected?: () => void) =>
              Promise.reject(new Error('expected message')).then(
                onfulfilled,
                onrejected,
              ),
          }),
          fc.constantFrom(
            ...extractPhrases(
              'wrappedpromiselikeschema-to-reject-with-error-satisfying-string-regexp-object-3s3p',
            ),
          ),
          fc.constant('expected message'), // Error message matches exactly
        ],
      },
    },

  // Test promises that resolve (to resolve/to fulfill)
  'wrappedpromiselikeschema-to-resolve-to-fulfill-2s2p': {
    invalid: {
      async: true,
      generators: [
        fc
          .string()
          .map((msg) => Promise.reject(new Error(msg || 'test error'))),
        fc.constantFrom(
          ...extractPhrases(
            'wrappedpromiselikeschema-to-resolve-to-fulfill-2s2p',
          ),
        ),
      ],
    },
    valid: {
      async: true,
      generators: [
        fc.anything().map((val) => Promise.resolve(val)),
        fc.constantFrom(
          ...extractPhrases(
            'wrappedpromiselikeschema-to-resolve-to-fulfill-2s2p',
          ),
        ),
      ],
    },
  },
} as const satisfies Record<string, PropertyTestConfig>;

describe('Property-based tests for async assertions', () => {
  assertExhaustiveTestConfig('promise', assertions, testConfigs);

  runPropertyTests(testConfigs, assertions, testConfigDefaults);
});
