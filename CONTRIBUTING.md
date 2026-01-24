# Contributing to **BUPKIS**

Thank you for your interest in contributing to **BUPKIS**! We welcome contributions from everyone and are grateful for every contribution made.

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues as you might find that the problem has already been reported. When creating a bug report, include as many details as possible:

- **Use a clear and descriptive title** for the issue
- **Identify the affected package** (e.g., `bupkis`, `@bupkis/sinon`, etc.)
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples to demonstrate the steps**
- **Describe the behavior you observed** and **explain which behavior you expected to see**
- **Include code samples** that demonstrate the issue
- **Specify the version(s) of the package(s) you're using**
- **Specify your Node.js version and operating system**

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion:

- **Use a clear and descriptive title**
- **Identify the target package** or propose a new package if appropriate
- **Provide a detailed description of the suggested enhancement**
- **Explain why this enhancement would be useful**
- **Provide examples of how the enhancement would be used**

### Pull Requests

- **Fill in the required template**
- **Include screenshots or animated GIFs in your pull request when appropriate**
- **Follow the TypeScript and JavaScript style guides**
- **Include thoughtfully-worded, well-structured tests**
- **Document new code with TSDoc comments**
- **End all files with a newline**

## Development Setup

### Prerequisites

- Node.js (see `engines` field in `package.json` for supported versions)
- npm (comes with Node.js)

### Setting Up Your Development Environment

1. Fork the repository on GitHub
2. Clone your fork locally:

   ```bash
   git clone https://github.com/YOUR_USERNAME/bupkis.git
   cd bupkis
   ```

3. Install dependencies:

   ```bash
   npm install
   ```

4. Create a branch for your changes:

   ```bash
   git checkout -b your-feature-branch
   ```

### Root-Level Commands

These commands run from the monorepo root and affect all packages:

```bash
# Build all packages (dual CJS/ESM via zshy)
npm run build

# Run all tests across all packages
npm test

# Run tests in watch mode
npm run test:dev

# Run property-based tests across packages
npm run test:property

# Run tests with coverage
npm run test:coverage
```

### Linting and Type Checking

```bash
# Run all linting (ESLint, types, markdown, spelling)
npm run lint

# Auto-fix all fixable issues
npm run fix

# Auto-fix ESLint issues only
npm run fix:eslint

# TypeScript type checking only
npm run lint:types

# Watch mode type checking
npm run lint:types:dev
```

### Documentation

```bash
# Build documentation
npm run docs:build

# Watch mode documentation
npm run docs:dev
```

### Package-Specific Commands

Run commands for a specific package using `--workspace`:

```bash
npm run test --workspace=bupkis
npm run build --workspace=@bupkis/sinon
```

Or `cd` into the package directory and run commands directly:

```bash
cd packages/sinon
npm test
```

### Core Package Commands (`packages/bupkis`)

The core package has additional commands:

```bash
# Run benchmark suites
npm run bench

# Run snapshot tests
npm run test:snapshots

# Update snapshot files
npm run test:update-snapshots

# Run type definition tests (tsd)
npm run test:types
```

## Monorepo Structure

This is an **npm workspaces monorepo**. All packages live in `packages/`:

| Package                    | Path                        | Description                                        |
| -------------------------- | --------------------------- | -------------------------------------------------- |
| `bupkis`                   | `packages/bupkis`           | Core assertion library                             |
| `@bupkis/events`           | `packages/events`           | EventEmitter and EventTarget assertions            |
| `@bupkis/from-chai`        | `packages/from-chai`        | Codemod to migrate Chai assertions                 |
| `@bupkis/from-jest`        | `packages/from-jest`        | Codemod to migrate Jest/Vitest assertions          |
| `@bupkis/http`             | `packages/http`             | HTTP response assertions (supertest, fetch, axios) |
| `@bupkis/property-testing` | `packages/property-testing` | Property-based testing harness for assertions      |
| `@bupkis/rxjs`             | `packages/rxjs`             | RxJS Observable assertions                         |
| `@bupkis/sinon`            | `packages/sinon`            | Sinon spy/stub/mock assertions                     |

### Core Package Structure (`packages/bupkis`)

- `src/` - Library source code
  - `assertion/` - Core assertion framework
    - `impl/` - Built-in assertion implementations by category
    - `create.ts` - Factory functions for custom assertions
  - `expect.ts` - Main entry points (`expect`, `expectAsync`)
  - `types.ts` - TypeScript type definitions
  - `snapshot/` - Snapshot testing support
- `test/` - Test suite
  - `core/` - Core functionality tests
  - `assertion/` - Assertion implementation tests
  - `assertion-error/` - Error formatting tests with snapshots
  - `property/` - Property-based tests using fast-check
  - `integration/` - CJS/ESM compatibility tests

### Other Directories

- `site/` - Documentation source files for <https://bupkis.zip>

## Coding Guidelines

### TypeScript/JavaScript Style

**Critical Requirements:**

- **Always use ESM syntax** (`import`/`export`)
- **Always use arrow functions** unless you have a good reason not to (e.g., overloads, use of `this`). ESLint enforces this rule.
- **Comments explain intent**, not implementation
- After making changes, **always run `npm run fix:eslint`** and manually fix any outstanding issues

**General Guidelines:**

- Use TypeScript for all new code
- Follow the existing code style (enforced by ESLint)
- Use meaningful variable and function names
- Prefer explicit types over `any`
- Consume `type-fest` types instead of hand-rolled equivalents

**Documentation:**

