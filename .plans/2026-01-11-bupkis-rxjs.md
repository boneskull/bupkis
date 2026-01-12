# @bupkis/rxjs Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create a `@bupkis/rxjs` package providing type-safe, natural-language assertions for RxJS Observables, enabling verification of completion, emission, errors, and values.

**Architecture:** Plugin package that exports async assertions consumable via `expectAsync.use()`. All assertions use `createAsyncAssertion()` since Observable operations are inherently asynchronous. Assertions subscribe to Observables, collect emissions, and validate behavior against expectations. Proper subscription cleanup is critical.

**Tech Stack:** TypeScript, Zod v4 (via bupkis), RxJS 7.x/8.x, zshy (build tooling)

---

## Prerequisites

Before starting, ensure you have:
- Node.js 20.19+, 22.12+, or 23+
- Git with worktree support
- Understanding of RxJS Observable lifecycle (subscribe, complete, error)

---

## Task 1: Scaffold Package Structure

**Files:**
- Create: `packages/rxjs/package.json`
- Create: `packages/rxjs/tsconfig.json`
- Create: `packages/rxjs/src/index.ts` (empty placeholder)
- Create: `packages/rxjs/README.md` (placeholder)
- Create: `packages/rxjs/LICENSE.md`

**Step 1: Create package directory structure**

```bash
mkdir -p packages/rxjs/src packages/rxjs/test
```

**Step 2: Create package.json**

```json
{
  "name": "@bupkis/rxjs",
  "version": "0.0.0",
  "type": "module",
  "description": "RxJS Observable assertions for Bupkis",
  "repository": {
    "directory": "packages/rxjs",
    "type": "git",
    "url": "git+https://github.com/boneskull/bupkis.git"
  },
  "author": {
    "email": "boneskull@boneskull.com",
    "name": "Christopher Hiller"
  },
  "license": "BlueOak-1.0.0",
  "engines": {
    "node": "^20.19.0 || ^22.12.0 || >=23"
  },
  "main": "./dist/index.cjs",
  "types": "./dist/index.d.cts",
  "module": "./dist/index.js",
  "exports": {
    ".": {
      "types": "./dist/index.d.cts",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    },
    "./package.json": "./package.json"
  },
  "files": [
    "CHANGELOG.md",
    "dist",
    "src"
  ],
  "keywords": [
    "bupkis",
    "rxjs",
    "observable",
    "reactive",
    "assert",
    "assertion",
    "test"
  ],
  "scripts": {
    "build": "zshy",
    "prepublishOnly": "npm run build",
    "test": "npm run test:base -- \"test/*.test.ts\"",
    "test:base": "node --import tsx --test --test-reporter=spec",
    "test:dev": "npm run test:base -- --watch \"test/*.test.ts\"",
    "test:node20": "npm run test:base -- test/*.test.ts",
    "test:types": "tsd"
  },
  "peerDependencies": {
    "bupkis": ">=0.15.0",
    "rxjs": ">=7.0.0"
  },
  "devDependencies": {
    "rxjs": "7.8.2"
  },
  "publishConfig": {
    "access": "public"
  },
  "zshy": {
    "exports": {
      ".": "./src/index.ts",
      "./package.json": "./package.json"
    }
  }
}
```

**Step 3: Create tsconfig.json**

```json
{
  "exclude": ["dist", "node_modules", "**/test/**/*.snap.cjs"],
  "extends": "../../.config/tsconfig.base.json",
  "include": ["src/**/*.ts", "test/**/*.ts"]
}
```

**Step 4: Copy LICENSE.md from sinon package**

**Step 5: Run npm install**

**Step 6: Commit scaffold**

```bash
git add packages/rxjs
git commit -m "chore(rxjs): scaffold @bupkis/rxjs package structure"
```

---

## Task 2: Create Observable Type Guards and Schemas

**Files:**
- Create: `packages/rxjs/src/guards.ts`
- Create: `packages/rxjs/src/schema.ts`
- Test: `packages/rxjs/test/guards.test.ts`

**Implementation:**

```typescript
// guards.ts
export const isObservable = (value: unknown): value is Observable<unknown> => {
  if (value === null || typeof value !== 'object') {
    return false;
  }
  const obj = value as Record<string, unknown>;
  return typeof obj.subscribe === 'function';
};

// schema.ts
export const ObservableSchema = z.custom<Observable<unknown>>(
  isObservable,
  'Expected an RxJS Observable',
);
```

