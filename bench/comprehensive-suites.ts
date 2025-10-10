/**
 * Comprehensive benchmark suites for bupkis assertion performance testing.
 *
 * This module provides benchmarks for ALL assertions grouped by their
 * implementation classes, allowing for targeted performance analysis of
 * function-based vs schema assertions and sync vs async execution.
 */

import fc from 'fast-check';
import { Bench } from 'tinybench';

import {
  BupkisAssertionFunctionAsync,
  BupkisAssertionSchemaAsync,
} from '../src/assertion/assertion-async.js';
import {
  BupkisAssertionFunctionSync,
  BupkisAssertionSchemaSync,
} from '../src/assertion/assertion-sync.js';
import {
  type AnyAssertion,
  AsyncAssertions,
  SyncAssertions,
} from '../src/assertion/index.js';
import { expect, expectAsync } from '../src/index.js';
import {
  AsyncParametricGenerators,
  SyncBasicGenerators,
  SyncCollectionGenerators,
  SyncDateGenerators,
  SyncEsotericGenerators,
  SyncParametricGenerators,
} from '../test-data/index.js';
import { type GeneratorParams } from '../test/property/property-test-config.js';
import {
  CI_BENCH_CONFIG,
  colors,
  COMPREHENSIVE_BENCH_CONFIG,
  DEFAULT_BENCH_CONFIG,
  QUICK_BENCH_CONFIG,
} from './config.js';

/**
 * Configuration for benchmark creation
 */
interface BenchmarkConfig {
  assertions: readonly AnyAssertion[];
  filter: (assertion: AnyAssertion) => boolean;
  label: string;
  name: string;
  taskRunner: (
    assertion: AnyAssertion,
    testData: unknown[],
  ) => Promise<void> | void;
}

/**
 * Factory function to create event handlers with timeout management
 */
const createEventHandlers = (benchmarkName: string) => {
  const taskTimeouts = new Map<string, NodeJS.Timeout>();

  const startHandler = () => {
    // this function intentionally left blank
  };

  const cycleHandler = (evt: any) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const task = evt.task as { name: string; result?: { hz?: number } };

    // Clear timeout for this task
    const timeout = taskTimeouts.get(task.name);
    if (timeout) {
      clearTimeout(timeout);
      taskTimeouts.delete(task.name);
    }

    // Parse the task name to extract assertion title and collection
    const match = task.name.match(/^(.+?)\s+\[(.+?)\]$/);
    if (match) {
      const [, assertionTitle, collection] = match;
      const opsPerSec = task.result?.hz?.toFixed(0) ?? '?';
      console.log(
        `✓ ${colors.dim}[${collection}]${colors.reset} ${colors.brightGreen}${assertionTitle}${colors.reset}: ${colors.yellow}${opsPerSec} ops/sec${colors.reset}`,
      );
    } else {
      // Fallback for unexpected format
      console.log(
        `✓ ${task.name}: ${colors.yellow}${task.result?.hz?.toFixed(0) ?? '?'} ops/sec${colors.reset}`,
      );
    }
  };

  const completeHandler = () => {
    console.log(`🏁 ${benchmarkName} benchmark complete!\n`);
    // Clear any remaining timeouts
    for (const timeout of taskTimeouts.values()) {
      clearTimeout(timeout);
    }
    taskTimeouts.clear();
  };

  const createTaskTimeout = (taskName: string) => {
    const timeout = setTimeout(() => {
      const error = new Error(
        `Benchmark timeout: Task "${taskName}" took longer than 10 seconds to complete. This may indicate a hanging assertion or infinite loop.`,
      );
      console.error(`\n⚠️  \x1b[31mTimeout Error:\x1b[0m ${error.message}`);
      throw error;
    }, 10000);
    timeout.unref(); // Don't keep the process alive
    taskTimeouts.set(taskName, timeout);
  };

  return {
    completeHandler,
    createTaskTimeout,
    cycleHandler,
    startHandler,
    taskTimeouts,
  };
};

/**
 * Factory function to create a benchmark with standardized setup
 */
