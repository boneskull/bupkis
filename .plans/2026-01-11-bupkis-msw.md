# @bupkis/msw Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create a `@bupkis/msw` package providing type-safe assertions for MSW (Mock Service Worker) request verification, filling the gap that MSW lacks built-in assertion support.

**Architecture:** Plugin package that exports assertions consumable via `expect.use()`. Uses a `TrackedServer` wrapper that attaches lifecycle event listeners (`request:match`, `response:mocked`) to track handled requests. Assertions inspect the tracked request history for verification.

**Tech Stack:** TypeScript, Zod v4 (via bupkis), MSW 2.x types, zshy (build tooling from monorepo)

---

## Prerequisites

Before starting, ensure you have:
- Node.js 20.19+, 22.12+, or 23+
- Git with worktree support
- Understanding of MSW 2.x `setupServer` and lifecycle events API

---

## Task 1: Create Worktree and Branch

**Files:**
- Create: `.worktrees/bupkis-msw/` (worktree directory)

**Step 1: Create worktree from main branch**

```bash
git worktree add .worktrees/bupkis-msw main -b feat/bupkis-msw
```

**Step 2: Verify worktree was created**

Run: `git worktree list`
Expected: Shows `.worktrees/bupkis-msw` pointing to `feat/bupkis-msw` branch

**Step 3: Navigate to worktree**

```bash
cd .worktrees/bupkis-msw
```

**Step 4: Install dependencies**

Run: `npm install`
Expected: Installs all workspace dependencies

---

## Task 2: Scaffold Package Structure

**Files:**
- Create: `packages/msw/package.json`
- Create: `packages/msw/tsconfig.json`
- Create: `packages/msw/src/index.ts`
- Create: `packages/msw/src/assertions.ts`
- Create: `packages/msw/src/tracker.ts`
- Create: `packages/msw/src/schema.ts`
- Create: `packages/msw/src/guards.ts`
- Create: `packages/msw/src/types.ts`
- Create: `packages/msw/test/assertions.test.ts`
- Create: `packages/msw/README.md`
- Create: `packages/msw/LICENSE.md`

**Step 1: Create package directory**

```bash
mkdir -p packages/msw/src packages/msw/test
```

**Step 2: Create package.json**

```json
{
  "name": "@bupkis/msw",
  "version": "0.0.0",
  "type": "module",
  "description": "MSW request verification assertions for Bupkis",
  "repository": {
    "directory": "packages/msw",
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
    "msw",
    "mock",
    "http",
    "api",
    "assert",
    "assertion",
    "test",
    "mock-service-worker"
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
    "msw": ">=2.0.0"
  },
  "devDependencies": {
    "msw": "2.8.4"
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

**Step 5: Run npm install to link workspace**

**Step 6: Commit scaffold**

```bash
git add packages/msw
git commit -m "chore(msw): scaffold @bupkis/msw package structure"
```

---

## Task 3: Create Request Tracker Types and Interfaces

**Files:**
- Create: `packages/msw/src/types.ts`

**Step 1: Create types file**

```typescript
// packages/msw/src/types.ts
import type { SetupServer } from 'msw/node';

/**
 * Represents a tracked HTTP request with its parsed details.
 */
export interface TrackedRequest {
  request: Request;
  requestId: string;
  method: string;
  url: string;
  pathname: string;
  body: unknown;
  headers: Record<string, string>;
  timestamp: number;
  response?: Response;
}

/**
 * Options for request matching assertions.
 */
export interface RequestMatchOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string | RegExp>;
  times?: number;
  once?: boolean;
}

/**
 * A server instance with request tracking capabilities.
 */
