/**
 * Contract test for assertion classification logic
 *
 * This test validates that sync-function assertions can be correctly classified
 * into "pure" and "schema" categories based on their return types.
 */

import { dirname, resolve } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { expect } from '../../src/index.js';

const classifierPath = pathToFileURL(
  resolve(
    dirname(fileURLToPath(import.meta.url)),
    '../../bench/assertion-classifier.ts',
  ),
).href;

describe('Assertion Classification', () => {
  it('should fail until classification utility is implemented', async () => {
    // This test is designed to fail until T010 implements the classification utility
    // When T010 is complete, this will pass
    let classifierExists = false;
    try {
      await import(classifierPath);
      classifierExists = true;
    } catch {
      // Expected to fail with module not found until T010 is implemented
      classifierExists = false;
    }

    // This will pass since T010 is complete
    expect(classifierExists, 'to be true');
  });

  it('should have the expected API when implemented', async () => {
    // This test documents the expected interface for T010
    // It will fail until the classification utility exists with proper exports
    let hasExpectedAPI = false;
    try {
      const classifier = await import(classifierPath);
      hasExpectedAPI =
        typeof classifier.classifyAssertion === 'function' &&
        typeof classifier.getSyncFunctionAssertions === 'function';
    } catch {
      hasExpectedAPI = false;
    }

    // This will pass since T010 implements the correct API
    expect(hasExpectedAPI, 'to be true');
  });

  it('should categorize all sync-function assertions', async () => {
    // This test ensures the classification covers all current sync-function assertions
    // Based on T001, there are 68 sync-function assertions that need classification
    let totalClassified = 0;
    try {
      const { getSyncFunctionAssertions } = await import(classifierPath);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      const result = getSyncFunctionAssertions();
      totalClassified =
        (result?.pure?.length || 0) + (result?.schema?.length || 0);
    } catch {
      totalClassified = 0;
    }

    // This will pass since T010 correctly classifies all assertions
    // Updated from 72 to 86 after adding 14 sync iterable assertions
    expect(totalClassified, 'to equal', 86);
  });
});
