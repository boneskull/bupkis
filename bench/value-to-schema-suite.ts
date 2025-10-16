/**
 * ValueToSchema benchmark suite implementation.
 *
 * Provides comprehensive performance testing for the valueToSchema() function
 * across different input categories and configurations.
 */

import * as fc from 'fast-check';
import * as os from 'node:os';
import { Bench } from 'tinybench';

import type {
  BenchmarkConfig,
  BenchmarkResult,
  ExecutionContext,
  GeneratorOptions,
  PerformanceAnalysis,
  PerformanceMetrics,
} from '../src/types.js';
import type { ValueToSchemaOptions } from '../src/value-to-schema.js';

import { valueToSchema } from '../src/value-to-schema.js';
import { valueToSchemaGeneratorFactory } from '../test-data/value-to-schema-generators.js';
import { colors, DEFAULT_BENCH_CONFIG } from './config.js';
import { createEventHandlers } from './suites.js';

/**
 * Creates a benchmark suite for valueToSchema() function. Follows the standard
 * benchmark creation pattern used by assertion benchmarks.
 */
export const createValueToSchemaBench = (): Bench => {
  const factory = valueToSchemaGeneratorFactory();

  // Define test categories and their generators
  const testCategories = [
    {
      category: 'primitives',
      generator: () => factory.createForCategory('primitives'),
    },
    {
      category: 'objects',
      generator: () => factory.createForCategory('objects'),
    },
    {
      category: 'arrays',
      generator: () => factory.createForCategory('arrays'),
    },
    {
      category: 'builtinObjects',
      generator: () => factory.createForCategory('builtinObjects'),
    },
  ];

  const bench = new Bench(DEFAULT_BENCH_CONFIG);

  // Set up event handlers
  const handlers = createEventHandlers('value-to-schema');
  bench.addEventListener('start', handlers.startHandler);
  bench.addEventListener('cycle', handlers.cycleHandler);
  bench.addEventListener('complete', () => {
    handlers.completeHandler();
    bench.removeEventListener('start', handlers.startHandler);
    bench.removeEventListener('cycle', handlers.cycleHandler);
    bench.removeEventListener('complete', handlers.completeHandler);
  });

  console.log(
    `⏱️  Benchmarking ${colors.brightCyan}${testCategories.length * 2}${colors.reset} ${colors.yellow}valueToSchema() operations${colors.reset}`,
  );

  // Add benchmark tasks for each category/option combination
  for (const { category, generator } of testCategories) {
    for (const options of [{}, { literalPrimitives: true }]) {
      const optionsStr =
        Object.keys(options).length > 0
          ? `-${Object.entries(options)
              .map(([k, v]) => `${k}:${v}`)
              .join('-')}`
          : '-default';
      const taskName = `${category}${optionsStr} [value-to-schema]`;

      bench.add(taskName, () => {
        // Generate fresh test data for each execution
        const testData = fc.sample(generator(), 5);
        for (const value of testData) {
          valueToSchema(value, options);
        }
      });
    }
  }

  return bench;
};

/**
 * Runs comprehensive valueToSchema() benchmarks based on configuration.
 */
