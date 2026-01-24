import { use } from 'bupkis';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, it } from 'node:test';

import type { TrackedServer } from '../src/types.js';

import { mswAssertions } from '../src/assertions.js';
import { isTrackedServer } from '../src/guards.js';
import { createTrackedServer, waitForBodies } from '../src/tracker.js';

const { expect, expectAsync } = use(mswAssertions);

// Base URL for testing - MSW intercepts requests to this URL
const BASE_URL = 'https://api.example.com';

describe('@bupkis/msw', () => {
  let server: TrackedServer;

  beforeEach(() => {
    server = createTrackedServer(
      http.get(`${BASE_URL}/api/users`, () =>
        HttpResponse.json([{ id: 1, name: 'Alice' }]),
      ),
      http.post(`${BASE_URL}/api/users`, async ({ request }) => {
        const body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ id: 2, ...body });
      }),
      http.get(`${BASE_URL}/api/users/:id`, ({ params }) =>
        HttpResponse.json({ id: params.id, name: 'User' }),
      ),
      http.delete(
        `${BASE_URL}/api/users/:id`,
        () => new HttpResponse(null, { status: 204 }),
      ),
    );
    server.listen({ onUnhandledRequest: 'bypass' });
  });

  afterEach(() => {
    server.close();
  });

  describe('isTrackedServer', () => {
    it('should return true for tracked servers', () => {
      expect(isTrackedServer(server), 'to be true');
    });

    it('should return false for non-tracked values', () => {
      expect(isTrackedServer({}), 'to be false');
      expect(isTrackedServer(null), 'to be false');
      expect(isTrackedServer('string'), 'to be false');
    });
  });

  describe('TrackedServer', () => {
    it('should track requests', async () => {
      await fetch(`${BASE_URL}/api/users`);
      expect(server.trackedRequests.length, 'to be', 1);
      expect(server.trackedRequests[0]?.method, 'to be', 'GET');
      expect(server.trackedRequests[0]?.pathname, 'to be', '/api/users');
    });

    it('should clear tracked requests', async () => {
      await fetch(`${BASE_URL}/api/users`);
      expect(server.trackedRequests.length, 'to be', 1);
      server.clearTrackedRequests();
      expect(server.trackedRequests.length, 'to be', 0);
    });

    it('should have isTrackedServer property', () => {
      expect(server.isTrackedServer, 'to be true');
    });
  });

  describe('waitForBodies', () => {
    it('should return requests with parsed bodies', async () => {
      await fetch(`${BASE_URL}/api/users`, {
        body: JSON.stringify({ age: 30, name: 'Alice' }),
        headers: { 'content-type': 'application/json' },
        method: 'POST',
      });
      await fetch(`${BASE_URL}/api/users`, {
        body: JSON.stringify({ name: 'Bob' }),
        headers: { 'content-type': 'application/json' },
        method: 'POST',
      });

      // waitForBodies returns the requests with bodies resolved
      const requests = await waitForBodies(server);

      expect(requests, 'to satisfy', [
        { body: { age: 30, name: 'Alice' } },
        { body: { name: 'Bob' } },
      ]);
    });
  });

  describe('to have handled request to', () => {
    it('should pass when request was handled', async () => {
      await fetch(`${BASE_URL}/api/users`);
      expect(server, 'to have handled request to', '/api/users');
    });

    it('should fail when request was not handled', () => {
      expect(server, 'not to have handled request to', '/api/unknown');
    });

    it('should match with method option', async () => {
      await fetch(`${BASE_URL}/api/users`, { body: '{}', method: 'POST' });
      expect(server, 'to have handled request to', '/api/users', {
        method: 'POST',
      });
    });

    it('should fail when method does not match', async () => {
      await fetch(`${BASE_URL}/api/users`);
      expect(
        () =>
          expect(server, 'to have handled request to', '/api/users', {
            method: 'POST',
          }),
        'to throw',
      );
    });

    it('should match with body option', async () => {
      await fetch(`${BASE_URL}/api/users`, {
        body: JSON.stringify({ name: 'Bob' }),
        headers: { 'content-type': 'application/json' },
        method: 'POST',
      });
      // Use expectAsync for body matching - it awaits body parsing automatically
      await expectAsync(server, 'to have handled request to', '/api/users', {
        body: { name: 'Bob' },
        method: 'POST',
      });
    });

    it('should use satisfy semantics for body matching', async () => {
      await fetch(`${BASE_URL}/api/users`, {
        body: JSON.stringify({ extra: 'field', name: 'Bob' }),
        headers: { 'content-type': 'application/json' },
        method: 'POST',
      });
      // Use expectAsync - should pass with partial match
      await expectAsync(server, 'to have handled request to', '/api/users', {
        body: { name: 'Bob' },
        method: 'POST',
      });
    });

    it('should match with array body', async () => {
      await fetch(`${BASE_URL}/api/users`, {
        body: JSON.stringify([{ name: 'Alice' }, { name: 'Bob' }]),
        headers: { 'content-type': 'application/json' },
        method: 'POST',
      });
      // Arrays work because they're objects - Object.entries gives indexed keys
      await expectAsync(server, 'to have handled request to', '/api/users', {
        body: [{ name: 'Alice' }, { name: 'Bob' }],
        method: 'POST',
      });
    });

    it('should match with headers option (exact)', async () => {
      await fetch(`${BASE_URL}/api/users`, {
        headers: { 'x-custom': 'value' },
      });
      expect(server, 'to have handled request to', '/api/users', {
        headers: { 'x-custom': 'value' },
      });
    });

    it('should match with headers option (regex)', async () => {
      await fetch(`${BASE_URL}/api/users`, {
        headers: { authorization: 'Bearer abc123' },
      });
      expect(server, 'to have handled request to', '/api/users', {
        headers: { authorization: /^Bearer / },
      });
    });

    it('should match with times option', async () => {
      await fetch(`${BASE_URL}/api/users`);
      await fetch(`${BASE_URL}/api/users`);
      await fetch(`${BASE_URL}/api/users`);
      expect(server, 'to have handled request to', '/api/users', { times: 3 });
    });

    it('should fail when times does not match', async () => {
      await fetch(`${BASE_URL}/api/users`);
      await fetch(`${BASE_URL}/api/users`);
      expect(
        () =>
          expect(server, 'to have handled request to', '/api/users', {
            times: 3,
          }),
        'to throw',
      );
    });

    it('should match with once option', async () => {
      await fetch(`${BASE_URL}/api/users`);
      expect(server, 'to have handled request to', '/api/users', {
        once: true,
      });
    });

    it('should fail when once but called multiple times', async () => {
      await fetch(`${BASE_URL}/api/users`);
      await fetch(`${BASE_URL}/api/users`);
      expect(
        () =>
          expect(server, 'to have handled request to', '/api/users', {
            once: true,
          }),
        'to throw',
      );
    });
  });

  describe('to have handled request matching', () => {
    it('should pass when request matches pattern', async () => {
      await fetch(`${BASE_URL}/api/users/123`);
      expect(server, 'to have handled request matching', /\/api\/users\/\d+/);
    });

    it('should fail when no request matches pattern', () => {
      expect(
        server,
        'not to have handled request matching',
        /\/api\/admin\/\d+/,
      );
    });

    it('should match with method option', async () => {
      await fetch(`${BASE_URL}/api/users/123`, { method: 'DELETE' });
      expect(server, 'to have handled request matching', /\/api\/users\/\d+/, {
        method: 'DELETE',
      });
    });
  });

  describe('to have handled request matching (negation)', () => {
    it('should pass negation when no request matches pattern', () => {
      expect(server, 'not to have handled request matching', /\/api\/admin/);
    });

    it('should fail negation when request matches pattern', async () => {
      await fetch(`${BASE_URL}/api/users/123`);
      expect(
        () =>
          expect(
            server,
            'not to have handled request matching',
            /\/api\/users\/\d+/,
          ),
        'to throw',
      );
    });
  });

  describe('to have handled N requests', () => {
    it('should pass when count matches', async () => {
      await fetch(`${BASE_URL}/api/users`);
      await fetch(`${BASE_URL}/api/users/1`);
      await fetch(`${BASE_URL}/api/users/2`);
      expect(server, 'to have handled', 3, 'requests');
    });

    it('should fail when count does not match', async () => {
      await fetch(`${BASE_URL}/api/users`);
      expect(server, 'not to have handled', 5, 'requests');
    });
  });

  describe('to have handled requests', () => {
    it('should pass when requests were tracked', async () => {
      await fetch(`${BASE_URL}/api/users`);
      expect(server, 'to have handled requests');
    });

    it('should fail when no requests tracked (use negation)', () => {
      expect(server, 'not to have handled requests');
    });
  });
});
