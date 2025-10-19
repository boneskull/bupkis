/**
 * Sync Function Schema Assertions Benchmark Suite
 *
 * Tests function-based sync assertions that return Zod schemas or
 * AssertionParseRequest objects.
 *
 * More complex than pure functions but still function-based implementations.
 * Examples: Collection operations, type checking, comparison assertions.
 *
 * This suite covers 59 assertions.
 */

import type { BenchmarkDefinition } from './shared/benchmark-generator.js';
import type { BenchmarkConfig } from './shared/config.js';

import { getSyncFunctionAssertions } from './assertion-classifier.js';
import { getTestDataForAssertion } from './shared/assertion-data.js';
import { createSyncBenchmark } from './shared/benchmark-generator.js';
import { SUITE_CONFIGS } from './shared/config.js';

const { schema } = getSyncFunctionAssertions();

const benchmarks: Record<string, BenchmarkDefinition> = {};

for (const assertion of schema) {
  const name = `${assertion}`;
  const testData = getTestDataForAssertion(assertion);

  benchmarks[name] = createSyncBenchmark(
    assertion,
    testData,
    ['sync', 'function', 'schema-returning'],
    {},
  );
}

export default {
  suites: {
    'Sync Function Schema Assertions': {
      benchmarks,
      config: SUITE_CONFIGS['sync-function-schema'] as Partial<BenchmarkConfig>,
    },
  },
};
