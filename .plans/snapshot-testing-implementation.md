# BUPKIS Snapshot Testing - Implementation Plan

**Status:** Planning
**Created:** 2025-01-12
**Owner:** @boneskull

## Overview

This document outlines the implementation plan for adding unified snapshot testing support to BUPKIS. The goal is to provide a consistent `expect(value, 'to match snapshot', context)` API that works across multiple test frameworks (node:test, Jest, Vitest, Mocha, etc.).

## Design Decisions Summary

### Core Principles

1. **Unified API with Framework Intelligence** - Single assertion syntax adapts to the test framework
2. **Migration-Friendly** - Follow each framework's snapshot conventions
3. **Stateless Adapters** - Framework detection happens per-assertion, no global state
4. **Graceful Fallback** - Custom implementation for frameworks without native snapshot support

### Key Technical Decisions

- **Q1: API Approach** → Unified API with automatic framework detection
- **Q2: Context Parameter** → `expect(value, "to match snapshot", t)` where `t` is test context
- **Q3: Snapshot Storage** → Framework-specific conventions with `__snapshots__/` fallback
- **Q4: Serialization** → Framework-native with node:test-like fallback
- **Q5: Framework Detection** → Context object introspection (with fallback to globals if needed)
- **Q6: Test Path Construction** → Extract from context using framework-specific adapters
- **Q7: Update Workflow** → Framework-native flags (`--test-update-snapshots`, `-u`) + `BUPKIS_UPDATE_SNAPSHOTS=1`
- **Q8: Multi-Framework Projects** → User's responsibility; adapters are stateless
- **Q9: Inline Snapshots** → Not in MVP (external snapshots only)
- **Q10: Chaining** → Yes, snapshots participate in assertion chains

## Architecture

### Project Structure

```
src/
├── snapshot/
│   ├── adapter.ts              # Adapter interface & types
│   ├── select-adapter.ts       # Adapter selection logic
│   ├── serializer.ts           # Default serialization utilities
│   ├── adapters/
│   │   ├── node-test.ts        # Node:test adapter
│   │   ├── jest-vitest.ts      # Jest/Vitest adapter (Phase 2)
│   │   ├── fallback.ts         # Fallback adapter
│   │   └── index.ts            # Export all adapters
│   └── index.ts                # Main snapshot exports
├── assertion/
│   └── impl/
│       └── snapshot.ts         # Snapshot assertions
└── index.ts                    # Update to export snapshot utilities

test/
├── snapshot/
│   ├── adapters/
│   │   ├── node-test.test.ts
│   │   ├── fallback.test.ts
│   │   └── jest-vitest.test.ts (Phase 2)
│   ├── select-adapter.test.ts
│   ├── serializer.test.ts
│   └── snapshot-assertion.test.ts
└── integration/
    └── snapshot-integration.test.ts
```

### Adapter Interface

```typescript
interface SnapshotAdapter {
  readonly name: string;
  canHandle(context: unknown): boolean;
  getContext(context: unknown): SnapshotContext;
  assertSnapshot(
    value: unknown,
    context: unknown,
    options?: SnapshotOptions,
  ): void;
}

interface SnapshotContext {
  testPath: string; // Full test name/path
  filePath: string; // Test file path
  isUpdateMode: boolean; // Whether to update snapshots
}

interface SnapshotOptions {
  serializer?: SnapshotSerializer;
  hint?: string; // Optional name hint
}
```

### Adapter Implementations

#### 1. Node:test Adapter

- **Detection:** `context?.assert?.snapshot` exists
- **Path Extraction:** Use `context.name` (and parent test names if available)
- **Implementation:** Delegate to `context.assert.snapshot()`
- **Update Mode:** Check for `--test-update-snapshots` flag

#### 2. Fallback Adapter

- **Detection:** Default when no other adapter matches
- **Path Extraction:** Mocha `this.test.fullTitle()` or explicit string name
- **Implementation:** Custom snapshot storage in `__snapshots__/*.snap.js`
- **Update Mode:** Check `process.env.BUPKIS_UPDATE_SNAPSHOTS === '1'`
- **Storage Format:** ES module with exports object (like node:test)

```javascript
// __snapshots__/my-test.test.js
export default {
  'describe block > test name': '{\n  "foo": "bar"\n}',
  'another test': '"simple string"',
};
```

#### 3. Jest/Vitest Adapter (Phase 2)

