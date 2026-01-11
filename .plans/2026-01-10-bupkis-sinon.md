# @bupkis/sinon Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create a `@bupkis/sinon` package providing type-safe, natural-language assertions for Sinon spies, stubs, and spy calls.

**Architecture:** Plugin package that exports assertions consumable via `expect.use()`. Assertions use function-based implementations to inspect Sinon spy properties. Types are inferred from Sinon's TypeScript definitions.

**Tech Stack:** TypeScript, Zod v4 (via bupkis), Sinon types (`@types/sinon`), zshy (build tooling from monorepo)

---

## Prerequisites

Before starting, ensure you have:
- Node.js 20.19+, 22.12+, or 23+
- Git with worktree support
- Understanding of Sinon spy/stub API

---

## Task 1: Create Worktree and Branch

**Files:**
- Create: `.worktrees/bupkis-sinon/` (worktree directory)

**Step 1: Create worktree from monorepo branch**

```bash
git worktree add .worktrees/bupkis-sinon monorepo -b feat/bupkis-sinon
```

**Step 2: Verify worktree was created**

Run: `git worktree list`
Expected: Shows `.worktrees/bupkis-sinon` pointing to `feat/bupkis-sinon` branch

**Step 3: Navigate to worktree**

```bash
cd .worktrees/bupkis-sinon
```

**Step 4: Install dependencies**

Run: `npm install`
Expected: Installs all workspace dependencies

---

## Task 2: Scaffold Package Structure

**Files:**
- Create: `packages/sinon/package.json`
- Create: `packages/sinon/tsconfig.json`
- Create: `packages/sinon/src/index.ts`
- Create: `packages/sinon/src/assertions.ts`
- Create: `packages/sinon/src/schema.ts`
- Create: `packages/sinon/src/guards.ts`
- Create: `packages/sinon/test/assertions.test.ts`

**Step 1: Create package directory**

```bash
mkdir -p packages/sinon/src packages/sinon/test
```

**Step 2: Create package.json**

Create `packages/sinon/package.json`:

```json
{
  "name": "@bupkis/sinon",
  "version": "0.1.0",
  "type": "module",
  "description": "Sinon spy/stub/mock assertions for Bupkis",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/boneskull/bupkis.git",
    "directory": "packages/sinon"
  },
  "author": {
    "name": "Christopher Hiller",
    "email": "boneskull@boneskull.com"
  },
  "license": "BlueOak-1.0.0",
  "engines": {
    "node": "^20.19.0 || ^22.12.0 || >=23"
  },
  "main": "./dist/index.cjs",
  "types": "./dist/index.d.cts",
  "module": "./dist/index.js",
  "exports": {
    "./package.json": "./package.json",
    ".": {
      "types": "./dist/index.d.cts",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    }
  },
  "files": [
    "CHANGELOG.md",
    "dist",
    "src"
  ],
  "keywords": [
    "bupkis",
    "sinon",
    "spy",
    "stub",
    "mock",
    "assert",
    "assertion",
    "test"
  ],
  "peerDependencies": {
    "bupkis": ">=0.14.0",
    "sinon": ">=17.0.0"
  },
  "devDependencies": {
    "@types/sinon": "^17.0.0",
    "sinon": "^19.0.0"
  },
  "scripts": {
    "build": "zshy",
    "prepare": "npm run build",
    "test": "tsx --test --test-reporter spec test/**/*.test.ts",
    "test:dev": "tsx --test --watch --test-reporter spec test/**/*.test.ts",
    "test:types": "tsd"
  },
  "zshy": {
    "exports": {
      "./package.json": "./package.json",
      ".": "./src/index.ts"
    }
  }
}
```

**Step 3: Create tsconfig.json**

Create `packages/sinon/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "composite": true,
    "rootDir": ".",
    "outDir": "dist"
  },
  "include": ["src/**/*.ts", "test/**/*.ts"],
  "references": [
    { "path": "../bupkis" }
  ]
}
```

**Step 4: Run npm install to link workspace**

Run: `npm install`
Expected: `packages/sinon` recognized as workspace, dependencies installed

**Step 5: Commit scaffold**

```bash
git add packages/sinon
git commit -m "chore(sinon): scaffold @bupkis/sinon package structure"
```

---

## Task 3: Create Sinon Type Guards and Schemas

**Files:**
- Create: `packages/sinon/src/guards.ts`
- Create: `packages/sinon/src/schema.ts`

**Step 1: Write the test for type guards**

Create `packages/sinon/test/guards.test.ts`:

```typescript
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import sinon from 'sinon';
import { isSpy, isSpyCall } from '../src/guards.js';

describe('guards', () => {
  describe('isSpy()', () => {
    it('should return true for a sinon spy', () => {
      const spy = sinon.spy();
      assert.equal(isSpy(spy), true);
    });

    it('should return true for a sinon stub', () => {
      const stub = sinon.stub();
      assert.equal(isSpy(stub), true);
    });

    it('should return false for a regular function', () => {
      const fn = () => {};
      assert.equal(isSpy(fn), false);
    });

    it('should return false for non-functions', () => {
      assert.equal(isSpy(null), false);
      assert.equal(isSpy(undefined), false);
      assert.equal(isSpy(42), false);
      assert.equal(isSpy('string'), false);
      assert.equal(isSpy({}), false);
    });
  });

  describe('isSpyCall()', () => {
    it('should return true for a spy call', () => {
      const spy = sinon.spy();
      spy(1, 2, 3);
      const call = spy.getCall(0);
      assert.equal(isSpyCall(call), true);
    });

    it('should return false for a spy (not a call)', () => {
      const spy = sinon.spy();
      assert.equal(isSpyCall(spy), false);
    });

    it('should return false for non-objects', () => {
      assert.equal(isSpyCall(null), false);
      assert.equal(isSpyCall(undefined), false);
      assert.equal(isSpyCall(42), false);
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -w @bupkis/sinon`
Expected: FAIL - `guards.js` module not found

**Step 3: Implement type guards**

Create `packages/sinon/src/guards.ts`:

