# Bupkis Copilot Instructions

## Architecture Overview

**Bupkis** is a TypeScript assertion library built around natural language assertions using Zod v4 for validation. Unlike chainable APIs, it uses function calls with phrase arguments: `expect(value, 'to be a string')` instead of `expect(value).toBeString()`.

### Core Components

- **`src/expect.ts`** - Main synchronous assertion engine with argument parsing and assertion matching
- **`src/expect-async.ts`** - Asynchronous assertion engine for Promise-based operations
- **`src/assertion/assertion.ts`** - Core `Assertion` class with parsing/execution logic
- **`src/assertion/implementations.ts`** - All built-in synchronous assertions (type checks, comparisons, etc.)
- **`src/assertion/async-implementations.ts`** - Built-in async assertions (Promise resolution/rejection)
- **`src/assertion/types.ts`** - Complex TypeScript types for assertion system (recursive tuple operations)

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

**Test Results & Coverage**: Use Wallaby MCP tools when available for real-time insights:

- `wallaby_allTests` - Get all test results with execution times and errors
- `wallaby_failingTests` - Focus on failing tests only
- `wallaby_coveredLinesForFile` - Check code coverage for specific files
- `wallaby_runtimeValues` - Inspect variable values at specific code locations
- Fallback: `npm test` for basic test execution without real-time feedback

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
- **Use Wallaby MCP**, if available. It will execute any code found in a temporary test file matching the glob pattern `test/**/*.test.ts`. These will be run automatically by Wallaby. You can create a temporary test file here to gather feedback about specific issues, put breakpoints to log values and/or query runtime values, and also query Wallaby for test results.
  - If Wallaby MCP is available, **avoid running arbitrary code in a terminal**.
  - If the Wallaby extension is installed and you are able to Start Wallaby, do so.

**Error Investigation**:

- Enable debug logging: `DEBUG=bupkis*` shows assertion matching and validation steps
- Stack traces use `stackStartFn` parameter to point to user code, not library internals
- Zod validation errors are prettified via `z.prettifyError()` for readability

**Performance Gotchas**:

- Assertion matching loops through all built-in assertions until exact match found
- Complex tuple type operations may slow TypeScript compilation in large projects
- Circular reference detection in `satisfies()` utility prevents infinite loops but adds overhead
