# Bupkis Cursor AI Rules

## Project Context

**Bupkis** is a TypeScript assertion library built around natural language assertions using Zod v4 for validation. Unlike chainable APIs, it uses function calls with phrase arguments: `expect(value, 'to be a string')` instead of `expect(value).toBeString()`.

## Core Architecture

### Library Structure

- **`src/assertion/`**: Core assertion framework with sync/async execution engines
- **`src/assertion/impl/`**: Built-in assertions by category (basic, collection, esoteric, parametric, async)
- **`src/expect.ts`**: Main entry points (`expect`, `expectAsync`)
- **`src/types.ts`**: Complex TypeScript type inference system
- **`test/property/`**: Property-based testing with fast-check
- **`bench/`**: Performance benchmarking suites

### Key Patterns

1. **Natural Language API**: `expect(subject, phrase, ...params)` - no method chaining
2. **Zod-Centric Design**: Zod v4 for validation AND implementation
3. **Dual Execution**: Separate sync/async paths (`expect()` vs `expectAsync()`)
4. **Type-Safe Parsing**: `parseValues()` converts natural language to typed tuples

## Development Workflows

### Commands

- `npm test` - Run all tests (Node.js built-in test runner + tsx)
- `npm run test:property` - Property-based tests with fast-check (1m timeout)
- `npm run test:base -- test/<file>.test.ts` - Run specific test files
- `npm run build` - Dual CJS/ESM build with zshy
- `npm run lint:fix` - Auto-fix ESLint issues
- `npm run lint:types` - TypeScript type checking

### Debug & Testing

- Set `DEBUG=bupkis*` for detailed logging
- Use `.tmp/` directory for temporary files (Git-ignored)
- Property tests use `getVariants()` and `runVariant()` utilities
- Tests should use Node.js `test` framework with BDD-style descriptions ("should...")

## Coding Conventions

### TypeScript

- Use recursive conditional types for argument inference
- Consume types from `type-fest` instead of hand-rolled equivalents
- Heavy type inference: `AssertionParts` → `AssertionSlots` → `ParsedValues`
- Branded Zod types for compile-time validation

### Assertion Creation

```ts
// Schema-based
createAssertion(['to be a string'], z.string());

// Parameterized with callback
createAssertion([z.number(), 'is greater than', z.number()], (_, expected) =>
  z.number().gt(expected),
);

// Boolean function
createAssertion([z.number(), 'is even'], (n) => n % 2 === 0);
```

### Error Handling

- Use Node.js `AssertionError` for test framework compatibility
- Enable debug via `DEBUG=bupkis*` for assertion matching details
- Use `z.prettifyError()` for consistent error formatting

## Critical Rules

### Code Style

- **NO descriptive comments** - use self-documenting code with descriptive names
- Comments only explain _why_, never _what_
- Auto-fix ESLint issues before manual fixes
- Always use ESM syntax (`import`/`export`), never CommonJS in new files

### Testing

- Write tests in TypeScript using `node:test` framework
- Use `describe` for grouping, `it` for individual tests
- Property tests must use coordinated generators for valid input combinations
- Avoid `fc.constant()` where possible - prefer `fc.func().map()` for broader coverage

### Debugging Patterns

- **Assertion Parsing**: Check `parseValues()` success/failure and reason
- **Type Issues**: Recursive types may hit TypeScript limits
- **Async/Sync**: `expect()` throws on Promise returns - use `expectAsync()`
- **Object Matching**: Use `valueToSchema(obj, { literalPrimitives: true })` for exact matching

### Performance Awareness

- Assertion matching loops through all built-ins until match
- Complex tuple types slow TypeScript compilation
- `satisfies()` utility has circular reference detection overhead

## Version Control

- Use conventional commits format
- If commit message validation fails, disable with: `rm -f .husky/_/commit-msg`
- Always verify TypeScript success: `npm run lint:types && echo "ok"`

## Dependencies

- **Zod v4**: Core validation (peer dependency)
- **Debug**: Structured logging (`bupkis:*` namespace)
- **tsx**: TypeScript execution
- **fast-check**: Property-based testing
- **type-fest**: TypeScript utilities

## File Organization

- Place temporary files in `.tmp/` (Git-ignored)
- Use `.mjs` extension for ESM scripts outside `.tmp/`
- Maintain clear sync/async assertion separation
- Follow established module boundaries (`guards.ts`, `schema.ts`, `util.ts`)