```typescript
/**
 * Type guards for Sinon spy and stub detection.
 *
 * @packageDocumentation
 */

import type { SinonSpy, SinonSpyCall } from 'sinon';

/**
 * Checks if a value is a Sinon spy or stub.
 *
 * Sinon spies have a unique `isSinonProxy` property set to `true`.
 */
export function isSpy(value: unknown): value is SinonSpy {
  return (
    typeof value === 'function' &&
    'isSinonProxy' in value &&
    value.isSinonProxy === true
  );
}

/**
 * Checks if a value is a Sinon spy call object.
 *
 * Spy calls are returned by `spy.getCall(n)` and have specific properties
 * like `args`, `thisValue`, `returnValue`, and `calledWith`.
 */
export function isSpyCall(value: unknown): value is SinonSpyCall {
  if (value === null || typeof value !== 'object') {
    return false;
  }
  const obj = value as Record<string, unknown>;
  return (
    'args' in obj &&
    Array.isArray(obj.args) &&
    'thisValue' in obj &&
    'returnValue' in obj &&
    typeof obj.calledWith === 'function'
  );
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -w @bupkis/sinon`
Expected: PASS - all guard tests pass

**Step 5: Write the test for schemas**

Add to `packages/sinon/test/guards.test.ts`:

```typescript
import { SpySchema, SpyCallSchema } from '../src/schema.js';

describe('schemas', () => {
  describe('SpySchema', () => {
    it('should accept a sinon spy', () => {
      const spy = sinon.spy();
      const result = SpySchema.safeParse(spy);
      assert.equal(result.success, true);
    });

    it('should reject a regular function', () => {
      const fn = () => {};
      const result = SpySchema.safeParse(fn);
      assert.equal(result.success, false);
    });
  });

  describe('SpyCallSchema', () => {
    it('should accept a spy call', () => {
      const spy = sinon.spy();
      spy(42);
      const call = spy.getCall(0);
      const result = SpyCallSchema.safeParse(call);
      assert.equal(result.success, true);
    });

    it('should reject a spy', () => {
      const spy = sinon.spy();
      const result = SpyCallSchema.safeParse(spy);
      assert.equal(result.success, false);
    });
  });
});
```

**Step 6: Run test to verify it fails**

Run: `npm test -w @bupkis/sinon`
Expected: FAIL - `schema.js` module not found

**Step 7: Implement Zod schemas**

Create `packages/sinon/src/schema.ts`:

```typescript
/**
 * Zod schemas for Sinon types.
 *
 * @packageDocumentation
 */

import type { SinonSpy, SinonSpyCall } from 'sinon';
import { z } from 'zod/v4';
import { BupkisRegistry } from 'bupkis/schema';
import { isSpy, isSpyCall } from './guards.js';

/**
 * Schema that validates Sinon spies and stubs.
 */
export const SpySchema: z.ZodType<SinonSpy> = z.custom<SinonSpy>(
  isSpy,
  'Expected a Sinon spy or stub',
);
BupkisRegistry.set(SpySchema, { name: 'spy' });

/**
 * Schema that validates Sinon spy call objects.
 */
export const SpyCallSchema: z.ZodType<SinonSpyCall> = z.custom<SinonSpyCall>(
  isSpyCall,
  'Expected a Sinon spy call',
);
BupkisRegistry.set(SpyCallSchema, { name: 'spyCall' });
```

**Step 8: Run test to verify it passes**

Run: `npm test -w @bupkis/sinon`
Expected: PASS - all schema tests pass

**Step 9: Commit guards and schemas**

```bash
git add packages/sinon/src/guards.ts packages/sinon/src/schema.ts packages/sinon/test/guards.test.ts
git commit -m "feat(sinon): add type guards and Zod schemas for spy/spyCall"
```

---

## Task 4: Implement Basic Spy Assertions (was called, was not called)

**Files:**
- Modify: `packages/sinon/src/assertions.ts`
- Modify: `packages/sinon/test/assertions.test.ts`

**Step 1: Write the failing test for 'was called'**

Create `packages/sinon/test/assertions.test.ts`:

```typescript
import { describe, it } from 'node:test';
import sinon from 'sinon';
import { expect, expectAsync } from 'bupkis';
import { sinonAssertions } from '../src/assertions.js';

const { expect: e } = expect.use(sinonAssertions);

describe('spy assertions', () => {
  describe('was called', () => {
    it('should pass when spy was called', () => {
      const spy = sinon.spy();
      spy();
      e(spy, 'was called');
    });

    it('should fail when spy was not called', () => {
      const spy = sinon.spy();
      expect(() => e(spy, 'was called'), 'to throw');
    });
  });

  describe('was not called', () => {
    it('should pass when spy was not called', () => {
      const spy = sinon.spy();
      e(spy, 'was not called');
    });

    it('should fail when spy was called', () => {
      const spy = sinon.spy();
      spy();
      expect(() => e(spy, 'was not called'), 'to throw');
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -w @bupkis/sinon`
Expected: FAIL - `assertions.js` module not found

**Step 3: Implement 'was called' assertions**

Create `packages/sinon/src/assertions.ts`:

```typescript
/**
 * Sinon spy assertions for Bupkis.
 *
 * @packageDocumentation
 */

import { createAssertion } from 'bupkis/assertions';
import type { SinonSpy } from 'sinon';
import { SpySchema } from './schema.js';

/**
 * Asserts that a spy was called at least once.
 *
 * @example
 * ```ts
 * const spy = sinon.spy();
 * spy();
 * expect(spy, 'was called'); // passes
 * ```
 */
export const wasCalledAssertion = createAssertion(
  [SpySchema, 'was called'],
  (spy: SinonSpy) => {
    if (spy.called) {
      return true;
    }
    return {
      message: `Expected spy to have been called, but it was never called`,
      actual: spy.callCount,
      expected: 'at least 1 call',
    };
  },
);

/**
 * Asserts that a spy was never called.
 *
 * @example
 * ```ts
 * const spy = sinon.spy();
 * expect(spy, 'was not called'); // passes
 * ```
 */
export const wasNotCalledAssertion = createAssertion(
  [SpySchema, 'was not called'],
  (spy: SinonSpy) => {
    if (spy.notCalled) {
      return true;
    }
    return {
      message: `Expected spy to not have been called, but it was called ${spy.callCount} time(s)`,
      actual: spy.callCount,
      expected: 0,
    };
  },
);

/**
 * All Sinon assertions for use with `expect.use()`.
 */
export const sinonAssertions = [
  wasCalledAssertion,
  wasNotCalledAssertion,
] as const;
```