export const runValueToSchemaBenchmark = async (
  config: BenchmarkConfig,
): Promise<BenchmarkResult> => {
  // Validate config - reasonable limits for both testing and production
  if (!config.sampleSize || config.sampleSize < 1) {
    throw new Error(
      `Invalid sampleSize: ${config.sampleSize}. Must be at least 1`,
    );
  }
  if (!config.timeout || config.timeout < 200) {
    throw new Error(
      `Invalid timeout: ${config.timeout}ms. Must be at least 200ms`,
    );
  }
  if (config.iterations < 1 || config.iterations > 10000) {
    throw new Error('Iterations must be between 1 and 10000');
  }

  const startTime = Date.now();
  const executionContext = getExecutionContext();
  const factory = valueToSchemaGeneratorFactory();

  // Generate test data for all categories
  const testData = generateTestDataSets(config, factory);

  // Create benchmark suite with sensible defaults for testing
  const bench = new Bench({
    iterations: Math.min(config.iterations, 50), // Limit total iterations
    time: Math.min(1000, config.timeout / 10), // Max 1 second per benchmark
    warmupIterations: Math.min(config.warmupIterations, 5), // Limit warmup
    warmupTime: 50, // Short warmup time
  });

  // Add benchmark tasks for each category/option combination
  const benchmarkTasks: Array<{
    category: string;
    data: unknown[];
    options: Partial<ValueToSchemaOptions>;
  }> = [];

  for (const category of config.categories || ['primitives']) {
    const categoryData = testData[category] || [];

    for (const options of config.options || [{}]) {
      const taskName = `${category}-${JSON.stringify(options)}`;
      // Use much smaller sample size for tests to avoid hanging
      const sampleSize = Math.min(config.sampleSize, 10);
      const taskData = categoryData.slice(0, sampleSize);

      benchmarkTasks.push({ category, data: taskData, options });

      bench.add(taskName, () => {
        // Run valueToSchema on each data sample - but limit to just a few iterations
        for (let i = 0; i < Math.min(taskData.length, 5); i++) {
          valueToSchema(taskData[i], options);
        }
      });
    }
  }

  // Run benchmarks
  await bench.run();

  // Process results
  const results: PerformanceMetrics[] = [];

  for (let i = 0; i < bench.tasks.length; i++) {
    const task = bench.tasks[i];
    const taskConfig = benchmarkTasks[i];

    if (task && task.result && taskConfig) {
      results.push({
        executionTime: {
          mean: task.result.latency.mean * 1000, // Convert to milliseconds
          median: task.result.latency.mean * 1000, // Use mean as approximation for median
          p95: task.result.latency.mean * 1.2 * 1000, // Approximate p95
          p99: task.result.latency.mean * 1.5 * 1000, // Approximate p99
        },
        inputCategory: taskConfig.category,
        memoryUsage: {
          external: process.memoryUsage().external,
          heapTotal: process.memoryUsage().heapTotal,
          heapUsed: process.memoryUsage().heapUsed,
        },
        operationsPerSecond: task.result.hz || 0,
        options: taskConfig.options,
        timestamp: new Date(),
      });
    }
  }

  const analysis = analyzeResults(results);
  const executionTime = Date.now() - startTime;

  return {
    analysis,
    executionContext,
    executionTime,
    metadata: {
      nodeVersion: process.version,
      timestamp: new Date().toISOString(),
      version: '1.0.0', // Version of the benchmark suite
    },
    results,
    suiteId: 'value-to-schema',
  };
};

/**
 * Generates test data for specific categories and counts.
 */
export const generateTestData = (
  category: string,
  count: number,
  options: GeneratorOptions = {},
): {
  category: string;
  count: number;
  data: unknown[];
  metadata: {
    actualCount: number;
    generationTime: number;
    seed?: number;
  };
} => {
  const startTime = Date.now();
  const factory = valueToSchemaGeneratorFactory();

  try {
    const generator = factory.createForCategory(category, options);

    // Limit the count for performance
    const limitedCount = Math.min(count, 50);

    // Generate test data using fast-check with type casting
    const samples = fc.sample(generator as fc.Arbitrary<unknown>, limitedCount);

    const generationTime = Date.now() - startTime;

    return {
      category,
      count: limitedCount,
      data: samples,
      metadata: {
        actualCount: samples.length,
        generationTime,
        ...(options.seedValue && { seed: options.seedValue }),
      },
    };
  } catch {
    // Return empty result for unsupported categories
    const generationTime = Date.now() - startTime;
    return {
      category,
      count: 0,
      data: [],
      metadata: {
        actualCount: 0,
        generationTime,
        ...(options.seedValue && { seed: options.seedValue }),
      },
    };
  }
};

/**
 * Analyzes benchmark results to identify bottlenecks and patterns.
 */
