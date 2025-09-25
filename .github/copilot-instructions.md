# Bupkis Copilot Instructions

## Architecture Overview

**Bupkis** is a TypeScript assertion library built around natural language assertions using Zod v4 for validation. Unlike chainable APIs, it uses function calls with phrase arguments: `expect(value, 'to be a string')` instead of `expect(value).toBeString()`.

### Core Components

**Core Library Structure**:

- **`src/`**: Main library source code
  - **`assertion/`**: Core assertion implementation framework
    - `assertion.ts` - Base `BupkisAssertion` class and factory methods
    - `create.ts` - Assertion creation utilities (`createAssertion`, `createAsyncAssertion`)
    - `slotify.ts` - Type system for converting assertion parts to typed slots
    - `assertion-sync.ts` / `assertion-async.ts` - Separate sync/async execution engines
    - `assertion-types.ts` - Core assertion typing system
    - **`impl/`**: Built-in assertion implementations organized by category
      - `sync-basic.ts` - Basic type assertions (string, number, boolean, etc.)
      - `sync-collection.ts` - Array and object assertions (to contain, to have length, etc.)
      - `sync-esoteric.ts` - Advanced assertions (instanceof, satisfies, etc.)
      - `sync-parametric.ts` - Parameterized assertions (greater than, matches, etc.)
      - `async-parametric.ts` - Promise-based assertions (to resolve, to reject, etc.)
  - `expect.ts` - Main entry points (`expect`, `expectAsync`)
  - `bootstrap.ts` - Factory functions for creating assertion engines
  - `guards.ts` - Runtime type guards and validation utilities
  - `schema.ts` - Reusable Zod schemas (`ConstructibleSchema`, `FunctionSchema`, etc.)
  - `types.ts` - Complex TypeScript type definitions and inference system
  - `util.ts` - Object matching utilities (`satisfies`, `exhaustivelySatisfies`)
  - `error.ts` - Custom error classes (`AssertionError`, `NegatedAssertionError`)
  - `use.ts` - Plugin system for registering custom assertions

**Test Structure**:

- **`test/`**: Comprehensive test suite
  - **`property/`**: Property-based testing with fast-check
    - `async-*.test.ts` - Property tests for async assertions (8 assertions)
    - `sync-*.test.ts` - Property tests for sync assertions by category
    - `property-test-util.ts` - Utility functions for property testing (`getVariants`, `runVariant`, `createPhraseExtractor`)
    - `property-test-config.ts` - Configuration types and interfaces
  - **`assertion/`**: Unit tests for individual assertion implementations
  - `custom-assertions.ts` - Custom test assertions including `"to exhaustively test collection"`
  - Individual test files for core functionality (`expect.test.ts`, `use.test.ts`, etc.)
- See `test/README.md` for detailed information on the test structure and approach.

**Build & Distribution**:

- **`tshy`**: Dual CJS/ESM TypeScript build system outputting to `dist/`
- **TypeDoc**: API documentation generation to `docs/`

### Key Patterns

**Assertion Creation**: Use `createAssertion()` from `Assertion.fromParts()`:

```ts
// Simple schema-based assertion
createAssertion(['to be a string'], z.string());

// Parameterized assertion with callback
createAssertion([z.number(), 'is greater than', z.number()], (_, expected) =>
  z.number().gt(expected),
);

// Boolean-returning function
createAssertion([z.number(), 'is even'], (n) => n % 2 === 0);
```

**Dual Execution Engines**: The library maintains separate sync/async paths:

- `expect()` throws immediately on Promise returns
- `expectAsync()` awaits Promise-based implementations
- Both use the same assertion parsing but different execution

**Type-Safe Argument Parsing**: The `parseValues()`/`parseValuesAsync()` methods convert natural language arguments into typed tuples using Zod schemas. Arguments are matched against "slots" derived from assertion parts.

## Development Workflows

**Build & Development**:

- `npm run build` - Production build using `tshy` for dual CJS/ESM output
- `npm run dev` - Watch mode build for development
- `npm run docs:build` - Generate API documentation with TypeDoc