- **Detection:** `context?.expect?.getState` exists
- **Path Extraction:** `context.expect.getState().currentTestName`
- **Implementation:** Use Jest's snapshot matcher system
- **Update Mode:** Check `context.expect.getState().snapshotState._updateSnapshot === 'all'`

### Adapter Selection

```typescript
function selectAdapter(context: unknown): SnapshotAdapter {
  const adapters = [nodeTestAdapter, fallbackAdapter];

  for (const adapter of adapters) {
    if (adapter.canHandle(context)) {
      return adapter;
    }
  }

  return fallbackAdapter;
}
```

## API Examples

### Node:test

```typescript
import test from 'node:test';
import { expect } from 'bupkis';

test('component renders correctly', (t) => {
  const output = renderComponent();
  expect(output, 'to match snapshot', t);
});
```

### Jest/Vitest

```typescript
import { it } from 'vitest';
import { expect } from 'bupkis';

it('component renders correctly', (t) => {
  const output = renderComponent();
  expect(output, 'to match snapshot', t);
});
```

### Mocha

```typescript
import { expect } from 'bupkis';

describe('Component', function () {
  it('renders correctly', function () {
    const output = renderComponent();
    expect(output, 'to match snapshot', this);
  });
});
```

### Explicit Names (Framework Agnostic)

```typescript
test('any framework', () => {
  const output = renderComponent();
  expect(output, 'to match snapshot', 'component-default-state');
});
```

### Custom Serialization

```typescript
test('custom serializer', (t) => {
  const data = { secret: 'password', public: 'info' };

  expect(data, 'to match snapshot', t, {
    serializer: (value) => {
      return JSON.stringify({ ...value, secret: '[REDACTED]' }, null, 2);
    },
  });
});
```

### Chaining

```typescript
test('chained assertions', (t) => {
  const user = getUserData();

  expect(
    user,
    'to satisfy',
    { name: 'Alice' },
    'and',
    'to have property',
    'email',
    'and',
    'to match snapshot',
    t,
  );
});
```

## Implementation Tasks

### Phase 1: MVP

#### Task 1: Core Types & Adapter Interface

**File:** `src/snapshot/adapter.ts`
**Estimate:** 1-2 hours
**Description:** Define adapter interface, types, and type guards

**Key Types:**

- `SnapshotAdapter` interface
- `SnapshotContext` interface
- `SnapshotOptions` interface
- `SnapshotSerializer` type
- `isTestContext()` type guard

**Tests:**

- Type guard tests
- Interface contract validation

---

#### Task 2: Serialization Utilities

**File:** `src/snapshot/serializer.ts`
**Estimate:** 3-4 hours
**Description:** Default serialization with circular reference detection

**Features:**

- JSON.stringify with custom replacer
- Circular reference detection
- Non-JSON type handling (Functions omitted, Symbols → string, etc.)
- Error object serialization
- Map/Set serialization
- Key sorting
- Configurable depth

**Tests:**

- Circular reference handling
- Function omission
- Error serialization
- Map/Set serialization
- Key sorting
- Property-based tests with fast-check

---

#### Task 3: Node:test Adapter

**File:** `src/snapshot/adapters/node-test.ts`
**Estimate:** 2-3 hours
**Description:** Adapter for node:test's built-in snapshot support

**Features:**

- Context detection via `context.assert.snapshot`
- Test path extraction from `context.name`
- Update mode detection from CLI flags
- File path extraction from stack trace
- Custom serializer support

**Tests:**

- `canHandle()` with valid/invalid contexts
- `getContext()` extraction
- Update mode detection
- Integration test with actual node:test

---

#### Task 4: Fallback Adapter

**File:** `src/snapshot/adapters/fallback.ts`
**Estimate:** 4-5 hours
**Description:** Custom snapshot storage for frameworks without native support

**Features:**

- Mocha context detection (`this.test.fullTitle()`)
- Explicit string name support
- Snapshot file management (`__snapshots__/*.snap.js`)
- ES module format output
- Multiple snapshots per test (counters)
- Update mode via `BUPKIS_UPDATE_SNAPSHOTS=1`

**Storage Format:**

```javascript
export default {
  'test name': '{\n  "value": 42\n}',
  'test name 2': '"another snapshot"',
};
```

**Tests:**

- Mocha context extraction
- String context handling
- Snapshot file creation/loading
- Update mode
- Multiple snapshot counters
- File I/O edge cases

---

#### Task 5: Adapter Selection Logic

**File:** `src/snapshot/select-adapter.ts`
**Estimate:** 1-2 hours
**Description:** Priority-based adapter selection

**Features:**

