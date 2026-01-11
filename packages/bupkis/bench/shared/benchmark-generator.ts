/**
 * Factory functions for creating modestbench-compatible benchmark objects.
 *
 * Provides helpers to generate benchmark definitions for sync and async
 * assertions with proper error handling.
 */

import type { AnyAssertion } from '../../src/assertion/index.js';
import type { BenchmarkConfig } from './config.js';

import { expect, expectAsync } from '../../src/index.js';
import { isThrowingAssertion } from './assertion-data.js';

export interface BenchmarkDefinition {
  config: Partial<BenchmarkConfig>;
  fn: () => Promise<void> | void;
  tags: string[];
}

export const createSyncBenchmark = (
  assertion: AnyAssertion,
  testData: readonly [subject: unknown, phrase: string, ...args: unknown[]],
  tags: string[] = [],
  config: Partial<BenchmarkConfig> = {},
): BenchmarkDefinition => {
  return {
    config,
    fn() {
      try {
        expect(...testData);
      } catch (error) {
        if (!isThrowingAssertion(assertion)) {
          console.warn(`Unexpected error in ${assertion}:`, error);
        }
      }
    },
    tags,
  };
};

export const createAsyncBenchmark = (
  assertion: AnyAssertion,
  testData: readonly [subject: unknown, phrase: string, ...args: unknown[]],
  tags: string[] = [],
  config: Partial<BenchmarkConfig> = {},
): BenchmarkDefinition => {
  return {
    config,
    async fn() {
      try {
        await expectAsync(...testData);
      } catch (error) {
        if (!isThrowingAssertion(assertion)) {
          console.warn(`Unexpected error in ${assertion}:`, error);
        }
      }
    },
    tags,
  };
};