**Testing**:

- `npm test` - Run all tests (unit + property) using Node.js built-in test runner with `tsx` loader
- `npm run test:watch` - Run all tests in watch mode
- `npm run test:property` - Run only property-based tests with fast-check (timeout: 1m recommended)
- `npm run test:property:dev` - Run property tests in watch mode
- `npm run test:base -- test/<file>.test.ts` - Run specific test files easily (preferred method for individual files)
- **Individual Property Tests**: For faster execution, run individual property test files: `node --test --import tsx test/property/<file>.test.ts`

**Linting & Type Checking**:

- `npm run lint` - ESLint with TypeScript support
- `npm run lint:fix` - Auto-fix ESLint issues
- `npm run lint:types` - TypeScript type checking across project
- `npm run lint:types:dev` - Type checking in watch mode

**Debug**: Set `DEBUG=bupkis*` environment variable for detailed logging

**Wallaby.js Integration**: Real-time testing with `.wallaby.js` config:

- Auto-detects Node.js test framework
- Enables debug output via `DEBUG=bupkis*`
- Excludes build artifacts and handles TypeScript via `tsx/esm`

**Version Control**:

- **Conventional Commits**: The project uses conventional commits format, but Copilot should disable the validation hook to avoid commit failures if it cannot provide a compliant message.
- **Git Commits**: If Copilot cannot provide a compliant message, before making any `git commit`, run `rm -f .husky/_/commit-msg` to disable the commit message hook, as Copilot may not format commit messages in conventional commits format.

## Project-Specific Conventions

**Natural Language API**: Every assertion follows `expect(subject, phrase, ...params)` pattern

- Phrases are string literals or tuples: `['to be a', 'to be an']`
- Type inference maps phrases to TypeScript types
- No method chaining - everything is positional arguments

**Zod-Centric Design**:

- Zod v4 is both validation engine AND implementation language
- Custom assertions leverage Zod's schema composition
- Error messages use `z.prettifyError()` for consistency

**TypeScript Type System**:

