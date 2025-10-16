# ValueToSchema Benchmark API Contracts

## Benchmark Execution Contract

### `runValueToSchemaBenchmark(config: BenchmarkConfig): Promise<BenchmarkResult>`

**Purpose**: Execute a complete benchmark suite for `valueToSchema()` function performance analysis.

**Request Schema**:

```typescript
interface BenchmarkConfig {
  iterations: number; // 1-10000, default: 100
  warmupIterations: number; // 1-100, default: 10
  timeout: number; // 1000-300000ms, default: 30000
  sampleSize: number; // 10-10000, default: 1000
  complexityLevels: ('simple' | 'medium' | 'complex')[];
  categories?: string[]; // Optional filter for input categories
  options?: Partial<ValueToSchemaOptions>[]; // Option combinations to test
}
```

**Response Schema**:

```typescript
interface BenchmarkResult {
  suiteId: string;
  executionTime: number; // Total execution time in ms
  results: PerformanceMetrics[];
  analysis: PerformanceAnalysis;
  executionContext: ExecutionContext;
  metadata: {
    timestamp: string; // ISO date string
    version: string; // Library version
    nodeVersion: string;
  };
}
```

**Error Responses**:

- `InvalidConfigError`: Configuration validation failed
- `TimeoutError`: Benchmark exceeded timeout limit
- `GeneratorError`: Test data generation failed
- `BenchmarkError`: Unexpected error during benchmark execution

## Test Data Generation Contract

### `generateTestData(category: string, count: number, options?: GeneratorOptions): unknown[]`

**Purpose**: Generate test data for a specific input category.

**Request Schema**:

```typescript
interface GeneratorRequest {
  category:
    | 'primitives'
    | 'builtinObjects'
    | 'nestedStructures'
    | 'arrays'
    | 'options';
  count: number; // 1-10000
  options?: {
    maxDepth?: number; // 1-20, default: 5
    maxArrayLength?: number; // 1-1000, default: 100
    maxObjectProperties?: number; // 1-100, default: 20
    includeEdgeCases?: boolean; // default: true
    seedValue?: number; // For reproducible generation
  };
}
```

**Response Schema**:

```typescript
interface GeneratorResponse {
  category: string;
  count: number;
  data: unknown[];
  metadata: {
    actualCount: number; // May be less than requested if validation failed
    generationTime: number; // Time to generate in ms
    seed?: number; // Actual seed used
  };
}
```

## Performance Analysis Contract

### `analyzeResults(metrics: PerformanceMetrics[]): PerformanceAnalysis`

**Purpose**: Analyze benchmark results to identify bottlenecks and performance characteristics.

**Request Schema**:

```typescript
interface AnalysisRequest {
  metrics: PerformanceMetrics[];
  thresholds?: {
    slowOperationThreshold: number; // ops/sec, default: 1000
    outlierThreshold: number; // standard deviations, default: 2
  };
}
```

**Response Schema**:

```typescript
interface PerformanceAnalysis {
  bottlenecks: {
    category: string;
    reason: string;
    impact: 'low' | 'medium' | 'high';
    opsPerSecond: number;
  }[];
  outliers: {
    category: string;
    options: ValueToSchemaOptions;
    deviation: number; // Standard deviations from mean
    value: number; // Actual ops/sec value
  }[];
  trends: {
    factor: string; // What changed (complexity, options, etc.)
    impact: number; // Performance change factor
    description: string;
  }[];
  summary: {
    fastestCategory: string;
    slowestCategory: string;
    averageOpsPerSecond: number;
    totalExecutionTime: number;
  };
}
```

## Contract Validation Rules

### Input Validation

- All numeric values must be within specified ranges
- String enums must match exactly (case-sensitive)
- Optional fields can be omitted but not null
- Array fields cannot be empty when provided

### Response Guarantees

- All promises resolve within timeout limits
- Numeric results are always finite numbers (no NaN, Infinity)
- String fields are never empty
- Array results maintain order when order is meaningful

### Error Handling

- All contract violations throw typed errors
- Timeout errors include partial results when available
- Generator errors specify which values failed validation
- All errors include actionable error messages
