/**
 * Async Function Assertions Benchmark Suite
 *
 * Tests function-based async assertions that use callback functions for Promise
 * validation.
 *
 * Includes reject/resolve patterns with parameter validation. This suite covers
 * 8 assertions.
 */

import type { BenchmarkDefinition } from './shared/benchmark-generator.js';
import type { BenchmarkConfig } from './shared/config.js';

import { BupkisAssertionFunctionAsync } from '../src/assertion/assertion-async.js';
import { AsyncAssertions } from '../src/assertion/index.js';
import { getTestDataForAssertion } from './shared/assertion-data.js';
import { createAsyncBenchmark } from './shared/benchmark-generator.js';
import { SUITE_CONFIGS } from './shared/config.js';

const asyncFunctionAssertions = AsyncAssertions.filter(
  (assertion): assertion is BupkisAssertionFunctionAsync<any, any, any> =>
    assertion instanceof BupkisAssertionFunctionAsync,
);

const benchmarks: Record<string, BenchmarkDefinition> = {};

for (const assertion of asyncFunctionAssertions) {
  const name = `${assertion}`;
  const testData = getTestDataForAssertion(assertion);

  benchmarks[name] = createAsyncBenchmark(
    assertion,
    testData,
    ['async', 'function'],
    {},
  );
}

export default {
  suites: {
    'Async Function Assertions': {
      benchmarks,
      config: SUITE_CONFIGS['async-function'] as Partial<BenchmarkConfig>,
    },
  },
};
