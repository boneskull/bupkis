/**
 * Specialized benchmark suites for different assertion categories.
 *
 * This module contains focused benchmark suites for specific types of
 * assertions to help identify performance issues in particular areas.
 */

import { Bench } from 'tinybench';

import { expect } from '../src/index.js';
import {
  CI_BENCH_CONFIG,
  COMPREHENSIVE_BENCH_CONFIG,
  DEFAULT_BENCH_CONFIG,
  QUICK_BENCH_CONFIG,
  TEST_DATA,
} from './config.js';

/**
 * Benchmarks for basic type assertions.
 */
export const createTypeAssertionsBench = (
  config = DEFAULT_BENCH_CONFIG,
): Bench => {
  const bench = new Bench(config);

  return bench
    .add('string type check', () => {
      expect('hello', 'to be a string');
    })
    .add('number type check', () => {
      expect(42, 'to be a number');
    })
    .add('boolean type check', () => {
      expect(true, 'to be a boolean');
    })
    .add('array type check', () => {
      expect([], 'to be an array');
    })
    .add('object type check', () => {
      expect({}, 'to be an object');
    })
    .add('null type check', () => {
      expect(null, 'to be null');
    })
    .add('undefined type check', () => {
      expect(undefined, 'to be undefined');
    });
};

/**
 * Benchmarks for collection-based assertions.
 */
export const createCollectionAssertionsBench = (
  config = DEFAULT_BENCH_CONFIG,
): Bench => {
  const bench = new Bench(config);

  return bench
    .add('array contains - small array', () => {
      expect(TEST_DATA.stringArray(), 'to contain', 'cherry');
    })
    .add('array contains - large array', () => {
      expect(TEST_DATA.largeArray(1000), 'to contain', 500);
    })
    .add('object has key - simple', () => {
      expect(TEST_DATA.simpleObject(), 'to have key', 'b');
    })
    .add('object has key - nested', () => {
      expect(TEST_DATA.nestedObject(), 'to have key', 'user.name');
    })
    .add('object has key - deep', () => {
      expect(
        TEST_DATA.deepObject(),
        'to have key',
        'level1.level2.level3.level4.value',
      );
    })
    .add('array length check', () => {
      expect(TEST_DATA.stringArray(), 'to have length', 5);
    })
    .add('object size check', () => {
      expect(TEST_DATA.simpleObject(), 'to have size', 3);
    });
};

/**
 * Benchmarks for equality and comparison assertions.
 */
export const createComparisonAssertionsBench = (
  config = DEFAULT_BENCH_CONFIG,
): Bench => {
  const bench = new Bench(config);

  return bench
    .add('string equality', () => {
      expect('hello', 'to equal', 'hello');
    })
    .add('number equality', () => {
      expect(42, 'to equal', 42);
    })
    .add('object equality', () => {
      const obj = { a: 1, b: 2 };
      expect(obj, 'to equal', obj);
    })
    .add('array equality', () => {
      const arr = [1, 2, 3];
      expect(arr, 'to equal', arr);
    })
    .add('number greater than', () => {
      expect(10, 'to be greater than', 5);
    })
    .add('number less than', () => {
      expect(5, 'to be less than', 10);
    })
    .add('string includes', () => {
      expect('hello world', 'to include', 'world');
    });
};

/**
 * Benchmarks for pattern matching and regex assertions.
 */
export const createPatternAssertionsBench = (
  config = DEFAULT_BENCH_CONFIG,
): Bench => {
  const bench = new Bench(config);

  return bench
    .add('simple regex match', () => {
      expect('hello123', 'to match', /\d+/);
    })
    .add('complex regex match', () => {
      expect('user@example.com', 'to match', /^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    })
    .add('string starts with', () => {
      expect('hello world', 'to start with', 'hello');
    })
    .add('string ends with', () => {
      expect('hello world', 'to end with', 'world');
    })
    .add('case-insensitive match', () => {
      expect('Hello World', 'to match', /hello/i);
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
): Promise<void> => {
  console.log(`\n🔧 Running ${name} benchmarks (${mode} mode)...`);

  const bench = createBench(BENCH_MODES[mode]);
  await bench.run();

  console.log(`\n📊 ${name} Results:`);
  console.table(bench.table());
};