const createBenchmark = (config: BenchmarkConfig): Bench => {
  const bench = new Bench(DEFAULT_BENCH_CONFIG);
  const filteredAssertions = config.assertions.filter(config.filter);

  if (!filteredAssertions.length) {
    console.log(
      `ℹ️  No assertions matched the filter criteria. Skipping suite ${colors.yellow}${config.label}${colors.reset}`,
    );
    return bench;
  }
  const handlers = createEventHandlers(config.name);

  // Set up event listeners
  bench.addEventListener('start', handlers.startHandler);
  bench.addEventListener('cycle', handlers.cycleHandler);
  bench.addEventListener('complete', () => {
    handlers.completeHandler();
    // Clean up event listeners
    bench.removeEventListener('start', handlers.startHandler);
    bench.removeEventListener('cycle', handlers.cycleHandler);
    bench.removeEventListener('complete', handlers.completeHandler);
  });

  console.log(
    `⏱️  Benchmarking ${colors.brightCyan}${filteredAssertions.length}${colors.reset} ${colors.yellow}${config.label}${colors.reset}`,
  );

  // Add benchmarks for each assertion
  for (const assertion of filteredAssertions) {
    const phrase = getPrimaryPhrase(assertion);

    if (phrase) {
      const testData = getTestDataForAssertion(assertion);
      const taskName = `${assertion} [${config.name}]`;

      bench.add(taskName, () => config.taskRunner(assertion, [...testData]));

      // Add timeout handling for individual tasks
      // task.addEventListener('start', () => {
      //   handlers.createTaskTimeout(taskName);
      // });
    }
  }

  return bench;
};

/**
 * Combined assertion arbitraries from all generator maps
 */
const assertionArbitraries = new Map<AnyAssertion, GeneratorParams>();
// Combine all generator maps
for (const [assertion, generators] of SyncBasicGenerators) {
  assertionArbitraries.set(assertion, generators);
}
for (const [assertion, generators] of SyncCollectionGenerators) {
  assertionArbitraries.set(assertion, generators);
}
for (const [assertion, generators] of SyncDateGenerators) {
  assertionArbitraries.set(assertion, generators);
}
for (const [assertion, generators] of SyncEsotericGenerators) {
  assertionArbitraries.set(assertion, generators);
}
for (const [assertion, generators] of SyncParametricGenerators) {
  assertionArbitraries.set(assertion, generators);
}
for (const [assertion, generators] of AsyncParametricGenerators) {
  assertionArbitraries.set(assertion, generators);
}

/**
 * Type guard to check if assertion is a sync function-based implementation
 */
const isSyncFunctionAssertion = <T extends AnyAssertion>(
  assertion: T,
): assertion is BupkisAssertionFunctionSync<any, any, any> & T =>
  assertion instanceof BupkisAssertionFunctionSync;

/**
 * Type guard to check if assertion is a sync schema-based implementation
 */
const isSyncSchemaAssertion = <T extends AnyAssertion>(
  assertion: T,
): assertion is BupkisAssertionSchemaSync<any, any, any> & T =>
  assertion instanceof BupkisAssertionSchemaSync;

/**
 * Type guard to check if assertion is an async function-based implementation
 */
const isAsyncFunctionAssertion = <T extends AnyAssertion>(
  assertion: T,
): assertion is BupkisAssertionFunctionAsync<any, any, any> & T =>
  assertion instanceof BupkisAssertionFunctionAsync;

/**
 * Type guard to check if assertion is an async schema-based implementation
 */
const isAsyncSchemaAssertion = <T extends AnyAssertion>(
  assertion: T,
): assertion is BupkisAssertionSchemaAsync<any, any, any> & T =>
  assertion instanceof BupkisAssertionSchemaAsync;

/**
 * Extract the primary phrase from assertion parts
 */
const getPrimaryPhrase = (assertion: AnyAssertion): null | string => {
  const parts = assertion.parts as unknown[];

  // Try each part until we find a string or string array
  for (const part of parts) {
    if (typeof part === 'string') {
      return part;
    }
    if (Array.isArray(part) && part.length > 0 && typeof part[0] === 'string') {
      return part[0];
    }
  }

  throw new Error(
    `Could not determine primary phrase for assertion ${assertion}`,
  );
};

/**
 * Type guard to check if generators is an array of arbitraries
 */
const isGeneratorArray = (
  generators: any,
): generators is readonly [
  subject: fc.Arbitrary<any>,
  phrase: fc.Arbitrary<string>,
  ...fc.Arbitrary<any>[],
] => Array.isArray(generators);

/**
 * Get generator params for an assertion that can be sampled and spread to
 * expect/expectAsync.
 *
 * Ideally, this would return the exact Parts type for each assertion, but due
 * to fast-check's typing limitations and the complexity of assertion type
 * inference, we return a well-typed tuple structure that matches the expected
 * signature for expect/expectAsync.
 *
 * @param assertion - The assertion to get test data for
 * @returns Test data tuple matching the assertion's expected arguments
 */
