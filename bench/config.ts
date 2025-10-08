/**
 * Benchmark configuration and utilities for Bupkis.
 *
 * This module provides common configuration and helper functions for all
 * benchmark suites.
 */

import type { Options } from 'tinybench';

/**
 * Default benchmark configuration optimized for assertion testing.
 */
export const DEFAULT_BENCH_CONFIG: Options = {
  iterations: 100,
  time: 1000,
  warmupIterations: 10,
  warmupTime: 100,
};

/**
 * Configuration for quick/development benchmarks.
 */
export const QUICK_BENCH_CONFIG: Options = {
  iterations: 50,
  time: 500,
  warmupIterations: 5,
  warmupTime: 50,
};

/**
 * Configuration for comprehensive/CI benchmarks.
 */
export const COMPREHENSIVE_BENCH_CONFIG: Options = {
  iterations: 200,
  time: 2000,
  warmupIterations: 20,
  warmupTime: 200,
};

/**
 * Configuration optimized for CI environments with limited resources. Focuses
 * on relative performance and consistency over absolute numbers.
 */
export const CI_BENCH_CONFIG: Options = {
  iterations: 30,
  // Longer settling time for virtualized environments
  setup: () => new Promise((resolve) => setTimeout(resolve, 100)),
  time: 1000,
  warmupIterations: 5,
  warmupTime: 100,
};

/**
 * Performance thresholds for different types of assertions (in milliseconds).
 */
export const PERFORMANCE_THRESHOLDS = {
  basic: 1.0, // Basic type checks
  collection: 2.0, // Array/object operations
  comparison: 1.5, // Equality, inequality assertions
  complex: 5.0, // Complex nested operations
  regex: 3.0, // Regular expression matching
} as const;

/**
 * Test data generators for consistent benchmarking.
 */
export const TEST_DATA = {
  deepObject: () => ({
    level1: {
      level2: {
        level3: {
          level4: {
            value: 'deep value',
          },
        },
      },
    },
  }),

  largeArray: (size = 1000) => Array.from({ length: size }, (_, i) => i),

  mixedArray: () => [1, 'string', true, null, { key: 'value' }],

  nestedObject: () => ({
    user: {
      emails: ['user@example.com', 'user@work.com'],
      id: 123,
      name: 'Test User',
      settings: { notifications: true, theme: 'dark' },
    },
  }),

  simpleObject: () => ({ a: 1, b: 2, c: 3 }),

  stringArray: () => ['apple', 'banana', 'cherry', 'date', 'elderberry'],
} as const;

/**
 * Helper function to format benchmark results for consistent output.
 */
export interface BenchmarkResult {
  average: number;
  max: number;
  min: number;
  name: string;
  opsPerSec: number;
  standardDeviation: number;
}

/**
 * Extracts and formats benchmark results from tinybench tasks.
 */
export const formatResults = (
  tasks: Array<{
    name: string;
    result?: {
      max?: number;
      mean?: number;
      min?: number;
      sd?: number;
    };
  }>,
): BenchmarkResult[] => {
  return tasks.map((task) => ({
    average: (task.result?.mean as number) ?? 0,
    max: (task.result?.max as number) ?? 0,
    min: (task.result?.min as number) ?? 0,
    name: task.name,
    opsPerSec: Math.round(1000 / ((task.result?.mean as number) ?? 1)),
    standardDeviation: (task.result?.sd as number) ?? 0,
  }));
};

/**
 * Checks results against performance thresholds and returns warnings.
 */
export const checkPerformance = (
  results: BenchmarkResult[],
  thresholds: Record<string, number> = PERFORMANCE_THRESHOLDS,
): { passed: boolean; warnings: string[] } => {
  const warnings: string[] = [];

  for (const result of results) {
    // Simple heuristic to categorize benchmark types
    let threshold = thresholds.basic;

    if (result.name.includes('complex') || result.name.includes('nested')) {
      threshold = thresholds.complex;
    } else if (
      result.name.includes('array') ||
      result.name.includes('object')
    ) {
      threshold = thresholds.collection;
    } else if (result.name.includes('match') || result.name.includes('regex')) {
      threshold = thresholds.regex;
    } else if (
      result.name.includes('equal') ||
      result.name.includes('comparison')
    ) {
      threshold = thresholds.comparison;
    }

    if (threshold !== undefined && result.average > threshold) {
      warnings.push(
        `${result.name}: ${result.average.toFixed(2)}ms (threshold: ${threshold}ms)`,
      );
    }
  }

  return {
    passed: warnings.length === 0,
    warnings,
  };
};