export interface TrackedServer extends SetupServer {
  readonly trackedRequests: TrackedRequest[];
  clearTrackedRequests(): void;
  readonly isTrackedServer: true;
}
```

**Step 2: Commit types**

```bash
git add packages/msw/src/types.ts
git commit -m "feat(msw): add request tracker types and interfaces"
```

---

## Task 4: Create Type Guards

**Files:**
- Create: `packages/msw/src/guards.ts`
- Test: `packages/msw/test/guards.test.ts`

Implement `isTrackedServer()` type guard using a Symbol marker.

---

## Task 5: Create Request Tracker

**Files:**
- Create: `packages/msw/src/tracker.ts`
- Test: `packages/msw/test/tracker.test.ts`

**Key implementation:**

```typescript
export const createTrackedServer = (...handlers: RequestHandler[]): TrackedServer => {
  const server = setupServer(...handlers);
  const trackedRequests: TrackedRequest[] = [];

  // Track requests that match a handler
  server.events.on('response:mocked', async ({ request, requestId, response }) => {
    const clonedRequest = request.clone();
    const url = new URL(request.url);

    const tracked: TrackedRequest = {
      body: await parseBody(clonedRequest),
      headers: parseHeaders(request.headers),
      method: request.method,
      pathname: url.pathname,
      request,
      requestId,
      response,
      timestamp: Date.now(),
      url: request.url,
    };

    trackedRequests.push(tracked);
  });

  // Create the tracked server object
  const trackedServer = Object.assign(server, {
    [kTrackedServer]: true as const,
    clearTrackedRequests: () => { trackedRequests.length = 0; },
    get isTrackedServer(): true { return true; },
    get trackedRequests(): TrackedRequest[] { return [...trackedRequests]; },
  }) as TrackedServer;

  return trackedServer;
};
```

---

## Task 6: Create Zod Schemas

**Files:**
- Create: `packages/msw/src/schema.ts`

Create schemas for `TrackedServer`, `PathMatcher`, and `RequestMatchOptions`.

---

## Task 7: Implement Basic Assertions (to have handled request to)

**Files:**
- Create: `packages/msw/src/assertions.ts`
- Test: `packages/msw/test/assertions.test.ts`

**Assertions to implement:**

```typescript
// Basic path matching
expect(server, 'to have handled request to', '/api/users');

// With method
expect(server, 'to have handled request to', '/api/users', { method: 'POST' });

// With body verification
expect(server, 'to have handled request to', '/api/users', {
  method: 'POST',
  body: { name: 'Alice' },
});

// With header verification
expect(server, 'to have handled request to', '/api/users', {
  headers: { authorization: /^Bearer / },
});

// Request count
expect(server, 'to have handled request to', '/api/users', { times: 3 });
expect(server, 'to have handled request to', '/api/users', { once: true });

// RegExp path matching
expect(server, 'to have handled request matching', /\/api\/users\/\d+/);

// Negated assertions
expect(server, 'not to have handled request to', '/api/admin');
```

---

## Task 8: Implement Request Matching Assertion (RegExp support)

Add `to have handled request matching` with RegExp pattern support.

---

## Task 9: Implement Request Count Assertions

Add support for `times` and `once` options in assertions.

---

## Task 10: Implement Request Body Verification

Use "to satisfy" semantics for body matching.

---

## Task 11: Implement Header Verification

Support string and RegExp header matching.

---

## Task 12: Create Index Module and Exports

**Files:**
- Create: `packages/msw/src/index.ts`

Export all assertions, guards, schemas, tracker, and types.

---

## Task 13: Create README Documentation

Comprehensive README with usage examples, available assertions, and export list.

---

## Task 14: Update Root Package Configuration

Add to `AGENTS.md` package table and `release-please-config.json`.

---

## Task 15: Build and Test Package

**Step 1: Build the package**
Run: `npm run build --workspace=@bupkis/msw`

**Step 2: Run all tests**
Run: `npm run test --workspace=@bupkis/msw`

**Step 3: Run type checking**
Run: `npm run lint:types`

**Step 4: Run linting**
Run: `npm run fix:eslint`

**Step 5: Final commit**
```bash
git add -A
git commit -m "chore(msw): finalize @bupkis/msw package"
```

---

## Summary

This plan creates a new `@bupkis/msw` package that:

1. **TrackedServer**: Wraps MSW's `setupServer` with request tracking via lifecycle events
2. **Type Guards**: `isTrackedServer()` for runtime type checking
3. **Zod Schemas**: `TrackedServerSchema`, `PathMatcherSchema`, `RequestMatchOptionsSchema`
4. **Assertions**:
   - `to have handled request to` - Basic path matching with optional method/body/headers
   - `to have handled request matching` - RegExp path matching
   - Count verification via `times` and `once` options
   - Body verification using "to satisfy" semantics
   - Header verification with string or RegExp patterns

---

### Critical Files for Implementation

- `packages/msw/src/tracker.ts` - Core request tracking logic with MSW lifecycle events
- `packages/msw/src/assertions.ts` - All MSW assertions implementation
- `packages/msw/src/types.ts` - TypeScript interfaces for TrackedServer and options
- `packages/sinon/src/assertions.ts` - Reference pattern for assertion implementation
- `packages/sinon/package.json` - Reference for package.json structure
