# Claude Instructions for Bupkis

This file provides Claude-specific instructions that extend the `.cursorrules` for more detailed context.

## Project Overview

**Bupkis** is a TypeScript assertion library with a natural language API. Unlike traditional chainable assertion libraries, Bupkis uses function calls with phrase arguments:

```ts
// Bupkis style
expect(value, 'to be a string');
expect(array, 'to have length', 5);
expect(promise, 'to resolve to', expectedValue);

// NOT like this
expect(value).toBeString();
expect(array).toHaveLength(5);
```

## Architecture Deep Dive

### Core Components

- **Assertion Framework**: Dual sync/async execution engines with type-safe parsing
- **Built-in Assertions**: Organized by category (basic, collection, esoteric, parametric, async)
- **Type System**: Heavy use of recursive conditional types for natural language → TypeScript mapping
- **Plugin System**: Custom assertion registration via `use()` function

### Key Files to Understand

- `src/assertion/assertion.ts` - Base `BupkisAssertion` class
- `src/assertion/create.ts` - `createAssertion()` factory functions
- `src/types.ts` - Complex type inference system
- `src/expect.ts` - Main API entry points
- `test/property/` - Property-based tests with fast-check

### Type System Pipeline

```text
AssertionParts → AssertionSlots → ParsedValues → InferredExpectSlots
```

## Development Context

### Current Work

The project is actively being developed with focus on:

- Performance benchmarking (`bench/` directory)
- Property-based testing improvements
- Type system optimizations
- Zod v4 integration

### Testing Philosophy

- **Comprehensive Coverage**: Unit tests + property-based tests
- **Fast-Check Integration**: All property tests use coordinated generators
- **Real-world Validation**: Custom assertions for testing the test framework itself
- **Performance Monitoring**: Benchmark suites for critical paths

### Common Patterns

#### Assertion Implementation

```ts
// Schema-based (preferred for simple cases)
createAssertion(['to be a string'], z.string());

// Function-based (for complex logic)
createAssertion(['to be even'], (n: number) => n % 2 === 0);

// Parameterized (with arguments)
createAssertion(
  [z.number(), 'is greater than', z.number()],
  (actual, expected) => z.number().gt(expected),
);
```

#### Property Test Configuration

```ts
const variants = getVariants(assertions, {
  // Configuration for test generation
});

await runVariant(variant, async (phrase, args) => {
  // Test implementation
});
```

### Debugging Workflows

#### Common Issues & Solutions

1. **Object Parameter Matching**: Use `valueToSchema(obj, { literalPrimitives: true })` for exact matching
2. **Async Return Bugs**: Functions must return booleans, not Zod schemas
3. **Type Inference Limits**: Recursive types may hit TypeScript recursion limits
4. **Property Test Failures**: Ensure assertion IDs match exactly in test configurations

#### Debug Commands

- `DEBUG=bupkis*` - Enable detailed logging
- `npm run debug:assertion-ids` - Dump assertion ID mappings
- `npm run test:base -- --test-name-pattern='specific-test'` - Run specific tests

### Performance Considerations

- Assertion matching loops through all built-ins until exact match
- Complex tuple types impact TypeScript compilation speed
- `satisfies()` utility includes circular reference detection overhead
- Property tests can be CPU-intensive - use 1-minute timeout for full suites

### Integration Points

- **Zod v4**: Core dependency for validation and schema composition
- **Node.js Test Framework**: Built-in test runner with tsx loader
- **Fast-Check**: Property-based testing framework
- **TypeDoc**: API documentation generation
- **tshy**: Dual CJS/ESM build system

## Workflow Guidelines

### When Working on Assertions

1. Start with unit tests in `test/assertion/`
2. Add property tests in `test/property/`
3. Implement in appropriate `src/assertion/impl/` file
4. Update type definitions if needed
5. Run full test suite to ensure no regressions

### When Debugging

1. Enable debug logging first: `DEBUG=bupkis*`
2. Check assertion parsing: look for `parseValues()` success/failure
3. Verify correct sync vs async usage
4. Use temporary files in `.tmp/` for debugging scripts
5. Run type checking: `npm run lint:types`

### When Benchmarking

1. Use existing benchmark suites in `bench/`
2. Focus on assertion matching and parsing performance
3. Consider impact on TypeScript compilation time
4. Document performance implications of changes

## Code Quality Standards

### TypeScript

- Prefer type inference over explicit types where possible
- Use branded types for additional type safety
- Consume utilities from `type-fest` library
- Maintain clear module boundaries

### Testing

- Write descriptive test names in BDD style ("should...")
- Use coordinated generators for property tests
- Avoid `fc.constant()` where dynamic generators work
- Test both sync and async code paths

### Documentation

- Code should be self-documenting with clear names
- Comments explain _why_, not _what_
- Use JSDoc for public APIs
- Maintain examples in tests

## Error Handling Philosophy

### User-Facing Errors

- Use Node.js `AssertionError` for test framework compatibility
- Provide detailed validation failure information
- Include "slot" information for debugging argument parsing
- Maintain clean stack traces pointing to user code

### Development Errors

- Enable debug logging for troubleshooting
- Use Zod's built-in error prettification
- Provide context about assertion matching failures
- Include validation details for complex type inference

This document should be referenced for complex development tasks involving the Bupkis assertion library.
