# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Bupkis** is a TypeScript assertion library that prioritizes type safety, extensibility, and natural language syntax. Unlike traditional chainable APIs (`expect(value).toBeString()`), Bupkis uses function calls with phrase arguments: `expect(value, 'to be a string')`.

## Development Commands

### Building and Testing

- `npm run build` - Dual CJS/ESM build using tshy
- `npm run build:dev` - Watch mode build
- `npm test` - Run core test suite (Node.js built-in test runner)
- `npm run test:property` - Property-based tests with fast-check (1 minute timeout)
- `npm run test:bench` - Run benchmark-related tests
- `npm run test:dev` - Watch mode for all tests

### Running Specific Tests

- `npm run test:base -- "test/<file>.test.ts"` - Run specific test file
- `npm run test:base -- "test/core/**/*.test.ts"` - Run core tests only
- `npm run test:property:dev` - Watch mode for property tests

### Linting and Type Checking

- `npm run lint` - Run all linting (ESLint, types, markdown, spelling)
- `npm run lint:fix` - Auto-fix ESLint issues
- `npm run lint:types` - TypeScript type checking only
- `npm run lint:types:dev` - Watch mode type checking

### Benchmarking

- `npm run bench` - Run all benchmark suites
- `npm run bench:dev` - Watch mode benchmarking
- `npm run bench:value-to-schema` - Run specific benchmark suite

### Debugging and Profiling

- Set `DEBUG=bupkis*` for detailed logging
- `npm run profile:test` - Profile test execution
- `npm run profile:bench` - Profile benchmark execution

## Core Architecture

### Module Structure

**Main Entry Points:**

- `src/index.ts` - Primary exports (`expect`, `expectAsync`, `z`, `createAssertion`)
- `src/bootstrap.ts` - Bootstraps expect functions with built-in assertions
- `src/expect.ts` - Core expect function implementations

**Assertion Framework:**

- `src/assertion/` - Core assertion framework
  - `assertion-sync.ts` / `assertion-async.ts` - Dual execution engines
  - `create.ts` - Factory functions for custom assertions
  - `assertion-types.ts` - Complex TypeScript type system
  - `impl/` - Built-in assertions by category:
    - `sync-basic.ts` - Basic type assertions
    - `sync-collection.ts` - Array/object assertions
    - `sync-parametric.ts` - Parameterized assertions
    - `sync-esoteric.ts` - Advanced assertions
    - `async.ts` / `async-parametric.ts` - Async variants

**Supporting Modules:**

- `src/types.ts` - Complex TypeScript inference system
- `src/schema.ts` - Zod integration utilities
- `src/value-to-schema.ts` - Runtime type introspection
- `src/error.ts` - Custom error types extending Node.js AssertionError

### Key Design Patterns

**Natural Language API:**

```ts
// Instead of: expect(value).toBeString()
expect(value, 'to be a string');
expect(user, 'to satisfy', { name: expect.it('to be a string') });
expect(actual, 'not to be', expected);
```

**Zod-Centric Validation:**

- Zod v4 schemas for both validation AND implementation
- Schema-based assertion creation: `createAssertion(['to be even'], (n) => n % 2 === 0)`
- Branded Zod types for compile-time validation

**Type-Safe Parsing:**

- `parseValues()` converts natural language to typed tuples
- Recursive conditional types for argument inference
- Heavy use of `type-fest` utilities

## Testing Conventions

### Test Framework

- Uses Node.js built-in `node:test` with `describe`/`it` structure
- Write tests in TypeScript with `tsx` for execution
- BDD-style descriptions: "should do X when Y"

### Property-Based Testing

- Uses `fast-check` for property tests in `test/property/`
- Coordinated generators for valid input combinations
- Avoid `fc.constant()` - prefer `fc.func().map()` for coverage
- Use `getVariants()` and `runVariant()` utilities

### Test Organization

- `test/core/` - Core functionality tests
- `test/assertion/` - Assertion implementation tests
- `test/assertion-error/` - Error formatting tests with snapshots
- `test/property/` - Property-based tests
- `test/bench/` - Benchmark-related tests

## Code Style Requirements

**Critical Rules:**

- NO descriptive comments - use self-documenting code
- Comments only explain _why_, never _what_
- Always use ESM syntax (`import`/`export`)
- Auto-fix ESLint issues before manual fixes

**TypeScript Patterns:**

- Use recursive conditional types for argument inference
- Consume `type-fest` types instead of hand-rolled equivalents
- Type inference flow: `AssertionParts` → `AssertionSlots` → `ParsedValues`

**Error Handling:**

- Use Node.js `AssertionError` for test framework compatibility
- Enable debug via `DEBUG=bupkis*` for assertion matching details
- Use `z.prettifyError()` for consistent error formatting

## Dependencies

**Core:**

- **Zod v4** - Validation library (peer dependency)
- **tsx** - TypeScript execution
- **tshy** - Dual CJS/ESM build system

**Development:**

- **fast-check** - Property-based testing
- **debug** - Structured logging (`bupkis:*` namespace)
- **type-fest** - TypeScript utilities

## Common Debugging Patterns

**Assertion Parsing Issues:**

- Check `parseValues()` success/failure and reason
- Complex tuple types may hit TypeScript limits

**Async/Sync Confusion:**

- `expect()` throws on Promise returns - use `expectAsync()`
- Maintain clear sync/async assertion separation

**Object Matching:**

- Use `valueToSchema(obj, { literalPrimitives: true })` for exact matching
- `satisfies()` utility has circular reference detection overhead

## File Organization

- Place temporary files in `.tmp/` (Git-ignored)
- Use `.mjs` extension for ESM scripts outside `.tmp/`
- Follow established module boundaries (`guards.ts`, `schema.ts`, `util.ts`)
- Maintain sync/async assertion separation in file structure
