/**
 * Fast-check generators for valueToSchema() benchmarking.
 *
 * These generators create diverse test inputs that exercise all code paths in
 * valueToSchema() to identify performance bottlenecks.
 */

import * as fc from 'fast-check';

import type { GeneratorOptions } from '../src/types.js';

/**
 * Creates generators for primitive values (string, number, boolean, etc.).
 * These test the basic type detection and schema creation paths.
 */
export const createPrimitiveGenerators = (options: GeneratorOptions = {}) => {
  const { includeEdgeCases = false } = options;

  const baseGenerators = {
    bigint: fc.bigInt(),
    boolean: fc.boolean(),
    number: fc.integer(),
    string: fc.string(),
    symbol: fc.string().map((s) => Symbol(s)),
  };

  if (includeEdgeCases) {
    return {
      ...baseGenerators,
      edgeCases: fc.oneof(
        fc.constant(null),
        fc.constant(undefined),
        fc.constant(''),
        fc.constant(0),
        fc.constant(-0),
        fc.constant(Infinity),
        fc.constant(-Infinity),
        fc.constant(NaN),
      ),
    };
  }

  return baseGenerators;
};

/**
 * Creates generators for special primitive values that might have specific
 * handling in valueToSchema (symbols, bigints, etc.).
 */
export const createSpecialPrimitiveGenerators = (
  options: GeneratorOptions = {},
) => {
  const { includeEdgeCases = false } = options;

  const baseGenerators = {
    infinityValue: fc.constant(Infinity),
    nanValue: fc.constant(NaN),
    nullValue: fc.constant(null),
    undefinedValue: fc.constant(undefined),
  };

  if (includeEdgeCases) {
    return {
      ...baseGenerators,
      negativeInfinity: fc.constant(-Infinity),
      negativeZero: fc.constant(-0),
    };
  }

  return baseGenerators;
};

/**
 * Creates generators for builtin object types (Date, RegExp, Error, etc.).
 * These test object type detection and handling.
 */
export const createBuiltinObjectGenerators = (
  options: GeneratorOptions = {},
) => {
  const { includeEdgeCases = false } = options;

  const baseGenerators = {
    date: fc.date(),
    map: fc
      .array(fc.tuple(fc.string(), fc.integer()), { maxLength: 5 })
      .map((pairs) => new Map(pairs)),
    regexp: fc
      .string()
      .map((s) => new RegExp(s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))),
    set: fc
      .array(fc.oneof(fc.string(), fc.integer()), { maxLength: 5 })
      .map((arr) => new Set(arr)),
  };

  if (includeEdgeCases) {
    return {
      ...baseGenerators,
      emptyMap: fc.constant(new Map()),
      emptySet: fc.constant(new Set()),
      invalidDate: fc.constant(new Date('invalid')),
    };
  }

  return baseGenerators;
};

/**
 * Creates generators for nested structures (objects with objects, arrays with
 * arrays). These test deep recursion and complex structure handling.
 */
export const createNestedStructureGenerators = (
  options: GeneratorOptions = {},
) => {
  const {
    includeEdgeCases = false,
    maxArrayLength = 10,
    maxDepth = 3,
  } = options;

  // Simple nested object
  const nestedObject = fc.record({
    children: fc.array(fc.string(), {
      maxLength: Math.max(1, maxArrayLength / 2),
    }),
    nested: fc.record({
      value: fc.string(),
    }),
    value: fc.string(),
  });

  // Simple nested array
  const nestedArray = fc.array(
    fc.oneof(
      fc.string(),
      fc.integer(),
      maxDepth > 1 ? fc.array(fc.string(), { maxLength: 3 }) : fc.string(),
    ),
    { maxLength: maxArrayLength },
  );

  const baseGenerators = {
    nestedArray,
    nestedObject,
  };

  if (includeEdgeCases) {
    return {
      ...baseGenerators,
      sparse: fc.array(fc.constant(undefined), { maxLength: 5 }),
    };
  }

  return baseGenerators;
};

/**
 * Creates generators for array types. These test array handling paths in
 * valueToSchema.
 */
export const createArrayGenerators = (options: GeneratorOptions = {}) => {
  const { includeEdgeCases = false, maxArrayLength = 10 } = options;

  const baseGenerators = {
    integerArray: fc.array(fc.integer(), { maxLength: maxArrayLength }),
    mixedArray: fc.array(fc.oneof(fc.string(), fc.integer(), fc.boolean()), {
      maxLength: maxArrayLength,
    }),
    stringArray: fc.array(fc.string(), { maxLength: maxArrayLength }),
  };

  if (includeEdgeCases) {
    return {
      ...baseGenerators,
      emptyArray: fc.constant([]),
      sparseArray: fc.array(fc.constant(undefined), { maxLength: 5 }),
    };
  }

  return baseGenerators;
};

/**
 * Creates generators for plain object types. These test object handling paths
 * in valueToSchema.
 */
export const createObjectGenerators = (options: GeneratorOptions = {}) => {
  const { includeEdgeCases = false, maxObjectProperties = 10 } = options;

  const baseGenerators = {
    flatObject: fc.record({
      a: fc.string(),
      b: fc.integer(),
      c: fc.boolean(),
    }),
    variableKeyObject: fc
      .dictionary(fc.string(), fc.oneof(fc.string(), fc.integer()), {
        maxKeys: maxObjectProperties,
      })
      .filter((obj) => !Object.hasOwn(obj, '__proto__')),
  };

  if (includeEdgeCases) {
    return {
      ...baseGenerators,
      emptyObject: fc.constant({}),
    };
  }

  return baseGenerators;
};

/**
 * Factory for creating generators based on test category. This provides a
 * unified interface for benchmark test data generation.
 */
export const valueToSchemaGeneratorFactory = () => ({
  createForAllCategories(options: GeneratorOptions = {}) {
    return fc.oneof(
      fc.oneof(...Object.values(createPrimitiveGenerators(options))),
      fc.oneof(...Object.values(createSpecialPrimitiveGenerators(options))),
      fc.oneof(...Object.values(createBuiltinObjectGenerators(options))),
      fc.oneof(...Object.values(createArrayGenerators(options))),
      fc.oneof(...Object.values(createObjectGenerators(options))),
      fc.oneof(...Object.values(createNestedStructureGenerators(options))),
    );
  },

  createForCategory(category: string, options: GeneratorOptions = {}) {
    switch (category) {
      case 'arrays':
        return fc.oneof(...Object.values(createArrayGenerators(options)));
      case 'builtin':
      case 'builtinObjects':
        return fc.oneof(
          ...Object.values(createBuiltinObjectGenerators(options)),
        );
      case 'functions':
        return fc.func(fc.string());
      case 'nested':
      case 'nestedObjects':
      case 'nestedStructures':
        return fc.oneof(
          ...Object.values(createNestedStructureGenerators(options)),
        );
      case 'objects':
        return fc.oneof(...Object.values(createObjectGenerators(options)));
      case 'primitive':
      case 'primitives':
        return fc.oneof(...Object.values(createPrimitiveGenerators(options)));
      case 'special':
      case 'specialPrimitives':
        return fc.oneof(
          ...Object.values(createSpecialPrimitiveGenerators(options)),
        );
      default:
        throw new Error(`Unknown category: ${category}`);
    }
  },
});