const getTestDataForAssertion = (
  assertion: AnyAssertion,
): readonly [subject: unknown, phrase: string, ...unknown[]] => {
  const generators = assertionArbitraries.get(assertion);

  if (generators) {
    if (isGeneratorArray(generators)) {
      // Convert array format to tuple and sample
      const sample = fc.sample(fc.tuple(...generators), 1)[0];
      if (!sample) {
        throw new Error(`Failed to sample generators for ${assertion}`);
      }
      return sample;
    } else {
      // Sample tuple format directly
      const sample = fc.sample(generators, 1)[0];
      if (!sample) {
        throw new Error(`Failed to sample generators for ${assertion}`);
      }
      return sample;
    }
  }
  throw new Error(`No generator found for assertion ${assertion}`);
};

/**
 * Determines if an assertion is expected to throw/reject based on its phrase.
 * These assertions test error conditions and throwing is their normal
 * behavior.
 */
const isThrowingAssertion = (assertion: AnyAssertion): boolean => {
  const phrase = getPrimaryPhrase(assertion);
  if (!phrase) {
    return false;
  }

  // List of phrases that indicate the assertion is meant to test error conditions
  const throwingPatterns = [
    'to throw',
    'throws',
    'to reject',
    'rejects',
    'to be rejected',
    'to fail',
    'fails',
  ];

  return throwingPatterns.some((pattern) =>
    phrase.toLowerCase().includes(pattern),
  );
};

/**
 * Warns about unexpected exceptions during benchmarking. Only warns for
 * assertions that aren't expected to throw.
 */
const warnUnexpectedException = (
  assertion: AnyAssertion,
  error: unknown,
): void => {
  if (!isThrowingAssertion(assertion)) {
    console.warn(
      `⚠️  Unexpected exception in benchmark for ${assertion}:`,
      error instanceof Error ? error.message : error,
    );
  }
};

/**
 * Create benchmarks for sync function-based assertions. Tests assertions that
 * use callback functions for validation.
 */
export const createSyncFunctionAssertionsBench = (): Bench =>
  createBenchmark({
    assertions: SyncAssertions,
    filter: isSyncFunctionAssertion,
    label: 'sync function-based assertions',
    name: 'sync-function',
    taskRunner: (assertion, testData) => {
      try {
        expect(...testData);
      } catch (error) {
        warnUnexpectedException(assertion, error);
      }
    },
  });

/**
 * Create benchmarks for sync schema-based assertions. Tests assertions that use
 * Zod schemas for validation.
 */
export const createSyncSchemaAssertionsBench = (): Bench =>
  createBenchmark({
    assertions: SyncAssertions,
    filter: isSyncSchemaAssertion,
    label: 'sync schema-based assertions',
    name: 'sync-schema',
    taskRunner: (assertion, testData) => {
      try {
        expect(...testData);
      } catch (error) {
        warnUnexpectedException(assertion, error);
      }
    },
  });

/**
 * Create benchmarks for async function-based assertions. Tests assertions that
 * use callback functions for Promise validation.
 */
export const createAsyncFunctionAssertionsBench = (): Bench =>
  createBenchmark({
    assertions: AsyncAssertions,
    filter: isAsyncFunctionAssertion,
    label: 'async function-based assertions',
    name: 'async-function',
    taskRunner: async (assertion, testData) => {
      try {
        await expectAsync(...testData);
      } catch (error) {
        warnUnexpectedException(assertion, error);
      }
    },
  });

/**
 * Create benchmarks for async schema-based assertions. Tests assertions that
 * use Zod schemas for Promise validation.
 */
export const createAsyncSchemaAssertionsBench = (): Bench =>
  createBenchmark({
    assertions: AsyncAssertions,
    filter: isAsyncSchemaAssertion,
    label: 'async schema-based assertions',
    name: 'async-schema',
    taskRunner: async (assertion, testData) => {
      try {
        await expectAsync(...testData);
      } catch (error) {
        warnUnexpectedException(assertion, error);
      }
    },
  });

/**
 * Create benchmarks for basic type assertions using test data generators.
 * Replaces the hardcoded createTypeAssertionsBench from suites.ts.
 */
