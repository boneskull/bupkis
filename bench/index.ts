/**
 * Performance benchmarks for Bupkis assertion library.
 *
 * This module sets up and runs benchmarks to monitor performance
 * characteristics of the assertion library, helping identify performance
 * regressions and optimization opportunities.
 */

import { Bench } from 'tinybench';

import { expect } from '../src/index.js';
import {
  checkPerformance,
  DEFAULT_BENCH_CONFIG,
  formatResults,
  TEST_DATA,
} from './config.js';

// Create a benchmark suite
const bench = new Bench(DEFAULT_BENCH_CONFIG);

// Basic assertion benchmarks
bench
  .add('Basic type assertion - string', () => {
    expect('hello', 'to be a string');
  })
  .add('Basic type assertion - number', () => {
    expect(42, 'to be a number');
  })
  .add('Basic type assertion - boolean', () => {
    expect(true, 'to be a boolean');
  })
  .add('Basic equality assertion', () => {
    expect('hello', 'to equal', 'hello');
  })
  .add('Array contains assertion', () => {
    expect([1, 2, 3, 4, 5], 'to contain', 3);
  })
  .add('Object property assertion', () => {
    expect(TEST_DATA.simpleObject(), 'to have key', 'b');
  })
  .add('String matching assertion', () => {
    expect('hello world', 'to match', /world/);
  })
  .add('Complex nested object assertion', () => {
    expect(TEST_DATA.nestedObject(), 'to have key', 'user.name');
  })
  .add('Large array contains assertion', () => {
    expect(TEST_DATA.largeArray(100), 'to contain', 50);
  })
  .add('Deep object property assertion', () => {
    expect(
      TEST_DATA.deepObject(),
      'to have key',
      'level1.level2.level3.level4.value',
    );
  });

// Run the benchmarks
const runBenchmarks = async (): Promise<void> => {
  console.log('🚀 Running Bupkis performance benchmarks...\n');

  await bench.run();

  console.log('\n📊 Benchmark Results:');
  console.table(bench.table());

  // Use the formatting utilities
  const results = formatResults(bench.tasks);
  const performanceCheck = checkPerformance(results);

  // Log additional statistics
  console.log('\n📈 Detailed Results:');
  for (const result of results) {
    console.log(`\n${result.name}:`);
    console.log(`  Average: ${result.average.toFixed(2)}ms`);
    console.log(`  Ops/sec: ${result.opsPerSec}`);
    console.log(`  Min: ${result.min.toFixed(2)}ms`);
    console.log(`  Max: ${result.max.toFixed(2)}ms`);
    console.log(
      `  Standard Deviation: ${result.standardDeviation.toFixed(2)}ms`,
    );
  }

  // Performance check results
  if (performanceCheck.passed) {
    console.log('\n✅ All benchmarks performed within acceptable limits!');
  } else {
    console.log('\n⚠️  Performance Warning:');
    console.log('The following tasks exceeded performance thresholds:');
    for (const warning of performanceCheck.warnings) {
      console.log(`  - ${warning}`);
    }
  }
};

// Error handling
runBenchmarks().catch((error) => {
  console.error('❌ Benchmark failed:', error);
  process.exit(1);
});
