/**
 * Property-based tests for the `get` function.
 *
 * These tests use fast-check to generate arbitrary objects and keypaths to
 * verify that:
 *
 * 1. `get` safely navigates nested object structures
 * 2. Valid keypaths return the correct values
 * 3. Invalid keypaths return undefined or default values
 * 4. Various keypath formats (dot notation, bracket notation) work correctly
 * 5. Edge cases and failure scenarios are handled appropriately
 *
 * @packageDocumentation
 */

import fc from 'fast-check';
import { describe, it } from 'node:test';

import { get } from '../../src/util.js';
import { calculateNumRuns } from './property-test-util.js';

const numRuns = calculateNumRuns();

/**
 * Generators for creating test data
 */

const primitiveValue = fc.oneof(
  fc.string(),
  fc.integer(),
  fc.float(),
  fc.boolean(),
  fc.constantFrom(null, undefined),
);

const simpleKey = fc
  .string({
    maxLength: 20,
    minLength: 1,
  })
  .filter((s) => /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(s));

const objectWithArrays = fc.record({
  data: fc.array(primitiveValue, { maxLength: 10 }),
  nested: fc.array(
    fc.record({
      id: fc.integer(),
      value: primitiveValue,
    }),
    { maxLength: 5 },
  ),
});

const simpleNestedObject = fc.record({
  level1: fc.record({
    level2: fc.record({
      value: primitiveValue,
    }),
  }),
  simple: primitiveValue,
});

/**
 * Generate invalid keypaths that should return undefined
 */
const invalidKeypaths = fc.oneof(
  fc.string({ maxLength: 20, minLength: 1 }).map((s) => `nonexistent_${s}`),

  fc
    .array(simpleKey, { maxLength: 5, minLength: 2 })
    .map((parts) => `nonexistent.${parts.join('.')}`),

  fc
    .nat({ max: 1000 })
    .filter((i) => i >= 100)
    .map((i) => `data[${i}]`),

  fc.oneof(
    fc.constant('key[unclosed'),
    fc.constant('key]unopened'),
    fc.constant('key["unterminated'),
    fc.constant("key['unterminated"),
  ),
);