- Heavy use of recursive conditional types for argument inference
- `AssertionParts` → `AssertionSlots` → `ParsedValues` transformation pipeline
- `InferredExpectSlots` maps assertion definitions to function signatures
- Recent work simplified some recursive types but maintained compatibility
- Consume types from [`type-fest`](https://npm.im/type-fest) instead of hand-rolled equivalents.

**Dual Implementation Classes**:

- `FunctionAssertion` - for callback-based implementations
- `SchemaAssertion` - for pure Zod schema implementations
- Both extend base `Assertion` class with different execution strategies

**Error Handling**:

- `AssertionError` from Node.js for test framework compatibility
- Detailed validation failures with slot information
- Stack trace management via `stackStartFn` parameter

**Testing**:

- Comprehensive unit tests for all built-in assertions
- Edge cases for argument parsing and type inference
- Both sync and async paths are fully covered
- Tests should be written in TypeScript using the `node:test` framework, leveraging `describe` for grouping and `it` for individual tests; titles should be written in BDD-style ("should...")

## Integration Points

**External Dependencies**:

- **Zod v4** (peer/optional dependency) - core validation engine
- **Debug** - structured logging with `bupkis:*` namespace
- **tsx** - TypeScript execution for tests
- **slug** - string normalization
- **fast-check** - property-based testing framework

**Module Boundaries**:

- `guards.ts` - runtime type checking (used throughout)
- `schema.ts` - reusable Zod schemas (`ConstructibleSchema`, `FunctionSchema`, etc.)
- `util.ts` - object matching utilities (`satisfies`, `exhaustivelySatisfies`)
- `bootstrap.ts` - factory functions for creating assertion engines
- Clear separation between sync/async assertion implementations

**Type Safety**: The library uses branded Zod types (`PhraseLiteralSlot`) and complex type inference to ensure compile-time validation of assertion usage while maintaining runtime flexibility.

## Debugging & Validation

**Test Results & Coverage**: Use Wallaby MCP tools for real-time insights (Wallaby MCP server should be enabled):

- `mcp_wallaby_wallaby_allTests` - Get all test results with execution times and errors
- `mcp_wallaby_wallaby_failingTests` - Focus on failing tests only
- `mcp_wallaby_wallaby_coveredLinesForFile` - Check code coverage for specific files
- `mcp_wallaby_wallaby_runtimeValues` - Inspect variable values at specific code locations
- Additional tools: `mcp_wallaby_wallaby_allTestsForFile`, `mcp_wallaby_wallaby_testById`, `mcp_wallaby_wallaby_updateFileSnapshots`
- Fallback: `npm test` for basic test execution when Wallaby MCP is unavailable
- If needed, run `npm run debug:assertion-ids` to dump a mapping of assertion ID to assertion description. Arguments to this script can be provided by appending `-- --collection=<collection-name>` where `<collection-name>` is one of `all`, `async`, `async-callback`, `async-parametric`, `sync`, `sync-basic`, `sync-callback`, `sync-collection`, `sync-esoteric`, or `sync-parametric`. The default is `all`.

**Property-Based Testing**: All tests in `test/property/` use [fast-check][] for property-based tests.

**Test Structure**: Property tests are organized by assertion category (sync-basic, sync-collection, sync-esoteric, sync-parametric, async) using `getVariants()` and `runVariant()` functions

**Fast-Check Integration**: Uses `fc.property()` and `fc.asyncProperty()` for comprehensive input generation

**Dynamic Function Generation**: Leverages `fc.func()` instead of `fc.constant()` for better test coverage where possible

**Coordinated Generators**: Complex assertion tests use coordinated generators to ensure valid input combinations

**Wallaby Integration**: Property tests use custom assertions and utility functions (not macro files) for better Wallaby compatibility. Test files use `"to exhaustively test collection"` assertion with `getVariants()` to generate test configurations

**Recent Optimizations**: Async property tests have been optimized to minimize `fc.constant()` usage by using dynamic generators like `fc.anything().map()`, `fc.string().map()`, and `fc.func().map()` for broader test coverage

**Linting Errors**: If there are linting errors, always run the "ESLint: Fix all auto-fixable problems" command from the Command Palette first. If there are still errors, they must be fixed manually.

**Type Validation**: Run `npm: lint:types` task to validate all TypeScript types across the project.

**CRITICAL**: The VS Code task runner may sometimes show stale TypeScript errors even when the actual type checking passes. If you see TypeScript errors through the task runner, verify the actual status by running `npm run lint:types` directly in a terminal. The command succeeds if the exit code is 0.

**Successful output** looks like this (no TypeScript errors shown):

```text
 *  Executing task: npm run --silent lint:types

 *  Terminal will be reused by tasks, press any key to close it.
```

**Failed output** will show TypeScript error messages before the terminal completion message.

**Verification**: To confirm success regardless of displayed output, check the exit code - it should be 0 for success. You can verify with `npm run lint:types && echo "ok"` - if it prints "ok", the command succeeded.

**Common Debugging Patterns**:

- **Assertion Parsing Failures**: Check `parseValues()` result for `success: false` and examine `reason` field
- **Type Inference Issues**: Complex recursive types in `types.ts` may hit TypeScript recursion limits
- **Async/Sync Mismatch**: `expect()` throws TypeError if assertion returns Promise; use `expectAsync()` instead
- **Slot Validation**: Arguments must match assertion "slots" exactly; check `DEBUG=bupkis*` output for validation details
- **Use Wallaby MCP**, if installed. It will execute any code found in a temporary test file matching the glob pattern `test/**/*.test.ts`. These will be run automatically by Wallaby. You can create a temporary test file here to gather feedback about specific issues, put breakpoints to log values and/or query runtime values, and also query Wallaby for test results.
  - If Wallaby MCP is installed and you are able to Start Wallaby, do so.
  - If the Wallaby Extension is installed and you are able to Start Wallaby, do so.
  - If the Wallaby MCP server is not available in the toolset and the Wallaby Extension _is_ available, use the Wallaby Extension in the same manner.
- If you need to create and run a temporary file, **always** put the file in `.tmp/`. If the directory does not exist, create it. `.tmp` is ignored by Git.
- **Temporary Scripts**: Always use ESM syntax (`import`/`export`) in temporary scripts, never CommonJS (`require`). Files should use `.mjs` extension for ESM or be placed in `.tmp/` directory.

**Error Investigation**:

- Enable debug logging: `DEBUG=bupkis*` shows assertion matching and validation steps
- Stack traces use `stackStartFn` parameter to point to user code, not library internals
- Zod validation errors are prettified via `z.prettifyError()` for readability

**Performance Gotchas**:

- Assertion matching loops through all built-in assertions until exact match found
- Complex tuple type operations may slow TypeScript compilation in large projects
- Circular reference detection in `satisfies()` utility prevents infinite loops but adds overhead

## Common Debugging Patterns & Solutions

**Object Parameter Matching Issues**:

- **Problem**: Complex error object parameter matching in assertions like `"to throw"` with object parameters
- **Root Cause**: `valueToSchema()` without `literalPrimitives: true` creates type-based schemas (e.g., `z.string()`) instead of exact value schemas (e.g., `z.literal('specific error')`)
- **Solution**: Use `valueToSchema(obj, { literalPrimitives: true })` for exact matching of primitive values in objects
- **Example**: Error object `{ message: 'specific error' }` should match exactly, not just structurally

**Property Test Configuration**:

- **keyBy Function**: When implementing collection utilities like `keyBy(collection, keyField)`, ensure the result object uses `item[keyField]` as the key, not just `keyField` itself
- **Test ID Mapping**: Property test configurations must use exact assertion IDs from `keyBy(assertions, 'id')` - mismatched IDs cause test failures
- **Phrase Extraction**: Use `extractPhrases(assertionId)` to get valid phrases for generators, don't hardcode them

**Async Assertion Implementation Bugs**:

- **Schema Return Bug**: In async assertions, ensure functions return boolean results, not Zod schemas
- **Pattern**: `if (schema.success) return true;` not `if (schema.success) return schema;`
- **Affected Areas**: Promise rejection/resolution assertions with object/string/regexp parameters

**valueToSchema Configuration**:

- **`literalPrimitives: false`** (default): Creates type schemas (`z.string()`, `z.number()`)
- **`literalPrimitives: true`**: Creates exact value schemas (`z.literal('hello')`, `z.literal(42)`)
- **`strict: false`** (default): Uses `z.looseObject()` - allows extra properties
- **`strict: true`**: Uses `z.strictObject()` - rejects extra properties
- **Use Case**: For assertion object matching, prefer `literalPrimitives: true, strict: false` for partial matching

**Test Debugging Workflow**:

1. Run specific failing test: `npm run test:base -- --test-name-pattern='test-id'`
2. Check assertion implementation for schema vs boolean return bugs
3. Verify property test configuration uses correct assertion ID
4. Use `valueToSchema` with appropriate options for the matching strategy needed
5. Run full property test suite: `npm run test:property` to verify fixes

**Import/Export Issues**:

- Property test files should import `createPhraseExtractor` not `extractPhrases`
- The pattern is: `const extractPhrases = createPhraseExtractor(assertions);`
- Avoid importing non-existent functions that cause TypeScript errors

## Coding Style & Linting

- Style is enforced by ESLint and Prettier. Linting is enforced by ESLint, markdownlint, and cspell.
- Many linting issues can be resolved simply by running the "ESLint: Fix all auto-fixable problems" command from VS Code's Command Palette. This is also available as an npm script: `npm run lint:fix` or `npm run lint:fix -- <glob-pattern>`.
- IMPORTANT! When writing code, avoid comments describing what the code is doing. Instead, use descriptive function and variable names so the code is self-documenting. Comments should only be used to explain _why_ something is done a certain way, not _what_ is being done; in other words, its _intent_.

[fast-check]: https://fast-check.dev
