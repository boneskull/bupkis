# Test Suite Documentation

This directory contains comprehensive tests for the Bupkis assertion library, organized by testing strategy and functionality.

## Core API Tests

Tests for the core API:

- `expect()`
- `expect.fail()`
- `expect.use()`
- `createAssertion()`
- `AssertionError`

…including async versions where appropriate.

## Property-Based Tests

This directory contains property-based tests for Bupkis assertions using [fast-check](https://fast-check.dev/). Property-based testing validates assertions against a wide range of generated inputs, ensuring robustness and catching edge cases that might be missed in traditional unit tests.

### Overview

Property-based tests verify that assertions behave correctly across four different scenarios:

1. **Valid inputs** - Should pass the assertion
2. **Invalid inputs** - Should fail the assertion (throw `AssertionError`)
3. **Valid inputs (negated)** - Should pass the negated assertion (`not ...`)
4. **Invalid inputs (negated)** - Should fail the negated assertion

Tests are organized by assertion category:

- `sync-basic.test.ts` - Basic type assertions (string, number, boolean, etc.)
- `sync-collection.test.ts` - Array and object assertions (contains, length, etc.)
- `sync-esoteric.test.ts` - Advanced assertions (instanceof, satisfies, etc.)
- `sync-parametric.test.ts` - Parameterized assertions (greater than, matches, etc.)
- `async-parametric.test.ts` - Promise-based assertions (resolve, reject, etc.)

Additional property test files:

- `guards.test.ts` - Property tests for runtime type guards
- `util.test.ts` - Property tests for utility functions
- `value-to-schema.test.ts` - Property tests for value-to-schema conversion

### Key Files

#### `property-test-config.ts`

Defines the configuration types and interfaces for property-based tests.

**Key exports:**

- **`PropertyTestConfig`** - Main configuration interface that extends fast-check's `Parameters`
- **`PropertyTestConfigVariantConfig`** - Configuration for individual test variants (valid/invalid cases)
- **`PropertyTestConfigParameters`** - Base parameters inherited from fast-check

The configuration system allows fine-grained control over test generation:

```typescript
interface PropertyTestConfig {
  invalid: PropertyTestConfigVariantConfig; // Should fail assertion
  valid: PropertyTestConfigVariantConfig; // Should pass assertion
  invalidNegated?: PropertyTestConfigVariantConfig; // Should fail negated assertion
  validNegated?: PropertyTestConfigVariantConfig; // Should pass negated assertion
}
```

Each variant config specifies:

- `generators` - Array of fast-check generators for test inputs
- Fast-check parameters (numRuns, seed, etc.)

#### `property-test-util.ts`

Contains utility functions for property-based test setup and data extraction.

**Key exports:**

- **`extractPhrases(assertion)`** - Extracts phrase literals from assertion parts for use with `fc.constantFrom()`. This function processes the assertion's natural language components (like `'to be a string'`) and returns them as an array of valid phrases that can be used in property tests.

- **`valueToSchemaFilter(value)`** - Filters objects for use with "deep equal" or "satisfies"-based assertions. Returns `true` if the value doesn't contain problematic properties like `__proto__`, `valueOf`, `toString`, or empty objects that could interfere with Zod parsing.

- **`safeRegexStringFilter(str)`** - Filters strings to remove characters that could cause regex syntax errors. Removes problematic regex metacharacters: `[ ] ( ) { } ^ $ * + ? . \ |`

- **`calculateNumRuns(runSize?)`** - Calculates the number of runs for property-based tests based on the environment and desired run size. Supports 'small' (50), 'medium' (250), or 'large' (500) run sizes, with automatic reduction in Wallaby and CI environments.

**Usage examples:**

```typescript
// Extract phrases for assertion testing
const phrases = extractPhrases(assertions['to-be-a-string']);
// Returns: ['to be a string']
fc.constantFrom(...extractPhrases(assertion));

// Filter problematic objects for schema generation
fc.object().filter(valueToSchemaFilter);

// Create safe regex strings for pattern testing
fc.string().map(safeRegexStringFilter);

// Configure test run counts based on environment
const numRuns = calculateNumRuns('large'); // 500 runs (or reduced in CI/Wallaby)
```

These utilities are essential for generating valid assertion phrases and safe test inputs in property tests, ensuring robust testing while avoiding problematic edge cases.

#### `property-test.macro.ts`

Contains the core "macro" functions that generate and execute property-based test suites.

**Key exports:**

- **`runPropertyTests(testConfigs, assertions, testConfigDefaults?)`** - Generates property-based tests for synchronous assertions using `fc.property()`
- **`assertExhaustiveTestConfig(assertions, testConfigs)`** - Validates that all assertions have corresponding test configurations

**How it works:**

1. **Test Generation**: For each assertion in the config, generates 4 test cases (valid, invalid, validNegated, invalidNegated)
2. **Input Generation**: Uses fast-check generators to create diverse test inputs
3. **Assertion Execution**: Runs `expect()` or `expectAsync()` with generated inputs
4. **Result Validation**: Verifies that assertions pass/fail as expected

**Example test structure generated:**

```typescript
describe('Assertion: {FunctionSchema} "to be a string"', () => {
  it('should pass for all valid inputs [string-assertion-id]', () => {
    // Uses fc.property with valid generators
  });

  it('should fail for all invalid inputs [string-assertion-id]', () => {
    // Uses fc.property with invalid generators, expects AssertionError
  });

  // ... negated variants
});
```

### Testing Strategy

#### Generator Optimization

The tests have been optimized to minimize static `fc.constant()` usage in favor of dynamic generators:

- **Dynamic Functions**: Use `fc.func().map()` to generate diverse function behaviors
- **Dynamic Values**: Use `fc.anything().map()`, `fc.string().map()` for broader input coverage
- **Strategic Constants**: Retain `fc.constant()` only where exact values are required (error classes, specific strings)

#### Coordinated Generation

Complex assertions use coordinated generators to ensure meaningful test scenarios:

```typescript
// Example: Testing error message matching
invalid: {
  generators: [
    fc.string().filter(s => s !== 'expected').map(msg =>
      Promise.reject(new Error(msg))
    ),
    fc.constant('expected'), // Expected message that won't match
  ],
}
```

#### Async Testing

Async assertions use `fc.asyncProperty()` and `expectAsync()` to properly handle Promise-based scenarios:

- Promise resolution/rejection testing
- Async function generation and testing
- Proper error handling for async assertion failures
- Safe thenable object usage to avoid unhandled Promise rejections

**Important**: Async property tests use thenable objects instead of immediately-executing async functions to prevent unhandled Promise rejections during test setup:

```typescript
// Safe thenable pattern for rejection scenarios
fc.constant({
  then(_resolve: (value: any) => void, reject: (reason: any) => void) {
    reject(new Error('rejection'));
  },
});
```

### Running Property Tests

```bash
# Run all property tests
npm run test:property

# Run property tests in watch mode
npm run test:property:dev

# Run individual property test file
node --import tsx --test test/property/sync-basic.test.ts

# Run async property tests specifically
node --import tsx --test test/property/async-parametric.test.ts
```

**Note**: Property-based tests cannot be executed through the Wallaby MCP server and must be run from the command line.

### Configuration Examples

#### Basic Type Assertion

```typescript
'to-be-a-string': {
  invalid: {
    generators: [
      fc.anything().filter(v => typeof v !== 'string'),
      fc.constantFrom(...extractPhrases(assertions['to-be-a-string'])),
    ],
  },
  valid: {
    generators: [
      fc.string(),
      fc.constantFrom(...extractPhrases(assertions['to-be-a-string'])),
    ],
  },
},
```

#### Async Assertion

```typescript
'promise-to-reject': {
  invalid: {
    async: true,
    generators: [
      fc.string().map(str => Promise.resolve(str)), // Should reject but resolves
      fc.constantFrom(...extractPhrases(assertions['promise-to-reject'])),
    ],
  },
  valid: {
    async: true,
    generators: [
      // Safe thenable pattern to avoid unhandled rejections
      fc.string().map(error => ({
        then(_resolve: any, reject: any) {
          reject(new Error(error));
        },
      })),
      fc.constantFrom(...extractPhrases(assertions['promise-to-reject'])),
    ],
  },
},
```

This systematic approach ensures comprehensive testing coverage while maintaining the natural language expressiveness that makes Bupkis unique.

### Run Count

The run count is dependent on several environment variables, _in order of precedence_:

- `WALLABY`: If set, will decrease the number of runs drastically to speed up responsiveness in WallabyJS.
- `CI`: If set, will decrease the number of runs to avoid execessive resource usage.
- `NUM_RUNS`: If set, this integer value will determine the number of runs.

## Snapshot Tests for `AssertionError` Messages

This directory contains error snapshot tests that complement the property-based testing approach. Error snapshot tests use the same test configurations but focus on capturing consistent error message formatting.

### Error Test Files

- `test/error/sync-basic-error.test.ts` - Error snapshots for basic type assertions
- `test/error/sync-collection-error.test.ts` - Error snapshots for collection assertions
- `test/error/sync-esoteric-error.test.ts` - Error snapshots for esoteric assertions
- `test/error/sync-parametric-error.test.ts` - Error snapshots for parametric assertions
- `test/error/async-parametric-error.test.ts` - Error snapshots for async assertions

### Error Snapshot Macro

The `test/error/error-snapshot.macro.ts` provides `runErrorSnapshotTests()` function that supports both sync and async assertions:

```typescript
// For sync assertions
runErrorSnapshotTests(assertions, failingAssertions);

// For async assertions
runErrorSnapshotTests(assertions, failingAssertions, { async: true });
```

This ensures consistent error message formatting across all assertion types while properly handling Promise-based scenarios.

### Updating Snapshots

Execute the following command to update error snapshots after making changes impacting the snapshots:

> Always _check the snapshots_ before updating to ensure the change was intentional!

```sh
npm run test:update-snapshots
```
