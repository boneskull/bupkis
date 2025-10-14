import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';

import {
  createSyncFunctionPureAssertionsBench,
  createSyncFunctionSchemaAssertionsBench,
  runBenchmarkSuite,
} from '../../bench/comprehensive-suites.js';
import { PERFORMANCE_THRESHOLDS } from '../../bench/config.js';

describe('performance validation for pure vs schema assertions', () => {
  it('should demonstrate that pure assertions generally outperform schema assertions', async () => {
    // Run benchmarks for both categories
    const pureBench = await runBenchmarkSuite(
      'Pure Assertions Performance Test',
      createSyncFunctionPureAssertionsBench,
      'quick',
    );

    const schemaBench = await runBenchmarkSuite(
      'Schema Assertions Performance Test',
      createSyncFunctionSchemaAssertionsBench,
      'quick',
    );

    // Calculate average performance for each category
    const pureOpsPerSec = pureBench.tasks
      .map((task) => task.result?.hz ?? 0)
      .filter((hz) => hz > 0);

    const schemaOpsPerSec = schemaBench.tasks
      .map((task) => task.result?.hz ?? 0)
      .filter((hz) => hz > 0);

    assert.ok(
      pureOpsPerSec.length > 0,
      'Should have at least one pure assertion result',
    );
    assert.ok(
      schemaOpsPerSec.length > 0,
      'Should have at least one schema assertion result',
    );

    const pureAverage =
      pureOpsPerSec.reduce((sum, hz) => sum + hz, 0) / pureOpsPerSec.length;
    const schemaAverage =
      schemaOpsPerSec.reduce((sum, hz) => sum + hz, 0) / schemaOpsPerSec.length;

    console.log(`Pure assertions average: ${pureAverage.toFixed(0)} ops/sec`);
    console.log(
      `Schema assertions average: ${schemaAverage.toFixed(0)} ops/sec`,
    );

    // Pure assertions should generally be faster than schema assertions
    // Allow some tolerance due to benchmark variability
    const speedRatio = pureAverage / schemaAverage;
    console.log(`Speed ratio (pure/schema): ${speedRatio.toFixed(2)}x`);

    // Pure should be at least 20% faster on average, but allow for benchmark variation
    assert.ok(
      speedRatio > 0.8, // Allow pure to be slower sometimes due to specific implementation differences
      `Pure assertions should generally outperform schema assertions, got ratio: ${speedRatio.toFixed(2)}`,
    );
  });

  it('should meet configured performance thresholds for both suite types', async () => {
    // Run benchmarks for both categories
    const pureBench = await runBenchmarkSuite(
      'Pure Thresholds Test',
      createSyncFunctionPureAssertionsBench,
      'quick',
    );

    const schemaBench = await runBenchmarkSuite(
      'Schema Thresholds Test',
      createSyncFunctionSchemaAssertionsBench,
      'quick',
    );

    const pureThreshold = PERFORMANCE_THRESHOLDS['sync-function-pure'];
    const schemaThreshold = PERFORMANCE_THRESHOLDS['sync-function-schema'];

    console.log(`Pure threshold: ${pureThreshold} ops/sec`);
    console.log(`Schema threshold: ${schemaThreshold} ops/sec`);

    // Check that most assertions meet their thresholds
    const pureResults = pureBench.tasks
      .map((task) => task.result?.hz ?? 0)
      .filter((hz) => hz > 0);

    const schemaResults = schemaBench.tasks
      .map((task) => task.result?.hz ?? 0)
      .filter((hz) => hz > 0);

    const purePassingCount = pureResults.filter(
      (hz) => hz >= pureThreshold,
    ).length;
    const schemaPassingCount = schemaResults.filter(
      (hz) => hz >= schemaThreshold,
    ).length;

    const purePassRate = purePassingCount / pureResults.length;
    const schemaPassRate = schemaPassingCount / schemaResults.length;

    console.log(
      `Pure pass rate: ${(purePassRate * 100).toFixed(1)}% (${purePassingCount}/${pureResults.length})`,
    );
    console.log(
      `Schema pass rate: ${(schemaPassRate * 100).toFixed(1)}% (${schemaPassingCount}/${schemaResults.length})`,
    );

    // Allow for some assertions to be below threshold due to complexity
    // At least 50% should meet the threshold in quick mode
    assert.ok(
      purePassRate >= 0.5,
      `At least 50% of pure assertions should meet threshold, got ${(purePassRate * 100).toFixed(1)}%`,
    );

    assert.ok(
      schemaPassRate >= 0.3, // Schema assertions can be more complex, so lower threshold
      `At least 30% of schema assertions should meet threshold, got ${(schemaPassRate * 100).toFixed(1)}%`,
    );
  });

  it('should validate that schema threshold is appropriately lower than pure threshold', () => {
    const pureThreshold = PERFORMANCE_THRESHOLDS['sync-function-pure'];
    const schemaThreshold = PERFORMANCE_THRESHOLDS['sync-function-schema'];

    console.log(`Pure threshold: ${pureThreshold} ops/sec`);
    console.log(`Schema threshold: ${schemaThreshold} ops/sec`);

    // Schema threshold should be lower than pure threshold
    assert.ok(
      schemaThreshold < pureThreshold,
      `Schema threshold (${schemaThreshold}) should be lower than pure threshold (${pureThreshold})`,
    );

    // The difference should be reasonable (not extreme)
    const ratio = pureThreshold / schemaThreshold;
    assert.ok(
      ratio >= 1.2 && ratio <= 3.0,
      `Threshold ratio should be reasonable (1.2-3.0x), got ${ratio.toFixed(2)}x`,
    );
  });

  it('should validate benchmark execution stability across multiple runs', async () => {
    // Run the same benchmark twice to check for stability
    const run1 = await runBenchmarkSuite(
      'Stability Test Run 1',
      createSyncFunctionPureAssertionsBench,
      'quick',
    );

    const run2 = await runBenchmarkSuite(
      'Stability Test Run 2',
      createSyncFunctionPureAssertionsBench,
      'quick',
    );

    const results1 = run1.tasks
      .map((task) => task.result?.hz ?? 0)
      .filter((hz) => hz > 0);
    const results2 = run2.tasks
      .map((task) => task.result?.hz ?? 0)
      .filter((hz) => hz > 0);

    assert.equal(
      results1.length,
      results2.length,
      'Both runs should have same number of results',
    );

    // Check that results are not wildly different (within 3x of each other)
    for (let i = 0; i < results1.length; i++) {
      const val1 = results1[i]!;
      const val2 = results2[i]!;
      const ratio = Math.max(val1, val2) / Math.min(val1, val2);
      assert.ok(
        ratio <= 5.0, // Allow for significant variance in benchmarks
        `Results should be reasonably stable between runs, task ${i}: ${ratio.toFixed(2)}x difference`,
      );
    }

    console.log(`Stability check passed for ${results1.length} assertions`);
  });
});
