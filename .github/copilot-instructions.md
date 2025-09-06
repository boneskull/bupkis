# Bupkis Copilot Instructions

## Architecture Overview

**Bupkis** is a TypeScript assertion library built around natural language assertions using Zod v4 for validation. Unlike chainable APIs, it uses function calls with phrase arguments: `expect(value, 'to be a string')` instead of `expect(value).toBeString()`.

### Core Components

**UPDATE ME**

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

**Build**: `npm run build` (uses `tshy` for dual CJS/ESM output)
**Test**: `npm test` (Node.js built-in test runner with `tsx` loader)
**Watch Tests**: `npm run test:watch`
**Debug**: Set `DEBUG=bupkis*` environment variable

**Wallaby.js Integration**: Real-time testing with `.wallaby.js` config:

- Auto-detects Node.js test framework
- Enables debug output via `DEBUG=bupkis*`
- Excludes build artifacts and handles TypeScript via `tsx/esm`

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

**Testing**

- Comprehensive unit tests for all built-in assertions
- Edge cases for argument parsing and type inference
- Both sync and async paths are fully covered
- Tests should be written in TypeScript using the `node:test` framework, leveragine `describe` for grouping and `it` for individual tests; titles should be written in BDD-style ("should...")

## Integration Points

**External Dependencies**:

- **Zod v4** (peer/optional dependency) - core validation engine
- **Debug** - structured logging with `bupkis:*` namespace
- **tsx** - TypeScript execution for tests

**Module Boundaries**:

- `guards.ts` - runtime type checking (used throughout)
- `schema.ts` - reusable Zod schemas (`ClassSchema`, `FunctionSchema`, etc.)
- `util.ts` - object matching utilities (`satisfies`, `exhaustivelySatisfies`)
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

**Property-Based Testing**: Property-based test suites must be executed from the command-line and cannot be executed nor queried through the Wallaby MCP server. Use the command `node --test --import tsx <filepath>` to run property-based test suites.

**Linting Errors**: If there are linting errors, always run the "ESLint: Fix all auto-fixable problems" command from the Command Palette first. If there are still errors, they must be fixed manually

**Type Validation**: Run `npm: lint:types` task to validate all TypeScript types across the project. The output of a successful run looks like this:

```
 *  Executing task: npm run --silent lint:types

 *  Terminal will be reused by tasks, press any key to close it.
```

Choose only the tail end of the output to confirm success.

**Common Debugging Patterns**:

- **Assertion Parsing Failures**: Check `parseValues()` result for `success: false` and examine `reason` field
- **Type Inference Issues**: Complex recursive types in `types.ts` may hit TypeScript recursion limits
- **Async/Sync Mismatch**: `expect()` throws TypeError if assertion returns Promise; use `expectAsync()` instead
- **Slot Validation**: Arguments must match assertion "slots" exactly; check `DEBUG=bupkis*` output for validation details
- **Use Wallaby MCP**, if installed. It will execute any code found in a temporary test file matching the glob pattern `test/**/*.test.ts`. These will be run automatically by Wallaby. You can create a temporary test file here to gather feedback about specific issues, put breakpoints to log values and/or query runtime values, and also query Wallaby for test results.
  - If Wallaby MCP is installed and you are able to Start Wallaby, do so.
  - If the Wallaby extension is installed and you are able to Start Wallaby, do so.
- If you need to create and run a temporary file, **always** put the file in `.tmp/`. If the directory does not exist, create it. `.tmp` is ignored by Git.

**Error Investigation**:

- Enable debug logging: `DEBUG=bupkis*` shows assertion matching and validation steps
- Stack traces use `stackStartFn` parameter to point to user code, not library internals
- Zod validation errors are prettified via `z.prettifyError()` for readability

**Performance Gotchas**:

- Assertion matching loops through all built-in assertions until exact match found
- Complex tuple type operations may slow TypeScript compilation in large projects
- Circular reference detection in `satisfies()` utility prevents infinite loops but adds overhead
