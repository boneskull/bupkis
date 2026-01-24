/**
 * Request tracking wrapper for MSW servers.
 *
 * @packageDocumentation
 */

import type { RequestHandler } from 'msw';

import { SetupServerApi } from 'msw/node';

import type { TrackedRequest, TrackedServer } from './types.js';

import { kTrackedServer } from './guards.js';

/**
 * Parses request headers into a plain object.
 *
 * @function
 * @param headers - Headers object from the request
 * @returns Record of header name to value
 * @internal
 */
const parseHeaders = (headers: Headers): Record<string, string> => {
  const result: Record<string, string> = {};
  headers.forEach((value, key) => {
    result[key.toLowerCase()] = value;
  });
  return result;
};

/**
 * Parses the request body asynchronously based on content type.
 *
 * @function
 * @param request - Request object
 * @returns Parsed body (JSON object, string, or undefined)
 * @internal
 */
const parseBodyAsync = async (request: Request): Promise<unknown> => {
  const contentType = request.headers.get('content-type') ?? '';

  try {
    if (contentType.includes('application/json')) {
      return await request.json();
    }
    if (
      contentType.includes('text/') ||
      contentType.includes('application/x-www-form-urlencoded')
    ) {
      return await request.text();
    }
    // For other content types, try text first
    const text = await request.text();
    if (text) {
      try {
        const { parse } = JSON;
        return parse(text) as unknown;
      } catch {
        return text;
      }
    }
  } catch {
    // Body parsing failed, return undefined
  }
  return undefined;
};

/**
 * Internal tracked request type (same as public type since bodyPromise is now
 * exposed).
 *
 * @internal
 */
type InternalTrackedRequest = TrackedRequest;

/**
 * Pending request data captured during request:start.
 *
 * @internal
 */
interface PendingRequest {
  bodyPromise: Promise<unknown>;
  headers: Record<string, string>;
  method: string;
  pathname: string;
  request: Request;
  requestId: string;
  timestamp: number;
  url: string;
}

/**
 * MSW server with request tracking capabilities.
 *
 * Extends MSW's `SetupServerApi` with lifecycle event listeners that capture
 * request details when handlers match and respond. Use the `trackedRequests`
 * property to inspect handled requests in assertions.
 *
 * @example
 *
 * ```ts
 * import { createTrackedServer } from '@bupkis/msw';
 * import { http, HttpResponse } from 'msw';
 *
 * const server = createTrackedServer(
 *   http.get('/api/users', () =>
 *     HttpResponse.json([{ id: 1, name: 'Alice' }]),
 *   ),
 *   http.post('/api/users', () => HttpResponse.json({ id: 2 })),
 * );
 *
 * server.listen();
 *
 * await fetch('https://api.example.com/api/users');
 * await fetch('https://api.example.com/api/users', {
 *   method: 'POST',
 *   body: '{}',
 * });
 *
 * console.log(server.trackedRequests.length); // 2
 * console.log(server.trackedRequests[0].method); // 'GET'
 * console.log(server.trackedRequests[1].method); // 'POST'
 *
 * server.clearTrackedRequests(); // Reset tracking
 * server.close();
 * ```
 *
 * @example Using `using` syntax (TypeScript 5.2+)
 *
 * ```ts
 * {
 *   using server = createTrackedServer(
 *     http.get('/api/users', () => HttpResponse.json([])),
 *   );
 *   server.listen();
 *   await fetch('https://api.example.com/api/users');
 *   // server.close() called automatically when block exits
 * }
 * ```
 */
