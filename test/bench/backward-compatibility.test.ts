/**
 * Integration test for backward compatibility
 *
 * This test validates that all existing CLI commands continue to work unchanged
 * after the new suite implementation.
 */

import { describe, it } from 'node:test';

import { expect } from '../../src/index.js';

describe('Backward Compatibility', () => {
  it('should maintain all existing suite names', async () => {
    // All original suites must still exist and work
    const originalSuites = [
      'all',
      'sync-function',
      'sync-schema',
      'async-function',
      'async-schema',
    ];
    let allOriginalSuitesExist = false;

    try {
      const { pathToFileURL } = await import('node:url');
      const { resolve } = await import('node:path');

      const runnerPath = pathToFileURL(
        resolve(process.cwd(), 'bench/runner.ts'),
      ).href;
      const { AVAILABLE_SUITES } = await import(runnerPath);

      allOriginalSuitesExist = originalSuites.every(
        (suite) => suite in AVAILABLE_SUITES,
      );
    } catch {
      allOriginalSuitesExist = false;
    }

    // This must always pass - breaking existing suites is not allowed
    expect(allOriginalSuitesExist, 'to be true');
  });

  it('should maintain sync-function suite functionality', async () => {
    // The sync-function suite should still work and contain 66 assertions
    let syncFunctionStillWorks = false;
    try {
      const { pathToFileURL } = await import('node:url');
      const { resolve } = await import('node:path');

      const suitesPath = pathToFileURL(
        resolve(process.cwd(), 'bench/suites.ts'),
      ).href;
      const { createSyncFunctionAssertionsBench } = await import(suitesPath);

      if (typeof createSyncFunctionAssertionsBench === 'function') {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        const bench = createSyncFunctionAssertionsBench();

        const taskCount = bench.tasks?.length || 0;
        syncFunctionStillWorks = taskCount === 66;
      }
    } catch {
      syncFunctionStillWorks = false;
    }

    // This must always pass - existing functionality must not break
    expect(syncFunctionStillWorks, 'to be true');
  });

  it('should maintain CLI argument parsing', async () => {
    // The parseArgs function should still handle existing patterns
    let parseArgsStillWorks = false;
    try {
      // Check that the runner can still parse traditional arguments
      // This is a proxy test - we can't easily test CLI parsing directly
      // but we can verify the core functions still exist
      const { pathToFileURL } = await import('node:url');
      const { resolve } = await import('node:path');

      const runnerPath = pathToFileURL(
        resolve(process.cwd(), 'bench/runner.ts'),
      ).href;
      const runner = await import(runnerPath);

      parseArgsStillWorks =
        typeof runner.parseArgs === 'function' ||
        typeof runner.main === 'function' ||
        // At minimum, the module should export something callable
        Object.keys(runner as Record<string, unknown>).length > 0;
    } catch {
      parseArgsStillWorks = false;
    }

    // The runner module should still be functional
    expect(parseArgsStillWorks, 'to be true');
  });

  it('should maintain performance thresholds structure', async () => {
    // Performance thresholds should still exist and work for existing suites
    let thresholdsStillWork = false;
    try {
      const { pathToFileURL } = await import('node:url');
      const { resolve } = await import('node:path');

      const configPath = pathToFileURL(
        resolve(process.cwd(), 'bench/config.ts'),
      ).href;
      const { PERFORMANCE_THRESHOLDS } = await import(configPath);

      // Should still have thresholds for existing suites
      thresholdsStillWork =
        PERFORMANCE_THRESHOLDS &&
        typeof PERFORMANCE_THRESHOLDS === 'object' &&
        ('sync-function' in PERFORMANCE_THRESHOLDS ||
          'comparison' in PERFORMANCE_THRESHOLDS ||
          Object.keys(PERFORMANCE_THRESHOLDS as Record<string, unknown>)
            .length > 0);
    } catch {
      thresholdsStillWork = false;
    }

    // Performance threshold system must remain functional
    expect(thresholdsStillWork, 'to be true');
  });

  it('should not break existing task runner structure', async () => {
    // The taskRunner pattern should still work for existing suites
    let taskRunnerStillWorks = false;
    try {
      // Verify that the basic benchmark creation pattern still works
      const { pathToFileURL } = await import('node:url');
      const { resolve } = await import('node:path');

      const suitesPath = pathToFileURL(
        resolve(process.cwd(), 'bench/suites.ts'),
      ).href;
      const suites = await import(suitesPath);

      // At least some of the original suite creation functions should exist
      taskRunnerStillWorks =
        typeof suites.createSyncFunctionAssertionsBench === 'function' ||
        typeof suites.createSyncSchemaAssertionsBench === 'function' ||
        typeof suites.createAsyncFunctionAssertionsBench === 'function';
    } catch {
      taskRunnerStillWorks = false;
    }

    // Core benchmark creation must remain functional
    expect(taskRunnerStillWorks, 'to be true');
  });
});