describe('util property tests', () => {
  describe('get()', () => {
    describe('successful value retrieval', () => {
      it('should retrieve values using dot notation for simple objects', () => {
        fc.assert(
          fc.property(
            fc
              .record({
                a: primitiveValue,
                b: primitiveValue,
                c: primitiveValue,
              })
              .chain((obj) =>
                fc.tuple(
                  fc.constant(obj),
                  fc.constantFrom('a', 'b', 'c'),
                  fc.anything(),
                ),
              ),
            ([obj, key, defaultValue]) => {
              const result = get(obj, key, defaultValue);
              const expected = obj[key];

              if (Number.isNaN(expected) && Number.isNaN(result)) {
                return true;
              }

              return result === expected;
            },
          ),
          { numRuns },
        );
      });

      it('should retrieve values from simple nested objects', () => {
        fc.assert(
          fc.property(
            simpleNestedObject.chain((obj) =>
              fc.tuple(
                fc.constant(obj),
                fc.constantFrom('level1.level2.value', 'simple'),
                fc.anything(),
              ),
            ),
            ([obj, path, _defaultValue]) => {
              const result = get(obj, path);

              if (path === 'level1.level2.value') {
                const expected = obj.level1.level2.value;

                if (Number.isNaN(expected) && Number.isNaN(result)) {
                  return true;
                }
                return result === expected;
              }
              if (path === 'simple') {
                const expected = obj.simple;

                if (Number.isNaN(expected) && Number.isNaN(result)) {
                  return true;
                }
                return result === expected;
              }

              return true;
            },
          ),
          { numRuns },
        );
      });

      it('should retrieve values from arrays using bracket notation', () => {
        fc.assert(
          fc.property(
            objectWithArrays.chain((obj) => {
              const validIndices =
                obj.data.length > 0
                  ? Array.from(
                      { length: Math.min(obj.data.length, 3) },
                      (_, i) => i,
                    )
                  : [0];

              return fc.tuple(
                fc.constant(obj),
                fc.constantFrom(...validIndices.map((i) => `data[${i}]`)),
                fc.anything(),
              );
            }),
            ([obj, path, defaultValue]) => {
              const result = get(obj, path, defaultValue);
              const match = path.match(/\[(\d+)\]/);

              if (!match || !match[1]) return false;

              const index = parseInt(match[1], 10);

              if (index < obj.data.length) {
                const expected = obj.data[index];

                if (Number.isNaN(expected) && Number.isNaN(result)) {
                  return true;
                }
                return result === expected;
              } else {
                if (Number.isNaN(defaultValue) && Number.isNaN(result)) {
                  return true;
                }
                return result === defaultValue;
              }
            },
          ),
          { numRuns },
        );
      });

      it('should handle complex keypaths with mixed notation', () => {
        fc.assert(
          fc.property(
            fc
              .constant({
                'complex-key': { 'another-complex': 'value' },
                users: [
                  { name: 'Alice', profile: { age: 30 } },
                  { name: 'Bob', profile: { age: 25 } },
                ],
              })
              .chain((obj) =>
                fc.tuple(
                  fc.constant(obj),
                  fc.constantFrom(
                    'users[0].name',
                    'users[1].profile.age',
                    '["complex-key"]["another-complex"]',
                  ),
                  fc.anything(),
                ),
              ),
            ([obj, path, _defaultValue]) => {
              const result = get(obj, path);

              if (path === 'users[0].name') return result === 'Alice';
              if (path === 'users[1].profile.age') return result === 25;
              if (path === '["complex-key"]["another-complex"]')
                return result === 'value';

              return true;
            },
          ),
          { numRuns },
        );
      });
    });

    describe('failure modes and edge cases', () => {
      it('should return undefined for non-existent paths', () => {
        fc.assert(
          fc.property(
            fc.tuple(simpleNestedObject, invalidKeypaths),
            ([obj, invalidPath]) => {
              const result = get(obj, invalidPath);
              return result === undefined;
            },
          ),
          { numRuns },
        );
      });

      it('should return default value when path does not exist', () => {
        fc.assert(
          fc.property(
            fc.tuple(simpleNestedObject, invalidKeypaths, fc.anything()),
            ([obj, invalidPath, defaultValue]) => {
              const result = get(obj, invalidPath, defaultValue);

              if (Number.isNaN(defaultValue) && Number.isNaN(result)) {
                return true;
              }

              return result === defaultValue;
            },
          ),
          { numRuns },
        );
      });

      it('should handle null and undefined objects gracefully', () => {
        fc.assert(
          fc.property(
            fc.tuple(
              fc.constantFrom(null, undefined),
              fc.string({ minLength: 1 }),
              fc.anything(),
            ),
            ([obj, path, defaultValue]) => {
              const result = get(obj, path, defaultValue);
              if (Number.isNaN(defaultValue) && Number.isNaN(result)) {
                return true;
              }
              return result === defaultValue;
            },
          ),
          { numRuns },
        );
      });

      it('should handle invalid keypath types', () => {
        fc.assert(
          fc.property(
            fc.tuple(
              simpleNestedObject,
              fc.oneof(
                fc.integer().map(String),
                fc.constantFrom(null, undefined, 123, true, {}, []),
              ),
              fc.anything(),
            ),
            ([obj, invalidKeypath, defaultValue]) => {
              const result = get(obj, invalidKeypath as string, defaultValue);

              if (typeof invalidKeypath !== 'string') {
                if (Number.isNaN(defaultValue) && Number.isNaN(result)) {
                  return true;
                }
                return result === defaultValue;
              }

              if (invalidKeypath in obj) {
                const expected = obj[invalidKeypath as keyof typeof obj];

                if (Number.isNaN(expected) && Number.isNaN(result)) {
                  return true;
                }
                return result === expected;
              } else {
                if (Number.isNaN(defaultValue) && Number.isNaN(result)) {
                  return true;
                }
                return result === defaultValue;
              }
            },
          ),
          { numRuns },
        );
      });

      it('should handle primitive values as objects gracefully', () => {
        fc.assert(
          fc.property(
            fc.tuple(
              primitiveValue,
              fc.string({ minLength: 1 }),
              fc.anything(),
            ),
            ([primitive, path, defaultValue]) => {
              const result = get(primitive, path, defaultValue);
              if (Number.isNaN(defaultValue) && Number.isNaN(result)) {
                return true;
              }
              return result === defaultValue;
            },
          ),
          { numRuns },
        );
      });

      it('should handle deep paths that traverse through null/undefined values', () => {
        fc.assert(
          fc.property(
            fc.tuple(
              fc.constant({ a: { b: null, c: undefined } }),
              fc.constantFrom('a.b.deep', 'a.c.deep', 'a.d.deep'),
              fc.anything(),
            ),
            ([obj, path, defaultValue]) => {
              const result = get(obj, path, defaultValue);
              if (Number.isNaN(defaultValue) && Number.isNaN(result)) {
                return true;
              }
              return result === defaultValue;
            },
          ),
          { numRuns },
        );
      });
    });

    describe('keypath parsing edge cases', () => {
      it('should handle various bracket notation formats', () => {
        fc.assert(
          fc.property(
            fc
              .constant({
                '123numeric': 'value3',
                data: ['item0', 'item1', 'item2'],
                'key-with-dashes': 'value1',
                'key with spaces': 'value2',
              })
              .chain((obj) =>
                fc.tuple(
                  fc.constant(obj),
                  fc.constantFrom(
                    '["key-with-dashes"]',
                    "['key with spaces']",
                    '["123numeric"]',
                    'data[0]',
                    'data[1]',
                    'data[2]',
                  ),
                ),
              ),
            ([obj, path]) => {
              const result = get(obj, path);

              if (path === '["key-with-dashes"]') return result === 'value1';
              if (path === "['key with spaces']") return result === 'value2';
              if (path === '["123numeric"]') return result === 'value3';
              if (path === 'data[0]') return result === 'item0';
              if (path === 'data[1]') return result === 'item1';
              if (path === 'data[2]') return result === 'item2';

              return true;
            },
          ),
          { numRuns },
        );
      });

      it('should handle empty and edge case paths', () => {
        fc.assert(
          fc.property(
            fc.tuple(
              simpleNestedObject,
              fc.constantFrom('', '.', '..', '[', ']', '[""]', "['']"),
              fc.anything(),
            ),
            ([obj, edgePath, defaultValue]) => {
              const result = get(obj, edgePath, defaultValue);

              // Handle NaN comparison properly since NaN !== NaN
              if (Number.isNaN(defaultValue) && Number.isNaN(result)) {
                return true;
              }

              return result === defaultValue || result === undefined;
            },
          ),
          { numRuns },
        );
      });
    });

    describe('type safety and return values', () => {
      it('should maintain type information when using generics', () => {
        fc.assert(
          fc.property(
            fc.tuple(
              fc.constant({ message: 'hello world' }),
              fc.constant('message'),
              fc.string().map((s) => `default-${s}`),
            ),
            ([obj, path, defaultValue]) => {
              const result: string | undefined = get<string>(
                obj,
                path,
                defaultValue,
              );
              return typeof result === 'string' && result === 'hello world';
            },
          ),
          { numRuns },
        );
      });

      it('should work with deeply nested structures generated dynamically', () => {
        fc.assert(
          fc.property(
            fc
              .array(simpleKey, { maxLength: 3, minLength: 1 })
              .chain((keys) => {
                const sampleValue = fc.sample(primitiveValue, 1)[0];
                let obj: Record<string, unknown> = { value: sampleValue };

                for (let i = keys.length - 1; i >= 0; i--) {
                  obj = { [keys[i] as string]: obj };
                }

                return fc.tuple(
                  fc.constant(obj),
                  fc.constant(keys.join('.')),
                  fc.anything(),
                );
              }),
            ([obj, path, _defaultValue]) => {
              const result = get(obj, path);
              return result !== undefined;
            },
          ),
          { numRuns },
        );
      });
    });
  });
});
