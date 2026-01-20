# @bupkis/http Implementation Plan (formerly @bupkis/supertest)

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create a `@bupkis/http` package providing type-safe, natural-language assertions for HTTP responses from supertest (and potentially generic enough to work with fetch/axios responses).

**Architecture:** Plugin package that exports assertions consumable via `expect.use()`. Assertions use function-based implementations to inspect HTTP response properties (status, headers, body). The response interface is designed to be generic, supporting supertest's Response object as the primary target while being flexible enough for other HTTP clients.

**Tech Stack:** TypeScript, Zod v4 (via bupkis), supertest/superagent types (`@types/supertest`, `@types/superagent`), express (for tests), zshy (build tooling from monorepo)

---

## Prerequisites

Before starting, ensure you have:
- Node.js 20.19+, 22.12+, or 23+
- Git with worktree support
- Understanding of HTTP response structure (status codes, headers, body)

---

## Task 1: Create Package Structure

**Files:**
- Create: `packages/supertest/package.json`
- Create: `packages/supertest/tsconfig.json`
- Create: `packages/supertest/LICENSE.md`
- Create: `packages/supertest/src/index.ts` (placeholder)
- Create: `packages/supertest/test/` (directory)

**Step 1: Create package directory**

```bash
mkdir -p packages/supertest/src packages/supertest/test
```

**Step 2: Create package.json**

```json
{
  "name": "@bupkis/supertest",
  "version": "0.0.0",
  "type": "module",
  "description": "HTTP response assertions for Bupkis - works with supertest, fetch, and axios",
  "repository": {
    "directory": "packages/supertest",
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
    "supertest",
    "http",
    "response",
    "assert",
    "assertion",
    "test",
    "fetch",
    "axios"
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
    "bupkis": ">=0.15.0"
  },
  "devDependencies": {
    "@types/express": "5.0.3",
    "@types/supertest": "6.0.3",
    "express": "5.1.0",
    "supertest": "7.1.1"
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
git add packages/supertest
git commit -m "chore(supertest): scaffold @bupkis/supertest package structure"
```

---

## Task 2: Create Response Type Guards and Schemas

**Files:**
- Create: `packages/supertest/src/guards.ts`
- Create: `packages/supertest/src/schema.ts`
- Create: `packages/supertest/test/guards.test.ts`

**Implementation:**

```typescript
// guards.ts
export interface HttpResponse {
  status: number;
  headers?: Record<string, string | string[] | undefined>;
  header?: Record<string, string | string[] | undefined>;
  body?: unknown;
  text?: string;
  type?: string;
}

export const isHttpResponse = (value: unknown): value is HttpResponse => {
  if (value === null || typeof value !== 'object') {
    return false;
  }
  const obj = value as Record<string, unknown>;
  return typeof obj.status === 'number';
};

// schema.ts
export const HttpResponseSchema = z.custom<HttpResponse>(
  isHttpResponse,
  'Expected an HTTP response object with a status property',
);
```

---

## Task 3: Implement Status Code Assertions

**Files:**
- Create: `packages/supertest/src/assertions.ts`
- Create: `packages/supertest/test/assertions.test.ts`

**Assertions:**

```typescript
// Exact status code
expect(response, 'to have status', 200);

// Status categories
expect(response, 'to have status', 'ok'); // 2xx
expect(response, 'to have status', 'redirect'); // 3xx
expect(response, 'to have status', 'client error'); // 4xx
expect(response, 'to have status', 'server error'); // 5xx
```

---

## Task 4: Implement Header Assertions

```typescript
// Header existence
expect(response, 'to have header', 'content-type');

// Header with exact value
expect(response, 'to have header', 'content-type', 'application/json');

// Header with regex match
expect(response, 'to have header', 'content-type', /json/);
```

---

## Task 5: Implement Body Assertions

```typescript
// Has body
expect(response, 'to have body');

// Exact string body
expect(response, 'to have body', 'exact string');

// Has JSON body
expect(response, 'to have JSON body');

// JSON body satisfying partial match
expect(response, 'to have JSON body satisfying', { users: [] });

// Body satisfying regex or object
expect(response, 'to have body satisfying', /pattern/);
```

---

## Task 6: Implement Redirect Assertions

```typescript
// Is a redirect
expect(response, 'to redirect');

// Redirects to specific URL
expect(response, 'to redirect to', '/login');
expect(response, 'to redirect to', /auth/);
```

---

## Task 7: Create Main Export and Finalize Package

**Files:**
- Modify: `packages/supertest/src/index.ts`
- Create: `packages/supertest/README.md`

---

## Task 8: Add Alternate Phrases

Support alternate phrase aliases like:
- `'to respond with status'` → `'to have status'`
- `'to include header'` → `'to have header'`

---

## Task 9: Final Review and Integration

Run full test suite, lint, and build.

---

## Summary

This plan creates `@bupkis/supertest` with:

**Assertions (10 total):**
- Status: `to have status <number|category>`
- Headers: `to have header`, `to have header <value|regex>`
- Body: `to have body`, `to have body <string>`, `to have JSON body`, `to have JSON body satisfying`, `to have body satisfying`
- Redirect: `to redirect`, `to redirect to`

**Supporting code:**
- Type guard: `isHttpResponse()`
- Zod schema: `HttpResponseSchema`
- Interface: `HttpResponse` (compatible with supertest, fetch, axios)

**Status categories:**
- `'ok'` - 2xx
- `'redirect'` - 3xx
- `'client error'` - 4xx
- `'server error'` - 5xx

---

### Available Assertions

#### Status Assertions

| Assertion | Description |
| --- | --- |
| `to have status <number>` | Response has exact status code |
| `to have status 'ok'` | Response has 2xx status |
| `to have status 'redirect'` | Response has 3xx status |
| `to have status 'client error'` | Response has 4xx status |
| `to have status 'server error'` | Response has 5xx status |

#### Header Assertions

| Assertion | Description |
| --- | --- |
| `to have header <name>` | Response has the header (case-insensitive) |
| `to have header <name> <value>` | Header equals exact value |
| `to have header <name> <regex>` | Header matches regex pattern |

#### Body Assertions

| Assertion | Description |
| --- | --- |
| `to have body` | Response has non-empty body |
| `to have body <string>` | Body equals exact string |
| `to have JSON body` | Response has JSON content-type and body |
| `to have JSON body satisfying <object>` | JSON body partially matches object |
| `to have body satisfying <regex\|object>` | Body matches regex or object spec |

#### Redirect Assertions

| Assertion | Description |
| --- | --- |
| `to redirect` | Response is a 3xx redirect |
| `to redirect to <url>` | Redirect Location header matches URL |
| `to redirect to <regex>` | Redirect Location matches pattern |

---

### Critical Files for Implementation

- `packages/supertest/src/assertions.ts` - Core assertion implementations
- `packages/supertest/src/guards.ts` - HttpResponse type guard and interface
- `packages/supertest/src/schema.ts` - Zod schema for HTTP responses
- `packages/sinon/src/assertions.ts` - Pattern to follow for assertion creation
- `packages/sinon/package.json` - Package structure pattern to follow
