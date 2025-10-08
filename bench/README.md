# Bupkis Performance Benchmarks

This directory contains comprehensive performance benchmarks for the Bupkis assertion library, providing detailed performance analysis and monitoring capabilities using [tinybench](https://npm.im/tinybench).

## Overview

The benchmark system monitors performance across multiple dimensions:

1. **Traditional Categorical Benchmarks** - Group assertions by functionality (type, collection, comparison, pattern)
2. **Implementation Class Benchmarks** - Group assertions by their implementation classes for performance comparison
3. **Comprehensive Analysis** - Overall performance overview with implementation distribution

## Files Overview

- **`index.ts`** - Main benchmark suite with comprehensive assertion tests
- **`config.ts`** - Configuration utilities, test data generators, and performance thresholds
- **`suites.ts`** - Traditional categorical benchmark suites organized by assertion functionality
- **`comprehensive-suites.ts`** - **NEW** Implementation class-based benchmarks for ALL assertions
- **`runner.ts`** - CLI runner for executing different benchmark suites and modes

## Available Scripts

```bash
# Run the main benchmark suite
npm run bench

# Run benchmarks in watch mode for development
npm run bench:dev

# Run the CLI benchmark runner
npm run bench:runner

# Quick performance check across all implementation types
npm run bench:runner -- --mode quick --suite comprehensive

# Specific implementation class benchmarks
npm run bench:runner -- --suite sync-function    # 73 function-based sync assertions
npm run bench:runner -- --suite sync-schema      # 44 schema-based sync assertions
npm run bench:runner -- --suite async-function   # 10 function-based async assertions

# Traditional categorical suites
npm run bench:runner -- --suite type collection comparison pattern

# Different benchmark modes
npm run bench:runner -- --mode quick         # Fast iteration (development)
npm run bench:runner -- --mode default       # Balanced accuracy
npm run bench:runner -- --mode comprehensive # High accuracy (CI/production)
```

## Benchmark Suites

### 🆕 Implementation Class Suites

These suites benchmark **ALL assertions** grouped by their implementation classes, providing insights into the performance characteristics of different assertion architectures:

#### **`comprehensive`** - Complete Analysis

- Assertion Implementation Distribution:
  - Sync Function-based: 73 assertions
  - Sync Schema-based: 44 assertions
  - Async Function-based: 10 assertions
  - Async Schema-based: 0 assertions
  - **Total: 127 assertions**

#### **`sync-function`** - Function-based Sync Assertions

- Tests assertions that use callback functions for validation
- Example task names: `"{unknown} 'to be an instance of' / 'to be a' / 'to be an' {constructible}" [sync-function]`

#### **`sync-schema`** - Schema-based Sync Assertions

- Tests assertions that use Zod schemas for validation
- Generally faster than function-based equivalents
- Example: `"{unknown} 'to be a string'" [sync-schema]`

#### **`async-function`** - Function-based Async Assertions

- Tests Promise-based assertions with callback functions
- Includes reject/resolve patterns with parameter validation

#### **`async-schema`** - Schema-based Async Assertions

- Currently no async schema-based assertions in the codebase

### Traditional Categorical Suites

#### **Type Assertions (`type`)**

- Basic type checking assertions (string, number, boolean, etc.)
- Focuses on the fundamental assertion building blocks

### Collection Assertions (`collection`)

- Array and object operations (contains, length, keys, etc.)
- Tests performance with different collection sizes

### Comparison Assertions (`comparison`)

- Equality, inequality, and relational comparisons
- Number and string comparisons

### Pattern Assertions (`pattern`)

- Regular expression matching
- String pattern operations (startsWith, endsWith, includes)

## Performance Thresholds

The benchmark system includes configurable performance thresholds:

- **Basic assertions**: 1.0ms threshold
- **Collection operations**: 2.0ms threshold
- **Comparison operations**: 1.5ms threshold
- **Complex operations**: 5.0ms threshold
- **Regex operations**: 3.0ms threshold

Benchmarks that exceed these thresholds will generate performance warnings.

## Configuration Modes

### Quick Mode

- 50 iterations, 500ms time limit
- 5 warmup iterations, 50ms warmup time
- Ideal for rapid development feedback

### Default Mode

- 100 iterations, 1000ms time limit
- 10 warmup iterations, 100ms warmup time
- Balanced accuracy and speed

### Comprehensive Mode

- 200 iterations, 2000ms time limit
- 20 warmup iterations, 200ms warmup time
- Maximum accuracy for CI/CD and release validation

## Test Data Generators

The `TEST_DATA` object provides consistent test data:

- `simpleObject()` - Basic 3-property object
- `nestedObject()` - Complex user object with nested properties
- `largeArray(size)` - Configurable large array for stress testing
- `deepObject()` - Deeply nested object (4 levels)
- `stringArray()` - Array of fruit names for string operations
- `mixedArray()` - Array with mixed data types

## Usage in CI/CD

For continuous integration, use comprehensive mode to catch performance regressions:

```bash
npm run bench:runner -- --mode comprehensive
```

The benchmarks will exit with a non-zero code if any performance thresholds are exceeded.

## Adding New Benchmarks

1. **Add to existing suite**: Modify the appropriate function in `suites.ts`
2. **Create new suite**: Add a new create function in `suites.ts` and update `runner.ts`
3. **Update main benchmark**: Add cases to `index.ts` for the comprehensive overview

## Performance Monitoring

The benchmark system is designed to help monitor:

- **Performance regressions** between releases
- **Scaling behavior** with different data sizes
- **Assertion category performance** to identify bottlenecks
- **Development impact** of code changes

Use the benchmark results to ensure Bupkis maintains excellent performance characteristics across all assertion types.