**Step 4: Run test to verify it passes**

Run: `npm test -w @bupkis/sinon`
Expected: PASS - 'was called' and 'was not called' tests pass

**Step 5: Commit basic spy assertions**

```bash
git add packages/sinon/src/assertions.ts packages/sinon/test/assertions.test.ts
git commit -m "feat(sinon): add 'was called' and 'was not called' assertions"
```

---

## Task 5: Implement Call Count Assertions (was called times, once, twice, thrice)

**Files:**
- Modify: `packages/sinon/src/assertions.ts`
- Modify: `packages/sinon/test/assertions.test.ts`

**Step 1: Write the failing tests**

Add to `packages/sinon/test/assertions.test.ts`:

```typescript
describe('was called times', () => {
  it('should pass when spy was called exact number of times', () => {
    const spy = sinon.spy();
    spy();
    spy();
    spy();
    e(spy, 'was called times', 3);
  });

  it('should fail when call count does not match', () => {
    const spy = sinon.spy();
    spy();
    expect(() => e(spy, 'was called times', 3), 'to throw');
  });
});

describe('was called once', () => {
  it('should pass when spy was called exactly once', () => {
    const spy = sinon.spy();
    spy();
    e(spy, 'was called once');
  });

  it('should fail when spy was called multiple times', () => {
    const spy = sinon.spy();
    spy();
    spy();
    expect(() => e(spy, 'was called once'), 'to throw');
  });
});

describe('was called twice', () => {
  it('should pass when spy was called exactly twice', () => {
    const spy = sinon.spy();
    spy();
    spy();
    e(spy, 'was called twice');
  });
});

describe('was called thrice', () => {
  it('should pass when spy was called exactly three times', () => {
    const spy = sinon.spy();
    spy();
    spy();
    spy();
    e(spy, 'was called thrice');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -w @bupkis/sinon`
Expected: FAIL - assertions not found

**Step 3: Implement call count assertions**

Add to `packages/sinon/src/assertions.ts`:

```typescript
import { z } from 'zod/v4';
import { NonNegativeIntegerSchema } from 'bupkis/schema';

/**
 * Asserts that a spy was called a specific number of times.
 *
 * @example
 * ```ts
 * const spy = sinon.spy();
 * spy(); spy(); spy();
 * expect(spy, 'was called times', 3); // passes
 * ```
 */
export const wasCalledTimesAssertion = createAssertion(
  [SpySchema, 'was called times', NonNegativeIntegerSchema],
  (spy: SinonSpy, expected: number) => {
    if (spy.callCount === expected) {
      return true;
    }
    return {
      message: `Expected spy to have been called ${expected} time(s)`,
      actual: spy.callCount,
      expected,
    };
  },
);

/**
 * Asserts that a spy was called exactly once.
 *
 * @example
 * ```ts
 * const spy = sinon.spy();
 * spy();
 * expect(spy, 'was called once'); // passes
 * ```
 */
export const wasCalledOnceAssertion = createAssertion(
  [SpySchema, 'was called once'],
  (spy: SinonSpy) => {
    if (spy.calledOnce) {
      return true;
    }
    return {
      message: `Expected spy to have been called exactly once`,
      actual: spy.callCount,
      expected: 1,
    };
  },
);

/**
 * Asserts that a spy was called exactly twice.
 */
export const wasCalledTwiceAssertion = createAssertion(
  [SpySchema, 'was called twice'],
  (spy: SinonSpy) => {
    if (spy.calledTwice) {
      return true;
    }
    return {
      message: `Expected spy to have been called exactly twice`,
      actual: spy.callCount,
      expected: 2,
    };
  },
);

/**
 * Asserts that a spy was called exactly three times.
 */
export const wasCalledThriceAssertion = createAssertion(
  [SpySchema, 'was called thrice'],
  (spy: SinonSpy) => {
    if (spy.calledThrice) {
      return true;
    }
    return {
      message: `Expected spy to have been called exactly three times`,
      actual: spy.callCount,
      expected: 3,
    };
  },
);
```

Update the exports array:

```typescript
export const sinonAssertions = [
  wasCalledAssertion,
  wasNotCalledAssertion,
  wasCalledTimesAssertion,
  wasCalledOnceAssertion,
  wasCalledTwiceAssertion,
  wasCalledThriceAssertion,
] as const;
```

**Step 4: Run test to verify it passes**

Run: `npm test -w @bupkis/sinon`
Expected: PASS - all call count tests pass

**Step 5: Commit call count assertions**

```bash
git add packages/sinon/src/assertions.ts packages/sinon/test/assertions.test.ts
git commit -m "feat(sinon): add call count assertions (times, once, twice, thrice)"
```

---

## Task 6: Implement 'was called with' Assertions

**Files:**
- Modify: `packages/sinon/src/assertions.ts`
- Modify: `packages/sinon/test/assertions.test.ts`

**Step 1: Write the failing tests**

Add to `packages/sinon/test/assertions.test.ts`:

