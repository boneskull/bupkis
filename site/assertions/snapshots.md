---
title: Snapshot Assertions
category: Assertions
---

## Snapshot Assertions

> 🆕 **New in v0.13.0**

Snapshot testing lets you capture the expected output of your code and automatically compare it against future runs. Instead of manually writing assertions for complex objects, arrays, or rendered output, you create a "snapshot" that gets stored alongside your tests.

**Currently Supported Test Frameworks:**

- ✅ **node:test** - Native `assert.snapshot()` integration
- ✅ **Mocha** - Custom snapshot storage
- ⏳ **Jest** - Planned for future release
- ⏳ **Vitest** - Planned for future release

### {unknown} to match snapshot {test-context | string}

> ✏️ Aliases:
>
>     {unknown} to match snapshot {test-context | string}
>     {unknown} to match the snapshot {test-context | string}
>     {unknown} to equal snapshot {test-context | string}
>     {unknown} to equal the snapshot {test-context | string}

Asserts that a value matches a stored snapshot. The snapshot is automatically created on first run and validated on subsequent runs.

**Basic Usage with node:test:**

```js
import test from 'node:test';
import { expect } from 'bupkis';

test('component renders correctly', (t) => {
  const output = {
    type: 'div',
    props: { className: 'container' },
    children: ['Hello, World!'],
  };

  expect(output, 'to match snapshot', t);
});
```

**Success** (first run - creates snapshot):

```js
test('user profile', (t) => {
  const user = { name: 'Alice', age: 30, role: 'admin' };
  expect(user, 'to match snapshot', t);
});
// ✓ Snapshot created
```

**Success** (subsequent runs - matches snapshot):

```js
test('user profile', (t) => {
  const user = { name: 'Alice', age: 30, role: 'admin' };
  expect(user, 'to match snapshot', t);
});
// ✓ Matches snapshot
```

**Failure** (value changed):

```js
test('user profile', (t) => {
  const user = { name: 'Alice', age: 31, role: 'admin' }; // age changed!
  expect(user, 'to match snapshot', t);
});
// AssertionError: Snapshot does not match
// - expected
// + actual
//
//   Object {
//     "name": "Alice",
// -   "age": 30,
// +   "age": 31,
//     "role": "admin"
//   }
```

**Negation:**

```js
// Asserts that the value does NOT match the snapshot
expect(changedOutput, 'not to match snapshot', t);
```

**With Mocha:**

```js
describe('MyComponent', function () {
  it('renders correctly', function () {
    const output = renderComponent();
    expect(output, 'to match snapshot', this); // Pass Mocha context
  });
});
```

**With Explicit Snapshot Name:**

```js
test('any framework', () => {
  const output = renderComponent();
  // Use string name instead of test context
  expect(output, 'to match snapshot', 'component-default-state');
});
```

### {unknown} to match snapshot {test-context | string} with options {options}

> ✏️ Aliases:
>
>     {unknown} to match snapshot {test-context | string} with options {options}
>     {unknown} to match the snapshot {test-context | string} with options {options}
>     {unknown} to equal snapshot {test-context | string} with options {options}
>     {unknown} to equal the snapshot {test-context | string} with options {options}

Extended version that accepts custom serialization and naming options via the `with options` syntax.

**Options Object:**

- `serializer?: (value: any) => string` - Custom function to serialize the value before snapshotting
- `hint?: string` - Additional identifier for multiple snapshots in the same test

**Custom Serialization:**

```js
test('redacts sensitive data', (t) => {
  const user = {
    username: 'alice',
    password: 'secret123',
    email: 'alice@example.com',
  };

  expect(user, 'to match snapshot', t, 'with options', {
    serializer: (value) =>
      JSON.stringify({ ...value, password: '[REDACTED]' }, null, 2),
  });
});

// Snapshot will contain:
// {
//   "username": "alice",
//   "password": "[REDACTED]",
//   "email": "alice@example.com"
// }
```

**Multiple Snapshots Per Test:**

```js
test('multi-step workflow', (t) => {
  const step1 = { status: 'pending', progress: 0 };
  expect(step1, 'to match snapshot', t, 'with options', { hint: 'step-1' });

  const step2 = { status: 'processing', progress: 50 };
  expect(step2, 'to match snapshot', t, 'with options', { hint: 'step-2' });

  const step3 = { status: 'complete', progress: 100 };
  expect(step3, 'to match snapshot', t, 'with options', { hint: 'step-3' });
});
```

**Custom Serialization for Dates:**

```js
test('handles timestamps', (t) => {
  const data = {
    id: 123,
    createdAt: new Date('2024-01-15T10:30:00Z'),
    updatedAt: new Date('2024-01-16T14:45:00Z'),
  };

  expect(data, 'to match snapshot', t, 'with options', {
    serializer: (value) => {
      const normalized = {
        ...value,
        createdAt: value.createdAt.toISOString(),
        updatedAt: value.updatedAt.toISOString(),
      };
      return JSON.stringify(normalized, null, 2);
    },
  });
});
```

## Updating Snapshots

When your code intentionally changes, you need to update the stored snapshots:

**node:test:**

```bash
node --test --test-update-snapshots
```

**Other frameworks:**

```bash
BUPKIS_UPDATE_SNAPSHOTS=1 npm test
```

**Jest/Vitest (when supported):**

```bash
vitest -u
jest -u
```

## Chaining with Other Assertions

Snapshot assertions can be chained with other assertions using `and`:

```js
test('validates structure and snapshots', (t) => {
  const user = {
    name: 'Alice',
    email: 'alice@example.com',
    age: 30,
    roles: ['admin', 'user'],
  };

  expect(
    user,
    'to be an object',
    'and',
    'to have property',
    'email',
    'and',
    'to match snapshot',
    t,
  );
});
```

## Best Practices

1. **Keep Snapshots Small**: Snapshot small, focused units rather than entire page renders
2. **Review Snapshot Changes**: Always review snapshot diffs carefully before updating
3. **Use Serializers for Volatile Data**: Redact timestamps, IDs, or random values with custom serializers
4. **Name Multiple Snapshots**: Use `hint` option when creating multiple snapshots in one test
5. **Version Control**: Commit snapshot files to version control

## Common Pitfalls

**❌ Don't snapshot volatile data without serialization:**

```js
// BAD - timestamp will fail on every run
const data = { timestamp: Date.now(), value: 'test' };
expect(data, 'to match snapshot', t);
```

**✅ Use a serializer to normalize:**

```js
// GOOD - normalize timestamp
expect(data, 'to match snapshot', t, 'with options', {
  serializer: (value) =>
    JSON.stringify({ ...value, timestamp: '[TIMESTAMP]' }, null, 2),
});
```

**❌ Don't create overly large snapshots:**

```js
// BAD - entire API response with 1000+ items
expect(massiveApiResponse, 'to match snapshot', t);
```

**✅ Snapshot a representative subset:**

```js
// GOOD - snapshot structure and first few items
const subset = {
  meta: massiveApiResponse.meta,
  items: massiveApiResponse.items.slice(0, 3),
};
expect(subset, 'to match snapshot', t);
```
