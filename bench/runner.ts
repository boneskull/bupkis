#!/usr/bin/env node

/**
 * Comprehensive benchmark runner for Bupkis.
 *
 * This script provides a CLI interface for running different benchmark suites
 * and modes, useful for CI/CD and development.
 */

import type { BenchMode } from './suites.js';

import {
  createAsyncFunctionAssertionsBench,
  createSyncFunctionAssertionsBench,
  createSyncSchemaAssertionsBench,
} from './comprehensive-suites.js';
import {
  createCollectionAssertionsBench,
  createComparisonAssertionsBench,
  createPatternAssertionsBench,
  createTypeAssertionsBench,
  runBenchmarkSuite,
} from './suites.js';

// // Handle SIGINT (Ctrl+C) and SIGTERM gracefully
// let isShuttingDown = false;

// const gracefulShutdown = (signal: string) => {
//   if (isShuttingDown) {
//     console.log('\n\n💀 \x1b[31mForce killing process...\x1b[0m');
//     process.exit(1);
//   }

//   isShuttingDown = true;
//   console.log(
//     `\n\n🛑 \x1b[33mBenchmark interrupted by ${signal} signal (Ctrl+C)\x1b[0m`,
//   );
//   console.log('🧹 \x1b[2mCleaning up and exiting...\x1b[0m');

//   // Give a brief moment for cleanup, then force exit
//   setTimeout(() => {
//     console.log('⚡ \x1b[31mForce exiting after timeout\x1b[0m');
//     process.exit(1);
//   }, 1000);

//   process.exit(0);
// };

interface RunnerOptions {
  mode: BenchMode;
  suites: string[];
}

/**
 * Available benchmark suites.
 */
const AVAILABLE_SUITES = {
  all: 'Run all benchmark suites',
  'async-function': 'Async function-based assertions',
  collection: 'Array and object assertions',
  comparison: 'Equality and comparison assertions',
  pattern: 'Pattern matching and regex assertions',
  'sync-function': 'Sync function-based assertions',
  'sync-schema': 'Sync schema-based assertions',
  type: 'Basic type checking assertions',
} as const;

/**
 * Parse command line arguments.
 */
const parseArgs = (): RunnerOptions => {
  const args = process.argv.slice(2);

  let mode: BenchMode = 'default';
  let suites: string[] = ['all'];

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
    } else if (arg === '--help') {
      printHelp();
      process.exit(0);
    }
  }

  return { mode, suites };
};

/**
 * Print usage information.
 */
const printHelp = (): void => {
  console.log(`
Bupkis Benchmark Runner

Usage: npm run bench:runner [options]

Options:
  --mode <mode>     Benchmark mode: quick, default, comprehensive, ci (default: default)
  --suite <suite>   Specific suite to run (can be used multiple times)
  --help           Show this help message

Available suites:
${Object.entries(AVAILABLE_SUITES)
  .map(([key, desc]) => `  ${key.padEnd(12)} ${desc}`)
  .join('\n')}

Examples:
  npm run bench:runner
  npm run bench:runner -- --mode quick
  npm run bench:runner -- --suite type --suite collection
  npm run bench:runner -- --mode comprehensive --suite pattern
  `);
};

/**
 * Run the specified benchmark suites.
 */
const runBenchmarks = async (options: RunnerOptions): Promise<void> => {
  console.log('🚀 Bupkis Performance Benchmark Runner');
  console.log(`Mode: ${options.mode}`);
  console.log(`Suites: ${options.suites.join(', ')}`);

  const startTime = Date.now();

  const suites: Promise<void>[] = [];

  try {
    if (options.suites.includes('all') || options.suites.includes('type')) {
      suites.push(
        runBenchmarkSuite(
          'Type Assertions',
          createTypeAssertionsBench,
          options.mode,
        ),
      );
    }

    if (
      options.suites.includes('all') ||
      options.suites.includes('collection')
    ) {
      suites.push(
        runBenchmarkSuite(
          'Collection Assertions',
          createCollectionAssertionsBench,
          options.mode,
        ),
      );
    }

    if (
      options.suites.includes('all') ||
      options.suites.includes('comparison')
    ) {
      suites.push(
        runBenchmarkSuite(
          'Comparison Assertions',
          createComparisonAssertionsBench,
          options.mode,
        ),
      );
    }

    if (options.suites.includes('all') || options.suites.includes('pattern')) {
      suites.push(
        runBenchmarkSuite(
          'Pattern Assertions',
          createPatternAssertionsBench,
          options.mode,
        ),
      );
    }

    // New comprehensive assertion benchmarks grouped by implementation
    if (
      options.suites.includes('all') ||
      options.suites.includes('sync-function')
    ) {
      suites.push(
        runBenchmarkSuite(
          'Sync Function-based Assertions',
          createSyncFunctionAssertionsBench,
          options.mode,
        ),
      );
    }

    if (
      options.suites.includes('all') ||
      options.suites.includes('sync-schema')
    ) {
      suites.push(
        runBenchmarkSuite(
          'Sync Schema-based Assertions',
          createSyncSchemaAssertionsBench,
          options.mode,
        ),
      );
    }

    if (
      options.suites.includes('all') ||
      options.suites.includes('async-function')
    ) {
      suites.push(
        runBenchmarkSuite(
          'Async Function-based Assertions',
          createAsyncFunctionAssertionsBench,
          options.mode,
        ),
      );
    }

    await Promise.all(suites);

    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;

    console.log(`\n✅ All benchmarks completed in ${duration.toFixed(2)}s`);
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
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
