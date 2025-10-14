# Quickstart: Enhanced Benchmark Suite Partitioning

## Overview

This feature adds two new benchmark suites (`sync-function-pure` and `sync-function-schema`) that partition the existing `sync-function` suite based on assertion return types, enabling targeted performance analysis.

## Quick Test

### 1. Verify Current State

```bash
# Current sync-function suite should work
npm run bench:runner -- --suite sync-function --mode quick

# Should show all sync function-based assertions
```

### 2. Test New Suites (After Implementation)

```bash
# Test pure assertions (faster, direct return)
npm run bench:runner -- --suite sync-function-pure --mode quick

# Test schema assertions (slower, requires parsing)
npm run bench:runner -- --suite sync-function-schema --mode quick

# Test combination (should deduplicate)
npm run bench:runner -- --suite sync-function-pure --suite sync-function-schema --mode quick
```

### 3. Verify Hierarchy Logic

```bash
# Parent overrides children - should only run sync-function
npm run bench:runner -- --suite sync-function --suite sync-function-pure --mode quick

# Should see message: "Suite 'sync-function' includes 'sync-function-pure' - running parent suite only"
```

### 4. Check Help Output

```bash
npm run bench:runner -- --help

# Should show new suites in available suites list
```

## Expected Behavior

### Performance Characteristics

- **sync-function-pure**: Should show higher ops/sec (direct return, no parsing)
- **sync-function-schema**: Should show lower ops/sec (Zod parsing overhead)
- **Combined total**: Sum of pure + schema should equal original sync-function count

### CLI Output Examples

```bash
# Pure suite output
✓ [sync-function-pure] "{unknown} 'to be a string'": 15234 ops/sec
✓ [sync-function-pure] "{unknown} 'to be truthy'": 18456 ops/sec

# Schema suite output
✓ [sync-function-schema] "{unknown} 'to satisfy' {unknown}": 1205 ops/sec
✓ [sync-function-schema] "{unknown} 'to match' {regexp}": 892 ops/sec
```

### Deduplication Messages

```bash
ℹ️  Suite 'sync-function' includes 'sync-function-pure' and 'sync-function-schema' - running parent suite only
ℹ️  Deduplicated 0 assertions (no overlap detected)
```

## Success Criteria

- [ ] New suites appear in `--help` output
- [ ] Pure assertions show higher performance than schema assertions
- [ ] Parent suite selection overrides child suites
- [ ] No regression in existing suite performance
- [ ] Clear feedback about deduplication decisions
- [ ] Backward compatibility maintained for all existing commands

## Performance Validation

The feature enables developers to:

1. **Identify performance patterns**: Compare pure vs schema assertion performance
2. **Optimize hot paths**: Focus on improving slower schema-based assertions
3. **Target benchmarking**: Run specific assertion types during development
4. **Validate optimizations**: Measure impact of changes to parsing vs direct logic

This quickstart validates that the partitioning successfully separates assertion types and provides the expected performance insights while maintaining full backward compatibility.