- Priority-ordered adapter list
- `selectAdapter()` function
- `registerAdapter()` for custom adapters
- `getRegisteredAdapters()` for debugging

**Tests:**

- Adapter selection with different contexts
- Priority ordering
- Custom adapter registration

---

#### Task 6: Snapshot Assertion

**File:** `src/assertion/impl/snapshot.ts`
**Estimate:** 2-3 hours
**Description:** BUPKIS assertion using adapter system

**Phrases:**

- `'to match snapshot'`
- `'to match the snapshot'`
- `'to equal snapshot'`
- `'to equal the snapshot'`

**Parameters:**

1. `subject`: Any value
2. `context`: Test context or string name
3. `options`: Optional `{ serializer?, hint? }`

**Implementation:**

```typescript
export const snapshotAssertion = createAssertion(
  z.unknown(),
  [['to match snapshot', 'to match the snapshot'], ...],
  snapshotContextSchema,
  snapshotOptionsSchema,
  (actual, context, options) => {
    const adapter = selectAdapter(context);
    adapter.assertSnapshot(actual, context, options);
    return true;
  }
);
```

**Tests:**

- Assertion with node:test context
- Assertion with string name
- Assertion with options
- Failure message format
- Chaining with other assertions

---

#### Task 7: BUPKIS Integration

**Files:** Multiple
**Estimate:** 1-2 hours
**Description:** Wire snapshot support into BUPKIS

**Changes:**

1. `src/assertion/impl/index.ts` - Export snapshot assertion
2. `src/snapshot/index.ts` - Main snapshot module exports
3. `src/index.ts` - Re-export snapshot types
4. `package.json` - Add `./snapshot` export

**Tests:**

- Integration tests in `test/integration/snapshot-integration.test.ts`

---

#### Task 8: Testing

**Estimate:** 4-5 hours
**Description:** Comprehensive test coverage

**Test Files:**

- `test/snapshot/serializer.test.ts` - Serialization edge cases
- `test/snapshot/adapters/node-test.test.ts` - Node:test adapter
- `test/snapshot/adapters/fallback.test.ts` - Fallback adapter
- `test/snapshot/select-adapter.test.ts` - Adapter selection
- `test/snapshot/snapshot-assertion.test.ts` - Assertion logic
- `test/integration/snapshot-integration.test.ts` - End-to-end tests
- `test/property/snapshot.test.ts` - Property-based tests

**Coverage Goals:**

- Unit tests for each adapter
- Integration tests with real test contexts
- Property tests for serialization determinism
- Edge case coverage (circular refs, multiple snapshots, etc.)

---

#### Task 9: Documentation

**Estimate:** 3-4 hours
**Description:** User-facing and API documentation

**Documents:**

1. `site/guide/snapshot-testing.md` - User guide with examples
2. `site/guide/migrating-snapshots.md` - Migration guide from Jest/node:test
3. JSDoc comments on all public APIs
4. README.md updates

**Content:**

- Quick start for each framework
- Update workflow documentation
- Custom serialization examples
- Chaining examples
- Troubleshooting guide

---

### Phase 2: Extended Framework Support (Future)

#### Jest/Vitest Adapter

**File:** `src/snapshot/adapters/jest-vitest.ts`
**Estimate:** 4-6 hours

**Features:**

- Context detection via `context.expect.getState`
- Integration with Jest's snapshot system
- Vitest compatibility
- Reuse existing `__snapshots__/` directories

---

## Timeline

### Phase 1: MVP (22-30 hours)

**Week 1: Core Infrastructure (10-14 hours)**

- Day 1-2: Tasks 1-2 (Types, Serialization)
- Day 3-4: Tasks 3-4 (Adapters)

**Week 2: Integration & Polish (12-16 hours)**

- Day 1: Task 5 (Adapter Selection)
- Day 2: Task 6-7 (Assertion & Integration)
- Day 3-4: Tasks 8-9 (Testing & Documentation)

### Phase 2: Extended Support (7-11 hours)

- Future milestone after MVP validation

---

## Success Criteria

MVP is complete when:

- ✅ `expect(value, 'to match snapshot', t)` works with node:test
- ✅ `expect(value, 'to match snapshot', name)` works with explicit names
- ✅ Snapshots update with `--test-update-snapshots` (node:test)
- ✅ Snapshots update with `BUPKIS_UPDATE_SNAPSHOTS=1` (fallback)
- ✅ Custom serializers work via options parameter
- ✅ Multiple snapshots per test work correctly
- ✅ Snapshot assertions chain with other assertions
- ✅ Clear error messages on snapshot mismatch
- ✅ Mocha context detection works
- ✅ All unit tests pass (>90% coverage)
- ✅ Integration tests pass
- ✅ Documentation complete
- ✅ Type safety verified with `tsc --noEmit`