- Add TSDoc comments for all public APIs
- Include examples in TSDoc comments for user-facing APIs
- Update relevant documentation when changing APIs

### Testing Guidelines

**Test Framework:**

- Uses Node.js built-in `node:test` with `describe`/`it` structure
- Write tests in TypeScript with `tsx` for execution
- Use BDD-style descriptions: "should do X when Y"

**Property-Based Testing:**

For assertion logic, use [fast-check](https://fast-check.dev) and the `@bupkis/property-testing` harness:

```ts
import {
  createPropertyTestHarness,
  extractPhrases,
  getVariants,
} from '@bupkis/property-testing';
import fc from 'fast-check';

const { runVariant } = createPropertyTestHarness({ expect, expectAsync });

// Define generators for valid/invalid inputs
const testConfig = {
  valid: {
    generators: [
      fc.integer().filter((n) => n % 2 === 0),
      fc.constantFrom(...extractPhrases(myAssertion)),
    ],
  },
  invalid: {
    generators: [
      fc.integer().filter((n) => n % 2 !== 0),
      fc.constantFrom(...extractPhrases(myAssertion)),
    ],
  },
};
```

**General Guidelines:**

- Write tests for all new functionality
- Ensure tests are deterministic and don't rely on external dependencies
- Use coordinated generators for valid input combinations
- Avoid `fc.constant()` in property tests; prefer `fc.func().map()` for better coverage

### Assertion Development

When creating new assertions:

1. **Use the factory functions:** `createAssertion()` for sync assertions, `createAsyncAssertion()` for async
2. **Follow natural language patterns** for assertion phrases (e.g., `'to be a string'`, `'to have property'`)
3. **Provide phrase aliases** where natural (e.g., `['to be a string', 'to be str']`)
4. **Write comprehensive TSDoc comments** with examples
5. **Write both unit tests and property-based tests** using `@bupkis/property-testing`
6. **Update documentation** as needed

**AssertionFailure Guidelines:**

When returning `AssertionFailure` from an assertion, the `actual`/`expected` properties feed into `jest-diff`:

- **Include them** when both are the same type (enables useful diff output)
- **Omit them** when types differ or there's no meaningful comparison (just use `message`)

**Async/Sync Separation:**

- `expect()` throws if it encounters a thenable; use `expectAsync()` instead
- A function should be sync or async, not both (no Zalgo)
- Create parallel APIs if necessary (e.g., `expect()`/`expectAsync()`)

### Package-Specific Contribution Notes

**Assertion Packages** (`@bupkis/events`, `@bupkis/http`, `@bupkis/rxjs`, `@bupkis/sinon`):

- Follow the patterns established in the core `bupkis` package
- Export assertions as an array that can be passed to `use()`
- Include comprehensive README documentation with examples for each assertion
- Write property-based tests where applicable

**Codemod Packages** (`@bupkis/from-chai`, `@bupkis/from-jest`):

- Add transformation mappings in the appropriate transformer file
- Include both the source pattern and target bupkis pattern in tests
- Support both `--strict` and `--best-effort` modes
- Add `TODO` comments for patterns that can't be automatically transformed

**Property Testing** (`@bupkis/property-testing`):

- Focus on generator utilities and test harness improvements
- Ensure generators produce valid inputs that match assertion schemas
- Use `filteredAnything` and `filteredObject` to avoid problematic values
- Document generator patterns for assertion authors

### Commit Messages

This project uses [Conventional Commits](https://www.conventionalcommits.org/) with package scopes. Each package is independently versioned, so commit types directly affect changelogs and version bumps.

**Format:** `<type>(<scope>): <description>`

**Scopes** correspond to package names:

- `bupkis`, `events`, `from-chai`, `from-jest`, `http`, `property-testing`, `rxjs`, `sinon`

**Types** are limited to:

- `feat` - New features (triggers minor version bump)
- `fix` - Bug fixes (triggers patch version bump)
- `docs` - Documentation changes
- `chore` - Internal changes, tooling, dependencies

**Examples:**

```text
feat(bupkis): add new 'to be a URL' assertion
fix(sinon): handle spies with no calls in 'was called with'
docs(http): add examples for redirect assertions
chore(from-jest): update jscodeshift dependency
```

**Cross-Package Changes:**

When a change spans multiple packages, ask: _"Is the commit type the same for all affected packages?"_

- If **yes** (e.g., `chore` across multiple packages), a single commit is fine
- If **no**, **split into separate commits**

For example, adding a new export to `@bupkis/property-testing` and consuming it in `bupkis`:

```text
feat(property-testing): add extractProperty helper
chore(bupkis): use extractProperty from @bupkis/property-testing
```

**Why this matters:** `feat` commits trigger releases and appear in user-facing changelogs. Internal tooling or test changes (`chore`) should not clutter changelogs or trigger unnecessary releases.

## Debugging

- Set `DEBUG=bupkis*` environment variable for detailed logging
- Use Wallaby.js integration for real-time testing feedback

**Profiling (in `packages/bupkis`):**

```bash
# Profile test execution
npm run profile:test

# Profile benchmark execution
npm run profile:benchmarks
```

## Release Process

Releases are managed by maintainers using automated tools. Contributors don't need to worry about versioning or publishing.

## Getting Help

- Check existing issues and discussions
- Create a new issue if you need help
- Be respectful and patient when asking for help

## Recognition

All contributors will be recognized in the project. We appreciate all forms of contribution, including but not limited to:

- Code contributions
- Bug reports
- Documentation improvements
- Feature suggestions
- Testing and feedback

You are a peach for contributing to **BUPKIS**!
