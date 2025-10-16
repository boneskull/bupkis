# Data Model: valueToSchema() Benchmark Suite

## Core Entities

### ValueToSchemaBenchmarkSuite

**Purpose**: Orchestrates the execution of performance benchmarks for the `valueToSchema()` function across different input types and configurations.

**Key Attributes**:

- `name: string` - Benchmark suite identifier ("valueToSchema")
- `inputCategories: InputCategory[]` - Collection of input type categories to test
- `optionCombinations: ValueToSchemaOptions[]` - Configuration variants to benchmark
- `metrics: PerformanceMetrics[]` - Collected performance measurements
- `config: BenchmarkConfig` - Runtime configuration (iterations, warmup, timeout)

**Relationships**:

- Owns multiple `InputCategory` instances
- Produces `PerformanceMetrics` for each test run
- Uses `TestDataGenerator` to create inputs

**State Transitions**:

- Initialized → Configured → Running → Complete
- Can be reset to Configured state for re-execution

### InputCategory

**Purpose**: Represents a specific category of input values that exercise particular code paths in `valueToSchema()`.

**Key Attributes**:

- `name: string` - Category identifier (e.g., "primitives", "nestedObjects")
- `generator: fc.Arbitrary<unknown>` - Fast-check generator for this category
- `description: string` - Human-readable description of what this category tests
- `expectedCodePath: string[]` - Code paths this category is designed to exercise
- `complexity: ComplexityLevel` - Relative complexity (Simple/Medium/Complex)

**Validation Rules**:

- Generators must not produce values that cause `valueToSchema()` to throw exceptions
- Each category must have unique name within a benchmark suite
- Generator must be deterministic for reproducible benchmarks

### TestDataGenerator

**Purpose**: Factory for creating fast-check generators that produce valid inputs for `valueToSchema()` benchmarking.

**Key Attributes**:

- `primitiveGenerator: fc.Arbitrary<Primitive>` - Generator for primitive values
- `builtinObjectGenerator: fc.Arbitrary<object>` - Generator for built-in object types
- `nestedStructureGenerator: fc.Arbitrary<object>` - Recursive generator for complex structures
- `options: GeneratorOptions` - Configuration for generator behavior

**Methods**:

- `createForCategory(category: string): fc.Arbitrary<unknown>` - Creates category-specific generator
- `withComplexity(level: ComplexityLevel): TestDataGenerator` - Adjusts generator complexity
- `excludeExceptionCases(): TestDataGenerator` - Filters out exception-causing values

**Validation Rules**:

- All generated values must be valid inputs for `valueToSchema()`
- Generators must not produce objects with own `__proto__` property
- ExpectItExecutor functions only generated when strict mode is disabled

### PerformanceMetrics

**Purpose**: Container for performance measurements collected during benchmark execution.

**Key Attributes**:

- `inputCategory: string` - Category of input being measured
- `options: ValueToSchemaOptions` - Configuration used for this measurement
- `operationsPerSecond: number` - Throughput measurement
- `executionTime: ExecutionTimeStats` - Timing statistics
- `memoryUsage?: MemoryStats` - Memory allocation data (if available)
- `timestamp: Date` - When measurement was taken

**Sub-Entities**:

- `ExecutionTimeStats`: `{ mean: number, median: number, p95: number, p99: number }`
- `MemoryStats`: `{ heapUsed: number, heapTotal: number, external: number }`

**Validation Rules**:

- All timing values must be positive numbers
- Operations per second must be greater than zero
- Timestamps must be valid dates

### BenchmarkResult

**Purpose**: Aggregated results from a complete benchmark run, including analysis and comparisons.

**Key Attributes**:

- `suiteId: string` - Identifier for the benchmark suite
- `results: PerformanceMetrics[]` - Individual measurement results
- `analysis: PerformanceAnalysis` - Computed insights and bottleneck identification
- `executionContext: ExecutionContext` - Environment details when benchmark was run

**Sub-Entities**:

- `PerformanceAnalysis`: `{ bottlenecks: string[], outliers: OutlierDetection[], trends: PerformanceTrend[] }`
- `ExecutionContext`: `{ nodeVersion: string, platform: string, cpuModel: string, memoryTotal: number }`

## Data Flow

```
TestDataGenerator → InputCategory → ValueToSchemaBenchmarkSuite → PerformanceMetrics → BenchmarkResult
```

1. **Generation**: `TestDataGenerator` creates category-specific generators
2. **Categorization**: Generators are organized into `InputCategory` instances
3. **Execution**: `ValueToSchemaBenchmarkSuite` runs benchmarks using categories
4. **Measurement**: Each run produces `PerformanceMetrics`
5. **Analysis**: Results are aggregated into `BenchmarkResult` with insights

## Configuration Schema

### BenchmarkConfig

```typescript
interface BenchmarkConfig {
  iterations: number; // Number of benchmark iterations (default: 100)
  warmupIterations: number; // Warmup runs before measurement (default: 10)
  timeout: number; // Maximum time per benchmark in ms (default: 30000)
  sampleSize: number; // Number of inputs to generate per category (default: 1000)
  complexityLevels: ComplexityLevel[]; // Which complexity levels to test
}
```

### GeneratorOptions

```typescript
interface GeneratorOptions {
  maxDepth: number; // Maximum nesting depth for recursive structures
  maxArrayLength: number; // Maximum array size
  maxObjectProperties: number; // Maximum object property count
  includeEdgeCases: boolean; // Whether to include edge cases (NaN, Infinity, etc.)
  seedValue?: number; // Optional seed for reproducible generation
}
```

## Validation Constraints

### Input Validation

- Generated values must not cause `SatisfactionError` exceptions
- Arrays and objects must respect depth limits to prevent stack overflow
- RegExp objects must be valid (not malformed patterns)
- Date objects can be invalid dates (test case for invalid date handling)

### Performance Validation

- Benchmark runs must complete within timeout limits
- Memory usage must not exceed reasonable bounds
- Results must be statistically significant (minimum sample size)

### Configuration Validation

- All numeric configuration values must be positive
- Timeout values must be reasonable (1-300 seconds)
- Sample sizes must be sufficient for statistical validity (minimum 10)