export const createTypeAssertionsBench = (): Bench => {
  // Filter for basic type checking assertions
  const isBasicTypeAssertion = (assertion: AnyAssertion): boolean => {
    const phrase = getPrimaryPhrase(assertion);
    if (!phrase) {
      return false;
    }

    return [
      'to be a string',
      'to be a number',
      'to be a boolean',
      'to be an array',
      'to be an object',
      'to be null',
      'to be undefined',
      'to be defined',
      'to be a bigint',
      'to be a date',
      'to be a class',
      'to be a function',
      'to be an async function',
    ].some((pattern) => phrase.includes(pattern));
  };

  return createBenchmark({
    assertions: SyncAssertions,
    filter: isBasicTypeAssertion,
    label: 'basic type assertions',
    name: 'type',
    taskRunner: (assertion, testData) => {
      try {
        expect(...testData);
      } catch (error) {
        warnUnexpectedException(assertion, error);
      }
    },
  });
};

/**
 * Create benchmarks for collection-based assertions using test data generators.
 * Replaces the hardcoded createCollectionAssertionsBench from suites.ts.
 */
export const createCollectionAssertionsBench = (): Bench => {
  // Filter for collection operations (arrays, objects, etc.)
  const isCollectionAssertion = (assertion: AnyAssertion): boolean => {
    const phrase = getPrimaryPhrase(assertion);
    if (!phrase) {
      return false;
    }

    return [
      'to contain',
      'to have key',
      'to have length',
      'to have size',
      'to be empty',
      'to have property',
      'to include',
    ].some((pattern) => phrase.includes(pattern));
  };

  return createBenchmark({
    assertions: SyncAssertions,
    filter: isCollectionAssertion,
    label: 'collection assertions',
    name: 'collection',
    taskRunner: (assertion, testData) => {
      try {
        expect(...testData);
      } catch (error) {
        warnUnexpectedException(assertion, error);
      }
    },
  });
};

/**
 * Create benchmarks for equality and comparison assertions using test data
 * generators. Replaces the hardcoded createComparisonAssertionsBench from
 * suites.ts.
 */
export const createComparisonAssertionsBench = (): Bench => {
  // Filter for equality and comparison operations
  const isComparisonAssertion = (assertion: AnyAssertion): boolean => {
    const phrase = getPrimaryPhrase(assertion);
    if (!phrase) {
      return false;
    }

    return [
      'to equal',
      'to be greater than',
      'to be less than',
      'to be greater than or equal to',
      'to be less than or equal to',
      'to be close to',
      'to deep equal',
      'to satisfy',
      'to satisfies',
    ].some((pattern) => phrase.includes(pattern));
  };

  return createBenchmark({
    assertions: SyncAssertions,
    filter: isComparisonAssertion,
    label: 'comparison assertions',
    name: 'comparison',
    taskRunner: (assertion, testData) => {
      try {
        expect(...testData);
      } catch (error) {
        warnUnexpectedException(assertion, error);
      }
    },
  });
};

/**
 * Create benchmarks for pattern matching and regex assertions using test data
 * generators. Replaces the hardcoded createPatternAssertionsBench from
 * suites.ts.
 */
export const createPatternAssertionsBench = (): Bench => {
  // Filter for pattern matching and string operations
  const isPatternAssertion = (assertion: AnyAssertion): boolean => {
    const phrase = getPrimaryPhrase(assertion);
    if (!phrase) {
      return false;
    }

    return [
      'to match',
      'to start with',
      'to end with',
      'to include',
      'to be truthy',
      'to be falsy',
    ].some((pattern) => phrase.includes(pattern));
  };

  return createBenchmark({
    assertions: SyncAssertions,
    filter: isPatternAssertion,
    label: 'pattern assertions',
    name: 'pattern',
    taskRunner: (assertion, testData) => {
      try {
        expect(...testData);
      } catch (error) {
        warnUnexpectedException(assertion, error);
      }
    },
  });
};

/**
 * Configuration options for benchmark modes.
 */
export const BENCH_MODES = {
  ci: CI_BENCH_CONFIG,
  comprehensive: COMPREHENSIVE_BENCH_CONFIG,
  default: DEFAULT_BENCH_CONFIG,
  quick: QUICK_BENCH_CONFIG,
} as const;

export type BenchMode = keyof typeof BENCH_MODES;

/**
 * Run a specific benchmark suite.
 */
export const runBenchmarkSuite = async (
  name: string,
  createBench: (config?: any) => Bench,
  mode: BenchMode = 'default',
): Promise<Bench> => {
  console.log(
    `🔧 Running ${colors.yellow}${name}${colors.reset} benchmarks in ${colors.white}${mode}${colors.reset} mode…`,
  );

  const bench = createBench(BENCH_MODES[mode]);
  await bench.run();

  return bench;
};
