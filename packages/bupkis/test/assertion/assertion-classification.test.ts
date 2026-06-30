/**
 * Contract test for assertion classification logic
 *
 * This test validates that sync-function assertions can be correctly classified
 * into "pure" and "schema" categories based on their return types.
 */

import { dirname, resolve } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { type SyncFunctionAssertionClassification } from '../../bench/assertion-classifier.js';
import { expect } from '../../src/index.js';

const classifierPath = pathToFileURL(
  resolve(
    dirname(fileURLToPath(import.meta.url)),
    '../../bench/assertion-classifier.ts',
  ),
).href;

describe('Assertion Classification', () => {
  it('should fail until classification utility is implemented', async () => {
    let classifierExists: boolean;
    try {
      await import(classifierPath);
      classifierExists = true;
    } catch {
      classifierExists = false;
    }

    expect(classifierExists, 'to be true');
  });

  it('should have the expected API when implemented', async () => {
    let hasExpectedAPI: boolean;
    try {
      const classifier = await import(classifierPath);
      hasExpectedAPI =
        typeof classifier.classifyAssertion === 'function' &&
        typeof classifier.getSyncFunctionAssertions === 'function';
    } catch {
      hasExpectedAPI = false;
    }

    expect(hasExpectedAPI, 'to be true');
  });

  it('should categorize all sync-function assertions', async () => {
    let totalClassified: number;
    try {
      const { getSyncFunctionAssertions } = (await import(classifierPath)) as {
        getSyncFunctionAssertions: () => SyncFunctionAssertionClassification;
      };

      const result = getSyncFunctionAssertions();
      totalClassified =
        (result?.pure?.length || 0) + (result?.schema?.length || 0);
    } catch {
      totalClassified = 0;
    }

    expect(totalClassified, 'to equal', 82);
  });
});
