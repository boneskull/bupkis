/**
 * Configuration presets for modestbench benchmarks.
 *
 * Defines benchmark configuration options and tag taxonomy.
 */

export interface BenchmarkConfig {
  iterations: number;
  time: number;
  warmupIterations?: number;
  warmupTime?: number;
}
export const SUITE_CONFIGS: Record<string, Partial<BenchmarkConfig>> = {
  'async-function': {
    iterations: 50,
    time: 1000,
  },
  'sync-function-pure': {
    iterations: 200,
    time: 1000,
  },
  'sync-function-schema': {
    iterations: 100,
    time: 1000,
  },
  'sync-schema': {
    iterations: 150,
    time: 1000,
  },
  'value-to-schema': {
    iterations: 100,
    time: 1000,
  },
};
