# Property-Based Tests

This directory contains property-based tests for Bupkis assertions using [fast-check](https://fast-check.dev/). Property-based testing validates assertions against a wide range of generated inputs, ensuring robustness and catching edge cases that might be missed in traditional unit tests.

## Overview

Property-based tests verify that assertions behave correctly across four different scenarios:

1. **Valid inputs** - Should pass the assertion
2. **Invalid inputs** - Should fail the assertion (throw `AssertionError`)
3. **Valid inputs (negated)** - Should pass the negated assertion (`not ...`)
4. **Invalid inputs (negated)** - Should fail the negated assertion

Tests are organized by assertion category:

- [`sync-basic.test.ts`](sync-basic.test.ts) - Basic type assertions (string, number, boolean, etc.)
- [`sync-collection.test.ts`](sync-collection.test.ts) - Array and object assertions (contains, length, etc.)
- [`sync-esoteric.test.ts`](sync-esoteric.test.ts) - Advanced assertions (instanceof, satisfies, etc.)
- [`sync-parametric.test.ts`](sync-parametric.test.ts) - Parameterized assertions (greater than, matches, etc.)
- [`async-callback.test.ts`](async-callback.test.ts) - Callback-based asynchronous assertions
- [`async-parametric.test.ts`](async-parametric.test.ts) - Parameterized asynchronous assertions

Non-assertion utilities needing extra attention are also tested here:

- [`is-constructible.test.ts`](is-constructible.test.ts) - Tests for constructible types
- [`value-to-schema.test.ts`](value-to-schema.test.ts) - Validation of value-to-schema conversions

## Key Files

### [`property-test-config.ts`](property-test-config.ts)

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

### [`property-test-util.ts`](property-test-util.ts)

Contains utility functions for property-based test setup and data extraction.

**Key exports:**

- **`extractPhrases(assertion)`** - Extracts phrase literals from assertion parts for use with `fc.constantFrom()`. This function processes the assertion's natural language components (like `'to be a string'`) and returns them as an array of valid phrases that can be used in property tests.

**Usage example:**

```typescript
const phrases = extractPhrases(assertions.stringAssertion);
// Returns: ['to be a string']

// Used in test configurations:
const testConfigs = new Map([
  [
    assertions.stringAssertion,
    {
      valid: {
        generators: [
          fc.string(),
          fc.constantFrom(...extractPhrases(assertions.stringAssertion)),
        ],
      },
      invalid: {
        generators: [
          fc.anything().filter((v) => typeof v !== 'string'),
          fc.constantFrom(...extractPhrases(assertions.stringAssertion)),
        ],
      },
    },
  ],
]);

runPropertyTests(testConfigs, assertions);
```

This utility is essential for generating valid assertion phrases in property tests, ensuring that the natural language API is tested with correct syntax.

### [`property-test.macro.ts`](property-test.macro.ts)

Contains the core "macro" functions that generate and execute property-based test suites.

**Key exports:**

- **`runPropertyTests(testConfigs, assertions, testConfigDefaults?)`** - Generates property-based tests for synchronous assertions
- **`runPropertyTestsAsync(testConfigs, assertions, testConfigDefaults?)`** - Generates property-based tests for asynchronous assertions
- **`assertExhaustiveTestConfig(assertions, testConfigs)`** - Validates that all assertions have corresponding test configurations

**How it works:**

1. **Test Generation**: For each assertion in the config, generates 4 test cases (valid, invalid, validNegated, invalidNegated)
2. **Input Generation**: Uses fast-check generators to create diverse test inputs
3. **Assertion Execution**: Runs `expect()` or `expectAsync()` with generated inputs
4. **Result Validation**: Verifies that assertions pass/fail as expected

**Example test structure generated:**

```typescript
describe('Assertion: {FunctionSchema} "to be a string"', () => {
  it('should pass for all valid inputs', () => {
    // Uses fc.property with valid generators
  });

  it('should fail for all invalid inputs', () => {
    // Uses fc.property with invalid generators, expects AssertionError
  });

  // ... negated variants
});
```

## Testing Strategy

### Generator Optimization

The tests have been optimized to minimize static `fc.constant()` usage in favor of dynamic generators:

- **Dynamic Functions**: Use `fc.func().map()` to generate diverse function behaviors
- **Dynamic Values**: Use `fc.anything().map()`, `fc.string().map()` for broader input coverage
- **Strategic Constants**: Retain `fc.constant()` only where exact values are required (error classes, specific strings)

### Coordinated Generation

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

### Async Testing

Async assertions use `fc.asyncProperty()` and `expectAsync()` to properly handle Promise-based scenarios:

- Promise resolution/rejection testing
- Async function generation and testing
- Proper error handling for async assertion failures

## Running Property Tests

```bash
# Run all property tests
npm run test:property

# Run property tests in watch mode
npm run test:property:dev

# Run specific property test file
node --import tsx --test test/property/[`sync-basic.test.ts`](sync-basic.test.ts)
```

**Note**: Property-based tests cannot be executed through the Wallaby MCP server and must be run from the command line.

## Configuration Examples

### Basic Type Assertion

```typescript
[
  assertions.stringAssertion,
  {
    invalid: {
      generators: [
        fc.anything().filter((v) => typeof v !== 'string'),
        fc.constantFrom(...extractPhrases(assertions.stringAssertion)),
      ],
    },
    valid: {
      generators: [
        fc.string(),
        fc.constantFrom(...extractPhrases(assertions.stringAssertion)),
      ],
    },
  },
],
```

### Parameterized Assertion

```typescript
[
  assertions.functionArityAssertion,
  {
    invalid: {
      generators: [
        fc.constant((a: number, b: number) => a + b),
        fc.constantFrom(...extractPhrases(assertions.functionArityAssertion)),
        fc.constant(3), // Wrong arity - function has 2 params, testing with 3
      ] as const,
    },
    valid: {
      generators: [
        fc.constant((a: number, b: number) => a + b),
        fc.constantFrom(...extractPhrases(assertions.functionArityAssertion)),
        fc.constant(2), // Correct arity - function has 2 params
      ] as const,
    },
  },
],
```

This systematic approach ensures comprehensive testing coverage while maintaining the natural language expressiveness that makes Bupkis unique.
