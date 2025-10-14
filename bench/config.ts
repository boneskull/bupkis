/**
 * Benchmark configuration and utilities for Bupkis.
 *
 * This module provides common configuration and helper functions for all
 * benchmark suites.
 */

import type { BenchOptions } from 'tinybench';

/**
 * Default benchmark configuration optimized for assertion testing.
 */
export const DEFAULT_BENCH_CONFIG: BenchOptions = {
  iterations: 100,
  time: 1000,
  warmupIterations: 10,
  warmupTime: 100,
};

/**
 * Configuration for quick/development benchmarks.
 */
export const QUICK_BENCH_CONFIG: BenchOptions = {
  iterations: 50,
  time: 500,
  warmupIterations: 5,
  warmupTime: 50,
};

/**
 * Configuration for comprehensive/CI benchmarks.
 */
export const COMPREHENSIVE_BENCH_CONFIG: BenchOptions = {
  iterations: 200,
  time: 2000,
  warmupIterations: 20,
  warmupTime: 200,
};

/**
 * Configuration optimized for CI environments with limited resources. Focuses
 * on relative performance and consistency over absolute numbers.
 */
export const CI_BENCH_CONFIG: BenchOptions = {
  iterations: 30,
  time: 1000,
  warmupIterations: 5,
  warmupTime: 100,
};

/**
 * Performance thresholds for different implementation types (in ops/sec). Based
 * on the new implementation-pattern-based suite organization.
 */
export const PERFORMANCE_THRESHOLDS = {
  'async-function': 15000, // Async function-based assertions (promise validation with callbacks)
  'async-schema': 15000, // Async schema-based assertions (promise validation with schemas)
  'sync-function': 1000, // Sync function-based assertions (validation with callback functions)
  'sync-function-pure': 1200, // Pure sync function assertions (return AssertionFailure/boolean)
  'sync-function-schema': 800, // Schema-based sync function assertions (return Zod schema/AssertionParseRequest)
  'sync-schema': 1500, // Sync schema-based assertions (validation with Zod schemas)
} as const;

/**
 * ANSI color codes for terminal output formatting.
 */
export const colors = {
  bright: '\x1b[1m',
  brightCyan: '\x1b[1m\x1b[36m',
  brightGreen: '\x1b[1m\x1b[32m',
  brightWhite: '\x1b[1m\x1b[37m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  reset: '\x1b[0m',
  white: '\x1b[37m',
  yellow: '\x1b[33m',
} as const;
