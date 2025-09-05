import fc from 'fast-check';
import { describe } from 'node:test';

import { CollectionAssertions } from '../../src/assertion/impl/sync-collection.js';
import { keyBy } from '../../src/util.js';
import {
  type PropertyTestConfig,
  type PropertyTestConfigParameters,
} from './config.js';
import { extractPhrases } from './property-test-util.js';
import {
  assertExhaustiveTestConfig,
  runPropertyTests,
} from './property-test.macro.js';

const assertions = keyBy(CollectionAssertions, 'id');

/**
 * Shared state for WeakMap/WeakSet testing
 */
class SharedWeakMapState {
  private static key = {};

  private static weakMap = new WeakMap();

  static {
    SharedWeakMapState.weakMap.set(SharedWeakMapState.key, 'value');
  }

  static getKey(): object {
    return SharedWeakMapState.key;
  }

  static getWeakMap(): WeakMap<object, any> {
    return SharedWeakMapState.weakMap;
  }
}

class SharedWeakSetState {
  private static value = {};

  private static weakSet = new WeakSet();

  static {
    SharedWeakSetState.weakSet.add(SharedWeakSetState.value);
  }

  static getValue(): object {
    return SharedWeakSetState.value;
  }

  static getWeakSet(): WeakSet<object> {
    return SharedWeakSetState.weakSet;
  }
}

/**
 * Test config defaults
 */
const testConfigDefaults = {
  numRuns: 200,
} as const satisfies PropertyTestConfigParameters;

/**
 * Helper generators for collection testing
 */
const helperGenerators = {
  nonObjectValue: fc.oneof(
    fc.string(),
    fc.integer(),
    fc.boolean(),
    fc.constant(null),
    fc.constant(undefined),
    fc.bigInt(),
    fc.string().map(Symbol),
  ),
} as const;

/**
 * Test configurations for each collection assertion.
 */
