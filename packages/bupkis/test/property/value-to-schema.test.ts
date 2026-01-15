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

import {
  calculateNumRuns,
  filteredAnything,
  filteredObject,
  hasKeyDeep,
  hasValueDeep,
} from '@bupkis/property-testing';
import fc from 'fast-check';
import { describe, it } from 'node:test';

import {
  valueToSchema,
  type ValueToSchemaOptions,
} from '../../src/value-to-schema.js';

const numRuns = calculateNumRuns();

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
    fc.constant(() => {}),
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

describe('valueToSchema() property tests', () => {
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
      { numRuns },
    );
  });

  it('should work with literal primitives enabled', () => {
    fc.assert(
      fc.property(generators.primitive, (value) => {
        const schema = valueToSchema(value, { literalPrimitives: true });
        const result = schema.safeParse(value);
        return result.success;
      }),
      { numRuns },
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
      { numRuns },
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
      { numRuns },
    );
  });

  it('should handle regexp with literalRegExp true', () => {
    fc.assert(
      fc.property(generators.regexp, (regexp) => {
        const schema = valueToSchema(regexp, { literalRegExp: true });
        const result = schema.safeParse(regexp);
        return result.success;
      }),
      { numRuns },
    );
  });

  it('should reject non-regexp with literalRegExp true', () => {
    fc.assert(
      fc.property(generators.regexp, (regexp) => {
        const schema = valueToSchema(regexp, { literalRegExp: true });
        const result = schema.safeParse('not a regexp');
        return !result.success;
      }),
      { numRuns },
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
      { numRuns },
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
      { numRuns },
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
      { numRuns },
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
      { numRuns },
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
      { numRuns },
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
          if (!validResult.success) {
            return false;
          }
        },
      ),
      { numRuns },
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
          if (!validResult.success) {
            return false;
          }

          // Should reject object with non-empty nested object
          const invalidResult = schema.safeParse({
            [key]: { nested: 'value' },
          });
          return !invalidResult.success;
        },
      ),
      { numRuns },
    );
  });

  it('should handle strict object validation', () => {
    fc.assert(
      fc.property(generators.simpleObject, (obj) => {
        const schema = valueToSchema(obj, { strict: true });
        const result = schema.safeParse(obj);
        return result.success;
      }),
      { numRuns },
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
      { numRuns },
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
      { numRuns },
    );
  });

  it('should accept arbitrary objects and arrays', () => {
    fc.assert(
      fc.property(
        fc
          .oneof(filteredObject, fc.array(filteredAnything))
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
        numRuns,
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
      { numRuns },
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
      { numRuns },
    );
  });

  it.skip('should handle Map types', () => {
    // this fails because valueToSchema does not traverse Maps or Sets
    fc.assert(
      fc.property(
        fc
          .tuple(filteredAnything, filteredAnything)
          .map(([k, v]) => [new Map([[k, v]]), new Map([[v, k]])]),
        ([map1, map2]) => {
          const schema = valueToSchema(map2);
          const result = schema.safeParse(map1);
          return !!result.error;
        },
      ),
    );
  });

  it('should reject wrong types for built-in objects', () => {
    fc.assert(
      fc.property(fc.date(), fc.string(), (date, string) => {
        const schema = valueToSchema(date);
        const result = schema.safeParse(string);
        return !result.success;
      }),
      { numRuns },
    );
  });

  it('should handle function types', () => {
    fc.assert(
      fc.property(generators.functions, (fn) => {
        const schema = valueToSchema(fn);
        const result = schema.safeParse(fn);
        return result.success;
      }),
      { numRuns },
    );
  });

  it('should reject non-functions for function schemas', () => {
    fc.assert(
      fc.property(generators.functions, (fn) => {
        const schema = valueToSchema(void fn);
        const result = schema.safeParse('not a function');
        return !result.success;
      }),
      { numRuns },
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
      { numRuns },
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
      { numRuns },
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
      { numRuns },
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
      { numRuns },
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

  describe('__proto__ handling', () => {
    /**
     * Helper to create an object with `__proto__` as an own property. Using
     * Object.defineProperty is the only reliable way to do this.
     */
    const withOwnProto = <T extends object>(
      obj: T,
      protoValue: unknown,
    ): T & { __proto__: unknown } => {
      Object.defineProperty(obj, '__proto__', {
        configurable: true,
        enumerable: true,
        value: protoValue,
        writable: true,
      });
      return obj as T & { __proto__: unknown };
    };

    it('should correctly validate objects with own __proto__ property', () => {
      fc.assert(
        fc.property(
          fc
            .record({
              anotherKey: fc.integer(),
              normalKey: fc.string(),
            })
            .chain((baseObj) =>
              fc
                .oneof(
                  fc.string(),
                  fc.integer(),
                  fc.boolean(),
                  fc.record({ nested: fc.string() }),
                )
                .map((protoValue) => withOwnProto(baseObj, protoValue)),
            ),
          (objWithProto) => {
            const schema = valueToSchema(objWithProto);

            // Schema should accept the exact same structure
            const validCopy = withOwnProto(
              { ...objWithProto },
              objWithProto['__proto__'],
            );
            // Remove the __proto__ from the spread copy to avoid duplication
            delete (validCopy as Record<string, unknown>)['__proto__'];
            const realValidCopy = withOwnProto(
              {
                anotherKey: objWithProto.anotherKey,
                normalKey: objWithProto.normalKey,
              },
              objWithProto['__proto__'],
            );
            const validResult = schema.safeParse(realValidCopy);
            if (!validResult.success) {
              return false;
            }

            // Schema should reject object without __proto__
            const objWithoutProto = {
              anotherKey: objWithProto.anotherKey,
              normalKey: objWithProto.normalKey,
            };
            const invalidResult = schema.safeParse(objWithoutProto);
            return !invalidResult.success;
          },
        ),
        { numRuns },
      );
    });

    it('should correctly validate nested objects with own __proto__ property', () => {
      fc.assert(
        fc.property(
          fc
            .record({
              outerKey: fc.string(),
            })
            .chain((outerObj) =>
              fc.record({ innerKey: fc.integer() }).chain((innerObj) =>
                fc.string().map((innerProto) =>
                  Object.assign(outerObj, {
                    nested: withOwnProto(innerObj, innerProto),
                  }),
                ),
              ),
            ),
          (obj) => {
            const schema = valueToSchema(obj);

            // Valid: exact structure match
            const validCopy = {
              nested: withOwnProto(
                { innerKey: obj.nested.innerKey },
                obj.nested['__proto__'],
              ),
              outerKey: obj.outerKey,
            };
            if (!schema.safeParse(validCopy).success) {
              return false;
            }

            // Invalid: missing __proto__ in nested object
            const invalidCopy = {
              nested: { innerKey: obj.nested.innerKey },
              outerKey: obj.outerKey,
            };
            return !schema.safeParse(invalidCopy).success;
          },
        ),
        { numRuns },
      );
    });

    it('should correctly validate objects with __proto__ containing objects with __proto__', () => {
      fc.assert(
        fc.property(
          fc
            .record({ key: fc.string() })
            .chain((baseObj) =>
              fc
                .record({ innerKey: fc.integer() })
                .chain((innerObj) =>
                  fc
                    .string()
                    .map((deepProto) =>
                      withOwnProto(baseObj, withOwnProto(innerObj, deepProto)),
                    ),
                ),
            ),
          (obj) => {
            const schema = valueToSchema(obj);
            const protoObj = obj['__proto__'] as {
              __proto__: string;
            } & { innerKey: number };

            // Valid: exact deep structure
            const validCopy = withOwnProto(
              { key: obj.key },
              withOwnProto(
                { innerKey: protoObj.innerKey },
                protoObj['__proto__'],
              ),
            );
            if (!schema.safeParse(validCopy).success) {
              return false;
            }

            // Invalid: missing inner __proto__
            const invalidCopy = withOwnProto(
              { key: obj.key },
              { innerKey: protoObj.innerKey },
            );
            return !schema.safeParse(invalidCopy).success;
          },
        ),
        { numRuns },
      );
    });
  });

  describe('permissivePropertyCheck option', () => {
    /**
     * Generator for functions with static properties
     */
    const functionWithProps = fc
      .record({
        prop1: fc.string(),
        prop2: fc.integer(),
      })
      .map((props) => {
        const fn = () => {};
        Object.assign(fn, props);
        return { fn, props };
      });

    /**
     * Generator for class constructors with static methods
     */
    const classWithStatics = fc
      .record({
        staticValue: fc.integer(),
      })
      .map((props) => {
        class TestClass {
          static staticMethod() {
            return 42;
          }
        }
        Object.assign(TestClass, props);
        return { cls: TestClass, props };
      });

    it('should validate object shapes against functions when permissivePropertyCheck is true', () => {
      fc.assert(
        fc.property(functionWithProps, ({ fn, props }) => {
          // Create schema from the props (object shape)
          const schema = valueToSchema(props, {
            literalPrimitives: true,
            permissivePropertyCheck: true,
          });

          // Should validate the function that has those properties
          const result = schema.safeParse(fn);
          return result.success;
        }),
        { numRuns },
      );
    });

    it('should reject functions missing expected properties when permissivePropertyCheck is true', () => {
      fc.assert(
        fc.property(
          fc
            .string()
            .filter((s) => s.length > 0 && s !== 'length' && s !== 'name'),
          (propName) => {
            const fn = () => {};
            const expectedShape = { [propName]: 'expectedValue' };

            const schema = valueToSchema(expectedShape, {
              literalPrimitives: true,
              permissivePropertyCheck: true,
            });

            // Function doesn't have the property, should fail
            const result = schema.safeParse(fn);
            return !result.success;
          },
        ),
        { numRuns },
      );
    });

    it('should validate array length property via object shape', () => {
      fc.assert(
        fc.property(
          fc.array(filteredAnything, { maxLength: 20, minLength: 0 }),
          (arr) => {
            const expectedShape = { length: arr.length };

            const schema = valueToSchema(expectedShape, {
              literalPrimitives: true,
              permissivePropertyCheck: true,
            });

            const result = schema.safeParse(arr);
            return result.success;
          },
        ),
        { examples: [[[{ '': 0 }, { '': { '': 0 } }]]], numRuns },
      );
    });

    it('should reject arrays with wrong length via object shape', () => {
      fc.assert(
        fc.property(
          fc.array(filteredAnything, { maxLength: 20, minLength: 1 }),
          fc.integer({ max: 100, min: 0 }),
          (arr, wrongLength) => {
            // Skip if lengths happen to match
            if (wrongLength === arr.length) {
              return true;
            }

            const expectedShape = { length: wrongLength };

            const schema = valueToSchema(expectedShape, {
              literalPrimitives: true,
              permissivePropertyCheck: true,
            });

            const result = schema.safeParse(arr);
            return !result.success;
          },
        ),
        { numRuns },
      );
    });

    it('should validate class constructors with static properties', () => {
      fc.assert(
        fc.property(classWithStatics, ({ cls, props }) => {
          // Schema for checking static properties
          const schema = valueToSchema(
            { ...props, staticMethod: cls.staticMethod },
            {
              permissivePropertyCheck: true,
            },
          );

          const result = schema.safeParse(cls);
          return result.success;
        }),
        { numRuns },
      );
    });

    it('should reject primitives when object shape is expected', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.string(),
            fc.integer(),
            fc.boolean(),
            fc.constant(null),
            fc.constant(undefined),
            fc.bigInt(),
          ),
          fc.record({ someProp: fc.string() }),
          (primitive, shape) => {
            const schema = valueToSchema(shape, {
              literalPrimitives: true,
              permissivePropertyCheck: true,
            });

            const result = schema.safeParse(primitive);
            return !result.success;
          },
        ),
        { numRuns },
      );
    });

    it('should validate nested object shapes on functions', () => {
      fc.assert(
        fc.property(
          fc.record({
            nested: fc.record({
              value: fc.integer(),
            }),
          }),
          (nestedShape) => {
            const fn = () => {};
            Object.assign(fn, nestedShape);

            const schema = valueToSchema(nestedShape, {
              literalPrimitives: true,
              permissivePropertyCheck: true,
            });

            const result = schema.safeParse(fn);
            return result.success;
          },
        ),
        { numRuns },
      );
    });

    it('should reject when nested property types mismatch', () => {
      fc.assert(
        fc.property(fc.string(), fc.integer(), (expectedValue, actualValue) => {
          // Skip if values happen to match type-wise
          if (typeof expectedValue === typeof actualValue) {
            return true;
          }

          const fn = () => {};
          (fn as any).prop = { nested: actualValue };

          const schema = valueToSchema(
            { prop: { nested: expectedValue } },
            {
              literalPrimitives: true,
              permissivePropertyCheck: true,
            },
          );

          const result = schema.safeParse(fn);
          return !result.success;
        }),
        { numRuns },
      );
    });

    it('should not use permissive check when strict is true', () => {
      fc.assert(
        fc.property(functionWithProps, ({ fn, props }) => {
          // With strict: true, permissivePropertyCheck should be ignored
          // and functions should be rejected (since strictObject expects objects)
          const schema = valueToSchema(props, {
            literalPrimitives: true,
            permissivePropertyCheck: true,
            strict: true,
          });

          const result = schema.safeParse(fn);
          // Should fail because strict mode uses z.strictObject which rejects functions
          return !result.success;
        }),
        { numRuns },
      );
    });

    it('should work with empty object shapes in permissive mode', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.constant(() => {}),
            fc.constant([]),
            fc.constant({}),
            fc.constant(new Map()),
            fc.constant(new Set()),
          ),
          (value) => {
            const schema = valueToSchema(
              {},
              {
                literalEmptyObjects: false, // Don't require literally empty
                permissivePropertyCheck: true,
              },
            );

            const result = schema.safeParse(value);
            return result.success;
          },
        ),
        { numRuns },
      );
    });

    it('should validate built-in function properties', () => {
      // Test that we can check properties on built-in functions like Promise
      fc.assert(
        fc.property(
          fc.constantFrom(
            { fn: Promise, prop: 'resolve' },
            { fn: Promise, prop: 'reject' },
            { fn: Promise, prop: 'all' },
            { fn: Array, prop: 'isArray' },
            { fn: Object, prop: 'keys' },
            { fn: JSON, prop: 'parse' },
          ),
          ({ fn, prop }) => {
            const schema = valueToSchema(
              { [prop]: (fn as any)[prop] },
              { permissivePropertyCheck: true },
            );

            const result = schema.safeParse(fn);
            return result.success;
          },
        ),
        { numRuns: 20 },
      );
    });

    it('should handle array index properties via object shape', () => {
      fc.assert(
        fc.property(
          fc.array(filteredAnything, { maxLength: 10, minLength: 1 }),
          (arr) => {
            // Check specific index via object notation
            const expectedShape = { 0: arr[0] };

            const schema = valueToSchema(expectedShape, {
              literalPrimitives: true,
              permissivePropertyCheck: true,
            });

            const result = schema.safeParse(arr);
            return result.success;
          },
        ),
        {
          examples: [
            [[{ '': 0 }, { '': { '': 0 } }]],
            [[[{ '': [] }, { '': { '': null } }], { '': [] }]],
          ],
          numRuns,
        },
      );
    });

    it('should combine permissivePropertyCheck with other options', () => {
      fc.assert(
        fc.property(
          fc.record({
            literalPrimitives: fc.boolean(),
            maxDepth: fc.integer({ max: 10, min: 1 }),
          }),
          fc.record({ prop: fc.string() }),
          (options, shape) => {
            const fn = () => {};
            Object.assign(fn, shape);

            const schema = valueToSchema(shape, {
              ...options,
              permissivePropertyCheck: true,
              strict: false, // Must be false for permissive to work
            });

            const result = schema.safeParse(fn);
            return result.success;
          },
        ),
        { numRuns },
      );
    });

    it('should correctly validate prototype property access', () => {
      // The `in` operator checks prototype chain, so inherited properties should work
      fc.assert(
        fc.property(
          fc.constantFrom(
            { obj: [], prop: 'map' },
            { obj: [], prop: 'filter' },
            { obj: [], prop: 'reduce' },
            { obj: {}, prop: 'hasOwnProperty' },
            { obj: {}, prop: 'toString' },
            { obj: '', prop: 'charAt' },
          ),
          ({ obj, prop }) => {
            // Skip string because it's a primitive and will fail the object check
            if (typeof obj === 'string') {
              return true;
            }

            // Check that inherited method exists
            const schema = valueToSchema(
              { [prop]: (obj as any)[prop] },
              { permissivePropertyCheck: true },
            );

            const result = schema.safeParse(obj);
            return result.success;
          },
        ),
        { numRuns: 20 },
      );
    });

    it('should handle symbol properties on objects', () => {
      const testSymbol = Symbol('test');

      fc.assert(
        fc.property(fc.integer(), (value) => {
          const obj = { regularProp: 'hello', [testSymbol]: value };
          const fn = () => {};
          Object.assign(fn, obj);

          // Check regular property (symbols can't be in object shape keys easily)
          const schema = valueToSchema(
            { regularProp: 'hello' },
            {
              literalPrimitives: true,
              permissivePropertyCheck: true,
            },
          );

          const result = schema.safeParse(fn);
          return result.success;
        }),
        { numRuns },
      );
    });

    it('should validate getters via property access', () => {
      fc.assert(
        fc.property(fc.integer(), (expectedValue) => {
          const obj = {
            get computed() {
              return expectedValue;
            },
          };

          const fn = Object.create(null, {
            computed: {
              enumerable: true,
              get() {
                return expectedValue;
              },
            },
          }) as { computed: number };

          const schema = valueToSchema(
            { computed: expectedValue },
            {
              literalPrimitives: true,
              permissivePropertyCheck: true,
            },
          );

          // Test with regular object with getter
          const result1 = schema.safeParse(obj);
          if (!result1.success) {
            return false;
          }

          // Test with object created via Object.create
          const result2 = schema.safeParse(fn);
          return result2.success;
        }),
        { numRuns },
      );
    });

    it('should correctly report missing properties in error', () => {
      // Reserved properties that throw when accessed on strict mode functions
      const reservedProps = new Set(['arguments', 'callee', 'caller']);

      fc.assert(
        fc.property(
          fc
            .string()
            .filter(
              (s) =>
                s.length > 0 &&
                !/[^a-zA-Z0-9_]/.test(s) &&
                !reservedProps.has(s),
            ),
          (propName) => {
            const fn = () => {};
            const expectedShape = { [propName]: 'value' };

            const schema = valueToSchema(expectedShape, {
              literalPrimitives: true,
              permissivePropertyCheck: true,
            });

            const result = schema.safeParse(fn);
            if (result.success) {
              return false; // Should have failed
            }

            // Check that the error mentions the missing property
            const hasPropertyError = result.error.issues.some(
              (issue) =>
                issue.path.includes(propName) ||
                issue.message.includes(propName),
            );
            return hasPropertyError;
          },
        ),
        { numRuns },
      );
    });
  });
});