```typescript
describe('was called with', () => {
  it('should pass when spy was called with matching args', () => {
    const spy = sinon.spy();
    spy('foo', 42);
    e(spy, 'was called with', 'foo', 42);
  });

  it('should pass with partial args (prefix match)', () => {
    const spy = sinon.spy();
    spy('foo', 42, 'extra');
    e(spy, 'was called with', 'foo', 42);
  });

  it('should fail when args do not match', () => {
    const spy = sinon.spy();
    spy('bar');
    expect(() => e(spy, 'was called with', 'foo'), 'to throw');
  });

  it('should pass if any call matches', () => {
    const spy = sinon.spy();
    spy('first');
    spy('second');
    spy('target', 123);
    e(spy, 'was called with', 'target', 123);
  });
});

describe('was always called with', () => {
  it('should pass when all calls match', () => {
    const spy = sinon.spy();
    spy('foo', 1);
    spy('foo', 2);
    spy('foo', 3);
    e(spy, 'was always called with', 'foo');
  });

  it('should fail when any call does not match', () => {
    const spy = sinon.spy();
    spy('foo');
    spy('bar');
    expect(() => e(spy, 'was always called with', 'foo'), 'to throw');
  });
});

describe('was called with exactly', () => {
  it('should pass when args match exactly', () => {
    const spy = sinon.spy();
    spy('foo', 42);
    e(spy, 'was called with exactly', 'foo', 42);
  });

  it('should fail when extra args present', () => {
    const spy = sinon.spy();
    spy('foo', 42, 'extra');
    expect(() => e(spy, 'was called with exactly', 'foo', 42), 'to throw');
  });
});

describe('was never called with', () => {
  it('should pass when no call has matching args', () => {
    const spy = sinon.spy();
    spy('foo');
    spy('bar');
    e(spy, 'was never called with', 'baz');
  });

  it('should fail when any call has matching args', () => {
    const spy = sinon.spy();
    spy('foo');
    expect(() => e(spy, 'was never called with', 'foo'), 'to throw');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -w @bupkis/sinon`
Expected: FAIL - assertions not found

**Step 3: Implement 'was called with' assertions**

Add to `packages/sinon/src/assertions.ts`:

```typescript
import { UnknownSchema } from 'bupkis/schema';

/**
 * Asserts that a spy was called with specific arguments (prefix match).
 *
 * @example
 * ```ts
 * const spy = sinon.spy();
 * spy('foo', 42);
 * expect(spy, 'was called with', 'foo', 42); // passes
 * expect(spy, 'was called with', 'foo'); // also passes (prefix match)
 * ```
 */
export const wasCalledWithAssertion = createAssertion(
  [SpySchema, 'was called with', z.array(UnknownSchema)],
  (spy: SinonSpy, args: unknown[]) => {
    if (spy.calledWith(...args)) {
      return true;
    }
    return {
      message: `Expected spy to have been called with specified arguments`,
      actual: spy.args,
      expected: args,
    };
  },
);

/**
 * Asserts that all calls to a spy included specific arguments.
 */
export const wasAlwaysCalledWithAssertion = createAssertion(
  [SpySchema, 'was always called with', z.array(UnknownSchema)],
  (spy: SinonSpy, args: unknown[]) => {
    if (spy.alwaysCalledWith(...args)) {
      return true;
    }
    return {
      message: `Expected spy to always have been called with specified arguments`,
      actual: spy.args,
      expected: args,
    };
  },
);

/**
 * Asserts that a spy was called with exactly the specified arguments (no extra).
 */
export const wasCalledWithExactlyAssertion = createAssertion(
  [SpySchema, 'was called with exactly', z.array(UnknownSchema)],
  (spy: SinonSpy, args: unknown[]) => {
    if (spy.calledWithExactly(...args)) {
      return true;
    }
    return {
      message: `Expected spy to have been called with exactly the specified arguments`,
      actual: spy.args,
      expected: args,
    };
  },
);

/**
 * Asserts that a spy was never called with specific arguments.
 */
export const wasNeverCalledWithAssertion = createAssertion(
  [SpySchema, 'was never called with', z.array(UnknownSchema)],
  (spy: SinonSpy, args: unknown[]) => {
    if (spy.neverCalledWith(...args)) {
      return true;
    }
    return {
      message: `Expected spy to never have been called with specified arguments`,
      actual: spy.args,
      expected: `not ${JSON.stringify(args)}`,
    };
  },
);
```

Update exports array to include new assertions.

**Step 4: Run test to verify it passes**

Run: `npm test -w @bupkis/sinon`
Expected: PASS - all 'was called with' tests pass

**Step 5: Commit 'was called with' assertions**

```bash
git add packages/sinon/src/assertions.ts packages/sinon/test/assertions.test.ts
git commit -m "feat(sinon): add 'was called with' assertions"
```

---

## Task 7: Implement 'was called on' (this context) Assertions

**Files:**
- Modify: `packages/sinon/src/assertions.ts`
- Modify: `packages/sinon/test/assertions.test.ts`

**Step 1: Write the failing tests**

Add to `packages/sinon/test/assertions.test.ts`:

```typescript
describe('was called on', () => {
  it('should pass when spy was called with correct this context', () => {
    const obj = { method: sinon.spy() };
    obj.method();
    e(obj.method, 'was called on', obj);
  });

  it('should fail when this context does not match', () => {
    const obj1 = { method: sinon.spy() };
    const obj2 = {};
    obj1.method.call(obj2);
    expect(() => e(obj1.method, 'was called on', obj1), 'to throw');
  });
});

describe('was always called on', () => {
  it('should pass when all calls used correct this context', () => {
    const obj = { method: sinon.spy() };
    obj.method();
    obj.method();
    e(obj.method, 'was always called on', obj);
  });

  it('should fail when any call used different this context', () => {
    const obj = { method: sinon.spy() };
    const other = {};
    obj.method();
    obj.method.call(other);
    expect(() => e(obj.method, 'was always called on', obj), 'to throw');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -w @bupkis/sinon`
Expected: FAIL - assertions not found

**Step 3: Implement 'was called on' assertions**

Add to `packages/sinon/src/assertions.ts`:

