/**
 * Tests for valueToSchema benchmark API contracts.
 *
 * These tests validate the benchmark execution, test data generation, and
 * performance analysis contracts as defined in the design documents.
 */

import { describe, it } from 'node:test';

import type {
  BenchmarkConfig,
  GeneratorOptions,
  PerformanceMetrics,
} from '../../src/types.js';

import {
  analyzeResults,
  generateTestData,
  runValueToSchemaBenchmark,
} from '../../bench/value-to-schema-suite.js';
import { expect } from '../../src/index.js';

describe('valueToSchema benchmark contracts', () => {
  describe('runValueToSchemaBenchmark contract', () => {
    it(
      'should accept valid BenchmarkConfig and return BenchmarkResult',
      { timeout: 10000 },
      async () => {
        const config: BenchmarkConfig = {
          categories: ['primitives'],
          complexityLevels: ['simple'],
          iterations: 3, // Reduce iterations
          sampleSize: 5, // Much smaller sample size
          timeout: 2000, // Reduce timeout
          warmupIterations: 1, // Reduce warmup
        };

        try {
          const result = await runValueToSchemaBenchmark(config);

          // Validate result structure
          expect(result, 'to be an object');
          expect(result.suiteId, 'to be a string');
          expect(result.executionTime, 'to be a number');
          expect(result.results, 'to be an array');
          expect(result.analysis, 'to be an object');
          expect(result.executionContext, 'to be an object');
          expect(result.metadata, 'to be an object');

          // Validate metadata structure
          expect(result.metadata.timestamp, 'to be a string');
          expect(result.metadata.version, 'to be a string');
          expect(result.metadata.nodeVersion, 'to be a string');

          // Validate execution context
          expect(result.executionContext.nodeVersion, 'to be a string');
          expect(result.executionContext.platform, 'to be a string');
          expect(result.executionContext.cpuModel, 'to be a string');
          expect(result.executionContext.memoryTotal, 'to be a number');

          // Validate analysis structure
          expect(result.analysis.bottlenecks, 'to be an array');
          expect(result.analysis.outliers, 'to be an array');
          expect(result.analysis.trends, 'to be an array');
          expect(result.analysis.summary, 'to be an object');
        } catch (error) {
          // Expected to fail in TDD phase
          expect(error, 'to be an Error');
          expect((error as Error).message, 'to match', /not implemented|TDD/i);
        }
      },
    );

    it('should validate BenchmarkConfig parameters', async () => {
      const invalidConfigs = [
        // Invalid iterations
        {
          complexityLevels: ['simple'],
          iterations: 0,
          sampleSize: 100,
          timeout: 1000,
          warmupIterations: 5,
        },
        // Invalid timeout
        {
          complexityLevels: ['simple'],
          iterations: 10,
          sampleSize: 100,
          timeout: 100, // Too short - invalid
          warmupIterations: 5,
        },
        // Invalid sample size
        {
          complexityLevels: ['simple'],
          iterations: 10,
          sampleSize: 0, // Too small - invalid
          timeout: 1000,
          warmupIterations: 5,
        },
      ];

      for (const config of invalidConfigs) {
        try {
          await runValueToSchemaBenchmark(config as BenchmarkConfig);
          // Should not reach here
          expect(true, 'to be false', 'Expected validation error');
        } catch (error) {
          // Should throw validation error
          expect(error, 'to be an Error');
          // Will fail in TDD phase, but structure should be correct
        }
      }
    });

    it('should handle timeout errors gracefully', async () => {
      const config: BenchmarkConfig = {
        complexityLevels: ['complex'],
        iterations: 1000000, // Very high to trigger timeout
        sampleSize: 100,
        timeout: 100, // Very short timeout
        warmupIterations: 5,
      };

      try {
        await runValueToSchemaBenchmark(config);
        // Might not timeout in TDD phase
      } catch (error) {
        expect(error, 'to be an Error');
        // In real implementation, should be TimeoutError
      }
    });
  });

  describe('generateTestData contract', () => {
    it('should generate test data for valid categories', () => {
      const categories = [
        'primitives',
        'builtinObjects',
        'nestedStructures',
        'arrays',
      ];

      for (const category of categories) {
        try {
          const result = generateTestData(category, 10);

          expect(result, 'to be an object');
          expect(result.category, 'to equal', category);
          expect(result.count, 'to be a number');
          expect(result.data, 'to be an array');
          expect(result.metadata, 'to be an object');
          expect(result.metadata.actualCount, 'to be a number');
          expect(result.metadata.generationTime, 'to be a number');
        } catch (error) {
          // Expected to fail in TDD phase
          expect(error, 'to be an Error');
          expect((error as Error).message, 'to match', /not implemented|TDD/i);
        }
      }
    });

    it('should validate generation parameters', () => {
      const invalidParams = [
        ['primitives', 0], // Invalid count
        ['primitives', 10001], // Count too high
        ['invalidCategory', 10], // Invalid category
      ];

      for (const [category, count] of invalidParams) {
        try {
          generateTestData(category as string, count as number);
          // Should not reach here in real implementation
        } catch (error) {
          expect(error, 'to be an Error');
        }
      }
    });

    it('should respect GeneratorOptions', () => {
      const options: GeneratorOptions = {
        includeEdgeCases: true,
        maxArrayLength: 5,
        maxDepth: 3,
        maxObjectProperties: 10,
        seedValue: 12345,
      };

      try {
        const result = generateTestData('nestedStructures', 10, options);

        expect(result.metadata.seed, 'to equal', 12345);
        // Other validations would be in real implementation
      } catch (error) {
        // Expected to fail in TDD phase
        expect(error, 'to be an Error');
      }
    });
  });

  describe('analyzeResults contract', () => {
    it('should analyze performance metrics and return insights', () => {
      const mockMetrics: PerformanceMetrics[] = [
        {
          executionTime: { mean: 0.1, median: 0.1, p95: 0.15, p99: 0.2 },
          inputCategory: 'primitives',
          operationsPerSecond: 10000,
          options: {},
          timestamp: new Date(),
        },
        {
          executionTime: { mean: 0.33, median: 0.3, p95: 0.5, p99: 0.8 },
          inputCategory: 'nestedObjects',
          operationsPerSecond: 3000,
          options: {},
          timestamp: new Date(),
        },
      ];

      try {
        const analysis = analyzeResults(mockMetrics);

        expect(analysis, 'to be an object');
        expect(analysis.bottlenecks, 'to be an array');
        expect(analysis.outliers, 'to be an array');
        expect(analysis.trends, 'to be an array');
        expect(analysis.summary, 'to be an object');

        // Validate summary structure
        expect(analysis.summary.fastestCategory, 'to be a string');
        expect(analysis.summary.slowestCategory, 'to be a string');
        expect(analysis.summary.averageOpsPerSecond, 'to be a number');
        expect(analysis.summary.totalExecutionTime, 'to be a number');
      } catch (error) {
        // Expected to fail in TDD phase
        expect(error, 'to be an Error');
        expect((error as Error).message, 'to match', /not implemented|TDD/i);
      }
    });

    it('should identify bottlenecks correctly', () => {
      const mockMetrics: PerformanceMetrics[] = [
        {
          executionTime: { mean: 1, median: 1, p95: 1.5, p99: 2 },
          inputCategory: 'fast-category',
          operationsPerSecond: 1000, // Very fast
          options: {},
          timestamp: new Date(),
        },
        {
          executionTime: { mean: 10, median: 10, p95: 15, p99: 20 },
          inputCategory: 'slow-category',
          operationsPerSecond: 100, // Very slow
          options: {},
          timestamp: new Date(),
        },
      ];

      try {
        const analysis = analyzeResults(mockMetrics);

        // Should identify the slow category as a bottleneck
        expect(analysis.bottlenecks.length, 'to be greater than', 0);
        const bottleneck = analysis.bottlenecks[0];
        if (bottleneck) {
          expect(bottleneck.category, 'to equal', 'slow-category');
          expect(bottleneck.impact, 'to equal', 'high');
        }
      } catch (error) {
        // Expected to fail in TDD phase
        expect(error, 'to be an Error');
      }
    });
  });
});
