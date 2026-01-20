/**
 * Manual testing script for @bupkis/http with real HTTP responses.
 *
 * Run with: npx tsx examples/manual-test.ts
 */

import { createServer, type Server } from 'node:http';

import { use } from 'bupkis';

import httpAssertions from '../src/index.js';

const { expect } = use(httpAssertions);

/**
 * Adapts a fetch Response to the shape expected by @bupkis/http.
 */
async function adaptFetchResponse(response: Response) {
  const text = await response.text();
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }

  // Convert Headers to plain object
  const headers: Record<string, string> = {};
  response.headers.forEach((value, key) => {
    headers[key] = value;
  });

  return {
    status: response.status,
    headers,
    body,
    text,
    type: response.headers.get('content-type') ?? undefined,
  };
}

/**
 * Creates a test server with various endpoints.
 */
function createTestServer(): Server {
  return createServer((req, res) => {
    const url = new URL(req.url ?? '/', `http://localhost`);

    switch (url.pathname) {
      case '/json':
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'hello', users: [{ id: 1 }] }));
        break;

      case '/text':
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('Hello, World!');
        break;

      case '/redirect':
        res.writeHead(302, { Location: '/destination' });
        res.end();
        break;

      case '/redirect-pattern':
        res.writeHead(301, { Location: '/auth/login?redirect=/dashboard' });
        res.end();
        break;

      case '/not-found':
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not found' }));
        break;

      case '/server-error':
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal server error' }));
        break;

      case '/custom-header':
        res.writeHead(200, {
          'Content-Type': 'text/plain',
          'X-Request-Id': 'abc-123',
          'X-Rate-Limit': '100',
        });
        res.end('OK');
        break;

      default:
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('OK');
    }
  });
}

async function runTests() {
  const server = createTestServer();

  await new Promise<void>((resolve) => {
    server.listen(0, () => resolve());
  });

  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Failed to get server address');
  }
  const baseUrl = `http://localhost:${address.port}`;

  console.log(`Test server running at ${baseUrl}\n`);
  console.log('Running manual tests with real HTTP responses...\n');

  let passed = 0;
  let failed = 0;

  async function test(name: string, fn: () => Promise<void>) {
    try {
      await fn();
      console.log(`  \u2714 ${name}`);
      passed++;
    } catch (err) {
      console.log(`  \u2718 ${name}`);
      console.log(`    ${(err as Error).message}`);
      failed++;
    }
  }

  // Status assertions
  console.log('Status assertions:');
  await test('to have status (exact)', async () => {
    const res = await adaptFetchResponse(await fetch(`${baseUrl}/json`));
    expect(res, 'to have status', 200);
  });

  await test('to have status (category: ok)', async () => {
    const res = await adaptFetchResponse(await fetch(`${baseUrl}/json`));
    expect(res, 'to have status', 'ok');
  });

  await test('to have status (category: client error)', async () => {
    const res = await adaptFetchResponse(await fetch(`${baseUrl}/not-found`));
    expect(res, 'to have status', 'client error');
  });

  await test('to have status (category: server error)', async () => {
    const res = await adaptFetchResponse(
      await fetch(`${baseUrl}/server-error`),
    );
    expect(res, 'to have status', 'server error');
  });

  // Header assertions
  console.log('\nHeader assertions:');
  await test('to have header (existence)', async () => {
    const res = await adaptFetchResponse(
      await fetch(`${baseUrl}/custom-header`),
    );
    expect(res, 'to have header', 'x-request-id');
  });

  await test('to have header (exact value)', async () => {
    const res = await adaptFetchResponse(
      await fetch(`${baseUrl}/custom-header`),
    );
    expect(res, 'to have header', 'x-request-id', 'abc-123');
  });

  await test('to have header (pattern)', async () => {
    const res = await adaptFetchResponse(
      await fetch(`${baseUrl}/custom-header`),
    );
    expect(res, 'to have header', 'x-rate-limit', /\d+/);
  });

  // Body assertions
  console.log('\nBody assertions:');
  await test('to have body', async () => {
    const res = await adaptFetchResponse(await fetch(`${baseUrl}/json`));
    expect(res, 'to have body');
  });

  await test('to have body (exact string)', async () => {
    const res = await adaptFetchResponse(await fetch(`${baseUrl}/text`));
    expect(res, 'to have body', 'Hello, World!');
  });

  await test('to have JSON body', async () => {
    const res = await adaptFetchResponse(await fetch(`${baseUrl}/json`));
    expect(res, 'to have JSON body');
  });

  await test('to have JSON body satisfying', async () => {
    const res = await adaptFetchResponse(await fetch(`${baseUrl}/json`));
    expect(res, 'to have JSON body satisfying', { message: 'hello' });
  });

  await test('to have body satisfying (regex)', async () => {
    const res = await adaptFetchResponse(await fetch(`${baseUrl}/text`));
    expect(res, 'to have body satisfying', /Hello/);
  });

  await test('to have body satisfying (object)', async () => {
    const res = await adaptFetchResponse(await fetch(`${baseUrl}/json`));
    expect(res, 'to have body satisfying', { users: [{ id: 1 }] });
  });

  // Redirect assertions
  console.log('\nRedirect assertions:');
  await test('to redirect', async () => {
    const res = await adaptFetchResponse(
      await fetch(`${baseUrl}/redirect`, { redirect: 'manual' }),
    );
    expect(res, 'to redirect');
  });

  await test('to redirect to (exact URL)', async () => {
    const res = await adaptFetchResponse(
      await fetch(`${baseUrl}/redirect`, { redirect: 'manual' }),
    );
    expect(res, 'to redirect to', '/destination');
  });

  await test('to redirect to (pattern)', async () => {
    const res = await adaptFetchResponse(
      await fetch(`${baseUrl}/redirect-pattern`, { redirect: 'manual' }),
    );
    expect(res, 'to redirect to', /\/auth\/login/);
  });

  // Negation tests
  console.log('\nNegation assertions:');
  await test('not to have status', async () => {
    const res = await adaptFetchResponse(await fetch(`${baseUrl}/json`));
    expect(res, 'not to have status', 404);
  });

  await test('not to redirect', async () => {
    const res = await adaptFetchResponse(await fetch(`${baseUrl}/json`));
    expect(res, 'not to redirect');
  });

  // Cleanup
  server.close();

  console.log(`\n${'='.repeat(40)}`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log('='.repeat(40));

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
