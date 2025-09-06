import fc from 'fast-check';
import { describe } from 'node:test';

import { EsotericAssertions } from '../../src/assertion/impl/sync-esoteric.js';
import { keyBy } from '../../src/util.js';
import { type PropertyTestConfig } from './config.js';
import { extractPhrases } from './property-test-util.js';
import {
  assertExhaustiveTestConfig,
  runPropertyTests,
} from './property-test.macro.js';

const assertions = keyBy(EsotericAssertions, 'id');

/**
 * Test config defaults
 */
const testConfigDefaults: Omit<fc.Parameters<any>, 'examples'> = {} as const;

/**
 * Test configurations for each esoteric assertion.
 */
const testConfigs: Record<string, PropertyTestConfig> = {
  'string-number-symbol-to-be-an-enumerable-property-of-object-3s3p': {
    invalid: {
      generators: [
        fc.constant('a'),
        fc.constantFrom(
          ...extractPhrases(
            assertions[
              'string-number-symbol-to-be-an-enumerable-property-of-object-3s3p'
            ]!,
          ),
        ),
        fc.constant({}).map((obj) => {
          Object.defineProperty(obj, 'a', {
            enumerable: false, // non-enumerable property
            value: 42,
          });
          return obj;
        }),
      ],
    },
    valid: {
      generators: [
        fc.constant('a'),
        fc.constantFrom(
          ...extractPhrases(
            assertions[
              'string-number-symbol-to-be-an-enumerable-property-of-object-3s3p'
            ]!,
          ),
        ),
        fc.constant({}).map((obj) => {
          Object.defineProperty(obj, 'a', {
            enumerable: true, // enumerable property
            value: 42,
          });
          return obj;
        }),
      ],
      verbose: true,
    },
  },
  'unknown-to-be-extensible-2s1p': {
    invalid: {
      generators: [
        fc.oneof(
          fc.object().map((obj) => {
            Object.preventExtensions(obj);
            return obj;
          }),
        ),
        fc.constantFrom(
          ...extractPhrases(assertions['unknown-to-be-extensible-2s1p']!),
        ),
      ],
    },
    valid: {
      generators: [
        fc.object(), // regular objects are extensible
        fc.constantFrom(
          ...extractPhrases(assertions['unknown-to-be-extensible-2s1p']!),
        ),
      ],
    },
  },
  'unknown-to-be-frozen-2s1p': {
    invalid: {
      generators: [
        fc.object().filter((v) => !Object.isFrozen(v)), // non-frozen object
        fc.constantFrom(
          ...extractPhrases(assertions['unknown-to-be-frozen-2s1p']!),
        ),
      ],
    },
    valid: {
      generators: [
        fc.object().map((obj) => {
          Object.freeze(obj);
          return obj;
        }),
        fc.constantFrom(
          ...extractPhrases(assertions['unknown-to-be-frozen-2s1p']!),
        ),
      ],
    },
  },
  'unknown-to-be-sealed-2s1p': {
    invalid: {
      generators: [
        fc.oneof(
          fc.object().filter((v) => !Object.isSealed(v)), // non-sealed object
        ),
        fc.constantFrom(
          ...extractPhrases(assertions['unknown-to-be-sealed-2s1p']!),
        ),
      ],
    },
    valid: {
      generators: [
        fc.object().map((obj) => {
          Object.seal(obj);
          return obj;
        }),
        fc.constantFrom(
          ...extractPhrases(assertions['unknown-to-be-sealed-2s1p']!),
        ),
      ],
    },
  },
  'unknown-to-have-a-null-prototype-2s1p': {
    invalid: {
      generators: [
        fc
          .object({ withNullPrototype: true })
          .filter((v) => Object.getPrototypeOf(v) !== null), // non-null-prototype object
        fc.constantFrom(
          ...extractPhrases(
            assertions['unknown-to-have-a-null-prototype-2s1p']!,
          ),
        ),
      ],
    },
    valid: {
      generators: [
        fc.constant(Object.create(null)),
        fc.constantFrom(
          ...extractPhrases(
            assertions['unknown-to-have-a-null-prototype-2s1p']!,
          ),
        ),
      ],
    },
  },
};

describe('Property-Based Tests for Esoteric Assertions', () => {
  assertExhaustiveTestConfig(assertions, testConfigs);

  runPropertyTests(testConfigs, assertions, testConfigDefaults);
});
