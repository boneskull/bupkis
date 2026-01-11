/**
 * Sync Schema-based Assertions Benchmark Suite
 *
 * Tests assertions that use Zod schemas for validation (not function-based).
 * These are pure schema-based assertions without callback functions.
 *
 * Generally faster than function-based equivalents due to optimized schema
 * execution.
 *
 * This suite covers 44 assertions.
 */

import type { BenchmarkDefinition } from './shared/benchmark-generator.js';

import { BupkisAssertionSchemaSync } from '../src/assertion/assertion-sync.js';
import { SyncAssertions } from '../src/assertion/index.js';
import { getTestDataForAssertion } from './shared/assertion-data.js';
import { createSyncBenchmark } from './shared/benchmark-generator.js';
import { SUITE_CONFIGS } from './shared/config.js';

const syncSchemaAssertions = SyncAssertions.filter(
  (assertion): assertion is BupkisAssertionSchemaSync<any, any, any> =>
    assertion instanceof BupkisAssertionSchemaSync,
);

const benchmarks: Record<string, BenchmarkDefinition> = {};

for (const assertion of syncSchemaAssertions) {
  const name = `${assertion}`;
  const testData = getTestDataForAssertion(assertion);

  benchmarks[name] = createSyncBenchmark(
    assertion,
    testData,
    ['sync', 'schema'],
    {},
  );
}

export default {
  suites: {
    'Sync Schema Assertions': {
      benchmarks,
      config: SUITE_CONFIGS['sync-schema'],
    },
  },
};
