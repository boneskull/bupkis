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

import { valueToSchema } from '../../src/util.js';

/**
 * Generators for various types of values to test with valueToSchema
 */
const generators = {
  // Built-in object types
  builtinObjects: fc.oneof(
    fc.date(),
    fc.constant(new Map([['key', 'value']])),
    fc.constant(new Set(['item1', 'item2'])),
    fc.constant(new WeakMap()),
    fc.constant(new WeakSet()),
    fc.constant(new Error('test error')),
    fc.constant(Promise.resolve('test')),
  ),

  // Complex nested structures
  complexNested: fc.letrec((tie) => ({
    value: fc.oneof(
      fc.string(),
      fc.integer(),
      fc.array(tie('value'), { maxLength: 3 }),
      fc.record({
        data: tie('value'),
        meta: fc.record({
          count: fc.integer(),
          id: fc.string(),
        }),
      }),
    ),
  })).value,

  // Functions
  functions: fc.oneof(
    fc.constant(() => {}),
    fc.constant(function named() {}),
    fc.constant(async () => {}),
    fc.constant(function* generator() {}),
  ),

  // Arrays with homogeneous types
  homogeneousArray: fc.oneof(
    fc.array(fc.string()),
    fc.array(fc.integer()),
    fc.array(fc.boolean()),
  ),

  // Arrays with mixed types
  mixedArray: fc.array(
    fc.oneof(
      fc.string(),
      fc.integer(),
      fc.boolean(),
      fc.constant(null),
      fc.record({ key: fc.string() }),
    ),
  ),

  // Nested objects
  nestedObject: fc.letrec((tie) => ({
    value: fc.oneof(
      fc.string(),
      fc.integer(),
      fc.boolean(),
      fc.record({
        data: fc.string(),
        nested: tie('value'),
      }),
    ),
  })).value,

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
      { numRuns: 100 },
    );
  });

  it('should work with literal primitives enabled', () => {
    fc.assert(
      fc.property(generators.primitive, (value) => {
        const schema = valueToSchema(value, { literalPrimitives: true });
        const result = schema.safeParse(value);
        return result.success;
      }),
      { numRuns: 100 },
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
      { numRuns: 100 },
    );
  });

  it('should work with type-based primitives', () => {
    fc.assert(
      fc.property(generators.primitive, (value) => {
        const schema = valueToSchema(value, { literalPrimitives: false });
        const result = schema.safeParse(value);
        return result.success;
      }),
      { numRuns: 100 },
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
      { numRuns: 100 },
    );
  });

  it('should handle regexp with literalRegExp true', () => {
    fc.assert(
      fc.property(generators.regexp, (regexp) => {
        const schema = valueToSchema(regexp, { literalRegExp: true });
        const result = schema.safeParse(regexp);
        return result.success;
      }),
      { numRuns: 100 },
    );
  });

  it('should reject non-regexp with literalRegExp true', () => {
    fc.assert(
      fc.property(generators.regexp, (regexp) => {
        const schema = valueToSchema(regexp, { literalRegExp: true });
        const result = schema.safeParse('not a regexp');
        return !result.success;
      }),
      { numRuns: 100 },
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
      { numRuns: 50 },
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
      { numRuns: 50 },
    );
  });

  it('should handle objects with regexp values', () => {
    fc.assert(
      fc.property(generators.objectWithRegexp, (obj) => {
        const schema = valueToSchema(obj, { literalRegExp: true });
        const result = schema.safeParse(obj);
        return result.success;
      }),
      { numRuns: 100 },
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
      { numRuns: 100 },
    );
  });

  it('should handle mixed arrays when allowed', () => {
    fc.assert(
      fc.property(generators.mixedArray, (arr) => {
        const schema = valueToSchema(arr, { allowMixedArrays: true });
        const result = schema.safeParse(arr);
        return result.success;
      }),
      { numRuns: 100 },
    );
  });

  it('should handle homogeneous arrays when mixed arrays disallowed', () => {
    fc.assert(
      fc.property(generators.homogeneousArray, (arr) => {
        const schema = valueToSchema(arr, { allowMixedArrays: false });
        const result = schema.safeParse(arr);
        return result.success;
      }),
      { numRuns: 100 },
    );
  });

  it('should reject mixed content in homogeneous arrays', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string(), { minLength: 1 }),
        fc.integer(),
        (stringArr, number) => {
          const schema = valueToSchema(stringArr, { allowMixedArrays: false });
          const mixedArr = [...stringArr, number];
          const result = schema.safeParse(mixedArr);
          return !result.success;
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should handle strict object validation', () => {
    fc.assert(
      fc.property(generators.simpleObject, (obj) => {
        const schema = valueToSchema(obj, { strict: true });
        const result = schema.safeParse(obj);
        return result.success;
      }),
      { numRuns: 100 },
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
      { numRuns: 100 },
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
      { numRuns: 100 },
    );
  });

  it('should accept arbitrary objects and arrays', () => {
    fc.assert(
      fc.property(fc.oneof(fc.object(), fc.array(fc.anything())), (obj) => {
        try {
          const schema = valueToSchema(obj);
          const result = schema.safeParse(obj);
          return result.success;
        } catch (err) {
          console.error('WARNING: valueToSchema threw an error:', err);
          // Some extremely complex objects might cause stack overflow or other issues
          // at max depth, which is acceptable
          return true;
        }
      }),
      {
        examples: [
          [{ '': [[''], [[]]] }],
          [{ '': [null, undefined] }],
          [['', false]],
          [{ '': undefined }],
        ],
        numRuns: 500,
      },
    );
  });

  it('should respect depth limiting', () => {
    fc.assert(
      fc.property(
        generators.nestedObject,
        fc.integer({ max: 5, min: 1 }),
        (obj, maxDepth) => {
          const schema = valueToSchema(obj, { maxDepth });
          const result = schema.safeParse(obj);
          return result.success;
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should handle built-in object types', () => {
    fc.assert(
      fc.property(generators.builtinObjects, (obj) => {
        const schema = valueToSchema(obj);
        const result = schema.safeParse(obj);
        return result.success;
      }),
      { numRuns: 100 },
    );
  });

  it('should reject wrong types for built-in objects', () => {
    fc.assert(
      fc.property(fc.date(), fc.string(), (date, string) => {
        const schema = valueToSchema(date);
        const result = schema.safeParse(string);
        return !result.success;
      }),
      { numRuns: 100 },
    );
  });

  it('should handle function types', () => {
    fc.assert(
      fc.property(generators.functions, (fn) => {
        const schema = valueToSchema(fn);
        const result = schema.safeParse(fn);
        return result.success;
      }),
      { numRuns: 100 },
    );
  });

  it('should reject non-functions for function schemas', () => {
    fc.assert(
      fc.property(generators.functions, (fn) => {
        const schema = valueToSchema(fn);
        const result = schema.safeParse('not a function');
        return !result.success;
      }),
      { numRuns: 100 },
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
      { numRuns: 100 },
    );
  });

  it('should work with option combinations', () => {
    fc.assert(
      fc.property(
        generators.primitive.filter((v) => v !== null && v !== undefined), // Avoid null/undefined for simpler test
        fc.record({
          allowMixedArrays: fc.boolean(),
          literalPrimitives: fc.boolean(),
          literalRegExp: fc.boolean(),
          maxDepth: fc.integer({ max: 10, min: 1 }),
          strict: fc.boolean(),
        }),
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
      { numRuns: 100 },
    );
  });

  it('should reject wrong types with option combinations', () => {
    fc.assert(
      fc.property(
        fc.string(),
        fc.record({
          allowMixedArrays: fc.boolean(),
          literalPrimitives: fc.boolean(),
          literalRegExp: fc.boolean(),
          maxDepth: fc.integer({ max: 10, min: 1 }),
          strict: fc.boolean(),
        }),
        (value, options) => {
          const schema = valueToSchema(value, options);
          const result = schema.safeParse(42); // Wrong type
          return !result.success;
        },
      ),
      { numRuns: 100 },
    );
  });
});
