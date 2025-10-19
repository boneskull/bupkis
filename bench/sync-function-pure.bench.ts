/**
 * Sync Function Pure Assertions Benchmark Suite
 *
 * Tests pure function-based sync assertions that return boolean or
 * AssertionFailure objects directly (no schema generation).
 *
 * These are typically the fastest assertion type due to minimal overhead.
 * Examples: Set operations, function error validation.
 */

import type { BenchmarkDefinition } from './shared/benchmark-generator.js';
import type { BenchmarkConfig } from './shared/config.js';

import { getSyncFunctionAssertions } from './assertion-classifier.js';
import { getTestDataForAssertion } from './shared/assertion-data.js';
import { createSyncBenchmark } from './shared/benchmark-generator.js';
import { SUITE_CONFIGS } from './shared/config.js';

const { pure } = getSyncFunctionAssertions();

const benchmarks: Record<string, BenchmarkDefinition> = {};

for (const assertion of pure) {
  const name = `${assertion}`;
  const testData = getTestDataForAssertion(assertion);

  benchmarks[name] = createSyncBenchmark(
    assertion,
    testData,
    ['sync', 'function', 'pure'],
    {},
  );
}

export default {
  suites: {
    'Sync Function Pure Assertions': {
      benchmarks,
      config: SUITE_CONFIGS['sync-function-pure'] as Partial<BenchmarkConfig>,
    },
  },
};
