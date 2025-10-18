# CLI Interface Contract

## Command Line Interface

### Suite Selection

```bash
# Existing patterns (must remain unchanged)
npm run bench:runner -- --suite sync-function
npm run bench:runner -- --suite all
npm run bench:runner -- --suite sync-function --suite async-function

# New patterns (to be added)
npm run bench:runner -- --suite sync-function-pure
npm run bench:runner -- --suite sync-function-schema
npm run bench:runner -- --suite sync-function-pure --suite sync-function-schema
```

### Help Output

```bash
Available suites:
  all                     Run all benchmark suites
  async-function          Async function-based assertions (promise validation with callbacks)
  async-schema            Async schema-based assertions (promise validation with schemas)
  sync-function           Sync function-based assertions (validation with callback functions)
  sync-function-pure      Pure sync function assertions (return AssertionFailure/boolean)
  sync-function-schema    Schema-based sync function assertions (return Zod schema/AssertionParseRequest)
  sync-schema             Sync schema-based assertions (validation with Zod schemas)
```

### Error Handling

```bash
# Invalid suite name
❌ Invalid suite name: 'invalid-suite'
   Available suites: all, async-function, sync-function, sync-function-pure, sync-function-schema, sync-schema

# Overlapping suite selection (informational, not error)
ℹ️  Suite 'sync-function' includes 'sync-function-pure' and 'sync-function-schema' - running parent suite only
```

### Output Format

```bash
# Execution feedback
🚀 Bupkis Performance Benchmark Runner

📊 Running suites: sync-function-pure, sync-function-schema
ℹ️  Deduplicated 0 assertions (no overlap detected)

✓ [sync-function-pure] "{unknown} 'to be a string'": 15234 ops/sec
✓ [sync-function-schema] "{unknown} 'to satisfy' {unknown}": 1205 ops/sec

✅ All benchmarks completed in 2.34s
```

## Internal Contracts

### Suite Creation Functions

```typescript
interface SuiteCreateFunction {
  (mode: BenchMode): Promise<Bench>;
}

// New functions to be added
export const createSyncFunctionPureAssertionsBench: SuiteCreateFunction;
export const createSyncFunctionSchemaAssertionsBench: SuiteCreateFunction;
```

### Suite Registry Interface

```typescript
interface SuiteRegistry {
  readonly availableSuites: Record<string, string>;
  resolveSuiteSelection(requested: string[]): {
    resolved: string[];
    deduplicationLog: string[];
  };
  validateSuiteNames(names: string[]): string[];
}
```

### Assertion Classification

```typescript
interface AssertionClassifier {
  classifyAssertion(assertion: AnyAssertion): 'pure' | 'schema';
  getSyncFunctionAssertions(): {
    pure: AnyAssertion[];
    schema: AnyAssertion[];
  };
}
```

## Contract Validation Requirements

1. **Backward Compatibility**: All existing CLI commands must continue to work unchanged
2. **Suite Hierarchy**: sync-function selection must override sub-suite selections
3. **Performance**: New classification logic must not impact benchmark execution time
4. **Error Handling**: Invalid suite combinations must provide helpful error messages
5. **Output Consistency**: Results format must remain consistent with existing patterns

These contracts define the external interface (CLI) and internal module interfaces that must be maintained during implementation.