---

## Edge Cases & Considerations

### 1. Test Name Collisions

**Problem:** Different tests might have the same name
**Solution:** Include file path in snapshot key for fallback adapter

### 2. Async Assertions

**Problem:** `expectAsync()` needs snapshot support
**Solution:** Adapters handle both sync and async; return promises when needed

### 3. Multiple Snapshots Per Test

**Problem:** Calling `'to match snapshot'` multiple times
**Solution:**

- Jest/Vitest: Native counter support
- node:test: Unnamed snapshots (native support)
- Fallback: Append counter to key (`test-name-1`, `test-name-2`)

### 4. Negation

**Problem:** What does `'not to match snapshot'` mean?
**Solution:** Technically supported but not recommended; document as anti-pattern

### 5. Embeddable Snapshots

**Problem:** Can snapshots work with `expect.it()` inside `'to satisfy'`?
**Solution:** Not in MVP - nested assertions don't have test context access

### 6. Parallel Test Execution

**Problem:** Multiple tests writing to same snapshot file
**Solution:** Document limitation; recommend test isolation or serial execution

### 7. Snapshot File Conflicts

**Problem:** Git merge conflicts in snapshot files
**Solution:** Document best practices; consider text-based format for easier merging

---

## Risk Mitigation

| Risk                                    | Impact | Likelihood | Mitigation                                    |
| --------------------------------------- | ------ | ---------- | --------------------------------------------- |
| Node:test API changes                   | High   | Low        | Wrap in adapter; single update point          |
| Mocha context detection fails           | Medium | Medium     | Fallback to explicit string names             |
| Circular references break serialization | High   | Medium     | Comprehensive detection in serializer         |
| Snapshot file corruption                | Medium | Low        | Validate on load; regenerate if invalid       |
| Performance issues with large snapshots | Medium | Low        | Document best practices; consider size limits |
| Framework detection ambiguity           | Medium | Low        | Priority ordering; manual override option     |

---

## Open Questions

1. **Snapshot diff display**: Should BUPKIS show its own diff format or defer to framework's diff?
   - **Decision:** Use framework's diff when available, custom diff for fallback

2. **Property matchers**: Should we support Jest's `expect.any(Date)` pattern?
   - **Decision:** Not in MVP; this is Jest-specific and requires significant work

3. **Snapshot testing for custom assertions**: Should custom assertions access snapshots?
   - **Decision:** Yes, but document that they need to forward test context

4. **Snapshot pruning**: Should we detect and remove unused snapshots?
   - **Decision:** Post-MVP feature; complex to implement safely

5. **Binary snapshots**: Support for images, PDFs, etc.?
   - **Decision:** Post-MVP; start with text-based snapshots only

---

## Migration Benefits

For projects moving to BUPKIS:

1. **Keep existing snapshots** - Jest/Vitest projects continue using `__snapshots__/`
2. **Keep existing workflow** - Update flags still work (`-u`, `--test-update-snapshots`)
3. **Gradual migration** - Mix framework-native and BUPKIS snapshot assertions
4. **Consistent syntax** - All assertions use BUPKIS natural language

---

## References

- [Node:test snapshot documentation](https://nodejs.org/api/test.html#snapshots)
- [Jest snapshot testing](https://jestjs.io/docs/snapshot-testing)
- [Vitest snapshot testing](https://vitest.dev/guide/snapshot.html)
- Existing BUPKIS implementation: `test/assertion-error/error-snapshot-util.ts`

---

## Appendix: Framework Detection Heuristics

### Node:test

```typescript
canHandle(context: unknown): boolean {
  return typeof context === 'object'
    && context !== null
    && 'assert' in context
    && typeof context.assert === 'object'
    && context.assert !== null
    && 'snapshot' in context.assert;
}
```

### Jest/Vitest

```typescript
canHandle(context: unknown): boolean {
  return typeof context === 'object'
    && context !== null
    && 'expect' in context
    && typeof context.expect?.getState === 'function';
}
```

### Mocha

```typescript
canHandle(context: unknown): boolean {
  return typeof context === 'object'
    && context !== null
    && 'test' in context
    && typeof context.test?.fullTitle === 'function';
}
```

---

**Last Updated:** 2025-01-12
**Next Review:** After MVP completion
