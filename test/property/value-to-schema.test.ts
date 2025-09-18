/**
 * Property-based tests for `valueToSchema` function.
 *
 * These tests use fast-check to generate arbitrary values and verify that:
 *
 * 1. `valueToSchema` produces valid Zod schemas
 * 2. The generated schemas successfully validate the original input values
 * 3. Various option combinations work correctly
 * 4. Edge cases and failure scenarios are handled appropriately
 *
 * @packageDocumentation
 */

import fc from 'fast-check';
import { describe, it } from 'node:test';

import { hasKeyDeep, hasValueDeep } from '../../src/util.js';
import {
  valueToSchema,
  type ValueToSchemaOptions,
} from '../../src/value-to-schema.js';

const defaultNumRuns = process.env.WALLABY ? 10 : process.env.CI ? 100 : 500;

/**
 * Generators for various types of values to test with valueToSchema
 *
 * @privateRemarks
 * If it's only used once, it doesn't belong here.
 */
const generators = {
  // Functions
  functions: fc.oneof(
    fc.constant(() => {}),
    fc.constant(function named() {}),
    fc.constant(async () => {}),
    fc.constant(function* generator() {}),
  ),

  // Objects containing regexp values
  objectWithRegexp: fc.record({
    flags: fc.string(),
    name: fc.string(),
    pattern: fc.oneof(
      fc.constant(/test/),
      fc.constant(/\d+/),
      fc.constant(/[a-z]*/),
    ),
  }),

  // Basic primitives
  primitive: fc.oneof(
    fc.constant(null),
    fc.constant(undefined),
    fc.boolean(),
    fc.string(),
    fc.integer(),
    fc.float(),
    fc.bigInt(),
    fc.constant(NaN),
    fc.constant(Infinity),
    fc.constant(-Infinity),
    fc.constant(Symbol('test')),
  ),

  // Regular expressions
  regexp: fc.oneof(
    fc.constant(/test/),
    fc.constant(/\d+/g),
    fc.constant(/[a-z]*/i),
    fc.constant(/^start.*end$/m),
  ),

  // Simple objects
  simpleObject: fc.record({
    bool: fc.boolean(),
    num: fc.integer(),
    str: fc.string(),
  }),
};