class TrackedServerImpl
  extends SetupServerApi
  implements Disposable, TrackedServer
{
  readonly [kTrackedServer] = true;

  /**
   * Type guard marker for identifying tracked servers.
   */
  get isTrackedServer(): true {
    return true;
  }

  /**
   * Array of all tracked requests (copies, not live references).
   */
  get trackedRequests(): TrackedRequest[] {
    return [...this.#trackedRequests];
  }

  #boundListeners?: {
    onRequestStart: (event: { request: Request; requestId: string }) => void;
    onRequestUnhandled: (event: { requestId: string }) => void;
    onResponseMocked: (event: { requestId: string }) => void;
  };

  #pendingRequests = new Map<string, PendingRequest>();

  #trackedRequests: InternalTrackedRequest[] = [];

  constructor(...handlers: RequestHandler[]) {
    super(handlers);
    this.#setupEventListeners();
  }

  /**
   * Clears all tracked request history.
   */
  clearTrackedRequests(): void {
    this.#trackedRequests.length = 0;
  }

  /**
   * Disposes the server by calling `close()`.
   *
   * Enables `using` syntax in TypeScript 5.2+.
   */
  // eslint-disable-next-line custom/require-intrinsic-destructuring -- well-known symbols are non-writable
  [Symbol.dispose](): void {
    this.#cleanup();

    // Defensive: call superclass dispose if it exists (future-proofing)
    const { getPrototypeOf } = Object;
    const proto = getPrototypeOf(this) as Partial<Disposable>;
    // eslint-disable-next-line custom/require-intrinsic-destructuring -- well-known symbols are non-writable
    const superDispose = proto[Symbol.dispose];
    if (typeof superDispose === 'function') {
      superDispose.call(this);
    } else {
      this.close();
    }
  }

  /**
   * Removes event listeners and clears pending state.
   */
  #cleanup(): void {
    if (this.#boundListeners) {
      this.events.removeListener(
        'request:start',
        this.#boundListeners.onRequestStart,
      );
      this.events.removeListener(
        'response:mocked',
        this.#boundListeners.onResponseMocked,
      );
      this.events.removeListener(
        'request:unhandled',
        this.#boundListeners.onRequestUnhandled,
      );
      this.#boundListeners = undefined;
    }
    this.#pendingRequests.clear();
    this.#trackedRequests.length = 0;
  }

  /**
   * Sets up MSW lifecycle event listeners for request tracking.
   */
  #setupEventListeners(): void {
    // Capture request data early, before the handler consumes the body
    /**
     * @function
     */
    const onRequestStart = ({
      request,
      requestId,
    }: {
      request: Request;
      requestId: string;
    }) => {
      const url = new URL(request.url);

      // Clone the request BEFORE the handler can consume the body
      let bodyPromise: Promise<unknown>;
      try {
        const clonedRequest = request.clone();
        bodyPromise = parseBodyAsync(clonedRequest);
      } catch {
        bodyPromise = Promise.resolve(undefined);
      }

      const { now } = Date;
      this.#pendingRequests.set(requestId, {
        bodyPromise,
        headers: parseHeaders(request.headers),
        method: request.method,
        pathname: url.pathname,
        request,
        requestId,
        timestamp: now(),
        url: request.url,
      });
    };

    /**
     * When a mocked response is sent, move the request to tracked requests
     *
     * @function
     */
    const onResponseMocked = ({ requestId }: { requestId: string }) => {
      const pending = this.#pendingRequests.get(requestId);
      if (!pending) {
        return;
      }

      this.#pendingRequests.delete(requestId);

      const tracked: InternalTrackedRequest = {
        body: undefined,
        bodyPromise: pending.bodyPromise,
        headers: pending.headers,
        method: pending.method,
        pathname: pending.pathname,
        request: pending.request,
        requestId: pending.requestId,
        timestamp: pending.timestamp,
        url: pending.url,
      };

      // Update body when promise resolves
      void pending.bodyPromise.then((body) => {
        tracked.body = body;
      });

      this.#trackedRequests.push(tracked);
    };

    // Clean up unmatched requests
    /**
     * @function
     */
    const onRequestUnhandled = ({ requestId }: { requestId: string }) => {
      this.#pendingRequests.delete(requestId);
    };

    // Store references for cleanup
    this.#boundListeners = {
      onRequestStart,
      onRequestUnhandled,
      onResponseMocked,
    };

    // Register listeners
    this.events.on('request:start', onRequestStart);
    this.events.on('response:mocked', onResponseMocked);
    this.events.on('request:unhandled', onRequestUnhandled);
  }
}

/**
 * Creates a tracked MSW server that records all handled requests.
 *
 * This is a drop-in replacement for MSW's `setupServer` that adds request
 * tracking capabilities for use with bupkis assertions.
 *
 * @example
 *
 * ```ts
 * import { createTrackedServer } from '@bupkis/msw';
 * import { http, HttpResponse } from 'msw';
 *
 * const server = createTrackedServer(
 *   http.get('/api/users', () =>
 *     HttpResponse.json([{ id: 1, name: 'Alice' }]),
 *   ),
 * );
 *
 * server.listen();
 * // ... make requests ...
 * expect(server, 'to have handled request to', '/api/users');
 * server.close();
 * ```
 *
 * @function
 * @param handlers - MSW request handlers to register
 * @returns A TrackedServer instance with request tracking capabilities
 */
export const createTrackedServer = (
  ...handlers: RequestHandler[]
): TrackedServer => new TrackedServerImpl(...handlers);

/**
 * Waits for all tracked request bodies to be parsed and returns the requests.
 *
 * Use this when you need to access `req.body` directly. For body assertions,
 * prefer using `expectAsync` which handles this automatically.
 *
 * @example
 *
 * ```ts
 * await fetch(url, {
 *   method: 'POST',
 *   body: JSON.stringify({ name: 'Bob' }),
 * });
 * const requests = await waitForBodies(server);
 * console.log(requests[0].body); // { name: 'Bob' }
 * ```
 *
 * @function
 * @param server - The tracked server
 * @returns Promise resolving to tracked requests with bodies parsed
 */
export const waitForBodies = async (
  server: TrackedServer,
): Promise<TrackedRequest[]> => {
  const requests = server.trackedRequests;
  await Promise.all(requests.map((req) => req.bodyPromise));
  return requests;
};
