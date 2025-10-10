#!/usr/bin/env node

/**
 * Comprehensive benchmark runner for Bupkis.
 *
 * This script provides a CLI interface for running different benchmark suites
 * and modes, useful for CI/CD and development.
 */

import type { Task } from 'tinybench';

import {
  type BenchMode,
  createAsyncFunctionAssertionsBench,
  createAsyncSchemaAssertionsBench,
  createSyncFunctionAssertionsBench,
  createSyncSchemaAssertionsBench,
  runBenchmarkSuite,
} from './comprehensive-suites.js';
import { colors, PERFORMANCE_THRESHOLDS } from './config.js';

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
export const formatResults = (tasks: Task[]): BenchmarkResult[] => {
  return tasks.map((task) => {
    const result = task.result;
    if (!result) {
      return {
        average: 0,
        max: 0,
        min: 0,
        name: task.name,
        opsPerSec: 0,
        standardDeviation: 0,
      };
    }

    return {
      average: result.latency.mean,
      max: result.latency.max,
      min: result.latency.min,
      name: task.name,
      opsPerSec: Math.round(1000 / result.latency.mean),
      standardDeviation: result.latency.sd,
    };
  });
};

/**
 * Checks results against performance thresholds and returns warnings. Uses
 * suite-based thresholds based on implementation patterns.
 */
export const checkPerformance = (
  results: BenchmarkResult[],
  thresholds: Record<string, number> = PERFORMANCE_THRESHOLDS,
): { passed: boolean; warnings: string[] } => {
  const warnings: string[] = [];

  for (const result of results) {
    // Extract suite name from task name (format: "assertion [suite-name]")
    const suiteMatch = result.name.match(/\[(.+?)\]$/);
    const suiteName = suiteMatch?.[1];

    if (!suiteName || !(suiteName in thresholds)) {
      // Skip if we can't determine the suite or don't have a threshold for it
      continue;
    }

    const threshold = thresholds[suiteName];

    if (threshold === undefined) {
      // Skip if we don't have a threshold for this suite
      continue;
    }

    // Check if ops/sec is below the threshold (performance issue)
    if (result.opsPerSec < threshold) {
      // Parse the assertion name to separate the assertion string from the group
      const groupMatch = result.name.match(/^(.+?)(\s+\[.+?\])$/);
      if (groupMatch) {
        const [, assertionString, group] = groupMatch;
        warnings.push(
          `${colors.dim}${group}${colors.reset} ${colors.brightGreen}${assertionString}${colors.reset}: ${colors.yellow}${result.opsPerSec}${colors.reset}/${colors.brightWhite}${threshold}${colors.reset} ops/sec${colors.reset}`,
        );
      } else {
        // Fallback for unexpected name format
        warnings.push(
          `${colors.brightGreen}${result.name}${colors.reset}: ${colors.yellow}${result.opsPerSec} ops/sec${colors.reset} ${colors.brightWhite}(below threshold: ${colors.yellow}${threshold} ops/sec${colors.brightWhite})${colors.reset}`,
        );
      }
    }
  }

  return {
    passed: warnings.length === 0,
    warnings,
  };
};

interface RunnerOptions {
  checkPerformance: boolean;
  mode: BenchMode;
  suites: string[];
  table: boolean;
}

/**
 * Available benchmark suites.
 */
const AVAILABLE_SUITES = {
  all: 'Run all benchmark suites',
  'async-function':
    'Async function-based assertions (promise validation with callbacks)',
  'async-schema':
    'Async schema-based assertions (promise validation with schemas)',
  'sync-function':
    'Sync function-based assertions (validation with callback functions)',
  'sync-schema': 'Sync schema-based assertions (validation with Zod schemas)',
} as const;

/**
 * Parse command line arguments.
 */
const parseArgs = (): RunnerOptions => {
  const args = process.argv.slice(2);

  let mode: BenchMode = 'default';
  let suites: string[] = ['all'];
  let checkPerformance = false;
  let table = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--mode' && i + 1 < args.length) {
      const modeArg = args[i + 1] as BenchMode;
      if (
        modeArg === 'ci' ||
        modeArg === 'quick' ||
        modeArg === 'default' ||
        modeArg === 'comprehensive'
      ) {
        mode = modeArg;
      }
      i++; // Skip next arg since we consumed it
    } else if (arg === '--suite' && i + 1 < args.length) {
      if (suites.includes('all')) {
        suites = []; // Clear 'all' if specific suites are specified
      }
      const suite = args[i + 1];
      if (suite) {
        suites.push(suite);
      }
      i++; // Skip next arg since we consumed it
    } else if (arg === '--check') {
      checkPerformance = true;
    } else if (arg === '--table') {
      table = true;
    } else if (arg === '--help') {
      printHelp();
      process.exit(0);
    }
  }

  return { checkPerformance, mode, suites, table };
};

