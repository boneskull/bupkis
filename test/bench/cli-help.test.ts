/**
 * Integration test for CLI help output with new suites
 *
 * This test validates that the CLI help output includes the new suite options
 * and maintains backward compatibility.
 */

import { resolve } from 'node:path';
import { describe, it } from 'node:test';
import { pathToFileURL } from 'node:url';

import { expect } from '../../src/index.js';

const runnerPath = pathToFileURL(
  resolve(process.cwd(), 'bench/runner.ts'),
).href;

describe('CLI Help Output', () => {
  it('should fail until new suites are added to help output', async () => {
    // This test will fail until T013 and T016 update the CLI help
    let helpIncludesNewSuites = false;
    try {
      const { AVAILABLE_SUITES } = await import(runnerPath);

      helpIncludesNewSuites =
        'sync-function-pure' in AVAILABLE_SUITES &&
        'sync-function-schema' in AVAILABLE_SUITES;
    } catch {
      helpIncludesNewSuites = false;
    }

    // This will pass since new suites are added to AVAILABLE_SUITES
    expect(helpIncludesNewSuites, 'to be true');
  });

  it('should maintain existing suites in help output', async () => {
    // Ensure backward compatibility - all existing suites should remain
    let hasExistingSuites = false;
    try {
      const { AVAILABLE_SUITES } = await import(runnerPath);

      hasExistingSuites =
        'all' in AVAILABLE_SUITES &&
        'sync-function' in AVAILABLE_SUITES &&
        'sync-schema' in AVAILABLE_SUITES &&
        'async-function' in AVAILABLE_SUITES &&
        'async-schema' in AVAILABLE_SUITES;
    } catch {
      hasExistingSuites = false;
    }

    // This passes since T013 updates AVAILABLE_SUITES correctly
    expect(hasExistingSuites, 'to be true');
  });

  it('should have descriptive text for new suites', async () => {
    // New suites should have clear descriptions explaining their purpose
    let hasDescriptiveText = false;
    try {
      const { AVAILABLE_SUITES } = await import(runnerPath);

      const pureDescription = AVAILABLE_SUITES['sync-function-pure'];
      const schemaDescription = AVAILABLE_SUITES['sync-function-schema'];

      hasDescriptiveText =
        typeof pureDescription === 'string' &&
        pureDescription.length > 20 &&
        typeof schemaDescription === 'string' &&
        schemaDescription.length > 20 &&
        pureDescription.includes('pure') &&
        schemaDescription.includes('schema');
    } catch {
      hasDescriptiveText = false;
    }

    // This passes since T013 adds proper descriptions
    expect(hasDescriptiveText, 'to be true');
  });

  it('should have increased total suite count', async () => {
    // With two new suites added, the total count should increase
    let suiteCount = 0;
    try {
      const { AVAILABLE_SUITES } = await import(runnerPath);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      suiteCount = Object.keys(AVAILABLE_SUITES).length;
    } catch {
      suiteCount = 0;
    }

    // Should have original 5 suites + 3 new ones (including value-to-schema) = 8 total
    expect(suiteCount, 'to equal', 8);
  });
});
