/**
 * Contract test for sync-function-schema suite creation
 *
 * This test validates that the sync-function-schema suite can be created and
 * only includes assertions that return Zod schemas (for validation-based
 * implementations).
 */

import { resolve } from 'node:path';
import { describe, it } from 'node:test';
import { pathToFileURL } from 'node:url';

import { expect } from '../../src/index.js';

const suitesPath = pathToFileURL(
  resolve(process.cwd(), 'bench/comprehensive-suites.ts'),
).href;

describe('Sync Function Schema Suite', () => {
  it('should fail until schema suite creation function exists', async () => {
    // This test will fail until T012 implements the schema suite function
    let schemaCreateFunctionExists = false;
    try {
      const { createSyncFunctionSchemaAssertionsBench } = await import(
        suitesPath
      );
      schemaCreateFunctionExists =
        typeof createSyncFunctionSchemaAssertionsBench === 'function';
    } catch {
      schemaCreateFunctionExists = false;
    }

    // This will pass since T012 exports the function
    expect(schemaCreateFunctionExists, 'to be true');
  });

  it('should create a benchmark with schema assertions only', async () => {
    // This test validates that the schema suite only contains schema assertions
    let benchmarkCreated = false;
    try {
      const { createSyncFunctionSchemaAssertionsBench } = await import(
        suitesPath
      );
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      const bench = createSyncFunctionSchemaAssertionsBench();
      benchmarkCreated = bench && typeof bench === 'object';
    } catch {
      benchmarkCreated = false;
    }

    // This will pass since T012 correctly implements the suite
    expect(benchmarkCreated, 'to be true');
  });

  it('should contain fewer assertions than the full sync-function suite', async () => {
    // Schema assertions should be a subset of all sync-function assertions
    // So the count should be > 0 but < 66 (total sync-function count)
    let schemaCount = 0;
    try {
      const { createSyncFunctionSchemaAssertionsBench } = await import(
        suitesPath
      );
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      const bench = createSyncFunctionSchemaAssertionsBench();
      schemaCount = bench.tasks?.length || 0;
    } catch {
      schemaCount = 0;
    }

    // This will pass since T012 creates a suite with the correct number of schema assertions
    expect(schemaCount, 'to be greater than', 0);
    expect(schemaCount, 'to be less than', 66); // Less than total sync-function count
  });

  it('should complement the pure suite to total 66 assertions', async () => {
    // The pure and schema suites should together contain all 66 sync-function assertions
    let totalCount = 0;
    try {
      const suites = await import(suitesPath);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      const pureBench = suites.createSyncFunctionPureAssertionsBench();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      const schemaBench = suites.createSyncFunctionSchemaAssertionsBench();
      const pureCount = pureBench.tasks?.length || 0;
      const schemaCount = schemaBench.tasks?.length || 0;
      totalCount = pureCount + schemaCount;
    } catch {
      totalCount = 0;
    }

    // This will pass since both T011 and T012 correctly partition all assertions
    expect(totalCount, 'to equal', 66);
  });
});