const testConfigs = {
  // Array contains/includes value
  'array-to-contain-to-include-any-3s3p': {
    invalid: {
      generators: [
        fc.array(fc.string()),
        fc.constantFrom(
          ...extractPhrases(
            assertions['array-to-contain-to-include-any-3s3p']!,
          ),
        ),
        fc.integer(), // Looking for integer in string array
      ] as const,
    },
    valid: {
      generators: [
        fc.constant([42, 'test', true]), // Fixed array with known contents
        fc.constantFrom(
          ...extractPhrases(
            assertions['array-to-contain-to-include-any-3s3p']!,
          ),
        ),
        fc.constantFrom(42, 'test', true), // One of the values in the array
      ] as const,
    },
  },

  // Array length/size assertions
  'array-to-have-length-number-3s3p': {
    invalid: {
      generators: [
        fc.array(fc.anything()),
        fc.constantFrom(
          ...extractPhrases(assertions['array-to-have-length-number-3s3p']!),
        ),
        fc.integer().filter((n) => n < 0 || n > 100), // Unlikely lengths
      ] as const,
    },
    valid: {
      generators: [
        fc.constant([1, 2, 3]), // Fixed array with length 3
        fc.constantFrom(
          ...extractPhrases(assertions['array-to-have-length-number-3s3p']!),
        ),
        fc.constant(3), // Matching length
      ] as const,
    },
  },

  // Array has size
  'array-to-have-size-number-3s3p': {
    invalid: {
      generators: [
        fc.array(fc.anything()),
        fc.constantFrom(
          ...extractPhrases(assertions['array-to-have-size-number-3s3p']!),
        ),
        fc.integer().filter((n) => n < 0 || n > 100), // Unlikely sizes
      ] as const,
    },
    valid: {
      generators: [
        fc.constant(['a', 'b']), // Fixed array with size 2
        fc.constantFrom(
          ...extractPhrases(assertions['array-to-have-size-number-3s3p']!),
        ),
        fc.constant(2), // Matching size
      ] as const,
    },
  },

  // Map contains/includes key
  'mapany-any-to-contain-to-include-any-3s3p': {
    invalid: {
      generators: [
        fc.constant(new Map([['existing', 'value']])),
        fc.constantFrom(
          ...extractPhrases(
            assertions['mapany-any-to-contain-to-include-any-3s3p']!,
          ),
        ),
        fc.constant('missing'), // Key that doesn't exist
      ] as const,
    },
    valid: {
      generators: [
        fc.constant(
          new Map([
            ['key1', 'value1'],
            ['key2', 'value2'],
          ]),
        ), // Fixed map with known keys
        fc.constantFrom(
          ...extractPhrases(
            assertions['mapany-any-to-contain-to-include-any-3s3p']!,
          ),
        ),
        fc.constantFrom('key1', 'key2'), // One of the keys in the map
      ] as const,
    },
  },

  // Set contains/includes value
  'setany-to-contain-to-include-any-3s3p': {
    invalid: {
      generators: [
        fc.constant(new Set(['existing'])),
        fc.constantFrom(
          ...extractPhrases(
            assertions['setany-to-contain-to-include-any-3s3p']!,
          ),
        ),
        fc.constant('missing'), // Value that doesn't exist
      ] as const,
    },
    valid: {
      generators: [
        fc.constant(new Set([42, 'value1', 'value2'])), // Fixed set with known values
        fc.constantFrom(
          ...extractPhrases(
            assertions['setany-to-contain-to-include-any-3s3p']!,
          ),
        ),
        fc.constantFrom(42, 'value1', 'value2'), // One of the values in the set
      ] as const,
    },
  },

  // Map is empty
  'strongmapschema-to-be-empty-2s2p': {
    invalid: {
      generators: [
        fc
          .dictionary(fc.string(), fc.anything(), { minKeys: 1 })
          .map((obj) => new Map(Object.entries(obj))),
        fc.constantFrom(
          ...extractPhrases(assertions['strongmapschema-to-be-empty-2s2p']!),
        ),
      ] as const,
    },
    valid: {
      generators: [
        fc.constant(new Map()),
        fc.constantFrom(
          ...extractPhrases(assertions['strongmapschema-to-be-empty-2s2p']!),
        ),
      ] as const,
    },
  },

  // Map has size
  'strongmapschema-to-have-size-number-3s3p': {
    invalid: {
      generators: [
        fc.integer({ max: 10, min: 0 }).map((size) => {
          const map = new Map();
          for (let i = 0; i < size; i++) {
            map.set(`key${i}`, `value${i}`);
          }
          return map;
        }),
        fc.constantFrom(
          ...extractPhrases(
            assertions['strongmapschema-to-have-size-number-3s3p']!,
          ),
        ),
        fc.integer({ max: 100, min: 11 }), // Different size than the map
      ] as const,
    },
    valid: {
      generators: [
        fc.constant(
          new Map([
            ['a', 1],
            ['b', 2],
          ]),
        ), // Fixed map with size 2
        fc.constantFrom(
          ...extractPhrases(
            assertions['strongmapschema-to-have-size-number-3s3p']!,
          ),
        ),
        fc.constant(2), // Matching size
      ] as const,
    },
  },

  // Set is empty
  'strongsetschema-to-be-empty-2s2p': {
    invalid: {
      generators: [
        fc.array(fc.anything(), { minLength: 1 }).map((arr) => new Set(arr)),
        fc.constantFrom(
          ...extractPhrases(assertions['strongsetschema-to-be-empty-2s2p']!),
        ),
      ] as const,
    },
    valid: {
      generators: [
        fc.constant(new Set()),
        fc.constantFrom(
          ...extractPhrases(assertions['strongsetschema-to-be-empty-2s2p']!),
        ),
      ] as const,
    },
  },

  // Set has size
  'strongsetschema-to-have-size-number-3s3p': {
    invalid: {
      generators: [
        fc.integer({ max: 10, min: 0 }).map((size) => {
          const set = new Set();
          for (let i = 0; i < size; i++) {
            set.add(`value${i}`);
          }
          return set;
        }),
        fc.constantFrom(
          ...extractPhrases(
            assertions['strongsetschema-to-have-size-number-3s3p']!,
          ),
        ),
        fc.integer({ max: 100, min: 11 }), // Different size than the set
      ] as const,
    },
    valid: {
      generators: [
        fc.constant(new Set(['a', 'b', 'c'])), // Fixed set with size 3
        fc.constantFrom(
          ...extractPhrases(
            assertions['strongsetschema-to-have-size-number-3s3p']!,
          ),
        ),
        fc.constant(3), // Matching size
      ] as const,
    },
  },

  // WeakMap contains/includes key
  'weakmap-to-contain-to-include-any-3s3p': {
    invalid: {
      generators: [
        fc.constant(new WeakMap()),
        fc.constantFrom(
          ...extractPhrases(
            assertions['weakmap-to-contain-to-include-any-3s3p']!,
          ),
        ),
        helperGenerators.nonObjectValue, // WeakMap only accepts objects as keys
      ] as const,
    },
    valid: {
      generators: [
        fc.constant(SharedWeakMapState.getWeakMap()),
        fc.constantFrom(
          ...extractPhrases(
            assertions['weakmap-to-contain-to-include-any-3s3p']!,
          ),
        ),
        fc.constant(SharedWeakMapState.getKey()),
      ] as const,
    },
  },

  // WeakSet contains/includes value
  'weakset-to-contain-to-include-any-3s3p': {
    invalid: {
      generators: [
        fc.constant(new WeakSet()),
        fc.constantFrom(
          ...extractPhrases(
            assertions['weakset-to-contain-to-include-any-3s3p']!,
          ),
        ),
        helperGenerators.nonObjectValue, // WeakSet only accepts objects as values
      ] as const,
    },
    valid: {
      generators: [
        fc.constant(SharedWeakSetState.getWeakSet()),
        fc.constantFrom(
          ...extractPhrases(
            assertions['weakset-to-contain-to-include-any-3s3p']!,
          ),
        ),
        fc.constant(SharedWeakSetState.getValue()),
      ] as const,
    },
  },
} as const satisfies Record<string, PropertyTestConfig>;

describe('Property-Based Tests for Collection Assertions', () => {
  assertExhaustiveTestConfig(assertions, testConfigs);

  runPropertyTests(testConfigs, assertions, testConfigDefaults);
});
