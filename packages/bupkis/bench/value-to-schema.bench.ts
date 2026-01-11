/**
 * ValueToSchema Utility Benchmark Suite
 *
 * Tests the valueToSchema() function performance across different input
 * categories and configuration options.
 *
 * Categories tested:
 *
 * - Primitives: Basic types (string, number, boolean, etc.)
 * - Objects: Plain objects with various properties
 * - Arrays: Arrays with different element types
 * - BuiltinObjects: Built-in JS objects (Date, RegExp, etc.)
 *
 * Each category is tested with two option sets:
 *
 * - Default: Standard behavior
 * - LiteralPrimitives: Use literal schemas for primitive values
 *
 * Total: 8 benchmarks (4 categories × 2 option sets)
 */

import fc from 'fast-check';

import type { ValueToSchemaOptions } from '../src/value-to-schema.js';
import type { BenchmarkDefinition } from './shared/benchmark-generator.js';
import type { BenchmarkConfig } from './shared/config.js';

import { valueToSchema } from '../src/value-to-schema.js';
import { valueToSchemaGeneratorFactory } from '../test-data/value-to-schema-generators.js';
import { SUITE_CONFIGS } from './shared/config.js';

const factory = valueToSchemaGeneratorFactory();

const categories = ['primitives', 'objects', 'arrays', 'builtinObjects'];

interface OptionSet {
  name: string;
  options: ValueToSchemaOptions;
}

const optionSets: OptionSet[] = [
  { name: 'default', options: {} },
  { name: 'literal-primitives', options: { literalPrimitives: true } },
];

const testDataCache = new Map<string, unknown[]>();

for (const category of categories) {
  try {
    const generator = factory.createForCategory(category);
    const samples = fc.sample(generator, 50);

    for (const optionSet of optionSets) {
      const key = `${category}-${optionSet.name}`;
      testDataCache.set(key, samples);
    }
  } catch (error) {
    console.warn(
      `Failed to generate test data for category ${category}:`,
      error,
    );
  }
}

const benchmarks: Record<string, BenchmarkDefinition> = {};

for (const category of categories) {
  for (const optionSet of optionSets) {
    const key = `${category}-${optionSet.name}`;
    const testData = testDataCache.get(key);

    if (testData && testData.length > 0) {
      benchmarks[key] = {
        config: {},
        fn() {
          for (const value of testData) {
            valueToSchema(value, optionSet.options);
          }
        },
        tags: ['utility', 'value-to-schema', category],
      };
    }
  }
}

export default {
  suites: {
    'ValueToSchema Utility': {
      benchmarks,
      config: SUITE_CONFIGS['value-to-schema'] as Partial<BenchmarkConfig>,
    },
  },
};
