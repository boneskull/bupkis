# @bupkis/msw

MSW (Mock Service Worker) request verification assertions for [Bupkis](https://bupkis.zip).

## Installation

```bash
npm install @bupkis/msw bupkis msw -D
```

## Usage

```typescript
import { use } from 'bupkis';
import mswAssertions, { createTrackedServer } from '@bupkis/msw';
import { http, HttpResponse } from 'msw';

const { expect, expectAsync } = use(mswAssertions);

// Create a tracked server instead of using setupServer directly
// `using` automatically calls server.close() when the block exits
{
  using server = createTrackedServer(
    http.get('/api/users', () => HttpResponse.json([{ id: 1, name: 'Alice' }])),
    http.post('/api/users', () => HttpResponse.json({ id: 2 })),
  );

  server.listen();

  // Make requests
  await fetch('https://api.example.com/api/users');
  await fetch('https://api.example.com/api/users', {
    method: 'POST',
    body: JSON.stringify({ name: 'Bob' }),
    headers: { 'content-type': 'application/json' },
  });

  // Verify requests were handled (sync - use expect)
  expect(server, 'to have handled request to', '/api/users');
  expect(server, 'to have handled request to', '/api/users', {
    method: 'POST',
  });

  // For body matching, use expectAsync - it awaits body parsing automatically
  await expectAsync(server, 'to have handled request to', '/api/users', {
    method: 'POST',
    body: { name: 'Bob' },
  });

  // Verify request count
  expect(server, 'to have handled', 2, 'requests');

  // Clear tracked requests between tests
  server.clearTrackedRequests();

  // server.close() called automatically here!
}
```

## API

### `createTrackedServer(...handlers)`

Creates an MSW server with request tracking capabilities. This is a drop-in replacement for `setupServer` from `msw/node`.

The returned server implements `Disposable`, so you can use `using` syntax (TypeScript 5.2+) for automatic cleanup:

```typescript
import { createTrackedServer } from '@bupkis/msw';
import { http, HttpResponse } from 'msw';

{
  using server = createTrackedServer(
    http.get('/api/users', () => HttpResponse.json([])),
  );
  server.listen();
  // ... make requests and assertions ...
  // server.close() called automatically when block exits
}
```

### `isTrackedServer(value)`

Type guard that checks if a value is a `TrackedServer` instance.

```typescript
import { isTrackedServer, createTrackedServer } from '@bupkis/msw';
import { setupServer } from 'msw/node';

const trackedServer = createTrackedServer();
const plainServer = setupServer();

isTrackedServer(trackedServer); // true
isTrackedServer(plainServer); // false
```

### `waitForBodies(server)`

Waits for all tracked request bodies to be parsed and returns the requests.

**Note:** When using `expectAsync` for body matching, this is called automatically. Use this when you need to access `req.body` directly.

```typescript
await fetch(url, { method: 'POST', body: JSON.stringify({ name: 'Bob' }) });

// Returns requests with bodies resolved
const requests = await waitForBodies(server);
console.log(requests[0].body); // { name: 'Bob' }

// For body assertions, prefer expectAsync (body parsing is automatic)
await expectAsync(server, 'to have handled request to', '/api', { body: data });
```

### TrackedServer Properties

- `trackedRequests` - Array of all tracked requests (includes `bodyPromise` for each request)
- `isTrackedServer` - Always `true` for tracked servers
- `clearTrackedRequests()` - Clears all tracked request history
- `[Symbol.dispose]()` - Calls `close()` (enables `using` syntax)

## Assertions

### {TrackedServer} to have handled request to {path}

Asserts that the server handled a request to the specified path.

**Success**:

```js
await fetch('https://api.example.com/api/users');
expect(server, 'to have handled request to', '/api/users');
```

**Failure**:

```js
expect(server, 'to have handled request to', '/api/unknown');
// AssertionError: Expected server to have handled request to "/api/unknown"
```

### {TrackedServer} to have handled request to {path} {options}

Asserts that the server handled a request matching the path and options.

**Options**:

- `method` - HTTP method to match (case-insensitive)
- `body` - Expected request body (uses "to satisfy" semantics)
- `headers` - Expected headers (string for exact match, RegExp for pattern)
- `times` - Exact number of times the request should have been made
- `once` - Shorthand for `times: 1`

**With method**:

```js
await fetch('https://api.example.com/api/users', {
  method: 'POST',
  body: '{}',
});
expect(server, 'to have handled request to', '/api/users', { method: 'POST' });
```

**With body** (use `expectAsync`):

```js
await fetch('https://api.example.com/api/users', {
  method: 'POST',
  body: JSON.stringify({ name: 'Bob', extra: 'field' }),
  headers: { 'content-type': 'application/json' },
});

// Use expectAsync for body matching - it awaits body parsing automatically
// Uses "to satisfy" semantics - partial match works
await expectAsync(server, 'to have handled request to', '/api/users', {
  method: 'POST',
  body: { name: 'Bob' }, // extra field is ignored
});
```

**With headers**:

```js
await fetch('https://api.example.com/api/users', {
  headers: { authorization: 'Bearer abc123' },
});

// Exact match
expect(server, 'to have handled request to', '/api/users', {
  headers: { authorization: 'Bearer abc123' },
});

// RegExp match
expect(server, 'to have handled request to', '/api/users', {
  headers: { authorization: /^Bearer / },
});
```

**With times**:

```js
await fetch('https://api.example.com/api/users');
await fetch('https://api.example.com/api/users');
await fetch('https://api.example.com/api/users');
expect(server, 'to have handled request to', '/api/users', { times: 3 });
```

**With once**:

```js
await fetch('https://api.example.com/api/users');
expect(server, 'to have handled request to', '/api/users', { once: true });
```

**Negation** (assert no request was handled):

```js
expect(server, 'not to have handled request to', '/api/admin');
```

### {TrackedServer} to have handled request matching {pattern}

Asserts that the server handled a request matching a RegExp pattern.

**Success**:

```js
await fetch('https://api.example.com/api/users/123');
expect(server, 'to have handled request matching', /\/api\/users\/\d+/);
```

**Failure**:

```js
expect(server, 'to have handled request matching', /\/api\/admin\/\d+/);
// AssertionError: Expected server to have handled request matching /\/api\/admin\/\d+/
```

### {TrackedServer} to have handled request matching {pattern} {options}

Asserts that the server handled a request matching a RegExp pattern with options.

```js
await fetch('https://api.example.com/api/users/123', { method: 'DELETE' });
expect(server, 'to have handled request matching', /\/api\/users\/\d+/, {
  method: 'DELETE',
});
```

**Negation** (assert no request matched):

```js
expect(server, 'not to have handled request matching', /\/api\/admin/);
```

### {TrackedServer} to have handled {number} requests

Asserts that the server handled exactly the specified number of requests.

**Success**:

```js
await fetch('https://api.example.com/api/users');
await fetch('https://api.example.com/api/users/1');
await fetch('https://api.example.com/api/users/2');
expect(server, 'to have handled', 3, 'requests');
```

**Failure**:

```js
await fetch('https://api.example.com/api/users');
expect(server, 'to have handled', 5, 'requests');
// AssertionError: Expected server to have handled 5 request(s), but handled 1
```

### {TrackedServer} to have handled requests

Asserts that the server has handled at least one request.

**Success**:

```js
await fetch('https://api.example.com/api/users');
expect(server, 'to have handled requests');
```

**No requests (use negation)**:

```js
expect(server, 'not to have handled requests');
```

## Exports

```typescript
// Assertions (default export)
export { mswAssertions as default, mswAssertions } from './assertions.js';

// Type guard
export { isTrackedServer } from './guards.js';

// Zod schemas
export { PathMatcherSchema, TrackedServerSchema } from './schema.js';

// Tracker factory and utilities
export { createTrackedServer, waitForBodies } from './tracker.js';

// Types
export type {
  PathMatcher,
  RequestMatchOptions,
  TrackedRequest,
  TrackedServer,
} from './types.js';
```

## License

Copyright © 2026 [Christopher "boneskull" Hiller][boneskull]. Licensed under [BlueOak-1.0.0](https://blueoakcouncil.org/license/1.0.0).

[boneskull]: https://github.com/boneskull
