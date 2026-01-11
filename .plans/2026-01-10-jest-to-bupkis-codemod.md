# Jest-to-Bupkis Codemod Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create a TypeScript-first codemod tool that transforms Jest assertion syntax to bupkis, enabling frictionless migration for the community.

**Architecture:** A ts-morph-based transformer pipeline with modular matchers. The CLI accepts globs and mode flags (`--strict`, `--interactive`, `--best-effort`), defaulting to best-effort with TODO markers for ambiguous transforms. Smart import detection handles Jest globals, `@jest/globals`, and Vitest-style imports.

**Tech Stack:** ts-morph, commander (CLI), picocolors (output), glob patterns

**Branch:** Create from `monorepo` branch in a new worktree

---

## Phase 1: Project Scaffolding

### Task 1: Create package directory structure

**Files:**

- Create: `packages/codemod/package.json`
- Create: `packages/codemod/tsconfig.json`
- Create: `packages/codemod/src/index.ts`
- Create: `packages/codemod/src/cli.ts`

**Step 1: Create package.json**

```json
{
  "bin": {
    "bupkis-codemod": "./dist/cli.js"
  },
  "dependencies": {
    "commander": "^14.0.0",
    "picocolors": "^1.1.1",
    "ts-morph": "^25.0.0"
  },
  "description": "Migrate Jest assertions to bupkis",
  "devDependencies": {
    "@types/node": "^24.0.0"
  },
  "engines": {
    "node": "^20.19.0 || ^22.12.0 || >=23"
  },
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "files": ["dist"],
  "keywords": ["bupkis", "jest", "codemod", "migration", "assertions"],
  "name": "@bupkis/codemod",
  "scripts": {
    "build": "tsc",
    "test": "node --test --experimental-strip-types 'test/**/*.test.ts'",
    "test:dev": "node --test --watch --experimental-strip-types 'test/**/*.test.ts'"
  },
  "type": "module",
  "version": "0.0.0"
}
```

**Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "declarationMap": true
  },
  "exclude": ["node_modules", "dist", "test"],
  "extends": "../../tsconfig.json",
  "include": ["src/**/*.ts"]
}
```

**Step 3: Create placeholder src/index.ts**

```typescript
export { transform } from './transform.js';
export type { TransformOptions, TransformResult } from './types.js';
```

**Step 4: Create placeholder src/cli.ts**

```typescript
#!/usr/bin/env node
console.log('@bupkis/codemod - coming soon');
```

**Step 5: Install dependencies from monorepo root**

Run: `npm install` (from monorepo root)
Expected: Dependencies installed, package-lock.json updated

**Step 6: Commit scaffold**

```bash
git add packages/codemod/
git commit -m "feat(codemod): scaffold @bupkis/codemod package"
```

---

### Task 2: Define core types

**Files:**

- Create: `packages/codemod/src/types.ts`

**Step 1: Write the types file**

```typescript
/**
 * Mode for handling ambiguous or unsupported transformations.
 */
export type TransformMode = 'strict' | 'interactive' | 'best-effort';

/**
 * Options for the transform function.
 */
export interface TransformOptions {
  /**
   * How to handle ambiguous transformations.
   *
   * @default 'best-effort'
   */
  mode?: TransformMode;

  /**
   * Working directory for resolving files.
   *
   * @default process.cwd()
   */
  cwd?: string;

  /**
   * Whether to write changes to disk.
   *
   * @default true
   */
  write?: boolean;

  /**
   * File patterns to include (glob).
   */
  include?: string[];

  /**
   * File patterns to exclude (glob).
   */
  exclude?: string[];
}

/**
 * Result of transforming a single file.
 */
export interface FileTransformResult {
  /** Absolute path to the file */
  filePath: string;

  /** Whether the file was modified */
  modified: boolean;

  /** Number of transformations applied */
  transformCount: number;

  /** Warnings for manual review */
  warnings: TransformWarning[];

  /** Errors that prevented transformation */
  errors: TransformError[];
}

/**
 * Warning about a transformation that needs manual review.
 */
export interface TransformWarning {
  /** Line number in source */
  line: number;

  /** Column number in source */
  column: number;

  /** Description of what needs manual review */
  message: string;

  /** The original code that couldn't be fully transformed */
  originalCode: string;
}

/**
 * Error during transformation.
 */
export interface TransformError {
  /** Line number in source (if applicable) */
  line?: number;

  /** Column number in source (if applicable) */
  column?: number;

  /** Error message */
  message: string;
}

/**
 * Overall result of a transform operation.
 */
export interface TransformResult {
  /** Results for each file processed */
  files: FileTransformResult[];

  /** Total files processed */
  totalFiles: number;

  /** Total files modified */
  modifiedFiles: number;

  /** Total transformations applied */
  totalTransformations: number;

  /** Total warnings across all files */
  totalWarnings: number;

  /** Total errors across all files */
  totalErrors: number;
}

/**
 * A matcher transformation definition.
 */
export interface MatcherTransform {
  /** Jest matcher name (e.g., 'toBe', 'toEqual') */
  jestMatcher: string;

  /** Bupkis phrase (e.g., 'to be', 'to deep equal') */
  bupkisPhrase: string;

  /**
   * Optional transformer for complex cases. Return null to skip transformation
   * (will add TODO comment).
   */
  transform?: (args: MatcherTransformArgs) => string | null;
}

/**
 * Arguments passed to custom matcher transformers.
 */
export interface MatcherTransformArgs {
  /** The subject being tested (the value passed to expect()) */
  subject: string;

  /** Arguments passed to the Jest matcher */
  matcherArgs: string[];

  /** Whether the assertion is negated (.not) */
  negated: boolean;

  /** The full original expression for context */
  originalExpression: string;
}
```

**Step 2: Commit types**

```bash
git add packages/codemod/src/types.ts
git commit -m "feat(codemod): add core type definitions"
```

---

## Phase 2: Matcher Registry

### Task 3: Create Jest-to-bupkis matcher mappings

**Files:**

- Create: `packages/codemod/src/matchers/index.ts`
- Create: `packages/codemod/src/matchers/core.ts`
- Create: `packages/codemod/src/matchers/jest-extended.ts`
- Create: `packages/codemod/src/matchers/testing-library.ts`
- Test: `packages/codemod/test/matchers.test.ts`

**Step 1: Write failing test for core matchers**

```typescript
// packages/codemod/test/matchers.test.ts
import { describe, it } from 'node:test';
import { expect } from 'bupkis';
import { getCoreMatchers, getMatcherTransform } from '../src/matchers/index.js';