/**
 * Print usage information.
 */
const printHelp = (): void => {
  console.log(`
Bupkis Benchmark Runner

Usage: npm run bench:runner [options]

Options:
  --mode <mode>           Benchmark mode: quick, default, comprehensive, ci (default: default)
  --suite <suite>         Specific suite to run (can be used multiple times)
  --check                 Check benchmark results against performance thresholds
  --table                 Output results in table format
  --help                  Show this help message

Available suites:
${Object.entries(AVAILABLE_SUITES)
  .map(([key, desc]) => `  ${key.padEnd(15)} ${desc}`)
  .join('\n')}

Examples:
  npm run bench:runner
  npm run bench:runner -- --mode quick
  npm run bench:runner -- --suite sync-function --suite async-function
  npm run bench:runner -- --mode comprehensive --check
  `);
};

/**
 * Run the specified benchmark suites.
 */
const runBenchmarks = async (options: RunnerOptions): Promise<void> => {
  console.log('🚀 Bupkis Performance Benchmark Runner\n');

  if (options.checkPerformance) {
    console.log('🔍 Performance checking enabled');
  }

  const startTime = Date.now();
  const benchResults: BenchmarkResult[] = [];
  const tables: Array<
    [
      name: string,
      results: Array<null | Record<string, number | string | undefined>>,
    ]
  > = [];

  try {
    // Implementation-based assertion benchmarks grouped by execution strategy
    if (
      options.suites.includes('all') ||
      options.suites.includes('sync-function')
    ) {
      const bench = await runBenchmarkSuite(
        'Sync Function-based Assertions',
        createSyncFunctionAssertionsBench,
        options.mode,
      );
      benchResults.push(...formatResults(bench.tasks));
      if (options.table) {
        tables.push(['Sync Function-based Assertions', bench.table()]);
      }
    }

    if (
      options.suites.includes('all') ||
      options.suites.includes('sync-schema')
    ) {
      const bench = await runBenchmarkSuite(
        'Sync Schema-based Assertions',
        createSyncSchemaAssertionsBench,
        options.mode,
      );
      benchResults.push(...formatResults(bench.tasks));
      if (options.table) {
        tables.push(['Sync Schema-based Assertions', bench.table()]);
      }
    }

    if (
      options.suites.includes('all') ||
      options.suites.includes('async-function')
    ) {
      const bench = await runBenchmarkSuite(
        'Async Function-based Assertions',
        createAsyncFunctionAssertionsBench,
        options.mode,
      );
      benchResults.push(...formatResults(bench.tasks));
      if (options.table) {
        tables.push(['Async Function-based Assertions', bench.table()]);
      }
    }

    if (
      options.suites.includes('all') ||
      options.suites.includes('async-schema')
    ) {
      const bench = await runBenchmarkSuite(
        'Async Schema-based Assertions',
        createAsyncSchemaAssertionsBench,
        options.mode,
      );
      benchResults.push(...formatResults(bench.tasks));
      if (options.table) {
        tables.push(['Async Schema-based Assertions', bench.table()]);
      }
    }

    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;

    console.log(`\n✅ All benchmarks completed in ${duration.toFixed(2)}s`);

    if (options.table && tables.length) {
      for (const [name, table] of tables) {
        console.log(`\n📊 ${name} Results:`);
        console.table(table);
      }
    }

    // Performance checking
    if (options.checkPerformance && benchResults.length > 0) {
      console.log('\n🔍 Checking performance against thresholds...');
      const performanceCheck = checkPerformance(benchResults);

      if (performanceCheck.passed) {
        console.log('✅ All benchmarks meet performance thresholds');
      } else {
        console.log('\n⚠️  Performance warnings:');
        for (const warning of performanceCheck.warnings) {
          console.log(`  ${warning}`);
        }

        // Exit with error code in CI mode if performance check fails
        if (options.mode === 'ci') {
          console.log('\n❌ Performance thresholds not met in CI mode');
          process.exit(1);
        }
      }
    }
  } catch (error) {
    console.error('\n❌ Benchmark failed:', error);
    process.exit(1);
  }
};

// Main execution
const main = async (): Promise<void> => {
  const options = parseArgs();
  await runBenchmarks(options);
};

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  void main();
}