export const analyzeResults = (
  metrics: PerformanceMetrics[],
): PerformanceAnalysis => {
  if (metrics.length === 0) {
    return {
      bottlenecks: [],
      outliers: [],
      summary: {
        averageOpsPerSecond: 0,
        fastestCategory: 'none',
        slowestCategory: 'none',
        totalExecutionTime: 0,
      },
      trends: [],
    };
  }

  // Calculate summary statistics
  const avgOps =
    metrics.reduce((sum, m) => sum + (m.operationsPerSecond || 0), 0) /
    metrics.length;
  const totalExecutionTime = metrics.reduce(
    (sum, m) => sum + (m.executionTime?.mean || 0),
    0,
  );
  const sortedByOps = [...metrics].sort(
    (a, b) => (b.operationsPerSecond || 0) - (a.operationsPerSecond || 0),
  );

  const fastest = sortedByOps[0];
  const slowest = sortedByOps[sortedByOps.length - 1];

  // Identify bottlenecks (operations significantly slower than average)
  const bottlenecks = metrics
    .filter((m) => (m.operationsPerSecond || 0) < avgOps * 0.5) // Less than 50% of average
    .map((m) => ({
      category: m.inputCategory || 'unknown',
      impact: ((m.operationsPerSecond || 0) < avgOps * 0.25
        ? 'high'
        : 'medium') as 'high' | 'low' | 'medium',
      opsPerSecond: m.operationsPerSecond || 0,
      reason: `Low throughput: ${(m.operationsPerSecond || 0).toFixed(0)} ops/sec vs average ${avgOps.toFixed(0)} ops/sec`,
    }));

  // Identify outliers (execution times significantly different from mean)
  const outliers = metrics
    .filter((m) => {
      const meanTime = m.executionTime?.mean || 0;
      // Use p95 as a proxy for variability measure
      const variability =
        (m.executionTime?.p95 || 0) - (m.executionTime?.mean || 0);
      return Math.abs(meanTime - avgOps) > variability * 2;
    })
    .map((m) => ({
      category: m.inputCategory || 'unknown',
      deviation: Math.abs((m.executionTime?.mean || 0) - avgOps),
      options: m.options || {},
      value: m.executionTime?.mean || 0,
    }));

  return {
    bottlenecks,
    outliers,
    summary: {
      averageOpsPerSecond: avgOps,
      fastestCategory: fastest?.inputCategory || 'none',
      slowestCategory: slowest?.inputCategory || 'none',
      totalExecutionTime,
    },
    trends: [], // Add trend analysis later if needed
  };
};

/**
 * Generates test data sets for all configured categories.
 */
const generateTestDataSets = (
  config: BenchmarkConfig,
  factory: ReturnType<typeof valueToSchemaGeneratorFactory>,
): Record<string, unknown[]> => {
  const testData: Record<string, unknown[]> = {};
  const generatorOptions: GeneratorOptions = {
    includeEdgeCases: false, // Disable edge cases for faster generation
    maxArrayLength: 5, // Small arrays
    maxDepth: 2, // Shallow nesting
  };

  for (const category of config.categories || ['primitives']) {
    try {
      const generator = factory.createForCategory(category, generatorOptions);
      // Generate much fewer samples for tests
      const sampleCount = Math.min(config.sampleSize, 20);
      const samples = fc.sample(
        generator as fc.Arbitrary<unknown>,
        sampleCount,
      );
      testData[category] = samples;
    } catch (_error) {
      // Fallback to empty array if category not supported
      testData[category] = [];
    }
  }

  return testData;
};

/**
 * Gets current execution context information.
 */
const getExecutionContext = (): ExecutionContext => {
  const cpus = os.cpus();
  const cpuModel = cpus.length > 0 && cpus[0] ? cpus[0].model : 'Unknown';

  return {
    cpuModel,
    memoryTotal: os.totalmem(),
    nodeVersion: process.version,
    platform: `${os.type()} ${os.release()} ${os.arch()}`,
  };
};