```typescript
/**
 * Asserts that a spy was called with a specific `this` context.
 */
export const wasCalledOnAssertion = createAssertion(
  [SpySchema, 'was called on', UnknownSchema],
  (spy: SinonSpy, context: unknown) => {
    if (spy.calledOn(context)) {
      return true;
    }
    return {
      message: `Expected spy to have been called with specified this context`,
      actual: spy.thisValues,
      expected: context,
    };
  },
);

/**
 * Asserts that all calls to a spy used a specific `this` context.
 */
export const wasAlwaysCalledOnAssertion = createAssertion(
  [SpySchema, 'was always called on', UnknownSchema],
  (spy: SinonSpy, context: unknown) => {
    if (spy.alwaysCalledOn(context)) {
      return true;
    }
    return {
      message: `Expected spy to always have been called with specified this context`,
      actual: spy.thisValues,
      expected: context,
    };
  },
);
```

Update exports array.

**Step 4: Run test to verify it passes**

Run: `npm test -w @bupkis/sinon`
Expected: PASS

**Step 5: Commit**

```bash
git add packages/sinon/src/assertions.ts packages/sinon/test/assertions.test.ts
git commit -m "feat(sinon): add 'was called on' assertions for this context"
```

---

## Task 8: Implement 'threw' Assertions

**Files:**
- Modify: `packages/sinon/src/assertions.ts`
- Modify: `packages/sinon/test/assertions.test.ts`

**Step 1: Write the failing tests**

Add to `packages/sinon/test/assertions.test.ts`:

```typescript
describe('threw', () => {
  it('should pass when spy threw any error', () => {
    const stub = sinon.stub().throws(new Error('oops'));
    try { stub(); } catch {}
    e(stub, 'threw');
  });

  it('should pass when spy threw specific error message', () => {
    const stub = sinon.stub().throws(new Error('specific message'));
    try { stub(); } catch {}
    e(stub, 'threw', 'specific message');
  });

  it('should pass when spy threw specific error object', () => {
    const error = new TypeError('type error');
    const stub = sinon.stub().throws(error);
    try { stub(); } catch {}
    e(stub, 'threw', error);
  });

  it('should fail when spy did not throw', () => {
    const spy = sinon.spy();
    spy();
    expect(() => e(spy, 'threw'), 'to throw');
  });
});

describe('always threw', () => {
  it('should pass when spy always threw', () => {
    const stub = sinon.stub().throws(new Error('always'));
    try { stub(); } catch {}
    try { stub(); } catch {}
    e(stub, 'always threw');
  });

  it('should fail when spy did not always throw', () => {
    const stub = sinon.stub();
    stub.onFirstCall().throws(new Error('first'));
    stub.onSecondCall().returns('ok');
    try { stub(); } catch {}
    stub();
    expect(() => e(stub, 'always threw'), 'to throw');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -w @bupkis/sinon`
Expected: FAIL

**Step 3: Implement 'threw' assertions**

Add to `packages/sinon/src/assertions.ts`:

```typescript
/**
 * Asserts that a spy threw an exception.
 *
 * Can optionally check for a specific error message or error object.
 */
export const threwAssertion = createAssertion(
  [SpySchema, 'threw'],
  (spy: SinonSpy) => {
    if (spy.threw()) {
      return true;
    }
    return {
      message: `Expected spy to have thrown an exception`,
      actual: spy.exceptions,
      expected: 'an exception',
    };
  },
);

/**
 * Asserts that a spy threw a specific error.
 */
export const threwWithAssertion = createAssertion(
  [SpySchema, 'threw', UnknownSchema],
  (spy: SinonSpy, expected: unknown) => {
    if (spy.threw(expected as any)) {
      return true;
    }
    return {
      message: `Expected spy to have thrown specified exception`,
      actual: spy.exceptions,
      expected,
    };
  },
);

/**
 * Asserts that a spy always threw an exception.
 */
export const alwaysThrewAssertion = createAssertion(
  [SpySchema, 'always threw'],
  (spy: SinonSpy) => {
    if (spy.alwaysThrew()) {
      return true;
    }
    return {
      message: `Expected spy to always have thrown an exception`,
      actual: spy.exceptions,
      expected: 'an exception on every call',
    };
  },
);

/**
 * Asserts that a spy always threw a specific error.
 */
export const alwaysThrewWithAssertion = createAssertion(
  [SpySchema, 'always threw', UnknownSchema],
  (spy: SinonSpy) => {
    if (spy.alwaysThrew()) {
      return true;
    }
    return {
      message: `Expected spy to always have thrown specified exception`,
      actual: spy.exceptions,
      expected: 'specified exception on every call',
    };
  },
);
```

Update exports array.

**Step 4: Run test to verify it passes**

Run: `npm test -w @bupkis/sinon`
Expected: PASS

**Step 5: Commit**

```bash
git add packages/sinon/src/assertions.ts packages/sinon/test/assertions.test.ts
git commit -m "feat(sinon): add 'threw' and 'always threw' assertions"
```

---

## Task 9: Implement SpyCall Assertions (to satisfy, to have args)

**Files:**
- Modify: `packages/sinon/src/assertions.ts`
- Modify: `packages/sinon/test/assertions.test.ts`

**Step 1: Write the failing tests**

Add to `packages/sinon/test/assertions.test.ts`:

```typescript
describe('spyCall assertions', () => {
  describe('to have args', () => {
    it('should pass when call has matching args', () => {
      const spy = sinon.spy();
      spy('foo', 42);
      e(spy.firstCall, 'to have args', ['foo', 42]);
    });

    it('should fail when args do not match', () => {
      const spy = sinon.spy();
      spy('foo');
      expect(() => e(spy.firstCall, 'to have args', ['bar']), 'to throw');
    });
  });

  describe('to have returned', () => {
    it('should pass when call returned expected value', () => {
      const stub = sinon.stub().returns(42);
      stub();
      e(stub.firstCall, 'to have returned', 42);
    });

    it('should fail when return value does not match', () => {
      const stub = sinon.stub().returns(42);
      stub();
      expect(() => e(stub.firstCall, 'to have returned', 99), 'to throw');
    });
  });

  describe('to have thrown', () => {
    it('should pass when call threw', () => {
      const stub = sinon.stub().throws(new Error('boom'));
      try { stub(); } catch {}
      e(stub.firstCall, 'to have thrown');
    });
  });

  describe('to have this', () => {
    it('should pass when call had correct this context', () => {
      const obj = { method: sinon.spy() };
      obj.method();
      e(obj.method.firstCall, 'to have this', obj);
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -w @bupkis/sinon`
Expected: FAIL

