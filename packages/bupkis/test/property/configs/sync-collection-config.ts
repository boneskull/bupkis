import {
  extractPhrases,
  filteredAnything,
  type PropertyTestConfig,
} from '@bupkis/property-testing';
import fc from 'fast-check';

import * as assertions from '../../../src/assertion/impl/sync-collection.js';
import { type AnyAssertion } from '../../../src/types.js';
import { SyncCollectionGenerators } from '../../../test-data/sync-collection-generators.js';

/**
 * Stable, strongly-held `WeakMap` fixture shared across property-test configs.
 *
 * `WeakMap` membership is determined purely by object-reference identity, and
 * its entries cannot be enumerated or regenerated. That makes it impossible to
 * write a _passing_ ("valid") assertion (e.g. `to contain` / `to have entry`)
 * by generating random keys — the assertion only succeeds when handed the exact
 * object identity that was stored as the key. This class constructs a single
 * `WeakMap` with one known entry and exposes both the map and its key so config
 * entries can reference the very same instances.
 *
 * It also exists to keep those property tests _deterministic_. `WeakMap` holds
 * its keys weakly, so without an external strong reference the garbage
 * collector could evict the entry mid-run, silently emptying the map and
 * causing otherwise-valid assertions to fail intermittently. Pinning the key in
 * a `static` field prevents that. Negative ("invalid") cases intentionally use
 * _different_ identities or primitives, guaranteeing the key is truly absent.
 */
class SharedWeakMapState {
  /**
   * The object used as the sole key in {@link SharedWeakMapState.weakMap}.
   *
   * Held in a static field so a strong reference survives the entire test run;
   * without it the GC could collect the key and silently empty the map, making
   * "valid" cases flaky.
   */
  private static key = {};

  /** The shared `WeakMap`, pre-populated with a single {@link key}/value entry. */
  private static weakMap = new WeakMap();

  static {
    // Populate once at module load so the known entry exists before any test runs.
    SharedWeakMapState.weakMap.set(SharedWeakMapState.key, 'value');
  }

  /**
   * Returns the exact key object stored in the shared `WeakMap`.
   *
   * Use in "valid" cases that must reference the precise identity present in
   * the map; a freshly generated object would never match.
   */
  static getKey(): object {
    return SharedWeakMapState.key;
  }

  /** Returns the shared `WeakMap` instance for use as an assertion subject. */
  static getWeakMap(): WeakMap<WeakKey, any> {
    return SharedWeakMapState.weakMap;
  }
}

/**
 * Stable, strongly-held `WeakSet` fixture shared across property-test configs.
 *
 * The `WeakSet` analogue of {@link SharedWeakMapState}. `WeakSet` membership is
 * by object-reference identity and its contents cannot be enumerated, so a
 * _passing_ ("valid") `to contain` assertion can only be written by handing the
 * assertion the exact object that was added. This class adds one known object
 * to a single `WeakSet` and exposes both so configs can reference them.
 *
 * Pinning the value in a `static` field keeps a strong reference alive for the
 * whole test run, preventing the garbage collector from evicting the member and
 * making valid cases flaky. Negative ("invalid") cases use _different_
 * identities or primitives so the value is reliably absent.
 */
class SharedWeakSetState {
  /**
   * The object stored in {@link SharedWeakSetState.weakSet}.
   *
   * Held in a static field so a strong reference survives the entire test run;
   * otherwise the GC could collect it and silently empty the set.
   */
  private static value = {};

  /** The shared `WeakSet`, pre-populated with the single {@link value}. */
  private static weakSet = new WeakSet();

  static {
    // Populate once at module load so the known member exists before any test runs.
    SharedWeakSetState.weakSet.add(SharedWeakSetState.value);
  }

  /**
   * Returns the exact object stored in the shared `WeakSet`.
   *
   * Use in "valid" cases that must reference the precise identity present in
   * the set; a freshly generated object would never match.
   */
  static getValue(): object {
    return SharedWeakSetState.value;
  }

  /** Returns the shared `WeakSet` instance for use as an assertion subject. */
  static getWeakSet(): WeakSet<object> {
    return SharedWeakSetState.weakSet;
  }
}

