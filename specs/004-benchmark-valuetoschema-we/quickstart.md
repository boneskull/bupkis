# Quickstart: valueToSchema() Benchmark Suite

## Quick Start

### 1. Install Dependencies

```bash
# Already available in existing project
npm install  # fast-check, tinybench are existing dependencies
```

### 2. Run Basic Benchmark

```bash
# Run the valueToSchema benchmark suite
npm run bench:value-to-schema

# Or run specific categories
npm run bench:value-to-schema -- --categories=primitives,nestedObjects

# Run with custom configuration
npm run bench:value-to-schema -- --iterations=200 --sample-size=2000
```

### 3. Expected Output

```
📊 valueToSchema() Benchmark Results

┌─────────────────────┬─────────────────┬─────────────────┬─────────────────┐
│ Category            │ Options         │ Ops/sec         │ Avg Time (ms)   │
├─────────────────────┼─────────────────┼─────────────────┼─────────────────┤
│ primitives          │ default         │ 12,450          │ 0.080           │
│ primitives          │ literalPrimitives│ 8,230          │ 0.121           │
│ builtinObjects      │ default         │ 9,850           │ 0.101           │
│ nestedObjects       │ default         │ 4,320           │ 0.231           │
│ nestedObjects       │ strict          │ 3,890           │ 0.257           │
│ arrays              │ default         │ 6,780           │ 0.147           │
│ arrays              │ literalTuples   │ 5,430           │ 0.184           │
└─────────────────────┴─────────────────┴─────────────────┴─────────────────┘

🔍 Performance Analysis:
  ✅ Fastest: primitives (default) - 12,450 ops/sec
  ⚠️  Slowest: nestedObjects (strict) - 3,890 ops/sec
  📈 Key Insight: literalPrimitives option reduces performance by ~33%
  📈 Key Insight: Nested structures are 3x slower than primitives
```

## Integration with Existing Benchmarks

### Add to Benchmark Runner

```bash
# Run all benchmarks including valueToSchema
npm run bench

# Run comprehensive benchmark suite
npm run bench -- --suites=comprehensive,value-to-schema
```

### CI Integration

The benchmark integrates with existing CI pipeline:

```yaml
# .github/workflows/benchmark.yml (addition to existing)
- name: Run valueToSchema benchmarks
  run: npm run bench:value-to-schema -- --check-performance
```

## Advanced Usage

### Custom Generator Configuration

```typescript
// Create custom benchmark configuration
const config: BenchmarkConfig = {
  iterations: 500,
  sampleSize: 5000,
  complexityLevels: ['medium', 'complex'],
  categories: ['nestedObjects', 'arrays'],
  options: [
    { literalPrimitives: true, maxDepth: 5 },
    { literalTuples: true, noMixedArrays: true },
    { strict: true, literalEmptyObjects: true },
  ],
};

const results = await runValueToSchemaBenchmark(config);
```

### Performance Profiling

```bash
# Generate detailed performance profiles
npm run bench:value-to-schema -- --profile

# Output flame graphs for bottleneck analysis
npm run bench:value-to-schema -- --flame-graph
```

## Validation Tests

### Verify Benchmark Implementation

```bash
# Run benchmark validation tests
npm test -- test/bench/value-to-schema-bench.test.ts

# Verify generators produce valid inputs
npm test -- test/bench/value-to-schema-generators.test.ts
```

### Expected Test Results

```
✅ Generator validation
  ✅ Primitives generator produces valid inputs (1000/1000 passed)
  ✅ Builtin objects generator avoids exception cases (1000/1000 passed)
  ✅ Nested structures respect depth limits (1000/1000 passed)
  ✅ No __proto__ objects generated (0/1000 contained __proto__)
  ✅ No ExpectItExecutor in strict mode (0/1000 when strict=true)

✅ Benchmark execution
  ✅ All categories complete within timeout
  ✅ Performance metrics are valid numbers
  ✅ Results are reproducible with same seed
```

## Troubleshooting

### Common Issues

**Slow Performance**

```bash
# Reduce sample size for faster iteration
npm run bench:value-to-schema -- --sample-size=100 --iterations=10
```

**Memory Issues**

```bash
# Limit nesting depth and complexity
npm run bench:value-to-schema -- --max-depth=3 --categories=primitives
```

**Inconsistent Results**

```bash
# Use fixed seed for reproducible results
npm run bench:value-to-schema -- --seed=12345
```

### Debug Mode

```bash
# Enable detailed logging
DEBUG=bupkis:bench npm run bench:value-to-schema

# Output raw benchmark data
npm run bench:value-to-schema -- --output=./benchmark-results.json
```

## Success Criteria Validation

After running the benchmark, verify:

1. **Comprehensive Coverage**: All `valueToSchema()` code paths are exercised
2. **Performance Insights**: Bottlenecks are identified with specific input types
3. **Option Impact**: Performance differences between option combinations are measured
4. **Depth Analysis**: Performance degradation with nesting depth is quantified
5. **Integration**: Results integrate with existing benchmark infrastructure

Expected completion time: **2-5 minutes** for full benchmark suite
Expected memory usage: **< 500MB** peak during execution
