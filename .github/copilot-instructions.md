# Bupkis Copilot Instructions

## Project Overview

**Bupkis** is a TypeScript assertion library that provides natural language assertions using Zod v4 for validation. Instead of chainable APIs like `expect(value).toBeString()`, it uses phrase-based syntax: `expect(value, 'to be a string')`. The library is ~37KB (source), written in TypeScript, targets Node.js environments, and ships as dual CJS/ESM packages.

**Key Technologies**: TypeScript 5.9+, Zod v4 (peer dependency), Node.js built-in test runner, tshy (build tool), ESLint, Husky (git hooks)

## Build & Development Workflow

**Environment Setup**:

```bash
npm install  # Installs dependencies and runs husky prepare
```

**Core Commands** (always run in this order for development):

```bash
npm run build        # Build dual CJS/ESM output using tshy (~2-5 seconds)
npm run lint         # ESLint validation (~3-10 seconds)
npm run lint:types   # TypeScript type checking (~5-15 seconds)
npm test             # Run test suite (~10-30 seconds, 237+ tests)
```

**Development Commands**:

```bash
npm run dev          # Watch mode building with tshy --watch
npm run test:watch   # Watch mode testing
npm run test:ci      # CI-compatible test script (same as npm test)
npm run lint:fix     # Auto-fix ESLint issues
npm run build:docs   # Generate TypeDoc documentation
```

**Validated Workflow** (all commands work correctly):

- Tests run successfully with unquoted glob pattern: `test/**/*.test.ts`
- Build system produces dual output in `dist/commonjs/` and `dist/esm/`
- Linting passes with comprehensive TypeScript + style rules
- Type checking validates complex recursive types and strict mode
- All 237+ tests pass consistently including async and sync assertions

**Common Issues & Solutions**:

- **Test script issue (FIXED)**: Added `npm run test:ci` script for GitHub Actions workflow compatibility.
- **Test glob pattern (FIXED)**: Removed quotes from test script pattern - now uses `test/**/*.test.ts` which works correctly.
- **Build artifacts**: `.tshy/` directory contains generated files that may show as modified in git status - these are build artifacts and should not be committed.
- **Dependency installation**: Always run `npm install` before any development work to ensure husky hooks are properly installed.

**Build Validation Sequence**:

1. Clean install: `rm -rf node_modules package-lock.json && npm install`
2. Type check: `npm run lint:types`
3. Lint: `npm run lint`
4. Build: `npm run build`
5. Test: `npm test`
6. All commands should complete with exit code 0.

## Architecture & Key Components

**Core Source Structure**:

- `src/expect.ts` - Main synchronous assertion engine
- `src/expect-async.ts` - Asynchronous Promise-based assertions
- `src/assertion/assertion.ts` - Core Assertion class and parsing logic
- `src/assertion/sync*.ts` - Built-in synchronous assertions (type, comparison, etc.)
- `src/assertion/async.ts` - Built-in async assertions
- `src/assertion/types.ts` - Complex TypeScript type system for inference
- `src/guards.ts` - Runtime type checking utilities
- `src/schema.ts` - Reusable Zod schemas
- `src/util.ts` - Object matching utilities (`satisfies`, `exhaustivelySatisfies`)

**Build System**: Uses `tshy` to generate dual CJS/ESM output in `dist/commonjs/` and `dist/esm/`

**Testing**: Node.js built-in test runner (`node:test`) with `tsx` loader for TypeScript execution. Tests use `describe`/`it` BDD-style patterns.

## Development Patterns

**Assertion Creation Pattern**:

```ts
import { createAssertion } from './assertion/index.js';
import { z } from 'zod';

// Simple schema-based assertion
createAssertion(['to be a string'], z.string());

// Parameterized assertion
createAssertion([z.number(), 'is greater than', z.number()], (_, expected) =>
  z.number().gt(expected),
);

// Boolean function assertion
createAssertion([z.number(), 'is even'], (n) => n % 2 === 0);
```

**Type-Safe Natural Language API**:

- Phrases are string literals: `'to be a string'` or tuples: `['to be a', 'to be an']`
- Arguments are matched against "slots" derived from assertion parts
- Type inference maps phrases to TypeScript signatures
- No method chaining - everything uses positional arguments

**Dual Execution Engines**:

- `expect()` - synchronous, throws on Promise returns
- `expectAsync()` - asynchronous, awaits Promise-based implementations
- Both use same parsing but different execution strategies

## Continuous Integration & Validation

**GitHub Actions Workflow** (`.github/workflows/nodejs.yml`):

- Runs on Node.js 22.15.0 and 24.0.1
- Steps: checkout → setup Node → npm ci → lint → test
- Uses `npm run test:ci` (now available) for consistent CI testing

**Pre-commit Hooks** (via Husky):

- `lint-staged` runs on staged files
- `commitlint` validates commit message format (conventional commits)
- Automatically runs ESLint and Prettier on staged files

**Dependencies**:

- **Zod v4**: Core validation (peer/optional dependency)
- **Debug**: Structured logging (`DEBUG=bupkis*`)
- **tsx**: TypeScript execution for tests
- **tshy**: Dual package building
- **ESLint**: Code quality with TypeScript integration

## Common Development Issues

**Debug Logging**: Enable with `DEBUG=bupkis*` to see assertion matching and validation steps

**TypeScript Issues**:

- Complex recursive types in `types.ts` may hit recursion limits
- Run `npm run lint:types` to validate all TypeScript compilation
- Recent refactoring simplified some recursive types but maintained compatibility

**Test Issues**:

- Assertion parsing failures: Check `parseValues()` result for `success: false`
- Async/Sync mismatch: `expect()` throws TypeError if assertion returns Promise
- Use `expectAsync()` for Promise-based assertions

**Build Issues**:

- Always run `npm install` before building to ensure proper setup
- Build artifacts in `.tshy/` and `dist/` should not be committed
- Use `npm run dev` for watch mode during development

**Performance Considerations**:

- Assertion matching loops through all built-in assertions until exact match
- Complex tuple type operations may slow TypeScript compilation
- Circular reference detection prevents infinite loops but adds overhead

## File Organization

**Configuration Files**:

- `package.json` - Scripts, dependencies, tshy config
- `tsconfig.json` - TypeScript configuration with strict mode
- `eslint.config.js` - ESLint with TypeScript and style rules
- `.wallaby.js` - Real-time testing configuration
- `.gitignore` - Excludes `dist/`, `coverage/`, build artifacts

**Key Directories**:

- `src/` - TypeScript source code
- `test/` - Test files using Node.js test runner
- `dist/` - Built CJS/ESM output (generated)
- `.config/` - Additional configuration files
- `.github/` - GitHub Actions workflows and funding info

Trust these instructions and only perform additional exploration if information is incomplete or found to be incorrect. The project uses modern Node.js patterns and tooling designed for simplicity and type safety.