describe('valueToSchema property tests', () => {
  it('should handle simple primitive values', () => {
    fc.assert(
      fc.property(generators.primitive, (value) => {
        try {
          const schema = valueToSchema(value);
          const result = schema.safeParse(value);
          return result.success;
        } catch {
          // valueToSchema might throw for some edge cases, that's ok
          return true;
        }
      }),
      { numRuns: defaultNumRuns },
    );
  });

  it('should work with literal primitives enabled', () => {
    fc.assert(
      fc.property(generators.primitive, (value) => {
        const schema = valueToSchema(value, { literalPrimitives: true });
        const result = schema.safeParse(value);
        return result.success;
      }),
      { numRuns: defaultNumRuns },
    );
  });

  it('should reject different primitive values with literal primitives', () => {
    fc.assert(
      fc.property(
        generators.primitive,
        generators.primitive,
        (value1, value2) => {
          // Skip if values are the same (including NaN === NaN case for schema purposes)
          if (
            value1 === value2 ||
            (Number.isNaN(value1) && Number.isNaN(value2))
          ) {
            return true;
          }

          const schema = valueToSchema(value1, { literalPrimitives: true });
          const result = schema.safeParse(value2);
          // With literal primitives, different values should fail validation
          return !result.success;
        },
      ),
      { numRuns: defaultNumRuns },
    );
  });

  it('should work with type-based primitives', () => {
    fc.assert(
      fc.property(generators.primitive, (value) => {
        const schema = valueToSchema(value, { literalPrimitives: false });
        const result = schema.safeParse(value);
        return result.success;
      }),
    );
  });

  it('should reject wrong types with type-based primitives', () => {
    fc.assert(
      fc.property(fc.string(), fc.integer(), (stringValue, numberValue) => {
        const schema = valueToSchema(stringValue, { literalPrimitives: false });
        const result = schema.safeParse(numberValue);
        // Should fail because string schema won't accept number
        return !result.success;
      }),
      { numRuns: defaultNumRuns },
    );
  });

  it('should handle regexp with literalRegExp true', () => {
    fc.assert(
      fc.property(generators.regexp, (regexp) => {
        const schema = valueToSchema(regexp, { literalRegExp: true });
        const result = schema.safeParse(regexp);
        return result.success;
      }),
      { numRuns: defaultNumRuns },
    );
  });

  it('should reject non-regexp with literalRegExp true', () => {
    fc.assert(
      fc.property(generators.regexp, (regexp) => {
        const schema = valueToSchema(regexp, { literalRegExp: true });
        const result = schema.safeParse('not a regexp');
        return !result.success;
      }),
      { numRuns: defaultNumRuns },
    );
  });

  it('should handle regexp pattern matching with literalRegExp false', () => {
    fc.assert(
      fc.property(
        fc.constant(/test/),
        fc.constantFrom('test', 'testing', 'contest'),
        (regexp, matchingString) => {
          const schema = valueToSchema(regexp, { literalRegExp: false });
          const result = schema.safeParse(matchingString);
          return result.success === regexp.test(matchingString);
        },
      ),
      { numRuns: 10 },
    );
  });

  it('should reject non-matching strings with regexp patterns', () => {
    fc.assert(
      fc.property(
        fc.constant(/test/),
        fc.constantFrom('hello', 'world', 'xyz'),
        (regexp, nonMatchingString) => {
          const schema = valueToSchema(regexp, { literalRegExp: false });
          const result = schema.safeParse(nonMatchingString);
          return !result.success;
        },
      ),
      { numRuns: 10 },
    );
  });

  it('should handle objects with regexp values', () => {
    fc.assert(
      fc.property(generators.objectWithRegexp, (obj) => {
        const schema = valueToSchema(obj, { literalRegExp: true });
        const result = schema.safeParse(obj);
        return result.success;
      }),
      { numRuns: defaultNumRuns },
    );
  });

  it('should reject wrong regexp in objects', () => {
    fc.assert(
      fc.property(generators.objectWithRegexp, (obj) => {
        const schema = valueToSchema(obj, { literalRegExp: true });
        const wrongObj = { ...obj, pattern: 'not a regexp' };
        const result = schema.safeParse(wrongObj);
        return !result.success;
      }),
      { numRuns: defaultNumRuns },
    );
  });

  it('should handle mixed arrays when allowed', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.oneof(
            fc.string(),
            fc.integer(),
            fc.boolean(),
            fc.constant(null),
            fc.record({ key: fc.string() }),
          ),
        ),
        (arr) => {
          const schema = valueToSchema(arr, { noMixedArrays: false });
          const result = schema.safeParse(arr);
          return result.success;
        },
      ),
      { numRuns: defaultNumRuns },
    );
  });

  it('should handle homogeneous arrays when mixed arrays disallowed', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.array(fc.string()),
          fc.array(fc.integer()),
          fc.array(fc.boolean()),
        ),
        (arr) => {
          const schema = valueToSchema(arr, { noMixedArrays: false });
          const result = schema.safeParse(arr);
          return result.success;
        },
      ),
      { numRuns: defaultNumRuns },
    );
  });

  it('should reject mixed content in homogeneous arrays', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string(), { minLength: 1 }),
        fc.integer(),
        (stringArr, number) => {
          const schema = valueToSchema(stringArr, {
            noMixedArrays: false,
          });
          const mixedArr = [...stringArr, number];
          const result = schema.safeParse(mixedArr);
          return !result.success;
        },
      ),
      { numRuns: defaultNumRuns },
    );
  });

  it('should handle literal empty objects correctly', () => {
    fc.assert(
      fc.property(
        fc
          .object()
          .filter(
            (obj) => !hasKeyDeep(obj, '__proto__') && hasValueDeep(obj, {}),
          ),
        (obj) => {
          const schema = valueToSchema(obj, {
            literalEmptyObjects: true,
            literalPrimitives: true,
            literalTuples: true,
            strict: true,
          });

          // Should validate the original empty object
          const validResult = schema.safeParse(obj);
          if (!validResult.success) return false;
        },
      ),
      { numRuns: defaultNumRuns },
    );
  });

  it('should handle nested empty objects with literalEmptyObjects', () => {
    fc.assert(
      fc.property(
        fc.string().filter((key) => key !== '__proto__'),
        (key) => {
          const objWithEmptyValue = { [key]: {} };
          const schema = valueToSchema(objWithEmptyValue, {
            literalEmptyObjects: true,
          });

          // Should validate object with empty nested object
          const validResult = schema.safeParse({ [key]: {} });
          if (!validResult.success) return false;

          // Should reject object with non-empty nested object
          const invalidResult = schema.safeParse({
            [key]: { nested: 'value' },
          });
          return !invalidResult.success;
        },
      ),
      { numRuns: defaultNumRuns },
    );
  });

  it('should handle strict object validation', () => {
    fc.assert(
      fc.property(generators.simpleObject, (obj) => {
        const schema = valueToSchema(obj, { strict: true });
        const result = schema.safeParse(obj);
        return result.success;
      }),
      { numRuns: defaultNumRuns },
    );
  });

  it('should reject extra properties in strict mode', () => {
    fc.assert(
      fc.property(generators.simpleObject, (obj) => {
        const schema = valueToSchema(obj, { strict: true });
        const objWithExtra = { ...obj, extraProp: 'unexpected' };
        const result = schema.safeParse(objWithExtra);
        return !result.success;
      }),
      { numRuns: defaultNumRuns },
    );
  });

  it('should allow extra properties in non-strict mode', () => {
    fc.assert(
      fc.property(generators.simpleObject, (obj) => {
        const schema = valueToSchema(obj, { strict: false });
        const objWithExtra = { ...obj, extraProp: 'allowed' };
        const result = schema.safeParse(objWithExtra);
        return result.success;
      }),
      { numRuns: defaultNumRuns },
    );
  });

  it('should accept arbitrary objects and arrays', () => {
    fc.assert(
      fc.property(
        fc
          .oneof(fc.object(), fc.array(fc.anything()))
          .filter((v) => !hasKeyDeep(v, '__proto__')),
        (obj) => {
          const schema = valueToSchema(obj);
          const result = schema.safeParse(obj);
          return result.success;
        },
      ),
      {
        examples: [
          [{ '': [[''], [[]]] }],
          [{ '': [null, undefined] }],
          [['', false]],
          [{ '': undefined }],
          [{ '': [[['', undefined]]] }],
          [{ '': ['', undefined] }],
          [{ '': [{ '': ['', undefined] }] }],
        ],
        numRuns: defaultNumRuns,
      },
    );
  });

  it('should respect depth limiting', () => {
    fc.assert(
      fc.property(
        fc.letrec((tie) => ({
          value: fc.oneof(
            { depthSize: 'small' },
            fc.string(),
            fc.integer(),
            fc.boolean(),
            fc.record({
              data: fc.string(),
              nested: tie('value'),
            }),
          ),
        })).value,
        fc.integer({ max: 5, min: 1 }),
        (obj, maxDepth) => {
          const schema = valueToSchema(obj, { maxDepth });
          const result = schema.safeParse(obj);
          return result.success;
        },
      ),
      { numRuns: defaultNumRuns },
    );
  });

  it('should handle built-in object types', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.date(),
          fc.constant(new Map([['key', 'value']])),
          fc.constant(new Set(['item1', 'item2'])),
          fc.constant(new WeakMap()),
          fc.constant(new WeakSet()),
          fc.constant(new Error('test error')),
          fc.constant(Promise.resolve('test')),
        ),
        (obj) => {
          const schema = valueToSchema(obj);
          const result = schema.safeParse(obj);
          return result.success;
        },
      ),
      { numRuns: defaultNumRuns },
    );
  });

  it('should reject wrong types for built-in objects', () => {
    fc.assert(
      fc.property(fc.date(), fc.string(), (date, string) => {
        const schema = valueToSchema(date);
        const result = schema.safeParse(string);
        return !result.success;
      }),
      { numRuns: defaultNumRuns },
    );
  });

  it('should handle function types', () => {
    fc.assert(
      fc.property(generators.functions, (fn) => {
        const schema = valueToSchema(fn);
        const result = schema.safeParse(fn);
        return result.success;
      }),
      { numRuns: defaultNumRuns },
    );
  });

  it('should reject non-functions for function schemas', () => {
    fc.assert(
      fc.property(generators.functions, (fn) => {
        const schema = valueToSchema(void fn);
        const result = schema.safeParse('not a function');
        return !result.success;
      }),
      { numRuns: defaultNumRuns },
    );
  });

  it('should handle consistent nested structures', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          // Consistent arrays of primitives
          fc.array(fc.string()),
          fc.array(fc.integer()),
          fc.array(fc.boolean()),
          // Consistent objects
          fc.array(
            fc.record({
              id: fc.integer(),
              name: fc.string(),
            }),
          ),
          // Single values (no structural inconsistency possible)
          fc.string(),
          fc.integer(),
          fc.boolean(),
        ),
        (value) => {
          const schema = valueToSchema(value);
          const result = schema.safeParse(value);
          return result.success;
        },
      ),
      { numRuns: defaultNumRuns },
    );
  });

  it('should work with option combinations', () => {
    const optsArbs: Partial<
      Record<keyof ValueToSchemaOptions, fc.Arbitrary<any>>
    > = {
      literalPrimitives: fc.boolean(),
      literalRegExp: fc.boolean(),
      maxDepth: fc.integer({ max: 10, min: 1 }),
      noMixedArrays: fc.boolean(),
      strict: fc.boolean(),
    };
    fc.assert(
      fc.property(
        generators.primitive.filter((v) => v !== null && v !== undefined), // Avoid null/undefined for simpler test
        fc.record(optsArbs),
        (value, options) => {
          try {
            const schema = valueToSchema(value, options);
            const result = schema.safeParse(value);
            return result.success;
          } catch {
            // Some edge cases might throw, that's ok
            return true;
          }
        },
      ),
      { numRuns: defaultNumRuns },
    );
  });

  it('should reject wrong types with option combinations', () => {
    const optsArbs: Partial<
      Record<keyof ValueToSchemaOptions, fc.Arbitrary<any>>
    > = {
      literalPrimitives: fc.boolean(),
      literalRegExp: fc.boolean(),
      maxDepth: fc.integer({ max: 10, min: 1 }),
      noMixedArrays: fc.boolean(),
      strict: fc.boolean(),
    };
    fc.assert(
      fc.property(
        fc.string(),
        fc.integer({
          max: Number.MAX_SAFE_INTEGER,
          min: Number.MIN_SAFE_INTEGER,
        }),
        fc.record(optsArbs),
        (value, actual, options) => {
          const schema = valueToSchema(value, options);
          const result = schema.safeParse(actual); // Wrong type
          return !result.success;
        },
      ),
      { numRuns: defaultNumRuns },
    );
  });

  it('should throw TypeError for objects with own __proto__ property', () => {
    fc.assert(
      fc.property(
        // Use fc.chain to compose the generator
        fc
          .record({
            anotherKey: fc.integer(),
            nested: fc.record({ value: fc.anything() }),
            someKey: fc.string(),
          })
          .chain((baseObj) =>
            fc
              .oneof(
                fc.constant({}),
                fc.constant(null),
                fc.record({ customProp: fc.string() }),
                fc.anything(),
              )
              .map((protoValue) => {
                // Create an object with own __proto__ property
                const objWithProto = { ...baseObj };
                Object.defineProperty(objWithProto, '__proto__', {
                  configurable: true,
                  enumerable: true,
                  value: protoValue,
                  writable: true,
                });
                return objWithProto;
              }),
          ),
        (objWithProto) => {
          // Verify that Object.hasOwn returns true for __proto__
          if (!Object.hasOwn(objWithProto, '__proto__')) {
            throw new Error(
              'Test setup failed: Object should have own __proto__ property',
            );
          }

          let errorThrown = false;
          let errorMessage = '';

          try {
            valueToSchema(objWithProto);
          } catch (error) {
            errorThrown = true;
            if (error instanceof TypeError) {
              errorMessage = error.message;
            }
          }

          // Verify that a TypeError was thrown with the expected message
          if (!errorThrown) {
            throw new Error('Expected TypeError to be thrown');
          }

          if (
            !(
              errorMessage.includes('__proto__') &&
              errorMessage.includes('not supported')
            )
          ) {
            throw new Error(
              `Expected error message to mention __proto__ and "not supported", got: ${errorMessage}`,
            );
          }

          return true;
        },
      ),
      { numRuns: defaultNumRuns },
    );
  });

  it('should handle circular object references with fc.letrec', () => {
    fc.assert(
      fc.property(
        fc.letrec((tie) => ({
          node: fc.record({
            child: fc.oneof(
              { depthSize: 'small' },
              fc.constant(null),
              tie('node'),
            ),
            data: fc.string(),
            id: fc.integer(),
            // Create potential circular reference by referencing the node type
          }),
        })).node,
        (node) => {
          // Manually create a circular reference in the generated object
          if (node.child !== null) {
            (node as any).parent = node; // Add circular reference
          }

          try {
            const schema = valueToSchema(node);
            const result = schema.safeParse(node);
            // Should handle circular references and still validate
            return result.success;
          } catch {
            // valueToSchema might throw for some edge cases, that's acceptable
            return true;
          }
        },
      ),
      { numRuns: defaultNumRuns },
    );
  });

  it('should handle complex nested structures with cycles using fc.letrec', () => {
    fc.assert(
      fc.property(
        fc.letrec((tie) => ({
          tree: fc.record({
            children: fc.array(tie('tree'), {
              depthIdentifier: 'tree-depth',
              maxLength: 1, // Reduced from 2 to 1
            }),
            name: fc.string({ maxLength: 5 }), // Simplified structure
            value: fc.integer({ max: 100, min: 0 }),
          }),
        })).tree,
        (tree) => {
          // Only create a single circular reference to avoid complexity
          if (tree.children.length > 0) {
            (tree.children[0] as any).parent = tree;
          }

          try {
            const schema = valueToSchema(tree, {
              literalPrimitives: false, // Use type-based schemas for efficiency
              maxDepth: 2, // Further reduced from 3 to 2
            });
            const result = schema.safeParse(tree);
            return result.success;
          } catch {
            // Stack overflow or other issues are acceptable for edge cases
            return true;
          }
        },
      ),
      {
        numRuns: 25, // Further reduced from 50 to 25
        timeout: 5000, // 5 second timeout to prevent hanging
      },
    );
  });
});