**Step 3: Implement spyCall assertions**

Add to `packages/sinon/src/assertions.ts`:

```typescript
import type { SinonSpyCall } from 'sinon';
import { SpyCallSchema } from './schema.js';

/**
 * Asserts that a spy call had specific arguments.
 */
export const callHasArgsAssertion = createAssertion(
  [SpyCallSchema, 'to have args', z.array(UnknownSchema)],
  (call: SinonSpyCall, expected: unknown[]) => {
    const actual = call.args;
    if (
      actual.length === expected.length &&
      actual.every((arg, i) => Object.is(arg, expected[i]))
    ) {
      return true;
    }
    return {
      message: `Expected spy call to have specified arguments`,
      actual,
      expected,
    };
  },
);

/**
 * Asserts that a spy call returned a specific value.
 */
export const callReturnedAssertion = createAssertion(
  [SpyCallSchema, 'to have returned', UnknownSchema],
  (call: SinonSpyCall, expected: unknown) => {
    if (Object.is(call.returnValue, expected)) {
      return true;
    }
    return {
      message: `Expected spy call to have returned specified value`,
      actual: call.returnValue,
      expected,
    };
  },
);

/**
 * Asserts that a spy call threw an exception.
 */
export const callThrewAssertion = createAssertion(
  [SpyCallSchema, 'to have thrown'],
  (call: SinonSpyCall) => {
    if (call.exception !== undefined) {
      return true;
    }
    return {
      message: `Expected spy call to have thrown an exception`,
      actual: 'no exception',
      expected: 'an exception',
    };
  },
);

/**
 * Asserts that a spy call had a specific `this` context.
 */
export const callHasThisAssertion = createAssertion(
  [SpyCallSchema, 'to have this', UnknownSchema],
  (call: SinonSpyCall, expected: unknown) => {
    if (Object.is(call.thisValue, expected)) {
      return true;
    }
    return {
      message: `Expected spy call to have specified this context`,
      actual: call.thisValue,
      expected,
    };
  },
);
```

Update exports array.

**Step 4: Run test to verify it passes**

Run: `npm test -w @bupkis/sinon`
Expected: PASS

**Step 5: Commit**

```bash
git add packages/sinon/src/assertions.ts packages/sinon/test/assertions.test.ts
git commit -m "feat(sinon): add spyCall assertions (args, returned, threw, this)"
```

---

## Task 10: Implement 'to have calls satisfying' Assertion

**Files:**
- Modify: `packages/sinon/src/assertions.ts`
- Modify: `packages/sinon/test/assertions.test.ts`

**Step 1: Write the failing tests**

Add to `packages/sinon/test/assertions.test.ts`:

```typescript
describe('to have calls satisfying', () => {
  it('should pass when all calls match the specification', () => {
    const spy = sinon.spy();
    spy(1);
    spy(2);
    spy(3);
    e(spy, 'to have calls satisfying', [
      { args: [1] },
      { args: [2] },
      { args: [3] },
    ]);
  });

  it('should support array shorthand for args', () => {
    const spy = sinon.spy();
    spy('a', 1);
    spy('b', 2);
    e(spy, 'to have calls satisfying', [
      ['a', 1],
      ['b', 2],
    ]);
  });

  it('should fail when call count does not match', () => {
    const spy = sinon.spy();
    spy(1);
    expect(() => e(spy, 'to have calls satisfying', [
      { args: [1] },
      { args: [2] },
    ]), 'to throw');
  });

  it('should fail when args do not match', () => {
    const spy = sinon.spy();
    spy(1);
    spy(99);
    expect(() => e(spy, 'to have calls satisfying', [
      { args: [1] },
      { args: [2] },
    ]), 'to throw');
  });

  it('should support checking returned values', () => {
    const stub = sinon.stub();
    stub.onFirstCall().returns(10);
    stub.onSecondCall().returns(20);
    stub();
    stub();
    e(stub, 'to have calls satisfying', [
      { returned: 10 },
      { returned: 20 },
    ]);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -w @bupkis/sinon`
Expected: FAIL

**Step 3: Implement 'to have calls satisfying' assertion**

Add to `packages/sinon/src/assertions.ts`:

```typescript
/**
 * Specification for a single spy call.
 */
interface CallSpec {
  args?: unknown[];
  returned?: unknown;
  threw?: unknown;
  thisValue?: unknown;
}

type CallSpecOrArgs = CallSpec | unknown[];

function isCallSpec(spec: CallSpecOrArgs): spec is CallSpec {
  return !Array.isArray(spec) && typeof spec === 'object' && spec !== null;
}

function normalizeCallSpec(spec: CallSpecOrArgs): CallSpec {
  if (Array.isArray(spec)) {
    return { args: spec };
  }
  return spec;
}

/**
 * Asserts that a spy's calls match a specification array.
 *
 * Each element can be either:
 * - An object with `args`, `returned`, `threw`, `thisValue` properties
 * - An array (shorthand for `{ args: [...] }`)
 *
 * @example
 * ```ts
 * const spy = sinon.spy();
 * spy(1); spy(2); spy(3);
 * expect(spy, 'to have calls satisfying', [
 *   { args: [1] },
 *   { args: [2] },
 *   { args: [3] },
 * ]);
 * ```
 */
export const toHaveCallsSatisfyingAssertion = createAssertion(
  [SpySchema, 'to have calls satisfying', z.array(UnknownSchema)],
  (spy: SinonSpy, specs: CallSpecOrArgs[]) => {
    const calls = spy.getCalls();
    const normalizedSpecs = specs.map(normalizeCallSpec);

    if (calls.length !== normalizedSpecs.length) {
      return {
        message: `Expected spy to have ${normalizedSpecs.length} call(s), but it had ${calls.length}`,
        actual: calls.length,
        expected: normalizedSpecs.length,
      };
    }

    for (let i = 0; i < calls.length; i++) {
      const call = calls[i];
      const spec = normalizedSpecs[i];

      if (spec.args !== undefined) {
        const actualArgs = call.args;
        const expectedArgs = spec.args;
        for (let j = 0; j < expectedArgs.length; j++) {
          if (!Object.is(actualArgs[j], expectedArgs[j])) {
            return {
              message: `Call ${i}: argument ${j} did not match`,
              actual: actualArgs[j],
              expected: expectedArgs[j],
            };
          }
        }
      }

      if (spec.returned !== undefined) {
        if (!Object.is(call.returnValue, spec.returned)) {
          return {
            message: `Call ${i}: return value did not match`,
            actual: call.returnValue,
            expected: spec.returned,
          };
        }
      }

      if (spec.threw !== undefined) {
        if (spec.threw === true && call.exception === undefined) {
          return {
            message: `Call ${i}: expected to throw but did not`,
            actual: 'no exception',
            expected: 'an exception',
          };
        }
      }

      if (spec.thisValue !== undefined) {
        if (!Object.is(call.thisValue, spec.thisValue)) {
          return {
            message: `Call ${i}: this context did not match`,
            actual: call.thisValue,
            expected: spec.thisValue,
          };
        }
      }
    }

    return true;
  },
);
```

