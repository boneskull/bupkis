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
npm run bench:runner -- --suite sync-function          # 66 function-based sync assertions (all)
npm run bench:runner -- --suite sync-function-pure     # 7 pure function sync assertions (fastest)
npm run bench:runner -- --suite sync-function-schema   # 59 schema-returning function sync assertions
npm run bench:runner -- --suite sync-schema            # 44 schema-based sync assertions
npm run bench:runner -- --suite async-function         # 8 function-based async assertions

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
  - Sync Function-based: 66 assertions (pure: 7, schema: 59)
  - Sync Schema-based: 44 assertions
  - Async Function-based: 8 assertions
  - Async Schema-based: 0 assertions
  - **Total: 118 assertions**

#### **`sync-function`** - All Function-based Sync Assertions

- Tests all assertions that use callback functions for validation (66 total)
- Includes both pure and schema-returning function implementations
- Example task names: `"{unknown} 'to be an instance of' / 'to be a' / 'to be an' {constructible}" [sync-function]`

#### **`sync-function-pure`** - Pure Function Sync Assertions (NEW)

- Tests 7 assertions that return boolean or AssertionFailure objects directly
- Generally the fastest assertion type due to minimal overhead
- Examples: Set operations (`'to have union'`, `'to have intersection'`) and function error validation
- Performance threshold: 1200 ops/sec

#### **`sync-function-schema`** - Schema-returning Function Sync Assertions (NEW)

- Tests 59 assertions that return Zod schemas or AssertionParseRequest objects
- More complex than pure functions but still function-based implementations
- Examples: Collection operations, type checking, comparison assertions
- Performance threshold: 800 ops/sec

#### **`sync-schema`** - Schema-based Sync Assertions

- Tests 44 assertions that use Zod schemas for validation
- Generally faster than function-based equivalents due to optimized schema execution
- Example: `"{unknown} 'to be a string'" [sync-schema]`

#### **`async-function`** - Function-based Async Assertions

- Tests 8 Promise-based assertions with callback functions
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

The benchmark system includes configurable performance thresholds by implementation type:

### Implementation-based Thresholds

- **sync-function**: 1000 ops/sec (general function-based sync assertions)
- **sync-function-pure**: 1200 ops/sec (pure function assertions - highest threshold)
- **sync-function-schema**: 800 ops/sec (schema-returning function assertions)
- **sync-schema**: 1500 ops/sec (pure schema-based assertions)
- **async-function**: 15000 ops/sec (async function-based assertions)
- **async-schema**: 15000 ops/sec (async schema-based assertions)

### Legacy Categorical Thresholds

- **Basic assertions**: 1.0ms threshold
- **Collection operations**: 2.0ms threshold
- **Comparison operations**: 1.5ms threshold
- **Complex operations**: 5.0ms threshold
- **Regex operations**: 3.0ms threshold

Benchmarks that exceed these thresholds will generate performance warnings during execution with `--check` flag.

## Suite Overlap Resolution

The benchmark runner automatically handles overlapping suite selections to prevent duplicate execution:

- **Parent-Child Relationships**: If you select both `sync-function` and its child suites (`sync-function-pure`, `sync-function-schema`), the runner will automatically remove the child suites and only execute the parent suite
- **Deduplication Feedback**: The runner provides clear messages about which suites were removed due to overlap
- **Efficient Execution**: This ensures each assertion is benchmarked exactly once per run

Examples:

```bash
# This will only run sync-function (child suites are automatically removed)
npm run bench:runner -- --suite sync-function --suite sync-function-pure

# This will run both child suites independently
npm run bench:runner -- --suite sync-function-pure --suite sync-function-schema
```

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
