# AGENTS.md

This file provides guidance to Claude Code (claude.ai/code) and other agents when working with code in this repository.

## Project Overview

This is the **Bupkis monorepo**, containing the core assertion library and related packages.

**Bupkis** is a TypeScript assertion library that prioritizes type safety, extensibility, and natural language syntax. Unlike traditional chainable APIs (`expect(value).toBeString()`), Bupkis uses function calls with phrase arguments: `expect(value, 'to be a string')`.

## Monorepo Structure

This is an npm workspaces monorepo. All packages live in `packages/`:

| Package                    | Path                        | Description                                   |
| -------------------------- | --------------------------- | --------------------------------------------- |
| `bupkis`                   | `packages/bupkis`           | Core assertion library                        |
| `@bupkis/from-jest`        | `packages/from-jest`        | Codemod to migrate Jest/Vitest assertions     |
| `@bupkis/property-testing` | `packages/property-testing` | Property-based testing harness for assertions |
| `@bupkis/sinon`            | `packages/sinon`            | Sinon spy/stub/mock assertions                |

## Development Commands

### Root-Level Commands (Run from monorepo root)

**Building and Testing (all packages):**

- `npm run build` - Build all packages (dual CJS/ESM via zshy)
- `npm test` - Run all tests across all packages
- `npm run test:dev` - Watch mode for all tests
- `npm run test:property` - Property-based tests across packages
- `npm run test:coverage` - Run tests with coverage

**Linting and Type Checking:**

- `npm run lint` - Run all linting (ESLint, types, markdown, spelling)
- `npm run fix` - Auto-fix all fixable issues
- `npm run fix:eslint` - Auto-fix ESLint issues only
- `npm run lint:types` - TypeScript type checking only
- `npm run lint:types:dev` - Watch mode type checking

**Documentation (bupkis package only):**

- `npm run docs:build` - Build documentation
- `npm run docs:dev` - Watch mode documentation

### Package-Specific Commands

Run commands for a specific package using `--workspace`:

```bash
npm run test --workspace=bupkis
npm run build --workspace=@bupkis/sinon
```

Or `cd` into the package directory and run `npm` commands directly.

### Bupkis Package Commands (`packages/bupkis`)

- `npm run bench` - Run all benchmark suites
- `npm run test:property` - Property-based tests with fast-check
- `npm run test:snapshots` - Run snapshot tests
- `npm run test:update-snapshots` - Update snapshot files
- `npm run test:types` - Run type definition tests (tsd)

### Debugging and Profiling

- Set `DEBUG=bupkis*` for detailed logging
- `npm run profile:test` - Profile test execution (in bupkis package)
- `npm run profile:benchmarks` - Profile benchmark execution

## Core Architecture (bupkis package)

### Module Structure

All paths below are relative to `packages/bupkis/`.

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
- `src/snapshot/` - Snapshot testing support

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

## Other Packages

### @bupkis/from-jest (`packages/from-jest`)

A codemod tool to migrate Jest and Vitest assertions to bupkis. Supports:

- Jest 29+ and Vitest 1+
- Most common matchers (`toBe`, `toEqual`, `toBeTruthy`, etc.)
- Negation (`.not` → `'not to ...'`)
- Both CLI (`bupkis-from-jest`) and programmatic API

### @bupkis/property-testing (`packages/property-testing`)

Property-based testing harness using fast-check. Provides utilities for systematically testing assertions across four variants: valid, invalid, validNegated, invalidNegated.

Key exports:

- `createPropertyTestHarness()` - Create test harness with expect functions
- `extractPhrases()` - Extract phrase literals from assertions
- `getVariants()` - Extract test variants from config
- `filteredAnything` / `filteredObject` - Safe generators for Zod

### @bupkis/sinon (`packages/sinon`)

Sinon spy/stub/mock assertions for bupkis. Provides natural language assertions like:

- `expect(spy, 'was called')`
- `expect(spy, 'was called with', [arg1, arg2])`
- `expect(spy, 'was called before', otherSpy)`
- `expect(spy, 'to have calls satisfying', [...])`

## Testing Conventions

### Test Framework

- Uses Node.js built-in `node:test` with `describe`/`it` structure
- Write tests in TypeScript with `tsx` for execution
- BDD-style descriptions: "should do X when Y"

### Property-Based Testing

- Uses `fast-check` for property tests in `packages/bupkis/test/property/`
- Use `@bupkis/property-testing` harness for new assertion tests
- Coordinated generators for valid input combinations
- Avoid `fc.constant()` - prefer `fc.func().map()` for coverage
- Use `getVariants()` and `runVariant()` utilities

### Test Organization (bupkis package)

- `test/core/` - Core functionality tests
- `test/assertion/` - Assertion implementation tests
- `test/assertion-error/` - Error formatting tests with snapshots
- `test/property/` - Property-based tests
- `test/integration/` - Integration tests (CJS/ESM compatibility)

## Code Style Requirements -- **CRITICAL**

**IMPORTANT:**

- Comments should explain the _intent_ of the code instead of the implementation.
- Always use ESM syntax (`import`/`export`).
- When completing a task, _always_ run `npm run fix:eslint` and then manually fix any outstanding issues.
- If you encounter ESLint errors otherwise, always run `npm run fix:eslint` first before attempting manual fixes.
- **ALWAYS** use arrow functions unless you have a good reason not to (e.g., overloads, use of `this`). ESLint will enforce this rule.

**TypeScript Patterns:**

- Use recursive conditional types for argument inference
- Consume `type-fest` types instead of hand-rolled equivalents
- Type inference flow: `AssertionParts` → `AssertionSlots` → `ParsedValues`

## Dependencies

**Core (bupkis):**

- **Zod v4** - Validation library (peer dependency)
- **tsx** - TypeScript execution
- **zshy** - Dual CJS/ESM build system

**Development (root):**

- **fast-check** - Property-based testing
- **debug** - Structured logging (`bupkis:*` namespace)
- **modestbench** - Benchmarking

## Common Debugging Patterns

**Assertion Parsing Issues:**

- Check `parseValues()` success/failure and reason

**Async/Sync Confusion:**

- `expect()` throws if it finds a thenable; use `expectAsync()` instead
- Maintain clear sync/async separation in assertions.
- A function should be sync or async; not both (no Zalgo). Create parallel APIs, if necessary (e.g., `expect()`/`expectAsync()`).

**Object Matching:**

- `to satisfy` and `deep equal` both use `valueToSchema()`, but with different options.
- When an assertion is said to use "'to satisfy' semantics", its implementation will need to call `valueToSchema` somewhere.

## File Organization

- Place temporary files in `.tmp/` (Git-ignored)
- Follow established module boundaries (`guards.ts`, `schema.ts`, `util.ts`)
- Package-specific code stays within its `packages/<name>/` directory