Update exports array.

**Step 4: Run test to verify it passes**

Run: `npm test -w @bupkis/sinon`
Expected: PASS

**Step 5: Commit**

```bash
git add packages/sinon/src/assertions.ts packages/sinon/test/assertions.test.ts
git commit -m "feat(sinon): add 'to have calls satisfying' assertion"
```

---

## Task 11: Implement Call Order Assertions

**Files:**
- Modify: `packages/sinon/src/assertions.ts`
- Modify: `packages/sinon/test/assertions.test.ts`

**Step 1: Write the failing tests**

Add to `packages/sinon/test/assertions.test.ts`:

```typescript
describe('call order assertions', () => {
  describe('was called before', () => {
    it('should pass when first spy was called before second', () => {
      const spy1 = sinon.spy();
      const spy2 = sinon.spy();
      spy1();
      spy2();
      e(spy1, 'was called before', spy2);
    });

    it('should fail when order is reversed', () => {
      const spy1 = sinon.spy();
      const spy2 = sinon.spy();
      spy2();
      spy1();
      expect(() => e(spy1, 'was called before', spy2), 'to throw');
    });
  });

  describe('was called after', () => {
    it('should pass when first spy was called after second', () => {
      const spy1 = sinon.spy();
      const spy2 = sinon.spy();
      spy2();
      spy1();
      e(spy1, 'was called after', spy2);
    });
  });

  describe('given call order', () => {
    it('should pass when spies were called in order', () => {
      const spy1 = sinon.spy();
      const spy2 = sinon.spy();
      const spy3 = sinon.spy();
      spy1();
      spy2();
      spy3();
      e([spy1, spy2, spy3], 'given call order');
    });

    it('should fail when order is wrong', () => {
      const spy1 = sinon.spy();
      const spy2 = sinon.spy();
      spy2();
      spy1();
      expect(() => e([spy1, spy2], 'given call order'), 'to throw');
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -w @bupkis/sinon`
Expected: FAIL

**Step 3: Implement call order assertions**

Add to `packages/sinon/src/assertions.ts`:

```typescript
/**
 * Asserts that one spy was called before another.
 */
export const wasCalledBeforeAssertion = createAssertion(
  [SpySchema, 'was called before', SpySchema],
  (spy1: SinonSpy, spy2: SinonSpy) => {
    if (spy1.calledBefore(spy2)) {
      return true;
    }
    return {
      message: `Expected first spy to have been called before second spy`,
      actual: 'called after or not called',
      expected: 'called before',
    };
  },
);

/**
 * Asserts that one spy was called after another.
 */
export const wasCalledAfterAssertion = createAssertion(
  [SpySchema, 'was called after', SpySchema],
  (spy1: SinonSpy, spy2: SinonSpy) => {
    if (spy1.calledAfter(spy2)) {
      return true;
    }
    return {
      message: `Expected first spy to have been called after second spy`,
      actual: 'called before or not called',
      expected: 'called after',
    };
  },
);

/**
 * Asserts that an array of spies were called in the specified order.
 */
export const givenCallOrderAssertion = createAssertion(
  [z.array(SpySchema), 'given call order'],
  (spies: SinonSpy[]) => {
    for (let i = 0; i < spies.length - 1; i++) {
      if (!spies[i].calledBefore(spies[i + 1])) {
        return {
          message: `Expected spies to have been called in order, but spy ${i} was not called before spy ${i + 1}`,
          actual: 'incorrect order',
          expected: 'sequential call order',
        };
      }
    }
    return true;
  },
);
```

Update exports array.

**Step 4: Run test to verify it passes**

Run: `npm test -w @bupkis/sinon`
Expected: PASS

**Step 5: Commit**

```bash
git add packages/sinon/src/assertions.ts packages/sinon/test/assertions.test.ts
git commit -m "feat(sinon): add call order assertions (before, after, given call order)"
```

---

## Task 12: Create Main Export and Update Monorepo Config

**Files:**
- Create: `packages/sinon/src/index.ts`
- Modify: `knip.json`
- Modify: `tsconfig.json` (root)

**Step 1: Create main index.ts**

Create `packages/sinon/src/index.ts`:

```typescript
/**
 * Sinon assertions for Bupkis.
 *
 * @example
 * ```ts
 * import { expect } from 'bupkis';
 * import { sinonAssertions } from '@bupkis/sinon';
 * import sinon from 'sinon';
 *
 * const { expect: e } = expect.use(sinonAssertions);
 *
 * const spy = sinon.spy();
 * spy(42);
 * e(spy, 'was called');
 * e(spy, 'was called with', 42);
 * ```
 *
 * @packageDocumentation
 */

export { sinonAssertions } from './assertions.js';
export * from './assertions.js';
export { SpySchema, SpyCallSchema } from './schema.js';
export { isSpy, isSpyCall } from './guards.js';
```

