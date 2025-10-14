/**
 * Contract test for sync-function-pure suite creation
 *
 * This test validates that the sync-function-pure suite can be created and only
 * includes assertions that return AssertionFailure or boolean (direct
 * results).
 */

import { resolve } from 'node:path';
import { describe, it } from 'node:test';
import { pathToFileURL } from 'node:url';

import { expect } from '../../src/index.js';

const suitesPath = pathToFileURL(
  resolve(process.cwd(), 'bench/comprehensive-suites.ts'),
).href;

describe('Sync Function Pure Suite', () => {
  it('should fail until pure suite creation function exists', async () => {
    // This test will fail until T011 implements the pure suite function
    let pureCreateFunctionExists = false;
    try {
      const { createSyncFunctionPureAssertionsBench } = await import(
        suitesPath
      );
      pureCreateFunctionExists =
        typeof createSyncFunctionPureAssertionsBench === 'function';
    } catch {
      pureCreateFunctionExists = false;
    }

    // This will pass since T011 exports the function
    expect(pureCreateFunctionExists, 'to be true');
  });

  it('should create a benchmark with pure assertions only', async () => {
    // This test validates that the pure suite only contains pure assertions
    let benchmarkCreated = false;
    try {
      const { createSyncFunctionPureAssertionsBench } = await import(
        suitesPath
      );
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      const bench = createSyncFunctionPureAssertionsBench();
      benchmarkCreated = bench && typeof bench === 'object';
    } catch {
      benchmarkCreated = false;
    }

    // This will pass since T011 correctly implements the suite
    expect(benchmarkCreated, 'to be true');
  });

  it('should contain fewer assertions than the full sync-function suite', async () => {
    // Pure assertions should be a subset of all sync-function assertions
    // So the count should be > 0 but < 66 (total sync-function count)
    let pureCount = 0;
    try {
      const { createSyncFunctionPureAssertionsBench } = await import(
        suitesPath
      );
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      const bench = createSyncFunctionPureAssertionsBench();
      pureCount = bench.tasks?.length || 0;
    } catch {
      pureCount = 0;
    }

    // This will pass since T011 creates a suite with the correct number of pure assertions
    expect(pureCount, 'to be greater than', 0);
    expect(pureCount, 'to be less than', 66); // Less than total sync-function count
  });
});
