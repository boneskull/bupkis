import fc from 'fast-check';

import * as assertions from '../src/assertion/impl/sync-collection.js';
import { type AnyAssertion } from '../src/types.js';
import { type GeneratorParams } from '../test/property/property-test-config.js';
import {
  extractPhrases,
  filteredAnything,
} from '../test/property/property-test-util.js';

export const SyncCollectionGenerators = new Map<AnyAssertion, GeneratorParams>([
  [
    assertions.arrayContainsAssertion,
    [
      fc.constant([42, 'test', true]),
      fc.constantFrom(...extractPhrases(assertions.arrayContainsAssertion)),
      fc.constantFrom(42, 'test', true),
    ],
  ],
  [
    assertions.arrayItemSatisfiesAssertion,
    fc
      .record({ a: fc.integer(), b: fc.string() })
      .chain((obj) =>
        fc.tuple(
          fc.constant([{ x: 'other' }, obj, { y: 123 }]),
          fc.constantFrom(
            ...extractPhrases(assertions.arrayItemSatisfiesAssertion),
          ),
          fc.constant({ a: obj.a }),
        ),
      ),
  ],
  [
    assertions.arraySizeAssertion,
    [
      fc.constant([1, 2, 3]),
      fc.constantFrom(...extractPhrases(assertions.arraySizeAssertion)),
      fc.constant(3),
    ],
  ],
  [
    assertions.collectionSizeBetweenAssertion,
    [
      fc.constantFrom('Map', 'Set').chain((type) => {
        if (type === 'Map') {
          return fc.constant(
            new Map([
              ['a', 1],
              ['b', 2],
              ['c', 3],
            ]) as any,
          ); // size 3, within range [2,4]
        } else {
          return fc.constant(new Set([1, 2, 3]) as any); // size 3, within range [2,4]
        }
      }),
      fc.constantFrom(
        ...extractPhrases(assertions.collectionSizeBetweenAssertion),
      ),
      fc.constant([2, 4]),
    ],
  ],
  [
    assertions.collectionSizeGreaterThanAssertion,
    [
      fc.constantFrom('Map', 'Set').chain((type) => {
        if (type === 'Map') {
          return fc.constant(
            new Map([
              ['a', 1],
              ['b', 2],
              ['c', 3],
            ]) as any,
          ); // size 3
        } else {
          return fc.constant(new Set([1, 2, 3]) as any); // size 3
        }
      }),
      fc.constantFrom(
        ...extractPhrases(assertions.collectionSizeGreaterThanAssertion),
      ),
      fc.integer({ max: 2, min: 0 }), // 0 to 2 (less than 3)
    ],
  ],
  [
    assertions.collectionSizeLessThanAssertion,
    [
      fc.oneof(
        fc
          .dictionary(fc.string(), filteredAnything, {
            maxKeys: 2,
            minKeys: 2,
          })
          .map((obj) => new Map(Object.entries(obj))),
        fc
          .array(filteredAnything, { maxLength: 2, minLength: 2 })
          .map((arr) => new Set(arr)),
      ),
      fc.constantFrom(
        ...extractPhrases(assertions.collectionSizeLessThanAssertion),
      ),
      fc.integer({ max: 10, min: 3 }),
    ],
  ],
  [
    assertions.emptyMapAssertion,
    [
      fc.constant(new Map()),
      fc.constantFrom(...extractPhrases(assertions.emptyMapAssertion)),
    ],
  ],
  [
    assertions.emptySetAssertion,
    [
      fc.constant(new Set()),
      fc.constantFrom(...extractPhrases(assertions.emptySetAssertion)),
    ],
  ],
  [
    assertions.mapContainsAssertion,
    [
      fc.constant(
        new Map([
          ['key1', 'value1'],
          ['key2', 'value2'],
        ]),
      ),
      fc.constantFrom(...extractPhrases(assertions.mapContainsAssertion)),
      fc.constantFrom('key1', 'key2'),
    ],
  ],
  [
    assertions.mapEntryAssertion,
    [
      fc.constant(
        new Map([
          ['key1', 'value1'],
          ['key2', 'value2'],
        ]),
      ),
      fc.constantFrom(...extractPhrases(assertions.mapEntryAssertion)),
      fc.constantFrom(['key1', 'value1'], ['key2', 'value2']),
    ],
  ],
  [
    assertions.mapEqualityAssertion,
    [
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
  ],
  [
    assertions.mapKeyAssertion,
    [
      fc.constant(
        new Map([
          ['key1', 'value1'],
          ['key2', 'value2'],
        ]),
      ),
      fc.constantFrom(...extractPhrases(assertions.mapKeyAssertion)),
      fc.constantFrom('key1', 'key2'),
    ],
  ],
  [
    assertions.mapSizeAssertion,
    [
      fc.constant(
        new Map([
          ['a', 1],
          ['b', 2],
        ]),
      ),
      fc.constantFrom(...extractPhrases(assertions.mapSizeAssertion)),
      fc.constant(2),
    ],
  ],
  [
    assertions.mapValueAssertion,
    [
      fc.constant(
        new Map([
          ['key1', 'value1'],
          ['key2', 'value2'],
        ]),
      ),
      fc.constantFrom(...extractPhrases(assertions.mapValueAssertion)),
      fc.constantFrom('value1', 'value2'),
    ],
  ],
  [
    assertions.nonEmptyArrayAssertion,
    [
      fc.array(filteredAnything, { minLength: 1 }),
      fc.constantFrom(...extractPhrases(assertions.nonEmptyArrayAssertion)),
    ],
  ],
  [
    assertions.objectExactKeyAssertion,
    [
      fc.constant({
        'key.with.dots': 'direct property',
        'key[with]brackets': 'another direct property',
        simple: 'value',
      }),
      fc.constantFrom(...extractPhrases(assertions.objectExactKeyAssertion)),
      fc.constantFrom('key.with.dots', 'key[with]brackets', 'simple'),
    ],
  ],
  [
    assertions.objectKeyAssertion,
    [
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
  ],
  [
    assertions.objectKeysAssertion,
    [
      fc.constant({ a: 1, b: 2, c: 3 }),
      fc.constantFrom(...extractPhrases(assertions.objectKeysAssertion)),
      fc.array(fc.constantFrom('a', 'b', 'c'), { minLength: 1 }),
    ],
  ],
  [
    assertions.objectSizeAssertion,
    [
      fc.constant({ a: 1, b: 2, c: 3 }),
      fc.constantFrom(...extractPhrases(assertions.objectSizeAssertion)),
      fc.constant(3),
    ],
  ],
  [
    assertions.setContainsAssertion,
    [
      fc.constant(new Set(['val1', 'val2'])),
      fc.constantFrom(...extractPhrases(assertions.setContainsAssertion)),
      fc.constantFrom('val1', 'val2'),
    ],
  ],
  [
    assertions.setDifferenceEqualityAssertion,
    [
      fc.constant(new Set([1, 2, 3])),
      fc.constant('to have difference'),
      fc.constant(new Set([2, 3, 4])),
      fc.constant('equal to'),
      fc.constant(new Set([1])), // Correct difference
    ],
  ],
  [
    assertions.setDisjointAssertion,
    [
      fc.constant(new Set([1, 2])),
      fc.constantFrom(...extractPhrases(assertions.setDisjointAssertion)),
      fc.constant(new Set([3, 4])),
    ],
  ],
  [
    assertions.setEqualityAssertion,
    [
      fc.constant(new Set([1, 2, 3])),
      fc.constantFrom(...extractPhrases(assertions.setEqualityAssertion)),
      fc.constant(new Set([1, 2, 3])), // Same elements
    ],
  ],
  [
    assertions.setIntersectionAssertion,
    [
      fc.constant(new Set([1, 2, 3])),
      fc.constantFrom(...extractPhrases(assertions.setIntersectionAssertion)),
      fc.constant(new Set([2, 3, 4])),
    ],
  ],
  [
    assertions.setIntersectionEqualityAssertion,
    [
      fc.constant(new Set([1, 2, 3])),
      fc.constant('to have intersection'),
      fc.constant(new Set([2, 3, 4])),
      fc.constant('equal to'),
      fc.constant(new Set([2, 3])), // Correct intersection
    ],
  ],
  [
    assertions.setSizeAssertion,
    [
      fc
        .array(filteredAnything, { maxLength: 3, minLength: 3 })
        .map((arr) => new Set(arr))
        .filter(({ size }) => size === 3), // deduping can shrink it
      fc.constantFrom(...extractPhrases(assertions.setSizeAssertion)),
      fc.constant(3),
    ],
  ],
  [
    assertions.setSubsetAssertion,
    [
      fc.constant(new Set([1, 2])),
      fc.constantFrom(...extractPhrases(assertions.setSubsetAssertion)),
      fc.constant(new Set([1, 2, 3])),
    ],
  ],
  [
    assertions.setSupersetAssertion,
    [
      fc.constant(new Set([1, 2, 3, 4])),
      fc.constantFrom(...extractPhrases(assertions.setSupersetAssertion)),
      fc.constant(new Set([1, 2])),
    ],
  ],
  [
    assertions.setSymmetricDifferenceEqualityAssertion,
    [
      fc.constant(new Set([1, 2, 3])),
      fc.constant('to have symmetric difference'),
      fc.constant(new Set([2, 3, 4])),
      fc.constant('equal to'),
      fc.constant(new Set([1, 4])), // Correct symmetric difference
    ],
  ],
  [
    assertions.setUnionEqualityAssertion,
    [
      fc.constant(new Set([1, 2])),
      fc.constant('to have union'),
      fc.constant(new Set([3, 4])),
      fc.constant('equal to'),
      fc.constant(new Set([1, 2, 3, 4])), // Correct union
    ],
  ],
]);