**Step 2: Update root knip.json**

Add workspace entry for sinon package:

```json
{
  "packages/sinon": {
    "entry": [
      "src/index.ts",
      "test/**/*.test.ts"
    ]
  }
}
```

**Step 3: Update root tsconfig.json references**

Add reference to sinon package:

```json
{
  "references": [
    { "path": "packages/bupkis" },
    { "path": "packages/sinon" }
  ]
}
```

**Step 4: Run lint and test to verify everything works**

Run: `npm run lint && npm test`
Expected: PASS - no lint errors, all tests pass

**Step 5: Commit**

```bash
git add packages/sinon/src/index.ts knip.json tsconfig.json
git commit -m "chore(sinon): create main export and update monorepo config"
```

---

## Task 13: Build and Verify Package

**Files:**
- Verify: `packages/sinon/dist/` generated correctly

**Step 1: Build the sinon package**

Run: `npm run build -w @bupkis/sinon`
Expected: Generates `dist/` with CJS, ESM, and declaration files

**Step 2: Verify exports work**

Create a quick test script:

```bash
node -e "import('@bupkis/sinon').then(m => console.log(Object.keys(m)))"
```

Expected: Lists exported functions

**Step 3: Run full monorepo test suite**

Run: `npm test`
Expected: All tests pass including sinon package

**Step 4: Commit build artifacts (if any tracked)**

```bash
git add -A
git commit -m "chore(sinon): verify build output"
```

---

## Task 14: Add Alternate Phrase Aliases

**Files:**
- Modify: `packages/sinon/src/assertions.ts`
- Modify: `packages/sinon/test/assertions.test.ts`

**Step 1: Write tests for alternate phrases**

Add to `packages/sinon/test/assertions.test.ts`:

```typescript
describe('alternate phrases', () => {
  it('should support "to have been called"', () => {
    const spy = sinon.spy();
    spy();
    e(spy, 'to have been called');
  });

  it('should support "to not have been called"', () => {
    const spy = sinon.spy();
    e(spy, 'to not have been called');
  });

  it('should support "to have been called with"', () => {
    const spy = sinon.spy();
    spy(42);
    e(spy, 'to have been called with', 42);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -w @bupkis/sinon`
Expected: FAIL

**Step 3: Add phrase choices to assertions**

Update `wasCalledAssertion`:

```typescript
export const wasCalledAssertion = createAssertion(
  [SpySchema, ['was called', 'to have been called']],
  // ... same implementation
);

export const wasNotCalledAssertion = createAssertion(
  [SpySchema, ['was not called', 'to not have been called']],
  // ... same implementation
);

// Continue for other assertions...
```

**Step 4: Run test to verify it passes**

Run: `npm test -w @bupkis/sinon`
Expected: PASS

**Step 5: Commit**

```bash
git add packages/sinon/src/assertions.ts packages/sinon/test/assertions.test.ts
git commit -m "feat(sinon): add alternate phrase aliases for assertions"
```

---

## Task 15: Final Review and Documentation

**Files:**
- Create: `packages/sinon/README.md`

**Step 1: Create README**

Create `packages/sinon/README.md`:

```markdown
# @bupkis/sinon

Sinon spy/stub/mock assertions for [Bupkis](https://bupkis.zip).

## Installation

```bash
npm install @bupkis/sinon bupkis sinon
```

## Usage

```typescript
import { expect } from 'bupkis';
import { sinonAssertions } from '@bupkis/sinon';
import sinon from 'sinon';

const { expect: e } = expect.use(sinonAssertions);

// Basic spy assertions
const spy = sinon.spy();
spy(42);
e(spy, 'was called');
e(spy, 'was called once');
e(spy, 'was called with', 42);

// Call count
e(spy, 'was called times', 1);

// Stub return values
const stub = sinon.stub().returns(100);
stub();
e(stub.firstCall, 'to have returned', 100);

// Call order
const first = sinon.spy();
const second = sinon.spy();
first();
second();
e(first, 'was called before', second);
e([first, second], 'given call order');
```

## Available Assertions

### Spy Assertions
- `was called` / `to have been called`
- `was not called` / `to not have been called`
- `was called once`
- `was called twice`
- `was called thrice`
- `was called times <n>`
- `was called with <...args>`
- `was always called with <...args>`
- `was called with exactly <...args>`
- `was never called with <...args>`
- `was called on <context>`
- `was always called on <context>`
- `threw`
- `always threw`
- `was called before <spy>`
- `was called after <spy>`

### SpyCall Assertions
- `to have args <array>`
- `to have returned <value>`
- `to have thrown`
- `to have this <context>`

### Array Assertions
- `given call order`

### Complex Assertions
- `to have calls satisfying <array>`

## License

BlueOak-1.0.0
```

**Step 2: Run final verification**

Run: `npm run lint && npm test && npm run build`
Expected: All pass

**Step 3: Commit documentation**

```bash
git add packages/sinon/README.md
git commit -m "docs(sinon): add README with usage examples"
```

---

## Summary

This plan creates `@bupkis/sinon` with:

**Assertions (21 total):**
- Basic: `was called`, `was not called`
- Count: `was called times`, `once`, `twice`, `thrice`
- Arguments: `was called with`, `was always called with`, `was called with exactly`, `was never called with`
- Context: `was called on`, `was always called on`
- Exceptions: `threw`, `always threw`
- Order: `was called before`, `was called after`, `given call order`
- SpyCall: `to have args`, `to have returned`, `to have thrown`, `to have this`
- Complex: `to have calls satisfying`

**Supporting code:**
- Type guards: `isSpy()`, `isSpyCall()`
- Zod schemas: `SpySchema`, `SpyCallSchema`
- Package structure following monorepo conventions

---

Plan complete and saved to `docs/plans/2026-01-10-bupkis-sinon.md`. Two execution options:

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

Which approach?
