# Bupkis Performance Benchmarks

This directory contains comprehensive performance benchmarks for the Bupkis assertion library using [modestbench](https://github.com/boneskull/modestbench), a modern TypeScript-first benchmarking framework.

## Overview

These benchmarks test all assertion implementations in Bupkis, programmatically generated to ensure comprehensive coverage as assertions are added or modified. This implementation serves to "dogfood" modestbench with a real-world project.

## Benchmark Suites

### 1. Sync Schema Assertions (`sync-schema.bench.js`)

**Tests**: 44 pure schema-based sync assertions  
**Tags**: `sync`, `schema`  
**Description**: Assertions that use Zod schemas for validation (not function-based).

These are pure schema-based assertions without callback functions. Generally faster than function-based equivalents due to optimized schema execution.

**Examples**:

- Type checking (`'to be a string'`, `'to be a number'`)
- Array/object validation (`'to be empty'`, `'to be non-empty'`)
- Built-in type checking (`'to be a Date'`, `'to be a RegExp'`)

**Run**:

```bash
npm run bench:schema
```

---

### 2. Sync Function Pure Assertions (`sync-function-pure.bench.js`)

**Tests**: 7 pure function-based sync assertions  
**Tags**: `sync`, `function`, `pure`  
**Description**: Assertions that return `boolean` or `AssertionFailure` objects directly.

These are typically the fastest assertion type due to minimal overhead.

**Examples**:

- Set operations (`'to have union'`, `'to have intersection'`)
- Function error validation

**Run**:

```bash
npm run bench:pure
```

---

### 3. Sync Function Schema Assertions (`sync-function-schema.bench.js`)

**Tests**: 59 schema-returning function-based sync assertions  
**Tags**: `sync`, `function`, `schema-returning`  
**Description**: Assertions that use callback functions returning Zod schemas or `AssertionParseRequest` objects.

More complex than pure functions but still function-based implementations.

**Examples**:

- Collection operations
- Type checking assertions
- Comparison assertions

**Run**:

```bash
npm run bench:function-schema
```

---

### 4. Async Function Assertions (`async-function.bench.js`)

**Tests**: 8 async function-based assertions  
**Tags**: `async`, `function`  
**Description**: Promise-based assertions with callback functions for validation.

Includes reject/resolve patterns with parameter validation.

**Examples**:

- `'to reject'`
- `'to reject with'`
- `'to resolve'`
- `'to resolve to'`

**Run**:

```bash
npm run bench:async
```

---

### 5. ValueToSchema Utility (`value-to-schema.bench.js`)

**Tests**: 8 benchmarks (4 categories × 2 option sets)  
**Tags**: `utility`, `value-to-schema`  
**Description**: Performance tests for the `valueToSchema()` utility function.

**Categories Tested**:

- **primitives**: Basic types (string, number, boolean, etc.)
- **objects**: Plain objects with various properties
- **arrays**: Arrays with different element types
- **builtinObjects**: Built-in JS objects (Date, RegExp, etc.)

**Option Sets**:

- **default**: Standard behavior (`{}`)
- **literal-primitives**: Use literal schemas (`{ literalPrimitives: true }`)

Each category tests 50 generated samples per benchmark iteration.

**Run**:

```bash
npm run bench:value
```

---

## Running Benchmarks

### Run All Benchmarks

```bash
npm run bench
```

### Run Specific Suites

```bash
# Pure schema assertions only
npm run bench:schema

# Pure function assertions only
npm run bench:pure

# Schema-returning function assertions only
npm run bench:function-schema

# Async assertions only
npm run bench:async

# ValueToSchema utility only
npm run bench:value

# All sync suites
npm run bench:sync
```

### Run with Different Reporters

```bash
# Human-readable output (default)
node --import tsx node_modules/.bin/modestbench run bench/**/*.bench.js --reporters human

# JSON output for programmatic analysis
node --import tsx node_modules/.bin/modestbench run bench/**/*.bench.js --reporters json

# CSV output for spreadsheet analysis
node --import tsx node_modules/.bin/modestbench run bench/**/*.bench.js --reporters csv

# Multiple reporters
node --import tsx node_modules/.bin/modestbench run bench/**/*.bench.js --reporters human,json,csv
```

### Filter by Tags

```bash
# Run only sync benchmarks
node --import tsx node_modules/.bin/modestbench run bench/**/*.bench.js --tags sync

# Run only function-based benchmarks
node --import tsx node_modules/.bin/modestbench run bench/**/*.bench.js --tags function

# Run utility benchmarks
node --import tsx node_modules/.bin/modestbench run bench/**/*.bench.js --tags utility
```

### Adjust Iterations

```bash
# Quick run for development
node --import tsx node_modules/.bin/modestbench run bench/**/*.bench.js --iterations 50

# Comprehensive run for accuracy
node --import tsx node_modules/.bin/modestbench run bench/**/*.bench.js --iterations 500

# Adjust time limit per benchmark
node --import tsx node_modules/.bin/modestbench run bench/**/*.bench.js --time 2000
```

## Architecture

### Programmatic Generation

Benchmarks are **programmatically generated** at module load time, ensuring:

- All assertions are tested automatically
- No manual updates needed when assertions change
- Type-safe and maintainable code
- Consistent testing approach

### Directory Structure

```text
bench/
├── shared/
│   ├── assertion-data.js       # Test data generation utilities
│   ├── benchmark-generator.js  # Benchmark factory functions
│   └── config.js               # Configuration presets
├── sync-function-pure.bench.js
├── sync-function-schema.bench.js
├── sync-schema.bench.js
├── async-function.bench.js
├── value-to-schema.bench.js
└── README.md (this file)
```

### Shared Utilities

#### `shared/assertion-data.js`

- Combines all fast-check generators from `test-data/`
- `getTestDataForAssertion(assertion)` - Gets test data for any assertion
- `getPrimaryPhrase(assertion)` - Extracts display name
- `isThrowingAssertion(assertion)` - Identifies error-testing assertions

#### `shared/benchmark-generator.js`

- `createSyncBenchmark()` - Factory for sync assertions
- `createAsyncBenchmark()` - Factory for async assertions
- Handles error suppression for expected failures

#### `shared/config.js`

- Benchmark configuration presets (quick, default, comprehensive)
- Per-suite configuration overrides
- Tag taxonomy for filtering

### Test Data Generation

Test data is **pre-generated** using fast-check arbitraries:

1. Each assertion has corresponding generators in `test-data/`
2. Data is sampled once at module load time
3. Same data is reused across benchmark iterations for consistency
4. Ensures reproducible results

### Error Handling

Benchmarks suppress errors for assertions that **intentionally test error conditions**:

- Assertions containing "throw", "reject", "fail" in their phrase
- These assertions are expected to throw/reject
- Other errors are logged as warnings

## Performance Notes

### Expected Performance Ranges

Based on existing benchmarks:

| Suite Type           | Expected ops/sec | Notes                            |
| -------------------- | ---------------- | -------------------------------- |
| Sync Schema          | >1500            | Pure schema validation (fastest) |
| Sync Function Pure   | >1200            | Minimal overhead                 |
| Sync Function Schema | >800             | More complex schema generation   |
| Async Function       | >15000           | Promise overhead included        |
| ValueToSchema        | >5000            | Depends on input complexity      |

### Performance Thresholds

The benchmark system tracks performance thresholds by implementation type:

- **sync-function**: 1000 ops/sec (general function-based sync assertions)
- **sync-function-pure**: 1200 ops/sec (pure function assertions - highest threshold)
- **sync-function-schema**: 800 ops/sec (schema-returning function assertions)
- **sync-schema**: 1500 ops/sec (pure schema-based assertions)
- **async-function**: 15000 ops/sec (async function-based assertions)
- **async-schema**: 15000 ops/sec (async schema-based assertions)

### Optimization Tips

1. **Warm-up**: ModestBench includes warmup iterations by default
2. **Iterations**: Adjust with `--iterations` for accuracy vs speed
3. **Time Limit**: Use `--time` to control max time per benchmark
4. **Concurrent**: Consider `--concurrent` for independent benchmarks (use cautiously)

## Historical Tracking

ModestBench automatically stores results in `.modestbench-history/`:

```bash
# List recent runs
node --import tsx node_modules/.bin/modestbench history list

# Show detailed results
node --import tsx node_modules/.bin/modestbench history show <run-id>

# Compare two runs
node --import tsx node_modules/.bin/modestbench history compare <run-id-1> <run-id-2>

# Export data
node --import tsx node_modules/.bin/modestbench history export --format csv --output results.csv

# Clean old data
node --import tsx node_modules/.bin/modestbench history clean --older-than 30d
```

## CI/CD Integration

Example GitHub Actions workflow:

```yaml
name: Benchmarks
on: [push, pull_request]

jobs:
  benchmark:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 20

      - run: npm ci
      - run: npm run build

      - name: Run Benchmarks
        run: npm run bench

      - name: Export Results
        run: node --import tsx node_modules/.bin/modestbench run bench/**/*.bench.js --reporters json,csv --output ./results

      - name: Upload Results
        uses: actions/upload-artifact@v3
        with:
          name: benchmark-results
          path: ./results/
```

For continuous integration, benchmarks can be used to catch performance regressions across releases.

## Troubleshooting

### Benchmarks Not Found

**Problem**: `No benchmark files found`

**Solution**: Ensure you're running from the bupkis root directory:

```bash
cd /path/to/bupkis
npm run bench
```

### Import Errors

**Problem**: `Cannot find module` errors

**Solution**: Ensure all dependencies are installed:

```bash
npm install
npm run build
```

### ModestBench Symlink Bug

**Known Issue**: ModestBench has a bug with symlinked installations ([#4](https://github.com/boneskull/modestbench/issues/4))

**Workaround**: Use `node --import tsx node_modules/.bin/modestbench` instead of `npx modestbench`

This is already reflected in the npm scripts.

### Test Data Generation Fails

**Problem**: `No generator found for assertion`

**Solution**: Verify all generator maps are exported from `test-data/index.ts`:

```bash
npm run build
```

### Performance Degradation

**Problem**: Benchmarks are slower than expected

**Solution**:

1. Check system load
2. Close other applications
3. Run comprehensive mode for accurate results:

   ```bash
   node --import tsx node_modules/.bin/modestbench run bench/**/*.bench.js --iterations 500 --time 2000
   ```

### Memory Issues

**Problem**: Out of memory errors

**Solution**: Reduce sample size or run suites individually:

```bash
npm run bench:pure
npm run bench:schema
# etc.
```

## Development

### Adding New Assertions

When new assertions are added to Bupkis:

1. **Add generators** to `test-data/` (required)
2. **Export from index** in appropriate generator map
3. **Rebuild**: `npm run build`
4. **Run benchmarks**: Assertions are automatically included

No changes needed to benchmark files!

### Modifying Benchmark Configuration

Edit `shared/config.js` to adjust:

- Iteration counts per suite
- Time limits
- Warmup settings
- Tag taxonomy

### Creating New Suites

1. Create new `.bench.js` file in `bench/`
2. Import utilities from `shared/`
3. Follow existing pattern for programmatic generation
4. Export modestbench-compatible structure
5. Add npm script to `package.json`

## Resources

- [ModestBench Documentation](https://github.com/boneskull/modestbench#readme)
- [TinyBench (underlying library)](https://github.com/tinylibs/tinybench)
- [Fast-Check (test data generation)](https://github.com/dubzzz/fast-check)
- [Bupkis Documentation](../README.md)

---

**Questions?** Open an issue or check the main Bupkis documentation.