describe('matcher registry', () => {
  describe('getCoreMatchers', () => {
    it('should include toBe matcher', () => {
      const matchers = getCoreMatchers();
      expect(matchers, 'to have property', 'toBe');
    });

    it('should include toEqual matcher', () => {
      const matchers = getCoreMatchers();
      expect(matchers, 'to have property', 'toEqual');
    });

    it('should include toStrictEqual matcher', () => {
      const matchers = getCoreMatchers();
      expect(matchers, 'to have property', 'toStrictEqual');
    });
  });

  describe('getMatcherTransform', () => {
    it('should return transform for known matcher', () => {
      const transform = getMatcherTransform('toBe');
      expect(transform, 'to be defined');
      expect(transform?.bupkisPhrase, 'to equal', 'to be');
    });

    it('should return undefined for unknown matcher', () => {
      const transform = getMatcherTransform('toBeWeird');
      expect(transform, 'to be undefined');
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test --workspace=@bupkis/codemod`
Expected: FAIL - module not found

**Step 3: Create matchers/index.ts**

```typescript
// packages/codemod/src/matchers/index.ts
import type { MatcherTransform } from '../types.js';
import { coreMatchers } from './core.js';
import { jestExtendedMatchers } from './jest-extended.js';
import { testingLibraryMatchers } from './testing-library.js';

const allMatchers = new Map<string, MatcherTransform>();

// Register all matcher sets
for (const matcher of [
  ...coreMatchers,
  ...jestExtendedMatchers,
  ...testingLibraryMatchers,
]) {
  allMatchers.set(matcher.jestMatcher, matcher);
}

/**
 * Get all core Jest matchers.
 */
export function getCoreMatchers(): Record<string, MatcherTransform> {
  const result: Record<string, MatcherTransform> = {};
  for (const matcher of coreMatchers) {
    result[matcher.jestMatcher] = matcher;
  }
  return result;
}

/**
 * Get transform for a specific Jest matcher.
 */
export function getMatcherTransform(
  jestMatcher: string,
): MatcherTransform | undefined {
  return allMatchers.get(jestMatcher);
}

/**
 * Check if a matcher is supported.
 */
export function isMatcherSupported(jestMatcher: string): boolean {
  return allMatchers.has(jestMatcher);
}

export { coreMatchers } from './core.js';
export { jestExtendedMatchers } from './jest-extended.js';
export { testingLibraryMatchers } from './testing-library.js';
```

**Step 4: Create matchers/core.ts with Jest core matchers**

```typescript
// packages/codemod/src/matchers/core.ts
import type { MatcherTransform } from '../types.js';

/**
 * Core Jest matchers and their bupkis equivalents.
 *
 * Reference: https://jestjs.io/docs/expect
 */
export const coreMatchers: MatcherTransform[] = [
  // Equality
  { jestMatcher: 'toBe', bupkisPhrase: 'to be' },
  { jestMatcher: 'toEqual', bupkisPhrase: 'to deep equal' },
  { jestMatcher: 'toStrictEqual', bupkisPhrase: 'to deep equal' },

  // Truthiness
  { jestMatcher: 'toBeTruthy', bupkisPhrase: 'to be truthy' },
  { jestMatcher: 'toBeFalsy', bupkisPhrase: 'to be falsy' },
  { jestMatcher: 'toBeNull', bupkisPhrase: 'to be null' },
  { jestMatcher: 'toBeUndefined', bupkisPhrase: 'to be undefined' },
  { jestMatcher: 'toBeDefined', bupkisPhrase: 'to be defined' },
  { jestMatcher: 'toBeNaN', bupkisPhrase: 'to be NaN' },

  // Type checking
  {
    jestMatcher: 'toBeInstanceOf',
    bupkisPhrase: 'to be an instance of',
  },

  // Numbers
  { jestMatcher: 'toBeGreaterThan', bupkisPhrase: 'to be greater than' },
  {
    jestMatcher: 'toBeGreaterThanOrEqual',
    bupkisPhrase: 'to be greater than or equal to',
  },
  { jestMatcher: 'toBeLessThan', bupkisPhrase: 'to be less than' },
  {
    jestMatcher: 'toBeLessThanOrEqual',
    bupkisPhrase: 'to be less than or equal to',
  },
  {
    jestMatcher: 'toBeCloseTo',
    bupkisPhrase: 'to be close to',
    transform: ({ subject, matcherArgs, negated }) => {
      // toBeCloseTo(number, numDigits?) -> 'to be close to', number, numDigits
      const phrase = negated ? 'not to be close to' : 'to be close to';
      if (matcherArgs.length === 2) {
        return `expect(${subject}, '${phrase}', ${matcherArgs[0]}, ${matcherArgs[1]})`;
      }
      return `expect(${subject}, '${phrase}', ${matcherArgs[0]})`;
    },
  },

  // Strings
  { jestMatcher: 'toMatch', bupkisPhrase: 'to match' },
  { jestMatcher: 'toContain', bupkisPhrase: 'to contain' },

  // Arrays/Iterables
  { jestMatcher: 'toHaveLength', bupkisPhrase: 'to have length' },
  {
    jestMatcher: 'toContainEqual',
    bupkisPhrase: 'to contain',
    transform: ({ subject, matcherArgs, negated }) => {
      // toContainEqual uses deep equality - bupkis 'to contain' does too
      const phrase = negated ? 'not to contain' : 'to contain';
      return `expect(${subject}, '${phrase}', ${matcherArgs[0]})`;
    },
  },

  // Objects
  {
    jestMatcher: 'toHaveProperty',
    bupkisPhrase: 'to have property',
    transform: ({ subject, matcherArgs, negated }) => {
      // toHaveProperty(keyPath, value?) -> 'to have property', key or 'to satisfy'
      const phrase = negated ? 'not to have property' : 'to have property';
      if (matcherArgs.length === 1) {
        return `expect(${subject}, '${phrase}', ${matcherArgs[0]})`;
      }
      // With value, use to satisfy for nested check
      // This is a complex case - add TODO marker
      return null;
    },
  },
  {
    jestMatcher: 'toMatchObject',
    bupkisPhrase: 'to satisfy',
  },

  // Errors/Exceptions
  { jestMatcher: 'toThrow', bupkisPhrase: 'to throw' },
  {
    jestMatcher: 'toThrowError',
    bupkisPhrase: 'to throw',
  },

  // Promises (these need expectAsync)
  {
    jestMatcher: 'resolves',
    bupkisPhrase: 'to be fulfilled',
    transform: () => null, // Complex - needs restructuring to expectAsync
  },
  {
    jestMatcher: 'rejects',
    bupkisPhrase: 'to reject',
    transform: () => null, // Complex - needs restructuring to expectAsync
  },

  // Mocks/Spies (mark as unsupported)
  { jestMatcher: 'toHaveBeenCalled', bupkisPhrase: '', transform: () => null },
  {
    jestMatcher: 'toHaveBeenCalledTimes',
    bupkisPhrase: '',
    transform: () => null,
  },
  {
    jestMatcher: 'toHaveBeenCalledWith',
    bupkisPhrase: '',
    transform: () => null,
  },
  {
    jestMatcher: 'toHaveBeenLastCalledWith',
    bupkisPhrase: '',
    transform: () => null,
  },
  {
    jestMatcher: 'toHaveBeenNthCalledWith',
    bupkisPhrase: '',
    transform: () => null,
  },
  { jestMatcher: 'toHaveReturned', bupkisPhrase: '', transform: () => null },
  {
    jestMatcher: 'toHaveReturnedTimes',
    bupkisPhrase: '',
    transform: () => null,
  },
  {
    jestMatcher: 'toHaveReturnedWith',
    bupkisPhrase: '',
    transform: () => null,
  },
  {
    jestMatcher: 'toHaveLastReturnedWith',
    bupkisPhrase: '',
    transform: () => null,
  },
  {
    jestMatcher: 'toHaveNthReturnedWith',
    bupkisPhrase: '',
    transform: () => null,
  },
];
```

**Step 5: Create matchers/jest-extended.ts**

```typescript
// packages/codemod/src/matchers/jest-extended.ts
import type { MatcherTransform } from '../types.js';

/**
 * Jest-extended matchers and their bupkis equivalents.
 *
 * Reference: https://jest-extended.jestcommunity.dev/docs/matchers
 */
export const jestExtendedMatchers: MatcherTransform[] = [
  // Truthiness
  { jestMatcher: 'toBeTrue', bupkisPhrase: 'to be true' },
  { jestMatcher: 'toBeFalse', bupkisPhrase: 'to be false' },

  // Arrays
  { jestMatcher: 'toBeArray', bupkisPhrase: 'to be an array' },
  { jestMatcher: 'toBeArrayOfSize', bupkisPhrase: 'to have length' },
  { jestMatcher: 'toBeEmpty', bupkisPhrase: 'to be empty' },
  { jestMatcher: 'toInclude', bupkisPhrase: 'to contain' },
  {
    jestMatcher: 'toIncludeAllMembers',
    bupkisPhrase: 'to contain',
    transform: () => null,
  },
  {
    jestMatcher: 'toIncludeAnyMembers',
    bupkisPhrase: 'to contain',
    transform: () => null,
  },
  {
    jestMatcher: 'toIncludeSameMembers',
    bupkisPhrase: 'to contain',
    transform: () => null,
  },
  {
    jestMatcher: 'toSatisfyAll',
    bupkisPhrase: 'to have items satisfying',
    transform: () => null,
  },
  { jestMatcher: 'toSatisfyAny', bupkisPhrase: '', transform: () => null },

  // Strings
  { jestMatcher: 'toBeString', bupkisPhrase: 'to be a string' },
  { jestMatcher: 'toStartWith', bupkisPhrase: 'to start with' },
  { jestMatcher: 'toEndWith', bupkisPhrase: 'to end with' },
  { jestMatcher: 'toInclude', bupkisPhrase: 'to contain' },
  {
    jestMatcher: 'toEqualIgnoringCase',
    bupkisPhrase: '',
    transform: () => null,
  },

  // Numbers
  { jestMatcher: 'toBeNumber', bupkisPhrase: 'to be a number' },
  { jestMatcher: 'toBePositive', bupkisPhrase: 'to be positive' },
  { jestMatcher: 'toBeNegative', bupkisPhrase: 'to be negative' },
  { jestMatcher: 'toBeInteger', bupkisPhrase: 'to be an integer' },
  { jestMatcher: 'toBeFinite', bupkisPhrase: 'to be finite' },
  { jestMatcher: 'toBeWithin', bupkisPhrase: 'to be within' },
  { jestMatcher: 'toBeEven', bupkisPhrase: '', transform: () => null },
  { jestMatcher: 'toBeOdd', bupkisPhrase: '', transform: () => null },

  // Objects
  { jestMatcher: 'toBeObject', bupkisPhrase: 'to be an object' },
  { jestMatcher: 'toContainKey', bupkisPhrase: 'to have property' },
  { jestMatcher: 'toContainKeys', bupkisPhrase: 'to have properties' },
  { jestMatcher: 'toContainValue', bupkisPhrase: '', transform: () => null },
  { jestMatcher: 'toContainValues', bupkisPhrase: '', transform: () => null },
  { jestMatcher: 'toContainEntry', bupkisPhrase: '', transform: () => null },
  { jestMatcher: 'toContainEntries', bupkisPhrase: '', transform: () => null },
  { jestMatcher: 'toBeExtensible', bupkisPhrase: 'to be extensible' },
  { jestMatcher: 'toBeFrozen', bupkisPhrase: 'to be frozen' },
  { jestMatcher: 'toBeSealed', bupkisPhrase: 'to be sealed' },

  // Functions
  { jestMatcher: 'toBeFunction', bupkisPhrase: 'to be a function' },
  {
    jestMatcher: 'toThrowWithMessage',
    bupkisPhrase: 'to throw',
    transform: () => null,
  },

  // Dates
  { jestMatcher: 'toBeDate', bupkisPhrase: 'to be a date' },
  { jestMatcher: 'toBeValidDate', bupkisPhrase: 'to be a valid date' },
  { jestMatcher: 'toBeBefore', bupkisPhrase: 'to be before' },
  { jestMatcher: 'toBeAfter', bupkisPhrase: 'to be after' },

  // Booleans
  { jestMatcher: 'toBeBoolean', bupkisPhrase: 'to be a boolean' },

  // Symbols
  { jestMatcher: 'toBeSymbol', bupkisPhrase: 'to be a symbol' },

  // One of
  { jestMatcher: 'toBeOneOf', bupkisPhrase: 'to be one of' },

  // Type checking
  { jestMatcher: 'toBeNil', bupkisPhrase: 'to be nullish' },
];
```

**Step 6: Create matchers/testing-library.ts (placeholder for now)**

```typescript
// packages/codemod/src/matchers/testing-library.ts
import type { MatcherTransform } from '../types.js';

/**
 * @testing-library/jest-dom matchers.
 *
 * These are DOM-specific and may have limited bupkis equivalents.
 * Most will need TODO markers for manual migration.
 *
 * Reference: https://testing-library.com/docs/ecosystem-jest-dom/
 */
export const testingLibraryMatchers: MatcherTransform[] = [
  // These are DOM-specific - mark for manual migration
  { jestMatcher: 'toBeInTheDocument', bupkisPhrase: '', transform: () => null },
  { jestMatcher: 'toBeVisible', bupkisPhrase: '', transform: () => null },
  { jestMatcher: 'toBeDisabled', bupkisPhrase: '', transform: () => null },
  { jestMatcher: 'toBeEnabled', bupkisPhrase: '', transform: () => null },
  { jestMatcher: 'toHaveClass', bupkisPhrase: '', transform: () => null },
  { jestMatcher: 'toHaveAttribute', bupkisPhrase: '', transform: () => null },
  { jestMatcher: 'toHaveTextContent', bupkisPhrase: '', transform: () => null },
  { jestMatcher: 'toHaveValue', bupkisPhrase: '', transform: () => null },
  { jestMatcher: 'toHaveStyle', bupkisPhrase: '', transform: () => null },
  { jestMatcher: 'toHaveFocus', bupkisPhrase: '', transform: () => null },
  { jestMatcher: 'toBeChecked', bupkisPhrase: '', transform: () => null },
  {
    jestMatcher: 'toBePartiallyChecked',
    bupkisPhrase: '',
    transform: () => null,
  },
  { jestMatcher: 'toHaveFormValues', bupkisPhrase: '', transform: () => null },
  { jestMatcher: 'toContainElement', bupkisPhrase: '', transform: () => null },
  { jestMatcher: 'toContainHTML', bupkisPhrase: '', transform: () => null },
  {
    jestMatcher: 'toHaveAccessibleDescription',
    bupkisPhrase: '',
    transform: () => null,
  },
  {
    jestMatcher: 'toHaveAccessibleName',
    bupkisPhrase: '',
    transform: () => null,
  },
  {
    jestMatcher: 'toHaveErrorMessage',
    bupkisPhrase: '',
    transform: () => null,
  },
  {
    jestMatcher: 'toBeEmptyDOMElement',
    bupkisPhrase: '',
    transform: () => null,
  },
  { jestMatcher: 'toBeInvalid', bupkisPhrase: '', transform: () => null },
  { jestMatcher: 'toBeRequired', bupkisPhrase: '', transform: () => null },
  { jestMatcher: 'toBeValid', bupkisPhrase: '', transform: () => null },
];
```

**Step 7: Run tests to verify they pass**

Run: `npm test --workspace=@bupkis/codemod`
Expected: PASS

**Step 8: Commit matcher registry**

```bash
git add packages/codemod/src/matchers/ packages/codemod/test/
git commit -m "feat(codemod): add Jest matcher registry with bupkis mappings"
```

---

## Phase 3: Core Transform Engine

### Task 4: Create the ts-morph transformer

**Files:**

- Create: `packages/codemod/src/transform.ts`
- Create: `packages/codemod/src/transformers/expect-transformer.ts`
- Test: `packages/codemod/test/transform.test.ts`

**Step 1: Write failing test for basic transformation**

```typescript
// packages/codemod/test/transform.test.ts
import { describe, it } from 'node:test';
import { expect } from 'bupkis';
import { transformCode } from '../src/transform.js';

describe('transformCode', () => {
  it('should transform expect().toBe() to expect(, "to be", )', async () => {
    const input = `expect(42).toBe(42);`;
    const result = await transformCode(input);
    expect(result.code, 'to equal', `expect(42, 'to be', 42);`);
    expect(result.transformCount, 'to equal', 1);
  });

  it('should transform expect().not.toBe() to expect(, "not to be", )', async () => {
    const input = `expect(42).not.toBe(0);`;
    const result = await transformCode(input);
    expect(result.code, 'to equal', `expect(42, 'not to be', 0);`);
  });

  it('should transform expect().toEqual() to expect(, "to deep equal", )', async () => {
    const input = `expect({a: 1}).toEqual({a: 1});`;
    const result = await transformCode(input);
    expect(result.code, 'to equal', `expect({a: 1}, 'to deep equal', {a: 1});`);
  });

  it('should handle multiple assertions in one file', async () => {
    const input = `
expect(1).toBe(1);
expect(2).toBe(2);
expect(3).toEqual(3);
`.trim();
    const result = await transformCode(input);
    expect(result.transformCount, 'to equal', 3);
  });

  it('should preserve non-expect code', async () => {
    const input = `
const x = 42;
expect(x).toBe(42);
console.log(x);
`.trim();
    const result = await transformCode(input);
    expect(result.code, 'to contain', 'const x = 42');
    expect(result.code, 'to contain', 'console.log(x)');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test --workspace=@bupkis/codemod`
Expected: FAIL - transformCode not found

**Step 3: Create transform.ts**

```typescript
// packages/codemod/src/transform.ts
import { Project, type SourceFile } from 'ts-morph';
import type {
  FileTransformResult,
  TransformError,
  TransformOptions,
  TransformResult,
  TransformWarning,
} from './types.js';
import { transformExpectCalls } from './transformers/expect-transformer.js';

export interface CodeTransformResult {
  code: string;
  transformCount: number;
  warnings: TransformWarning[];
  errors: TransformError[];
}

/**
 * Transform a code string from Jest to bupkis assertions.
 */
export async function transformCode(
  code: string,
  options: { mode?: TransformOptions['mode'] } = {},
): Promise<CodeTransformResult> {
  const project = new Project({
    useInMemoryFileSystem: true,
    compilerOptions: {
      allowJs: true,
    },
  });

  const sourceFile = project.createSourceFile('temp.ts', code);
  const result = transformExpectCalls(
    sourceFile,
    options.mode ?? 'best-effort',
  );

  return {
    code: sourceFile.getFullText(),
    transformCount: result.transformCount,
    warnings: result.warnings,
    errors: result.errors,
  };
}

/**
 * Transform files matching glob patterns.
 */
export async function transform(
  options: TransformOptions = {},
): Promise<TransformResult> {
  const {
    cwd = process.cwd(),
    write = true,
    include = [
      '**/*.test.ts',
      '**/*.test.tsx',
      '**/*.spec.ts',
      '**/*.spec.tsx',
    ],
    exclude = ['**/node_modules/**'],
    mode = 'best-effort',
  } = options;

  const project = new Project({
    tsConfigFilePath: `${cwd}/tsconfig.json`,
    skipAddingFilesFromTsConfig: true,
  });

  // Add files matching include patterns
  for (const pattern of include) {
    project.addSourceFilesAtPaths(`${cwd}/${pattern}`);
  }

  const files: FileTransformResult[] = [];
  let totalTransformations = 0;
  let totalWarnings = 0;
  let totalErrors = 0;
  let modifiedFiles = 0;

  for (const sourceFile of project.getSourceFiles()) {
    const filePath = sourceFile.getFilePath();

    // Skip excluded files
    if (
      exclude.some((pattern) => filePath.includes(pattern.replace('**/', '')))
    ) {
      continue;
    }

    const result = transformExpectCalls(sourceFile, mode);

    const fileResult: FileTransformResult = {
      filePath,
      modified: result.transformCount > 0,
      transformCount: result.transformCount,
      warnings: result.warnings,
      errors: result.errors,
    };

    files.push(fileResult);
    totalTransformations += result.transformCount;
    totalWarnings += result.warnings.length;
    totalErrors += result.errors.length;

    if (result.transformCount > 0) {
      modifiedFiles++;
      if (write) {
        await sourceFile.save();
      }
    }
  }

  return {
    files,
    totalFiles: files.length,
    modifiedFiles,
    totalTransformations,
    totalWarnings,
    totalErrors,
  };
}
```

**Step 4: Create transformers/expect-transformer.ts**

```typescript
// packages/codemod/src/transformers/expect-transformer.ts
import {
  type CallExpression,
  type Node,
  type PropertyAccessExpression,
  type SourceFile,
  SyntaxKind,
} from 'ts-morph';
import { getMatcherTransform, isMatcherSupported } from '../matchers/index.js';
import type {
  TransformError,
  TransformMode,
  TransformWarning,
} from '../types.js';

interface ExpectTransformResult {
  transformCount: number;
  warnings: TransformWarning[];
  errors: TransformError[];
}

/**
 * Transform Jest expect() calls to bupkis syntax.
 */
export function transformExpectCalls(
  sourceFile: SourceFile,
  mode: TransformMode,
): ExpectTransformResult {
  const warnings: TransformWarning[] = [];
  const errors: TransformError[] = [];
  let transformCount = 0;

  // Find all call expressions
  const callExpressions = sourceFile.getDescendantsOfKind(
    SyntaxKind.CallExpression,
  );

  // Process in reverse order to avoid position shifts
  const expectCalls = callExpressions.filter(isJestExpectChain).reverse();

  for (const expectChain of expectCalls) {
    try {
      const result = transformSingleExpect(expectChain, mode);

      if (result.transformed) {
        transformCount++;
      }

      if (result.warning) {
        warnings.push(result.warning);
      }
    } catch (error) {
      const pos = expectChain.getStartLineNumber();
      errors.push({
        line: pos,
        message: error instanceof Error ? error.message : String(error),
      });

      if (mode === 'strict') {
        throw error;
      }
    }
  }

  return { transformCount, warnings, errors };
}

/**
 * Check if a call expression is a Jest expect() chain. Matches patterns like:
 *
 * - Expect(x).toBe(y)
 * - Expect(x).not.toBe(y)
 * - Expect(x).resolves.toBe(y)
 */
function isJestExpectChain(node: CallExpression): boolean {
  const text = node.getText();

  // Must start with expect(
  if (!text.startsWith('expect(')) {
    return false;
  }

  // Must have a matcher call (property access followed by call)
  const parent = node.getParent();
  if (!parent) {
    return false;
  }

  // Check for .toXxx() pattern
  return text.includes(').to') || text.includes(').not.');
}

interface SingleTransformResult {
  transformed: boolean;
  warning?: TransformWarning;
}

/**
 * Transform a single expect() chain.
 */
function transformSingleExpect(
  node: CallExpression,
  mode: TransformMode,
): SingleTransformResult {
  const fullText = node.getText();
  const pos = node.getStartLineNumber();
  const col = node.getStartLinePos();

  // Parse the expect chain
  const parsed = parseExpectChain(fullText);

  if (!parsed) {
    return { transformed: false };
  }

  const { subject, negated, matcher, matcherArgs } = parsed;

  // Check if matcher is supported
  if (!isMatcherSupported(matcher)) {
    if (mode === 'strict') {
      throw new Error(`Unsupported matcher: ${matcher}`);
    }

    // Add TODO comment for best-effort mode
    const comment = `// TODO: Manual migration needed - unsupported matcher '${matcher}'`;
    node.replaceWithText(`${comment}\n${fullText}`);

    return {
      transformed: false,
      warning: {
        line: pos,
        column: col,
        message: `Unsupported matcher: ${matcher}`,
        originalCode: fullText,
      },
    };
  }

  const transform = getMatcherTransform(matcher);

  if (!transform) {
    return { transformed: false };
  }

  // Check for custom transformer
  if (transform.transform) {
    const customResult = transform.transform({
      subject,
      matcherArgs,
      negated,
      originalExpression: fullText,
    });

    if (customResult === null) {
      // Transformer returned null - needs manual migration
      if (mode !== 'strict') {
        const comment = `// TODO: Manual migration needed - complex '${matcher}' usage`;
        node.replaceWithText(`${comment}\n${fullText}`);
      }

      return {
        transformed: false,
        warning: {
          line: pos,
          column: col,
          message: `Complex ${matcher} usage requires manual migration`,
          originalCode: fullText,
        },
      };
    }

    node.replaceWithText(customResult);
    return { transformed: true };
  }

  // Standard transformation
  const phrase = negated
    ? `not ${transform.bupkisPhrase}`
    : transform.bupkisPhrase;

  let newCode: string;
  if (matcherArgs.length > 0) {
    newCode = `expect(${subject}, '${phrase}', ${matcherArgs.join(', ')})`;
  } else {
    newCode = `expect(${subject}, '${phrase}')`;
  }

  node.replaceWithText(newCode);
  return { transformed: true };
}

interface ParsedExpectChain {
  subject: string;
  negated: boolean;
  matcher: string;
  matcherArgs: string[];
}

/**
 * Parse a Jest expect() chain into its components.
 */
function parseExpectChain(code: string): ParsedExpectChain | null {
  // Match: expect(subject).matcher(args) or expect(subject).not.matcher(args)
  const regex = /^expect\((.+?)\)\.(not\.)?(\w+)\((.*)\)$/s;
  const match = code.match(regex);

  if (!match) {
    return null;
  }

  const [, subject, notPart, matcher, argsStr] = match;

  // Parse arguments (simple split for now, doesn't handle nested parens)
  const matcherArgs = argsStr.trim() ? parseArguments(argsStr) : [];

  return {
    subject: subject.trim(),
    negated: Boolean(notPart),
    matcher,
    matcherArgs,
  };
}

/**
 * Parse function arguments, handling nested structures.
 */
function parseArguments(argsStr: string): string[] {
  const args: string[] = [];
  let current = '';
  let depth = 0;
  let inString: string | null = null;

  for (let i = 0; i < argsStr.length; i++) {
    const char = argsStr[i];
    const prevChar = argsStr[i - 1];

    // Handle string boundaries
    if ((char === '"' || char === "'" || char === '`') && prevChar !== '\\') {
      if (inString === char) {
        inString = null;
      } else if (!inString) {
        inString = char;
      }
    }

    // Track nesting depth (only outside strings)
    if (!inString) {
      if (char === '(' || char === '[' || char === '{') {
        depth++;
      } else if (char === ')' || char === ']' || char === '}') {
        depth--;
      }

      // Split on comma at depth 0
      if (char === ',' && depth === 0) {
        args.push(current.trim());
        current = '';
        continue;
      }
    }

    current += char;
  }

  if (current.trim()) {
    args.push(current.trim());
  }

  return args;
}
```

**Step 5: Run tests to verify they pass**

Run: `npm test --workspace=@bupkis/codemod`
Expected: PASS

**Step 6: Commit transformer**

```bash
git add packages/codemod/src/transform.ts packages/codemod/src/transformers/
git commit -m "feat(codemod): add ts-morph expect transformer"
```

---

### Task 5: Add import transformation

**Files:**

- Create: `packages/codemod/src/transformers/import-transformer.ts`
- Modify: `packages/codemod/src/transform.ts`
- Test: `packages/codemod/test/import-transform.test.ts`

**Step 1: Write failing test for import transformation**

```typescript
// packages/codemod/test/import-transform.test.ts
import { describe, it } from 'node:test';
import { expect } from 'bupkis';
import { transformCode } from '../src/transform.js';

describe('import transformation', () => {
  it('should add bupkis import when expect is used as global', async () => {
    const input = `expect(42).toBe(42);`;
    const result = await transformCode(input);
    expect(result.code, 'to contain', "import { expect } from 'bupkis'");
  });

  it('should replace @jest/globals import', async () => {
    const input = `
import { expect } from '@jest/globals';
expect(42).toBe(42);
`.trim();
    const result = await transformCode(input);
    expect(result.code, 'to contain', "import { expect } from 'bupkis'");
    expect(result.code, 'not to contain', '@jest/globals');
  });

  it('should handle vitest import', async () => {
    const input = `
import { expect } from 'vitest';
expect(42).toBe(42);
`.trim();
    const result = await transformCode(input);
    expect(result.code, 'to contain', "import { expect } from 'bupkis'");
    expect(result.code, 'not to contain', "'vitest'");
  });

  it('should preserve other imports from @jest/globals', async () => {
    const input = `
import { describe, it, expect } from '@jest/globals';
expect(42).toBe(42);
`.trim();
    const result = await transformCode(input);
    expect(
      result.code,
      'to contain',
      "import { describe, it } from '@jest/globals'",
    );
    expect(result.code, 'to contain', "import { expect } from 'bupkis'");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test --workspace=@bupkis/codemod`
Expected: FAIL - imports not transformed

**Step 3: Create import-transformer.ts**

```typescript
// packages/codemod/src/transformers/import-transformer.ts
import { type ImportDeclaration, type SourceFile, SyntaxKind } from 'ts-morph';

const JEST_IMPORT_SOURCES = ['@jest/globals', 'vitest', 'jest'];

/**
 * Transform Jest/Vitest imports to bupkis.
 */
export function transformImports(sourceFile: SourceFile): {
  modified: boolean;
} {
  let hasBupkisImport = false;
  let hasExpectUsage = false;
  let modified = false;

  // Check if bupkis import already exists
  const imports = sourceFile.getImportDeclarations();
  for (const imp of imports) {
    if (imp.getModuleSpecifierValue() === 'bupkis') {
      const namedImports = imp.getNamedImports();
      if (namedImports.some((n) => n.getName() === 'expect')) {
        hasBupkisImport = true;
      }
    }
  }

  // Check for expect usage in code
  const identifiers = sourceFile.getDescendantsOfKind(SyntaxKind.Identifier);
  hasExpectUsage = identifiers.some(
    (id) => id.getText() === 'expect' && isExpectCall(id),
  );

  // Transform Jest/Vitest imports
  for (const imp of imports) {
    const moduleSpecifier = imp.getModuleSpecifierValue();

    if (JEST_IMPORT_SOURCES.includes(moduleSpecifier)) {
      const namedImports = imp.getNamedImports();
      const expectImport = namedImports.find((n) => n.getName() === 'expect');

      if (expectImport) {
        // Remove expect from this import
        expectImport.remove();
        modified = true;

        // If no other named imports remain, remove the entire import
        if (imp.getNamedImports().length === 0) {
          imp.remove();
        }
      }
    }
  }

  // Add bupkis import if needed
  if (hasExpectUsage && !hasBupkisImport) {
    sourceFile.addImportDeclaration({
      moduleSpecifier: 'bupkis',
      namedImports: ['expect'],
    });
    modified = true;
  }

  return { modified };
}

/**
 * Check if an identifier is an expect() call.
 */
function isExpectCall(
  identifier: ReturnType<SourceFile['getDescendantsOfKind']>[0],
): boolean {
  const parent = identifier.getParent();
  return parent?.getKind() === SyntaxKind.CallExpression;
}
```

**Step 4: Update transform.ts to use import transformer**

Add to transformCode function after transformExpectCalls:

```typescript
import { transformImports } from './transformers/import-transformer.js';

// In transformCode, after transformExpectCalls:
const importResult = transformImports(sourceFile);
```

**Step 5: Run tests to verify they pass**

Run: `npm test --workspace=@bupkis/codemod`
Expected: PASS

**Step 6: Commit import transformer**

```bash
git add packages/codemod/src/transformers/import-transformer.ts packages/codemod/src/transform.ts packages/codemod/test/
git commit -m "feat(codemod): add import transformation for Jest/Vitest"
```

---

## Phase 4: CLI

### Task 6: Build the CLI

**Files:**

- Modify: `packages/codemod/src/cli.ts`
- Test: `packages/codemod/test/cli.test.ts`

**Step 1: Write failing test for CLI**

```typescript
// packages/codemod/test/cli.test.ts
import { describe, it } from 'node:test';
import { expect } from 'bupkis';
import { execSync } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

describe('CLI', () => {
  const testDir = join(tmpdir(), 'bupkis-codemod-test');

  it('should show help with --help', () => {
    const result = execSync('npx tsx src/cli.ts --help', {
      cwd: join(process.cwd(), 'packages/codemod'),
      encoding: 'utf-8',
    });
    expect(result, 'to contain', 'Usage:');
    expect(result, 'to contain', 'bupkis-codemod');
  });

  it('should show version with --version', () => {
    const result = execSync('npx tsx src/cli.ts --version', {
      cwd: join(process.cwd(), 'packages/codemod'),
      encoding: 'utf-8',
    });
    expect(result.trim(), 'to match', /^\d+\.\d+\.\d+/);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test --workspace=@bupkis/codemod`
Expected: FAIL - CLI not implemented

**Step 3: Implement CLI**

```typescript
#!/usr/bin/env node
// packages/codemod/src/cli.ts
import { Command } from 'commander';
import pc from 'picocolors';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { transform } from './transform.js';
import type { TransformMode, TransformResult } from './types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(
  readFileSync(join(__dirname, '..', 'package.json'), 'utf-8'),
);

const program = new Command();

program
  .name('bupkis-codemod')
  .description('Migrate Jest assertions to bupkis')
  .version(pkg.version)
  .argument('[patterns...]', 'Glob patterns for files to transform', [
    '**/*.test.ts',
    '**/*.test.tsx',
    '**/*.spec.ts',
    '**/*.spec.tsx',
  ])
  .option('--strict', 'Fail on any unsupported transformation')
  .option('--interactive', 'Prompt for ambiguous cases')
  .option(
    '--best-effort',
    'Transform what we can, add TODOs for the rest (default)',
  )
  .option('--dry-run', 'Show what would be changed without writing')
  .option('-e, --exclude <patterns...>', 'Patterns to exclude', [
    '**/node_modules/**',
  ])
  .action(async (patterns: string[], options) => {
    const mode: TransformMode = options.strict
      ? 'strict'
      : options.interactive
        ? 'interactive'
        : 'best-effort';

    console.log(
      pc.cyan('bupkis-codemod') + ' - Migrating Jest assertions to bupkis\n',
    );

    if (options.dryRun) {
      console.log(pc.yellow('Dry run mode - no files will be modified\n'));
    }

    console.log(`Mode: ${pc.bold(mode)}`);
    console.log(`Patterns: ${patterns.join(', ')}`);
    console.log(`Exclude: ${options.exclude.join(', ')}\n`);

    try {
      const result = await transform({
        include: patterns,
        exclude: options.exclude,
        write: !options.dryRun,
        mode,
      });

      printResult(result);

      if (result.totalErrors > 0 && mode === 'strict') {
        process.exit(1);
      }
    } catch (error) {
      console.error(
        pc.red('Error:'),
        error instanceof Error ? error.message : error,
      );
      process.exit(1);
    }
  });

function printResult(result: TransformResult): void {
  console.log(pc.bold('\nResults:'));
  console.log(`  Files processed: ${result.totalFiles}`);
  console.log(`  Files modified: ${pc.green(String(result.modifiedFiles))}`);
  console.log(
    `  Transformations: ${pc.green(String(result.totalTransformations))}`,
  );

  if (result.totalWarnings > 0) {
    console.log(`  Warnings: ${pc.yellow(String(result.totalWarnings))}`);
  }

  if (result.totalErrors > 0) {
    console.log(`  Errors: ${pc.red(String(result.totalErrors))}`);
  }

  // Print file details with warnings/errors
  for (const file of result.files) {
    if (file.warnings.length > 0 || file.errors.length > 0) {
      console.log(`\n${pc.dim(file.filePath)}`);

      for (const warning of file.warnings) {
        console.log(
          `  ${pc.yellow('⚠')} Line ${warning.line}: ${warning.message}`,
        );
      }

      for (const error of file.errors) {
        console.log(
          `  ${pc.red('✗')} ${error.line ? `Line ${error.line}: ` : ''}${error.message}`,
        );
      }
    }
  }

  console.log();

  if (result.totalWarnings > 0) {
    console.log(
      pc.yellow(
        'Note: Search for "TODO: Manual migration needed" in your code for items requiring manual review.',
      ),
    );
  }
}

program.parse();
```

**Step 4: Run tests to verify they pass**

Run: `npm test --workspace=@bupkis/codemod`
Expected: PASS

**Step 5: Commit CLI**

```bash
git add packages/codemod/src/cli.ts packages/codemod/test/cli.test.ts
git commit -m "feat(codemod): add CLI with mode flags and dry-run support"
```

---

## Phase 5: Polish & Documentation

### Task 7: Add README and finalize exports

**Files:**

- Create: `packages/codemod/README.md`
- Modify: `packages/codemod/src/index.ts`

**Step 1: Update index.ts with all exports**

```typescript
// packages/codemod/src/index.ts
export { transform, transformCode } from './transform.js';
export type { CodeTransformResult } from './transform.js';
export type {
  FileTransformResult,
  MatcherTransform,
  MatcherTransformArgs,
  TransformError,
  TransformMode,
  TransformOptions,
  TransformResult,
  TransformWarning,
} from './types.js';
export {
  coreMatchers,
  getCoreMatchers,
  getMatcherTransform,
  isMatcherSupported,
  jestExtendedMatchers,
  testingLibraryMatchers,
} from './matchers/index.js';
```

**Step 2: Create README.md**

````markdown
# @bupkis/codemod

Migrate Jest assertions to [bupkis](https://github.com/boneskull/bupkis) with a single command.

## Installation

```bash
npx @bupkis/codemod
```
````

Or install globally:

```bash
npm install -g @bupkis/codemod
bupkis-codemod
```

## Usage

```bash
# Transform all test files in current directory
npx @bupkis/codemod

# Transform specific patterns
npx @bupkis/codemod "src/**/*.test.ts" "tests/**/*.spec.ts"

# Dry run (see what would change)
npx @bupkis/codemod --dry-run

# Strict mode (fail on any unsupported matcher)
npx @bupkis/codemod --strict

# Exclude patterns
npx @bupkis/codemod -e "**/fixtures/**" -e "**/snapshots/**"
```

## Modes

- **`--best-effort`** (default): Transform what we can, add `// TODO: Manual migration needed` comments for complex cases
- **`--strict`**: Fail immediately on any unsupported transformation
- **`--interactive`**: Prompt for ambiguous cases (coming soon)

## Supported Matchers

### Jest Core

| Jest                           | bupkis                                 |
| ------------------------------ | -------------------------------------- |
| `expect(x).toBe(y)`            | `expect(x, 'to be', y)`                |
| `expect(x).toEqual(y)`         | `expect(x, 'to deep equal', y)`        |
| `expect(x).toBeTruthy()`       | `expect(x, 'to be truthy')`            |
| `expect(x).toBeFalsy()`        | `expect(x, 'to be falsy')`             |
| `expect(x).toBeNull()`         | `expect(x, 'to be null')`              |
| `expect(x).toBeUndefined()`    | `expect(x, 'to be undefined')`         |
| `expect(x).toBeDefined()`      | `expect(x, 'to be defined')`           |
| `expect(x).toBeInstanceOf(Y)`  | `expect(x, 'to be an instance of', Y)` |
| `expect(x).toBeGreaterThan(y)` | `expect(x, 'to be greater than', y)`   |
| `expect(x).toBeLessThan(y)`    | `expect(x, 'to be less than', y)`      |
| `expect(x).toMatch(pattern)`   | `expect(x, 'to match', pattern)`       |
| `expect(x).toContain(y)`       | `expect(x, 'to contain', y)`           |
| `expect(x).toHaveLength(n)`    | `expect(x, 'to have length', n)`       |
| `expect(x).toHaveProperty(k)`  | `expect(x, 'to have property', k)`     |
| `expect(x).toMatchObject(y)`   | `expect(x, 'to satisfy', y)`           |
| `expect(fn).toThrow()`         | `expect(fn, 'to throw')`               |

### jest-extended

| jest-extended              | bupkis                           |
| -------------------------- | -------------------------------- |
| `expect(x).toBeTrue()`     | `expect(x, 'to be true')`        |
| `expect(x).toBeFalse()`    | `expect(x, 'to be false')`       |
| `expect(x).toBeArray()`    | `expect(x, 'to be an array')`    |
| `expect(x).toBeEmpty()`    | `expect(x, 'to be empty')`       |
| `expect(x).toStartWith(s)` | `expect(x, 'to start with', s)`  |
| `expect(x).toEndWith(s)`   | `expect(x, 'to end with', s)`    |
| `expect(x).toBeOneOf(arr)` | `expect(x, 'to be one of', arr)` |

### Negation

All matchers support negation:

```javascript
// Jest
expect(x).not.toBe(y);

// bupkis
expect(x, 'not to be', y);
```

## Programmatic API

```typescript
import { transform, transformCode } from '@bupkis/codemod';

// Transform a code string
const result = await transformCode(`expect(42).toBe(42);`);
console.log(result.code); // expect(42, 'to be', 42);

// Transform files
const results = await transform({
  include: ['src/**/*.test.ts'],
  exclude: ['**/node_modules/**'],
  mode: 'best-effort',
  write: true,
});
```

## What Requires Manual Migration

Some Jest patterns cannot be automatically transformed:

- **Mock/spy matchers**: `toHaveBeenCalled`, `toHaveBeenCalledWith`, etc. (bupkis doesn't include mocking)
- **DOM matchers**: `@testing-library/jest-dom` matchers like `toBeInTheDocument`
- **Promise matchers**: `resolves`/`rejects` need restructuring to `expectAsync`
- **Complex `toHaveProperty`**: When checking property value, not just existence

These will be marked with `// TODO: Manual migration needed` comments.

## License

MIT

````

**Step 3: Commit documentation**

```bash
git add packages/codemod/README.md packages/codemod/src/index.ts
git commit -m "docs(codemod): add README and finalize exports"
````

---

### Task 8: Integration test with real-world patterns

**Files:**

- Create: `packages/codemod/test/integration.test.ts`
- Create: `packages/codemod/test/fixtures/jest-example.ts`
- Create: `packages/codemod/test/fixtures/expected.ts`

**Step 1: Create test fixture with various Jest patterns**

```typescript
// packages/codemod/test/fixtures/jest-example.ts
import { describe, it, expect } from '@jest/globals';

describe('example test suite', () => {
  it('tests equality', () => {
    expect(42).toBe(42);
    expect({ a: 1 }).toEqual({ a: 1 });
    expect({ a: 1, b: 2 }).toStrictEqual({ a: 1, b: 2 });
  });

  it('tests truthiness', () => {
    expect(true).toBeTruthy();
    expect(false).toBeFalsy();
    expect(null).toBeNull();
    expect(undefined).toBeUndefined();
    expect('defined').toBeDefined();
  });

  it('tests negation', () => {
    expect(42).not.toBe(0);
    expect({}).not.toEqual({ a: 1 });
  });

  it('tests numbers', () => {
    expect(10).toBeGreaterThan(5);
    expect(5).toBeLessThan(10);
    expect(0.1 + 0.2).toBeCloseTo(0.3);
  });

  it('tests strings', () => {
    expect('hello world').toMatch(/hello/);
    expect('hello world').toContain('world');
  });

  it('tests arrays', () => {
    expect([1, 2, 3]).toHaveLength(3);
    expect([1, 2, 3]).toContain(2);
  });

  it('tests objects', () => {
    expect({ a: 1, b: 2 }).toHaveProperty('a');
    expect({ a: 1, b: 2 }).toMatchObject({ a: 1 });
  });

  it('tests errors', () => {
    expect(() => {
      throw new Error('oops');
    }).toThrow();
  });

  it('tests instances', () => {
    expect(new Date()).toBeInstanceOf(Date);
  });
});
```

**Step 2: Create expected output**

```typescript
// packages/codemod/test/fixtures/expected.ts
import { describe, it } from '@jest/globals';
import { expect } from 'bupkis';

describe('example test suite', () => {
  it('tests equality', () => {
    expect(42, 'to be', 42);
    expect({ a: 1 }, 'to deep equal', { a: 1 });
    expect({ a: 1, b: 2 }, 'to deep equal', { a: 1, b: 2 });
  });

  it('tests truthiness', () => {
    expect(true, 'to be truthy');
    expect(false, 'to be falsy');
    expect(null, 'to be null');
    expect(undefined, 'to be undefined');
    expect('defined', 'to be defined');
  });

  it('tests negation', () => {
    expect(42, 'not to be', 0);
    expect({}, 'not to deep equal', { a: 1 });
  });

  it('tests numbers', () => {
    expect(10, 'to be greater than', 5);
    expect(5, 'to be less than', 10);
    expect(0.1 + 0.2, 'to be close to', 0.3);
  });

  it('tests strings', () => {
    expect('hello world', 'to match', /hello/);
    expect('hello world', 'to contain', 'world');
  });

  it('tests arrays', () => {
    expect([1, 2, 3], 'to have length', 3);
    expect([1, 2, 3], 'to contain', 2);
  });

  it('tests objects', () => {
    expect({ a: 1, b: 2 }, 'to have property', 'a');
    expect({ a: 1, b: 2 }, 'to satisfy', { a: 1 });
  });

  it('tests errors', () => {
    expect(() => {
      throw new Error('oops');
    }, 'to throw');
  });

  it('tests instances', () => {
    expect(new Date(), 'to be an instance of', Date);
  });
});
```

**Step 3: Write integration test**

```typescript
// packages/codemod/test/integration.test.ts
import { describe, it } from 'node:test';
import { expect } from 'bupkis';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { transformCode } from '../src/transform.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

describe('integration', () => {
  it('should transform Jest example to expected bupkis output', async () => {
    const input = readFileSync(
      join(__dirname, 'fixtures/jest-example.ts'),
      'utf-8',
    );
    const expected = readFileSync(
      join(__dirname, 'fixtures/expected.ts'),
      'utf-8',
    );

    const result = await transformCode(input);

    // Normalize whitespace for comparison
    const normalizeWs = (s: string) => s.replace(/\s+/g, ' ').trim();

    expect(normalizeWs(result.code), 'to equal', normalizeWs(expected));
    expect(result.warnings, 'to be empty');
    expect(result.errors, 'to be empty');
  });
});
```

**Step 4: Run integration test**

Run: `npm test --workspace=@bupkis/codemod`
Expected: PASS

**Step 5: Commit integration test**

```bash
git add packages/codemod/test/
git commit -m "test(codemod): add integration test with real-world patterns"
```

---

## Summary

This plan creates `@bupkis/codemod` with:

1. **Modular matcher registry** - Easy to extend with new matchers
2. **ts-morph transformer** - TypeScript-aware AST manipulation
3. **Smart import handling** - Detects Jest globals, `@jest/globals`, Vitest
4. **Configurable modes** - strict, interactive (future), best-effort
5. **CLI** - User-friendly with dry-run support
6. **TODO markers** - Clear guidance for manual migration
7. **Comprehensive testing** - Unit and integration tests

**Total estimated tasks:** 8 major tasks, ~40 bite-sized steps

---

Plan complete and saved to `.plans/2026-01-10-jest-to-bupkis-codemod.md`. Two execution options:

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

Which approach?