const helperGenerators = {
  primitive: fc.oneof(
    fc.string(),
    fc.integer({ max: 100, min: -100 }),
    fc.boolean(),
    fc.constant(null),
    fc.constant(undefined),
    fc.bigInt(),
    fc.string().map(Symbol),
  ),
};

export const testConfigs = new Map<
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
          fc.integer({ max: 100, min: 0 }),
        ],
      },
      valid: {
        generators: SyncCollectionGenerators.get(
          assertions.arrayContainsAssertion,
        )!,
      },
    },
  ],

  [
    assertions.arrayItemSatisfiesAssertion,
    {
      invalid: {
        generators: [
          fc.constant([{ a: 1 }, { b: 2 }]),
          fc.constantFrom(
            ...extractPhrases(assertions.arrayItemSatisfiesAssertion),
          ),
          fc.constant({ c: 3 }),
        ],
      },
      valid: {
        generators: SyncCollectionGenerators.get(
          assertions.arrayItemSatisfiesAssertion,
        )!,
      },
    },
  ],

  [
    assertions.arraySizeAssertion,
    {
      invalid: {
        generators: [
          fc.array(filteredAnything, { maxLength: 9, minLength: 1 }),
          fc.constantFrom(...extractPhrases(assertions.arraySizeAssertion)),
          fc.integer({ max: 100, min: 10 }),
        ],
      },
      valid: {
        generators: SyncCollectionGenerators.get(
          assertions.arraySizeAssertion,
        )!,
      },
    },
  ],

  [
    assertions.collectionSizeBetweenAssertion,
    {
      invalid: {
        generators: [
          fc.constantFrom('Map', 'Set').chain((type) => {
            if (type === 'Map') {
              return fc.constant(new Map([['a', 1]]) as any); // size 1, outside range [2,4]
            } else {
              return fc.constant(new Set([1]) as any); // size 1, outside range [2,4]
            }
          }),
          fc.constantFrom(
            ...extractPhrases(assertions.collectionSizeBetweenAssertion),
          ),
          fc.constant([2, 4]),
        ],
      },
      valid: {
        generators: SyncCollectionGenerators.get(
          assertions.collectionSizeBetweenAssertion,
        )!,
      },
    },
  ],

  [
    assertions.collectionSizeGreaterThanAssertion,
    {
      invalid: {
        generators: [
          fc.constantFrom('Map', 'Set').chain((type) => {
            if (type === 'Map') {
              return fc.constant(
                new Map([
                  ['a', 1],
                  ['b', 2],
                ]) as any,
              ); // size 2
            } else {
              return fc.constant(new Set([1, 2]) as any); // size 2
            }
          }),
          fc.constantFrom(
            ...extractPhrases(assertions.collectionSizeGreaterThanAssertion),
          ),
          fc.integer({ max: 10, min: 2 }), // 2 or greater
        ],
      },
      valid: {
        generators: SyncCollectionGenerators.get(
          assertions.collectionSizeGreaterThanAssertion,
        )!,
      },
    },
  ],
  [
    assertions.collectionSizeLessThanAssertion,
    {
      invalid: {
        generators: [
          fc.oneof(
            fc
              .dictionary(fc.string(), filteredAnything, {
                maxKeys: 10,
                minKeys: 4,
              })
              .map((obj) => new Map(Object.entries(obj))),
            fc
              .array(filteredAnything, { maxLength: 10, minLength: 4 })
              .map((arr) => new Set(arr))
              .filter(({ size }) => size >= 4), // deduping can shrink Set
          ),
          fc.constantFrom(
            ...extractPhrases(assertions.collectionSizeLessThanAssertion),
          ),
          fc.integer({ max: 3, min: 1 }),
        ],
      },
      valid: {
        generators: SyncCollectionGenerators.get(
          assertions.collectionSizeLessThanAssertion,
        )!,
      },
    },
  ],
  [
    assertions.emptyMapAssertion,
    {
      invalid: {
        generators: [
          fc
            .dictionary(fc.string(), filteredAnything, { minKeys: 1 })
            .map((obj) => new Map(Object.entries(obj))),
          fc.constantFrom(...extractPhrases(assertions.emptyMapAssertion)),
        ],
      },
      valid: {
        generators: SyncCollectionGenerators.get(assertions.emptyMapAssertion)!,
      },
    },
  ],

  [
    assertions.emptySetAssertion,
    {
      invalid: {
        generators: [
          fc
            .array(filteredAnything, { minLength: 1 })
            .map((arr) => new Set(arr)),
          fc.constantFrom(...extractPhrases(assertions.emptySetAssertion)),
        ],
      },
      valid: {
        generators: SyncCollectionGenerators.get(assertions.emptySetAssertion)!,
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
          generators: SyncCollectionGenerators.get(
            assertions.mapContainsAssertion,
          )!,
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
          generators: SyncCollectionGenerators.get(
            assertions.mapContainsAssertion,
          )!,
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
          generators: SyncCollectionGenerators.get(
            assertions.mapContainsAssertion,
          )!,
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
        generators: SyncCollectionGenerators.get(
          assertions.mapEqualityAssertion,
        )!,
      },
    },
  ],

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
        generators: SyncCollectionGenerators.get(assertions.mapKeyAssertion)!,
      },
    },
  ],

  [
    assertions.mapSizeAssertion,
    {
      invalid: {
        generators: [
          fc
            .dictionary(fc.string(), filteredAnything, {
              maxKeys: 10,
              minKeys: 1,
            })
            .map((obj) => new Map(Object.entries(obj))),
          fc.constantFrom(...extractPhrases(assertions.mapSizeAssertion)),
          fc.integer({ max: 100, min: 11 }),
        ],
      },
      valid: {
        generators: SyncCollectionGenerators.get(assertions.mapSizeAssertion)!,
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
        generators: SyncCollectionGenerators.get(assertions.mapValueAssertion)!,
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
        generators: SyncCollectionGenerators.get(
          assertions.nonEmptyArrayAssertion,
        )!,
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
        generators: SyncCollectionGenerators.get(
          assertions.objectExactKeyAssertion,
        )!,
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
        generators: SyncCollectionGenerators.get(
          assertions.objectKeyAssertion,
        )!,
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
        runSize: 'large',
      },
      valid: {
        examples: [
          [{ '': 1 }, 'to have keys', ['']],
          [{ foo: undefined }, 'to have keys', ['foo']],
        ],
        generators: SyncCollectionGenerators.get(
          assertions.objectKeysAssertion,
        )!,
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
          fc.integer({ max: 10, min: 0 }).filter((n) => n !== 3),
        ],
      },
      valid: {
        generators: SyncCollectionGenerators.get(
          assertions.objectSizeAssertion,
        )!,
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
        generators: SyncCollectionGenerators.get(
          assertions.setDifferenceEqualityAssertion,
        )!,
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
        generators: SyncCollectionGenerators.get(
          assertions.setDisjointAssertion,
        )!,
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
        generators: SyncCollectionGenerators.get(
          assertions.setEqualityAssertion,
        )!,
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
        generators: SyncCollectionGenerators.get(
          assertions.setIntersectionAssertion,
        )!,
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
        generators: SyncCollectionGenerators.get(
          assertions.setIntersectionEqualityAssertion,
        )!,
      },
    },
  ],

  [
    assertions.setSizeAssertion,
    {
      invalid: {
        generators: [
          fc
            .array(filteredAnything, { maxLength: 3, minLength: 3 })
            .map((arr) => new Set(arr))
            .filter(({ size }) => size !== 3), // deduping can shrink it
          fc.constantFrom(...extractPhrases(assertions.setSizeAssertion)),
          fc.constant(3),
        ],
      },
      valid: {
        generators: SyncCollectionGenerators.get(assertions.setSizeAssertion)!,
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
        generators: SyncCollectionGenerators.get(
          assertions.setSubsetAssertion,
        )!,
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
        generators: SyncCollectionGenerators.get(
          assertions.setSupersetAssertion,
        )!,
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
        generators: SyncCollectionGenerators.get(
          assertions.setSymmetricDifferenceEqualityAssertion,
        )!,
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
        generators: SyncCollectionGenerators.get(
          assertions.setUnionEqualityAssertion,
        )!,
      },
    },
  ],
]);