---

## Task 3: Implement Utility Functions for Observable Subscription

**Files:**
- Create: `packages/rxjs/src/util.ts`
- Test: `packages/rxjs/test/util.test.ts`

**Implementation:**

```typescript
export interface CollectResult<T> {
  completed: boolean;
  error: unknown;
  values: T[];
}

export const collectObservable = <T>(
  observable: Observable<T>,
): Promise<CollectResult<T>> =>
  new Promise((resolve) => {
    const values: T[] = [];
    let completed = false;
    let error: unknown;

    observable.subscribe({
      complete: () => {
        completed = true;
        resolve({ completed, error, values });
      },
      error: (err: unknown) => {
        error = err;
        resolve({ completed, error, values });
      },
      next: (value) => {
        values.push(value);
      },
    });
  });
```

---

## Task 4: Implement 'to complete' Assertion

**Files:**
- Create: `packages/rxjs/src/assertions.ts`
- Test: `packages/rxjs/test/assertions.test.ts`

```typescript
await expectAsync(of(1, 2, 3), 'to complete'); // passes
await expectAsync(throwError(() => new Error()), 'to complete'); // fails
```

---

## Task 5: Implement 'to emit error' Assertions

```typescript
await expectAsync(throwError(() => new Error('oops')), 'to emit error');
await expectAsync(throwError(() => new Error('oops')), 'to emit error', 'oops');
await expectAsync(
  throwError(() => new TypeError('type error')),
  'to emit error satisfying',
  { name: 'TypeError' },
);
```

---

## Task 6: Implement 'to emit values' Assertions

```typescript
await expectAsync(of('foo', 'bar'), 'to emit values', ['foo', 'bar']);
```

---

## Task 7: Implement Emission Count Assertions

```typescript
await expectAsync(of(1, 2, 3), 'to emit times', 3);
await expectAsync(of(42), 'to emit once');
await expectAsync(of(1, 2), 'to emit twice');
await expectAsync(of(1, 2, 3), 'to emit thrice');
await expectAsync(EMPTY, 'to be empty');
await expectAsync(EMPTY, 'to complete without emitting');
```

---

## Task 8: Implement 'to complete with value' Assertions

```typescript
await expectAsync(of(1, 2, 'final'), 'to complete with value', 'final');
await expectAsync(of('foo', 'bar', 'baz'), 'to complete with values', ['foo', 'bar', 'baz']);
await expectAsync(
  of({ status: 'pending' }, { status: 'done', result: 42 }),
  'to complete with value satisfying',
  { status: 'done' },
);
```

---

## Task 9: Create Main Export and Update Index

**Files:**
- Modify: `packages/rxjs/src/index.ts`

Export all assertions, guards, schemas, and utility types.

---

## Task 10: Update Monorepo Configuration

Add to `release-please-config.json` and `cspell.json`.

---

## Task 11: Write Documentation

Comprehensive README with:
- Installation
- Usage examples
- Available assertions table
- Important notes about async nature
- Timeout considerations
- Hot vs Cold Observable guidance

---

## Task 12: Final Verification and Cleanup

Run full test suite, lint, and build.

---

## Summary

This plan creates `@bupkis/rxjs` with:

**Assertions (14 total):**
- Completion: `to complete`, `to be empty`, `to complete without emitting`
- Count: `to emit times`, `to emit once`, `to emit twice`, `to emit thrice`
- Values: `to emit values`
- Completion with value: `to complete with value`, `to complete with values`, `to complete with value satisfying`
- Errors: `to emit error`, `to emit error` (with message), `to emit error satisfying`

**Supporting code:**
- Type guard: `isObservable()`
- Zod schema: `ObservableSchema`
- Utility: `collectObservable()`
- Package structure following monorepo conventions

**Key design decisions:**
- All assertions use `createAsyncAssertion()` (Observables are async)
- Proper subscription lifecycle management via `collectObservable()`
- No built-in timeouts (test framework responsibility)
- Compatible with RxJS 7.x and 8.x

---

### Critical Files for Implementation

- `packages/sinon/src/assertions.ts` - Pattern to follow for assertion structure
- `packages/sinon/package.json` - Package.json template
- `packages/bupkis/src/assertion/impl/async-parametric.ts` - Async assertion patterns with createAsyncAssertion
- `packages/sinon/test/assertions.test.ts` - Test structure pattern
- `packages/bupkis/src/schema.ts` - Schema patterns for custom types
