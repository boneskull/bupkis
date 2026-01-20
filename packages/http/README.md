# @bupkis/http

HTTP response assertions for [Bupkis](https://bupkis.zip).

Works with [supertest](https://github.com/ladjs/supertest), [superagent](https://github.com/ladjs/superagent), fetch responses, axios responses, or any object with a numeric `status` property.

## Installation

```bash
npm install @bupkis/http bupkis
```

## Usage

```typescript
import { use } from 'bupkis';
import httpAssertions from '@bupkis/http';
import request from 'supertest';

const { expect } = use(httpAssertions);

// Status assertions
const response = await request(app).get('/api/users');
expect(response, 'to have status', 200);
expect(response, 'to have status', 'ok');

// Header assertions
expect(response, 'to have header', 'content-type');
expect(response, 'to have header', 'content-type', 'application/json');
expect(response, 'to have header', 'content-type', /json/);

// Body assertions
expect(response, 'to have body');
expect(response, 'to have JSON body');
expect(response, 'to have JSON body satisfying', { users: [] });

// Redirect assertions
const redirect = await request(app).get('/old-page');
expect(redirect, 'to redirect');
expect(redirect, 'to redirect to', '/new-page');
```

## Assertions

### {Response} to have status {number}

> Aliases:
>
>     {Response} to have status {number}
>     {Response} to respond with status {number}

Asserts that a response has a specific HTTP status code.

**Success**:

```js
expect({ status: 200 }, 'to have status', 200);
expect({ status: 404 }, 'to have status', 404);
expect({ status: 500 }, 'to respond with status', 500);
```

**Failure**:

```js
expect({ status: 404 }, 'to have status', 200);
// AssertionError: Expected response to have status 200
```

**Negation**:

```js
expect({ status: 404 }, 'not to have status', 200);
```

### {Response} to have status {category}

> Aliases:
>
>     {Response} to have status {category}
>     {Response} to respond with status {category}

Asserts that a response has a status code within a category. Valid categories are:

- `'ok'` - 2xx status codes (200-299)
- `'redirect'` - 3xx status codes (300-399)
- `'client error'` - 4xx status codes (400-499)
- `'server error'` - 5xx status codes (500-599)

**Success**:

```js
expect({ status: 200 }, 'to have status', 'ok');
expect({ status: 201 }, 'to have status', 'ok');
expect({ status: 301 }, 'to have status', 'redirect');
expect({ status: 404 }, 'to have status', 'client error');
expect({ status: 500 }, 'to have status', 'server error');
```

**Failure**:

```js
expect({ status: 404 }, 'to have status', 'ok');
// AssertionError: Expected response to have ok status
```

**Negation**:

```js
expect({ status: 404 }, 'not to have status', 'ok');
```

### {Response} to have header {string}

> Aliases:
>
>     {Response} to have header {string}
>     {Response} to include header {string}

Asserts that a response has a specific header (existence check only). Header names are matched case-insensitively.

**Success**:

```js
const response = {
  status: 200,
  headers: { 'Content-Type': 'application/json' },
};
expect(response, 'to have header', 'content-type');
expect(response, 'to have header', 'Content-Type');
expect(response, 'to include header', 'CONTENT-TYPE');
```

**Failure**:

```js
const response = {
  status: 200,
  headers: { 'content-type': 'application/json' },
};
expect(response, 'to have header', 'x-custom-header');
// AssertionError: Expected response to have header "x-custom-header"
```

**Negation**:

```js
const response = {
  status: 200,
  headers: { 'content-type': 'application/json' },
};
expect(response, 'not to have header', 'x-custom-header');
```

### {Response} to have header {string} {string}

> Aliases:
>
>     {Response} to have header {string} {string}
>     {Response} to include header {string} {string}

Asserts that a response has a header with an exact value.

**Success**:

```js
const response = {
  status: 200,
  headers: { 'content-type': 'application/json' },
};
expect(response, 'to have header', 'content-type', 'application/json');
```

**Failure**:

```js
const response = {
  status: 200,
  headers: { 'content-type': 'text/html' },
};
expect(response, 'to have header', 'content-type', 'application/json');
// AssertionError: Expected header "content-type" to equal "application/json"
```

**With array header values** (e.g., multiple `Set-Cookie` headers):

```js
const response = {
  status: 200,
  headers: { 'set-cookie': ['a=1', 'b=2'] },
};
expect(response, 'to have header', 'set-cookie', 'a=1, b=2');
```

**Negation**:

```js
const response = {
  status: 200,
  headers: { 'content-type': 'text/html' },
};
expect(response, 'not to have header', 'content-type', 'application/json');
```

### {Response} to have header {string} {RegExp}

> Aliases:
>
>     {Response} to have header {string} {RegExp}
>     {Response} to include header {string} {RegExp}

Asserts that a response has a header matching a regex pattern.

**Success**:

```js
const response = {
  status: 200,
  headers: { 'content-type': 'application/json; charset=utf-8' },
};
expect(response, 'to have header', 'content-type', /json/);
expect(response, 'to have header', 'content-type', /^application\//);

const cacheResponse = {
  status: 200,
  headers: { 'cache-control': 'max-age=3600, public' },
};
expect(cacheResponse, 'to have header', 'cache-control', /max-age=\d+/);
```

**Failure**:

```js
const response = {
  status: 200,
  headers: { 'content-type': 'text/html' },
};
expect(response, 'to have header', 'content-type', /json/);
// AssertionError: Expected header "content-type" to match /json/
```

**Negation**:

```js
const response = {
  status: 200,
  headers: { 'content-type': 'text/html' },
};
expect(response, 'not to have header', 'content-type', /json/);
```

### {Response} to have body

Asserts that a response has a non-empty body. Empty objects `{}` and empty arrays `[]` are considered to have a body (they're valid JSON responses).

**Success**:

```js
expect({ status: 200, text: 'Hello' }, 'to have body');
expect({ status: 200, body: { users: [] } }, 'to have body');
expect({ status: 200, body: {} }, 'to have body'); // empty object counts
expect({ status: 200, body: [] }, 'to have body'); // empty array counts
```

**Failure**:

```js
expect({ status: 200 }, 'to have body');
// AssertionError: Expected response to have a body

expect({ status: 200, text: '', body: '' }, 'to have body');
// AssertionError: Expected response to have a body
```

**Negation**:

```js
expect({ status: 204 }, 'not to have body');
```

### {Response} to have body {string}

Asserts that a response has an exact string body.

**Success**:

```js
expect({ status: 200, text: 'Hello, World!' }, 'to have body', 'Hello, World!');

// Object bodies are stringified for comparison
expect({ status: 200, body: { id: 1 } }, 'to have body', '{"id":1}');
```

**Failure**:

```js
expect({ status: 200, text: 'Hello' }, 'to have body', 'Goodbye');
// AssertionError: Expected response body to equal string
```

**Negation**:

```js
expect({ status: 200, text: 'Hello' }, 'not to have body', 'Goodbye');
```

### {Response} to have JSON body

Asserts that a response has a JSON content-type and a body. Checks for `application/json` in either the `type` property or `content-type` header.

**Success**:

```js
const response = {
  status: 200,
  type: 'application/json',
  body: { users: [] },
};
expect(response, 'to have JSON body');

// Also works with content-type header
const response2 = {
  status: 200,
  headers: { 'content-type': 'application/json; charset=utf-8' },
  body: { data: 'test' },
};
expect(response2, 'to have JSON body');
```

**Failure**:

```js
const htmlResponse = {
  status: 200,
  type: 'text/html',
  body: '<html></html>',
};
expect(htmlResponse, 'to have JSON body');
// AssertionError: Expected response to have JSON content-type

const emptyResponse = {
  status: 204,
  type: 'application/json',
};
expect(emptyResponse, 'to have JSON body');
// AssertionError: Expected response to have a JSON body
```

**Negation**:

```js
const htmlResponse = {
  status: 200,
  type: 'text/html',
  body: '<html></html>',
};
expect(htmlResponse, 'not to have JSON body');
```

### {Response} to have JSON body satisfying {object}

Asserts that a response has a JSON body containing all specified properties with matching values. Uses partial/subset matching - the response may contain additional properties beyond those specified.

**Success**:

```js
const response = {
  status: 200,
  body: { id: 1, name: 'John', email: 'john@example.com' },
};

// Partial match - only checks specified properties
expect(response, 'to have JSON body satisfying', { id: 1 });
expect(response, 'to have JSON body satisfying', { name: 'John' });
expect(response, 'to have JSON body satisfying', { id: 1, name: 'John' });

// Nested objects
const nestedResponse = {
  status: 200,
  body: {
    user: { id: 1, profile: { name: 'John', age: 30 } },
    meta: { version: '1.0' },
  },
};
expect(nestedResponse, 'to have JSON body satisfying', {
  user: { profile: { name: 'John' } },
});

// Arrays
const arrayResponse = {
  status: 200,
  body: { users: [{ id: 1 }, { id: 2 }] },
};
expect(arrayResponse, 'to have JSON body satisfying', {
  users: [{ id: 1 }, { id: 2 }],
});
```

**Failure**:

```js
const response = {
  status: 200,
  body: { id: 1 },
};
expect(response, 'to have JSON body satisfying', { name: 'John' });
// AssertionError: Expected response body to satisfy specification

const response2 = {
  status: 200,
  body: { id: 1, name: 'Jane' },
};
expect(response2, 'to have JSON body satisfying', { name: 'John' });
// AssertionError: Expected response body to satisfy specification
```

**Negation**:

```js
const response = {
  status: 200,
  body: { id: 1, name: 'Jane' },
};
expect(response, 'not to have JSON body satisfying', { name: 'John' });
```

### {Response} to have body satisfying {RegExp}

Asserts that a response body (as text) matches a regex pattern.

**Success**:

```js
expect(
  { status: 200, text: 'Hello, World!' },
  'to have body satisfying',
  /World/,
);
expect(
  { status: 200, text: '{"id":123}' },
  'to have body satisfying',
  /"id":\d+/,
);
```

**Failure**:

```js
expect({ status: 200, text: 'Hello' }, 'to have body satisfying', /Goodbye/);
// AssertionError: Expected response body to match /Goodbye/

expect({ status: 200 }, 'to have body satisfying', /anything/);
// AssertionError: Expected response to have a body
```

**Negation**:

```js
expect(
  { status: 200, text: 'Hello' },
  'not to have body satisfying',
  /Goodbye/,
);
```

### {Response} to have body satisfying {object}

Asserts that a response body satisfies a partial object match. Similar to `to have JSON body satisfying` but doesn't require JSON content-type.

**Success**:

```js
const response = {
  status: 200,
  body: { id: 1, name: 'John', extra: 'ignored' },
};
expect(response, 'to have body satisfying', { id: 1 });
```

**Failure**:

```js
const response = {
  status: 200,
  body: { id: 1 },
};
expect(response, 'to have body satisfying', { name: 'John' });
// AssertionError: Expected response body to satisfy specification
```

**Negation**:

```js
const response = {
  status: 200,
  body: { id: 1 },
};
expect(response, 'not to have body satisfying', { name: 'John' });
```

### {Response} to redirect

Asserts that a response is a redirect (has a 3xx status code).

**Success**:

```js
expect({ status: 301 }, 'to redirect');
expect({ status: 302 }, 'to redirect');
expect({ status: 307 }, 'to redirect');
expect({ status: 308 }, 'to redirect');
```

**Failure**:

```js
expect({ status: 200 }, 'to redirect');
// AssertionError: Expected response to be a redirect, but got status 200

expect({ status: 404 }, 'to redirect');
// AssertionError: Expected response to be a redirect, but got status 404
```

**Negation**:

```js
expect({ status: 200 }, 'not to redirect');
```

### {Response} to redirect to {string}

Asserts that a response redirects to a specific URL. The response must be a redirect (3xx) and have a `Location` header matching the expected URL exactly.

**Success**:

```js
const response = {
  status: 302,
  headers: { location: '/login' },
};
expect(response, 'to redirect to', '/login');

const fullUrl = {
  status: 301,
  headers: { location: 'https://example.com/new-page' },
};
expect(fullUrl, 'to redirect to', 'https://example.com/new-page');
```

**Failure**:

```js
// Not a redirect
const okResponse = {
  status: 200,
  headers: { location: '/somewhere' },
};
expect(okResponse, 'to redirect to', '/somewhere');
// AssertionError: Expected response to be a redirect, but got status 200

// Missing Location header
expect({ status: 302 }, 'to redirect to', '/login');
// AssertionError: Expected redirect response to have a Location header

// Location doesn't match
const response = {
  status: 302,
  headers: { location: '/dashboard' },
};
expect(response, 'to redirect to', '/login');
// AssertionError: Expected redirect to "/login"
```

**Negation**:

```js
const response = {
  status: 302,
  headers: { location: '/dashboard' },
};
expect(response, 'not to redirect to', '/login');
```

### {Response} to redirect to {RegExp}

Asserts that a response redirects to a URL matching a pattern. The response must be a redirect (3xx) and have a `Location` header matching the regex.

**Success**:

```js
const response = {
  status: 302,
  headers: { location: '/auth/login?redirect=/dashboard' },
};
expect(response, 'to redirect to', /\/auth/);
expect(response, 'to redirect to', /redirect=/);
expect(response, 'to redirect to', /^\/auth\/login/);
```

**Failure**:

```js
// Not a redirect
const okResponse = {
  status: 200,
  headers: { location: '/somewhere' },
};
expect(okResponse, 'to redirect to', /somewhere/);
// AssertionError: Expected response to be a redirect, but got status 200

// Location doesn't match pattern
const response = {
  status: 302,
  headers: { location: '/dashboard' },
};
expect(response, 'to redirect to', /login/);
// AssertionError: Expected redirect Location to match /login/
```

**Negation**:

```js
const response = {
  status: 302,
  headers: { location: '/dashboard' },
};
expect(response, 'not to redirect to', /login/);
```

## Compatible Response Objects

This library works with any object that has a numeric `status` property. It's designed to be compatible with:

- **supertest** responses
- **superagent** responses (uses `header` instead of `headers`)
- **fetch** responses (after calling `.json()` or similar)
- **axios** responses
- Plain objects for testing

```js
// Minimal response
expect({ status: 200 }, 'to have status', 200);

// supertest/superagent style
expect(
  {
    status: 200,
    headers: { 'content-type': 'application/json' },
    body: { users: [] },
    text: '{"users":[]}',
    type: 'application/json',
  },
  'to have JSON body',
);

// superagent uses 'header' (singular)
expect(
  {
    status: 200,
    header: { 'content-type': 'text/html' },
  },
  'to have header',
  'content-type',
);
```

## License

Copyright © 2026 [Christopher "boneskull" Hiller][boneskull]. Licensed under [BlueOak-1.0.0](https://blueoakcouncil.org/license/1.0.0).

[boneskull]: https://github.com/boneskull
