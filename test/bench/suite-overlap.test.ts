/**
 * Integration test for suite overlap resolution logic
 *
 * This test validates that when overlapping suites are selected, the parent
 * suite overrides child suites to prevent duplication.
 */

import { describe, it } from 'node:test';

import { expect } from '../../src/index.js';

describe('Suite Overlap Resolution', () => {
  it('should fail until overlap resolution logic exists', async () => {
    // This test will fail until T014 implements overlap resolution
    let resolutionFunctionExists = false;
    try {
      const { pathToFileURL } = await import('node:url');
      const { resolve } = await import('node:path');

      const runnerPath = pathToFileURL(
        resolve(process.cwd(), 'bench/runner.ts'),
      ).href;
      const runner = await import(runnerPath);

      // Look for a function that handles suite resolution/deduplication
      resolutionFunctionExists =
        typeof runner.resolveSuiteOverlaps === 'function' ||
        typeof runner.resolveSuiteSelection === 'function' ||
        typeof runner.deduplicateSuites === 'function';
    } catch {
      resolutionFunctionExists = false;
    }

    // This will fail until T014 implements overlap logic
    expect(resolutionFunctionExists, 'to be true');
  });

  it('should handle sync-function overriding pure and schema suites', async () => {
    // When sync-function is selected with its child suites, only sync-function should run
    let correctOverride = false;
    try {
      const { pathToFileURL } = await import('node:url');
      const { resolve } = await import('node:path');

      const runnerPath = pathToFileURL(
        resolve(process.cwd(), 'bench/runner.ts'),
      ).href;
      const runner = await import(runnerPath);

      // Test the overlap resolution with mock input
      const testInput = [
        'sync-function',
        'sync-function-pure',
        'sync-function-schema',
      ];

      if (typeof runner.resolveSuiteOverlaps === 'function') {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        const resolved = runner.resolveSuiteOverlaps(testInput) as string[];
        correctOverride =
          Array.isArray(resolved) &&
          resolved.includes('sync-function') &&
          !resolved.includes('sync-function-pure') &&
          !resolved.includes('sync-function-schema');
      }
    } catch {
      correctOverride = false;
    }

    // This will fail until T014 correctly implements parent override logic
    expect(correctOverride, 'to be true');
  });

  it('should allow individual child suites when parent not selected', async () => {
    // When only child suites are selected, both should be allowed
    let allowsChildSuites = false;
    try {
      const { pathToFileURL } = await import('node:url');
      const { resolve } = await import('node:path');

      const runnerPath = pathToFileURL(
        resolve(process.cwd(), 'bench/runner.ts'),
      ).href;
      const runner = await import(runnerPath);

      const testInput = ['sync-function-pure', 'sync-function-schema'];

      if (typeof runner.resolveSuiteOverlaps === 'function') {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        const resolved = runner.resolveSuiteOverlaps(testInput) as string[];
        allowsChildSuites =
          Array.isArray(resolved) &&
          resolved.includes('sync-function-pure') &&
          resolved.includes('sync-function-schema') &&
          !resolved.includes('sync-function');
      }
    } catch {
      allowsChildSuites = false;
    }

    // This will fail until T014 allows child suites when parent not selected
    expect(allowsChildSuites, 'to be true');
  });

  it('should provide deduplication feedback messages', async () => {
    // Users should get clear feedback about overlap resolution decisions
    let providesMessages = false;
    try {
      const { pathToFileURL } = await import('node:url');
      const { resolve } = await import('node:path');

      const runnerPath = pathToFileURL(
        resolve(process.cwd(), 'bench/runner.ts'),
      ).href;
      const runner = await import(runnerPath);

      const testInput = ['sync-function', 'sync-function-pure'];

      if (typeof runner.resolveSuiteOverlaps === 'function') {
        // Check if the function logs deduplication messages by testing console output
        const logMessages: string[] = [];
        const originalLog = console.log;
        console.log = (...args: any[]) => {
          logMessages.push(args.join(' '));
        };

        try {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call
          const resolved = runner.resolveSuiteOverlaps(testInput) as string[];
          console.log = originalLog;

          // Should provide resolved suites and have logged deduplication message
          providesMessages =
            Array.isArray(resolved) &&
            resolved.includes('sync-function') &&
            !resolved.includes('sync-function-pure') &&
            logMessages.some((msg) => msg.includes('Deduplication'));
        } finally {
          console.log = originalLog;
        }
      }
    } catch {
      providesMessages = false;
    }

    // This will fail until T020 implements user feedback messages
    expect(providesMessages, 'to be true');
  });
});
