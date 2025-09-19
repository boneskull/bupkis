import fc from 'fast-check';
import { describe } from 'node:test';

import * as assertions from '../../src/assertion/impl/sync-collection.js';
import { SyncCollectionAssertions } from '../../src/assertion/index.js';
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
const testConfigDefaults = {} satisfies PropertyTestConfigParameters;

/**
 * Helper generators for collection testing
 */
const helperGenerators = {
  primitive: fc.oneof(
    fc.string(),
    fc.integer(),
    fc.boolean(),
    fc.constant(null),
    fc.constant(undefined),
    fc.bigInt(),
    fc.string().map(Symbol),
  ),
};

/**
 * Test configurations for each collection assertion.
 */
const testConfigs = new Map<
  AnyAssertion,
  PropertyTestConfig | PropertyTestConfig[]
>([
  [
    assertions.arrayContainsAssertion,
    {
      invalid: {
        generators: [
          fc.array(fc.string()),
          fc.constantFrom(...extractPhrases(assertions.arrayContainsAssertion)),
          fc.integer(),
        ],
      },
      valid: {
        generators: [
          fc.constant([42, 'test', true]),
          fc.constantFrom(...extractPhrases(assertions.arrayContainsAssertion)),
          fc.constantFrom(42, 'test', true),
        ],
      },
    },
  ],

  [
    assertions.arrayLengthAssertion,
    {
      invalid: {
        generators: [
          fc.array(fc.anything(), { maxLength: 9, minLength: 1 }),
          fc.constantFrom(...extractPhrases(assertions.arrayLengthAssertion)),
          fc.integer({ max: 100, min: 10 }),
        ],
      },
      valid: {
        generators: [
          fc.constant([1, 2, 3]),
          fc.constantFrom(...extractPhrases(assertions.arrayLengthAssertion)),
          fc.constant(3),
        ],
      },
    },
  ],

  [
    assertions.arraySizeAssertion,
    {
      invalid: {
        generators: [
          fc.array(fc.anything(), { maxLength: 100, minLength: 11 }),
          fc.constantFrom(...extractPhrases(assertions.arraySizeAssertion)),
          fc.integer({ max: 10, min: 1 }),
        ],
      },
      valid: {
        generators: [
          fc.array(fc.anything(), { maxLength: 2, minLength: 2 }),
          fc.constantFrom(...extractPhrases(assertions.arraySizeAssertion)),
          fc.constant(2),
        ],
      },
    },
  ],

  [
    assertions.collectionSizeBetweenAssertion,
    [
      {
        invalid: {
          generators: [
            fc.constant(new Map([['a', 1]])), // size 1, outside range [2,4]
            fc.constantFrom(
              ...extractPhrases(assertions.collectionSizeBetweenAssertion),
            ),
            fc.constant([2, 4]),
          ],
        },
        valid: {
          generators: [
            fc.constant(
              new Map([
                ['a', 1],
                ['b', 2],
                ['c', 3],
              ]),
            ), // size 3, within range [2,4]
            fc.constantFrom(
              ...extractPhrases(assertions.collectionSizeBetweenAssertion),
            ),
            fc.constant([2, 4]),
          ],
        },
      },
      {
        invalid: {
          generators: [
            fc.constant(new Set([1])), // size 1, outside range [2,4]
            fc.constantFrom(
              ...extractPhrases(assertions.collectionSizeBetweenAssertion),
            ),
            fc.constant([2, 4]),
          ],
        },
        valid: {
          generators: [
            fc.constant(new Set([1, 2, 3])), // size 3, within range [2,4]
            fc.constantFrom(
              ...extractPhrases(assertions.collectionSizeBetweenAssertion),
            ),
            fc.constant([2, 4]),
          ],
        },
      },
    ],
  ],

  // Size comparison assertions
  [
    assertions.collectionSizeGreaterThanAssertion,
    [
      {
        invalid: {
          generators: [
            fc.constant(
              new Map([
                ['a', 1],
                ['b', 2],
              ]),
            ), // size 2
            fc.constantFrom(
              ...extractPhrases(assertions.collectionSizeGreaterThanAssertion),
            ),
            fc.integer({ min: 2 }), // 2 or greater
          ],
        },
        valid: {
          generators: [
            fc.constant(
              new Map([
                ['a', 1],
                ['b', 2],
                ['c', 3],
              ]),
            ), // size 3
            fc.constantFrom(
              ...extractPhrases(assertions.collectionSizeGreaterThanAssertion),
            ),
            fc.integer({ max: 2 }), // less than 3
          ],
        },
      },
      {
        invalid: {
          generators: [
            fc.constant(new Set([1, 2])), // size 2
            fc.constantFrom(
              ...extractPhrases(assertions.collectionSizeGreaterThanAssertion),
            ),
            fc.integer({ min: 2 }), // 2 or greater
          ],
        },
        valid: {
          generators: [
            fc.constant(new Set([1, 2, 3])), // size 3
            fc.constantFrom(
              ...extractPhrases(assertions.collectionSizeGreaterThanAssertion),
            ),
            fc.integer({ max: 2 }), // less than 3
          ],
        },
      },
    ],
  ],
  [
    assertions.collectionSizeLessThanAssertion,
    {
      invalid: {
        generators: [
          fc.oneof(
            fc
              .dictionary(fc.string(), fc.anything(), {
                maxKeys: 10,
                minKeys: 4,
              })
              .map((obj) => new Map(Object.entries(obj))),
            fc
              .array(fc.anything(), { maxLength: 10, minLength: 4 })
              .map((arr) => new Set(arr)),
          ),
          fc.constantFrom(
            ...extractPhrases(assertions.collectionSizeLessThanAssertion),
          ),
          fc.integer({ max: 3, min: 1 }),
        ],
      },
      valid: {
        generators: [
          fc.oneof(
            fc
              .dictionary(fc.string(), fc.anything(), {
                maxKeys: 2,
                minKeys: 2,
              })
              .map((obj) => new Map(Object.entries(obj))),
            fc
              .array(fc.anything(), { maxLength: 2, minLength: 2 })
              .map((arr) => new Set(arr)),
          ),
          fc.constantFrom(
            ...extractPhrases(assertions.collectionSizeLessThanAssertion),
          ),
          fc.integer({ max: 10, min: 3 }),
        ],
      },
    },
  ],
  [
    assertions.emptyMapAssertion,
    {
      invalid: {
        generators: [
          fc
            .dictionary(fc.string(), fc.anything(), { minKeys: 1 })
            .map((obj) => new Map(Object.entries(obj))),
          fc.constantFrom(...extractPhrases(assertions.emptyMapAssertion)),
        ],
      },
      valid: {
        generators: [
          fc.constant(new Map()),
          fc.constantFrom(...extractPhrases(assertions.emptyMapAssertion)),
        ],
      },
    },
  ],

  [
    assertions.emptySetAssertion,
    {
      invalid: {
        generators: [
          fc.array(fc.anything(), { minLength: 1 }).map((arr) => new Set(arr)),
          fc.constantFrom(...extractPhrases(assertions.emptySetAssertion)),
        ],
      },
      valid: {
        generators: [
          fc.constant(new Set()),
          fc.constantFrom(...extractPhrases(assertions.emptySetAssertion)),
        ],
      },
    },
  ],

  [
    assertions.mapContainsAssertion,
    [
      {
        invalid: {
          generators: [
            fc.constant(new Map([['existing', 'value']])),
            fc.constantFrom(...extractPhrases(assertions.mapContainsAssertion)),
            fc.constant('missing'),
          ],
        },
        valid: {
          generators: [
            fc.constant(
              new Map([
                ['key1', 'value1'],
                ['key2', 'value2'],
              ]),
            ),
            fc.constantFrom(...extractPhrases(assertions.mapContainsAssertion)),
            fc.constantFrom('key1', 'key2'),
          ],
        },
      },
      {
        invalid: {
          generators: [
            fc.constant(SharedWeakMapState.getWeakMap()),
            fc.constantFrom(...extractPhrases(assertions.mapContainsAssertion)),
            helperGenerators.primitive,
          ],
        },
        valid: {
          generators: [
            fc.constant(SharedWeakMapState.getWeakMap()),
            fc.constantFrom(...extractPhrases(assertions.mapContainsAssertion)),
            fc.constant(SharedWeakMapState.getKey()),
          ],
        },
      },
      {
        invalid: {
          generators: [
            fc.constant(SharedWeakMapState.getWeakMap()),
            fc.constantFrom(...extractPhrases(assertions.mapContainsAssertion)),
            fc.constant({}),
          ],
        },
        valid: {
          generators: [
            fc.constant(SharedWeakMapState.getWeakMap()),
            fc.constantFrom(...extractPhrases(assertions.mapContainsAssertion)),
            fc.constant(SharedWeakMapState.getKey()),
          ],
        },
      },
    ],
  ],

  [
    assertions.mapEntryAssertion,
    [
      {
        invalid: {
          generators: [
            fc.constant(
              new Map([
                ['key1', 'value1'],
                ['key2', 'value2'],
              ]),
            ),
            fc.constantFrom(...extractPhrases(assertions.mapEntryAssertion)),
            fc.constant(['missing-key', 'missing-value']),
          ],
        },
        valid: {
          generators: [
            fc.constant(
              new Map([
                ['key1', 'value1'],
                ['key2', 'value2'],
              ]),
            ),
            fc.constantFrom(...extractPhrases(assertions.mapEntryAssertion)),
            fc.constantFrom(['key1', 'value1'], ['key2', 'value2']),
          ],
        },
      },
      {
        invalid: {
          generators: [
            fc.constant(SharedWeakMapState.getWeakMap()),
            fc.constantFrom(...extractPhrases(assertions.mapEntryAssertion)),
            fc.constant([{}, 'wrong-value']),
          ],
        },
        valid: {
          generators: [
            fc.constant(SharedWeakMapState.getWeakMap()),
            fc.constantFrom(...extractPhrases(assertions.mapEntryAssertion)),
            fc.constant([SharedWeakMapState.getKey(), 'value']),
          ],
        },
      },
    ],
  ],

  [
    assertions.mapEqualityAssertion,
    {
      invalid: {
        generators: [
          fc.constant(
            new Map([
              ['a', 1],
              ['b', 2],
            ]),
          ),
          fc.constantFrom(...extractPhrases(assertions.mapEqualityAssertion)),
          fc.constant(
            new Map([
              ['a', 1],
              ['b', 3],
            ]),
          ),
        ],
      },
      valid: {
        generators: [
          fc.constant(
            new Map([
              ['a', 1],
              ['b', 2],
            ]),
          ),
          fc.constantFrom(...extractPhrases(assertions.mapEqualityAssertion)),
          fc.constant(
            new Map([
              ['a', 1],
              ['b', 2],
            ]),
          ), // Order doesn't matter
        ],
      },
    },
  ],

  // Map assertions
  [
    assertions.mapKeyAssertion,
    {
      invalid: {
        generators: [
          fc.constant(
            new Map([
              ['key1', 'value1'],
              ['key2', 'value2'],
            ]),
          ),
          fc.constantFrom(...extractPhrases(assertions.mapKeyAssertion)),
          fc.constant('missing-key'),
        ],
      },
      valid: {
        generators: [
          fc.constant(
            new Map([
              ['key1', 'value1'],
              ['key2', 'value2'],
            ]),
          ),
          fc.constantFrom(...extractPhrases(assertions.mapKeyAssertion)),
          fc.constantFrom('key1', 'key2'),
        ],
      },
    },
  ],

  [
    assertions.mapSizeAssertion,
    {
      invalid: {
        generators: [
          fc
            .dictionary(fc.string(), fc.anything(), { maxKeys: 10, minKeys: 1 })
            .map((obj) => new Map(Object.entries(obj))),
          fc.constantFrom(...extractPhrases(assertions.mapSizeAssertion)),
          fc.integer({ max: 100, min: 11 }),
        ],
      },
      valid: {
        generators: [
          fc.constant(
            new Map([
              ['a', 1],
              ['b', 2],
            ]),
          ),
          fc.constantFrom(...extractPhrases(assertions.mapSizeAssertion)),
          fc.constant(2),
        ],
      },
    },
  ],

  [
    assertions.mapValueAssertion,
    {
      invalid: {
        generators: [
          fc.constant(
            new Map([
              ['key1', 'value1'],
              ['key2', 'value2'],
            ]),
          ),
          fc.constantFrom(...extractPhrases(assertions.mapValueAssertion)),
          fc.constant('missing-value'),
        ],
      },
      valid: {
        generators: [
          fc.constant(
            new Map([
              ['key1', 'value1'],
              ['key2', 'value2'],
            ]),
          ),
          fc.constantFrom(...extractPhrases(assertions.mapValueAssertion)),
          fc.constantFrom('value1', 'value2'),
        ],
      },
    },
  ],

  [
    assertions.nonEmptyArrayAssertion,
    {
      invalid: {
        generators: [
          fc.constant([]),
          fc.constantFrom(...extractPhrases(assertions.nonEmptyArrayAssertion)),
        ],
      },
      valid: {
        generators: [
          fc.array(fc.anything(), { minLength: 1 }),
          fc.constantFrom(...extractPhrases(assertions.nonEmptyArrayAssertion)),
        ],
      },
    },
  ],

  [
    assertions.objectExactKeyAssertion,
    {
      invalid: {
        generators: [
          fc.constant({
            'key.with.dots': 'direct property',
            'key[with]brackets': 'another direct property',
            simple: 'value',
          }),
          fc.constantFrom(
            ...extractPhrases(assertions.objectExactKeyAssertion),
          ),
          fc.constantFrom('missing', 'nested.path', 'nonexistent'),
        ],
      },
      valid: {
        generators: [
          fc.constant({
            'key.with.dots': 'direct property',
            'key[with]brackets': 'another direct property',
            simple: 'value',
          }),
          fc.constantFrom(
            ...extractPhrases(assertions.objectExactKeyAssertion),
          ),
          fc.constantFrom('key.with.dots', 'key[with]brackets', 'simple'),
        ],
      },
    },
  ],

  [
    assertions.objectKeyAssertion,
    {
      invalid: {
        generators: [
          fc.constant({
            foo: { bar: [{ baz: 'value' }] },
            items: [{ id: 1, name: 'first' }],
            'kebab-case': 'works',
          }),
          fc.constantFrom(...extractPhrases(assertions.objectKeyAssertion)),
          fc.constantFrom(
            'foo.missing',
            'items[5].name',
            'missing[0]',
            'nonexistent.path',
          ),
        ],
      },
      valid: {
        generators: [
          fc.constant({
            foo: { bar: [{ baz: 'value' }] },
            items: [{ id: 1, name: 'first' }],
            'kebab-case': 'works',
          }),
          fc.constantFrom(...extractPhrases(assertions.objectKeyAssertion)),
          fc.constantFrom(
            'foo.bar',
            'foo.bar[0].baz',
            'items[0].id',
            'items[0].name',
            'kebab-case',
          ),
        ],
      },
    },
  ],

  [
    assertions.objectKeysAssertion,
    {
      invalid: {
        examples: [
          [{ a: 1, b: 2, c: 3 }, 'to have keys', ['']],
          [{ a: 1, b: 2, c: 3 }, 'to have keys', ['valueOf']],
        ],
        generators: [
          fc.constant({ a: 1, b: 2, c: 3 }),
          fc.constantFrom(...extractPhrases(assertions.objectKeysAssertion)),
          fc.array(
            fc.string().filter((s) => !['a', 'b', 'c'].includes(s)),
            { minLength: 1 },
          ),
        ],
        numRuns: process.env.WALLABY ? 10 : process.env.CI ? 100 : 1000,
      },
      valid: {
        examples: [
          [{ '': 1 }, 'to have keys', ['']],
          [{ foo: undefined }, 'to have keys', ['foo']],
        ],
        generators: [
          fc.constant({ a: 1, b: 2, c: 3 }),
          fc.constantFrom(...extractPhrases(assertions.objectKeysAssertion)),
          fc.array(fc.constantFrom('a', 'b', 'c'), { minLength: 1 }),
        ],
      },
    },
  ],

  [
    assertions.objectSizeAssertion,
    {
      invalid: {
        generators: [
          fc.constant({ a: 1, b: 2, c: 3 }),
          fc.constantFrom(...extractPhrases(assertions.objectSizeAssertion)),
          fc.integer({ min: 0 }).filter((n) => n !== 3),
        ],
      },
      valid: {
        generators: [
          fc.constant({ a: 1, b: 2, c: 3 }),
          fc.constantFrom(...extractPhrases(assertions.objectSizeAssertion)),
          fc.constant(3),
        ],
      },
    },
  ],

  [
    assertions.setContainsAssertion,
    [
      {
        invalid: {
          generators: [
            fc.constant(new Set(['existing'])),
            fc.constantFrom(...extractPhrases(assertions.setContainsAssertion)),
            fc.constant('missing'),
          ],
        },
        valid: {
          generators: [
            fc.constant(new Set(['val1', 'val2'])),
            fc.constantFrom(...extractPhrases(assertions.setContainsAssertion)),
            fc.constantFrom('val1', 'val2'),
          ],
        },
      },
      {
        invalid: {
          generators: [
            fc.constant(new WeakSet()),
            fc.constantFrom(...extractPhrases(assertions.setContainsAssertion)),
            helperGenerators.primitive,
          ],
        },
        valid: {
          generators: [
            fc.constant(SharedWeakSetState.getWeakSet()),
            fc.constantFrom(...extractPhrases(assertions.setContainsAssertion)),
            fc.constant(SharedWeakSetState.getValue()),
          ],
        },
      },
    ],
  ],

  [
    assertions.setDifferenceEqualityAssertion,
    {
      invalid: {
        generators: [
          fc.constant(new Set([1, 2, 3])),
          fc.constant('to have difference'),
          fc.constant(new Set([2, 3, 4])),
          fc.constant('equal to'),
          fc.constant(new Set([2, 3])), // Wrong result
        ],
      },
      valid: {
        generators: [
          fc.constant(new Set([1, 2, 3])),
          fc.constant('to have difference'),
          fc.constant(new Set([2, 3, 4])),
          fc.constant('equal to'),
          fc.constant(new Set([1])), // Correct difference
        ],
      },
    },
  ],

  [
    assertions.setDisjointAssertion,
    {
      invalid: {
        generators: [
          fc.constant(new Set([1, 2, 3])),
          fc.constantFrom(...extractPhrases(assertions.setDisjointAssertion)),
          fc.constant(new Set([2, 3, 4])),
        ],
      },
      valid: {
        generators: [
          fc.constant(new Set([1, 2])),
          fc.constantFrom(...extractPhrases(assertions.setDisjointAssertion)),
          fc.constant(new Set([3, 4])),
        ],
      },
    },
  ],

  [
    assertions.setEqualityAssertion,
    {
      invalid: {
        generators: [
          fc.constant(new Set([1, 2, 3])),
          fc.constantFrom(...extractPhrases(assertions.setEqualityAssertion)),
          fc.constant(new Set([1, 2, 4])),
        ],
      },
      valid: {
        generators: [
          fc.constant(new Set([1, 2, 3])),
          fc.constantFrom(...extractPhrases(assertions.setEqualityAssertion)),
          fc.constant(new Set([1, 2, 3])), // Same elements
        ],
      },
    },
  ],

  [
    assertions.setIntersectionAssertion,
    {
      invalid: {
        generators: [
          fc.constant(new Set([1, 2])),
          fc.constantFrom(
            ...extractPhrases(assertions.setIntersectionAssertion),
          ),
          fc.constant(new Set([3, 4])),
        ],
      },
      valid: {
        generators: [
          fc.constant(new Set([1, 2, 3])),
          fc.constantFrom(
            ...extractPhrases(assertions.setIntersectionAssertion),
          ),
          fc.constant(new Set([2, 3, 4])),
        ],
      },
    },
  ],

  [
    assertions.setIntersectionEqualityAssertion,
    {
      invalid: {
        generators: [
          fc.constant(new Set([1, 2, 3])),
          fc.constant('to have intersection'),
          fc.constant(new Set([2, 3, 4])),
          fc.constant('equal to'),
          fc.constant(new Set([1, 4])), // Wrong result
        ],
      },
      valid: {
        generators: [
          fc.constant(new Set([1, 2, 3])),
          fc.constant('to have intersection'),
          fc.constant(new Set([2, 3, 4])),
          fc.constant('equal to'),
          fc.constant(new Set([2, 3])), // Correct intersection
        ],
      },
    },
  ],

  [
    assertions.setSizeAssertion,
    {
      invalid: {
        generators: [
          fc
            .array(fc.anything(), { maxLength: 3, minLength: 3 })
            .map((arr) => new Set(arr))
            .filter(({ size }) => size !== 3), // deduping can shrink it
          fc.constantFrom(...extractPhrases(assertions.setSizeAssertion)),
          fc.constant(3),
        ],
      },
      valid: {
        generators: [
          fc
            .array(fc.anything(), { maxLength: 3, minLength: 3 })
            .map((arr) => new Set(arr))
            .filter(({ size }) => size === 3), // deduping can shrink it
          fc.constantFrom(...extractPhrases(assertions.setSizeAssertion)),
          fc.constant(3),
        ],
      },
    },
  ],

  [
    assertions.setSubsetAssertion,
    {
      invalid: {
        generators: [
          fc.constant(new Set([1, 2, 3, 4])),
          fc.constantFrom(...extractPhrases(assertions.setSubsetAssertion)),
          fc.constant(new Set([1, 2])),
        ],
      },
      valid: {
        generators: [
          fc.constant(new Set([1, 2])),
          fc.constantFrom(...extractPhrases(assertions.setSubsetAssertion)),
          fc.constant(new Set([1, 2, 3])),
        ],
      },
    },
  ],

  [
    assertions.setSupersetAssertion,
    {
      invalid: {
        generators: [
          fc.constant(new Set([1, 2])),
          fc.constantFrom(...extractPhrases(assertions.setSupersetAssertion)),
          fc.constant(new Set([1, 2, 3])),
        ],
      },
      valid: {
        generators: [
          fc.constant(new Set([1, 2, 3, 4])),
          fc.constantFrom(...extractPhrases(assertions.setSupersetAssertion)),
          fc.constant(new Set([1, 2])),
        ],
      },
    },
  ],

  [
    assertions.setSymmetricDifferenceEqualityAssertion,
    {
      invalid: {
        generators: [
          fc.constant(new Set([1, 2, 3])),
          fc.constant('to have symmetric difference'),
          fc.constant(new Set([2, 3, 4])),
          fc.constant('equal to'),
          fc.constant(new Set([2, 3])), // Wrong result
        ],
      },
      valid: {
        generators: [
          fc.constant(new Set([1, 2, 3])),
          fc.constant('to have symmetric difference'),
          fc.constant(new Set([2, 3, 4])),
          fc.constant('equal to'),
          fc.constant(new Set([1, 4])), // Correct symmetric difference
        ],
      },
    },
  ],

  [
    assertions.setUnionEqualityAssertion,
    {
      invalid: {
        generators: [
          fc.constant(new Set([1, 2])),
          fc.constant('to have union'),
          fc.constant(new Set([3, 4])),
          fc.constant('equal to'),
          fc.constant(new Set([1, 2, 3])), // Wrong result
        ],
      },
      valid: {
        generators: [
          fc.constant(new Set([1, 2])),
          fc.constant('to have union'),
          fc.constant(new Set([3, 4])),
          fc.constant('equal to'),
          fc.constant(new Set([1, 2, 3, 4])), // Correct union
        ],
      },
    },
  ],
]);

describe('Property-Based Tests for Collection Assertions', () => {
  assertExhaustiveTestConfigs(
    'Collection Assertions',
    SyncCollectionAssertions,
    testConfigs,
  );
  runPropertyTests(testConfigs, testConfigDefaults);
});
