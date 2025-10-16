# Research: valueToSchema() Benchmark Implementation

## Fast-Check Generator Requirements

### Decision: Comprehensive Type Coverage Based on Switch Statement Analysis

**Rationale**: The `valueToSchema()` function contains a large switch statement that handles different `typeof` results and specific object type checks. To benchmark all code paths, we need generators for each case.

**Type Categories Identified**:

1. **Primitive Types** (switch statement cases):
   - `bigint` - z.bigint() or z.literal(value)
   - `boolean` - z.boolean() or z.literal(value)
   - `function` - z.function() (with special ExpectItExecutor handling)
   - `number` - z.number() or z.literal(value), including NaN, Infinity, -Infinity
   - `string` - z.string() or z.literal(value)
   - `symbol` - z.symbol()

2. **Special Primitive Values**:
   - `null` - z.null()
   - `undefined` - z.undefined() or custom validator
   - `NaN` - z.nan()
   - `Infinity/-Infinity` - z.literal(value)

3. **Built-in Object Types**:
   - `Date` - z.date() (including invalid dates)
   - `RegExp` - RegExpSchema or z.coerce.string().regex()
   - `Map` - z.instanceof(Map)
   - `Set` - z.instanceof(Set)
   - `WeakMap` - z.instanceof(WeakMap)
   - `WeakSet` - z.instanceof(WeakSet)
   - `Error` - z.instanceof(Error)
   - Promise-like objects - WrappedPromiseLikeSchema

4. **Collection Types** (recursive):
   - Arrays - z.array() or z.tuple() with recursive element processing
   - Plain objects - z.object() with recursive property processing

### Exception Cases to Avoid

**Decision**: Exclude object types that cause `valueToSchema()` to throw exceptions

**Cases Identified**:

1. Objects with own `__proto__` property - throws `SatisfactionError`
2. ExpectItExecutor functions in strict mode - throws `SatisfactionError`

**Rationale**: Benchmarks should test performance of successful execution paths, not exception handling overhead.

## ValueToSchemaOptions Coverage

### Decision: Test All Option Combinations That Affect Performance

**Options to Benchmark**:

- `literalPrimitives: boolean` - affects primitive type schema generation
- `literalRegExp: boolean` - affects RegExp handling
- `literalTuples: boolean` - affects array processing (tuple vs array)
- `literalEmptyObjects: boolean` - affects empty object handling
- `noMixedArrays: boolean` - affects array element deduplication logic
- `strict: boolean` - affects ExpectItExecutor validation
- `maxDepth: number` - affects recursion termination

**Rationale**: Each option changes execution paths and may have different performance characteristics.

## Recursive Structure Testing

### Decision: Test Nesting Depth Performance Characteristics

**Approach**:

- Generate nested objects with controlled depth (1-10 levels)
- Generate nested arrays with controlled depth (1-10 levels)
- Test mixed nested structures (objects containing arrays containing objects)
- Test performance degradation as depth approaches `maxDepth` limit

**Rationale**: Recursive processing is likely a performance bottleneck, especially with circular reference detection overhead.

## Fast-Check Generator Architecture

### Decision: Coordinated Generators with Type-Specific Arbitraries

**Architecture**:

```typescript
// Primary generator factory
const createValueToSchemaGenerators = () => ({
  primitives: fc.oneof([
    fc.bigint(),
    fc.boolean(),
    fc.float(),
    fc.string(),
    fc.hexa(),
  ]),
  builtinObjects: fc.oneof([
    fc.date(),
    fc.constant(/test/),
    fc.constant(new Map()),
    fc.constant(new Set()),
    fc.constant(new Error('test')),
  ]),
  nestedStructures: fc.letrec((tie) => ({
    object: fc.record({
      /* recursive */
    }),
    array: fc.array(tie('value'), { maxLength: 5 }),
    value: fc.oneof([tie('primitives'), tie('object'), tie('array')]),
  })),
});
```

**Rationale**: Coordinated generators ensure we test realistic combinations while maintaining control over complexity and avoiding exception cases.

## Benchmark Suite Integration

### Decision: Follow Existing Benchmark Infrastructure Patterns

**Integration Points**:

- Use `tinybench` library like existing benchmarks
- Follow naming conventions from `comprehensive-suites.ts`
- Integrate with benchmark runner in `runner.ts`
- Use performance thresholds from `config.ts`

**Output Format**: Match existing benchmark reporting for consistency with CI/CD pipeline.

## Performance Metrics to Collect

### Decision: Focus on Execution Time and Throughput

**Metrics**:

- Operations per second (ops/sec) for each input type category
- Execution time percentiles (p50, p95, p99)
- Memory allocation patterns (if feasible)
- Performance degradation with nesting depth

**Rationale**: These metrics will identify bottlenecks and inform optimization priorities.

## Alternatives Considered

### Alternative 1: Static Test Data

**Rejected Because**: Would not exercise all code paths or reveal performance characteristics across input diversity.

### Alternative 2: Single Combined Generator

**Rejected Because**: Would not provide granular performance insights by input type category.

### Alternative 3: Manual Benchmark Cases

**Rejected Because**: Would be labor-intensive and miss edge cases that property-based testing naturally discovers.
