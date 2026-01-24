/**
 * Type definitions for MSW request tracking.
 *
 * @packageDocumentation
 */

import type { SetupServer } from 'msw/node';

/**
 * A path matcher for request assertions.
 *
 * Can be a string (exact pathname match) or RegExp (pattern match).
 */
export type PathMatcher = RegExp | string;

/**
 * Options for request matching assertions.
 *
 * @example
 *
 * ```ts
 * // Match POST requests with specific body
 * expect(server, 'to have handled request to', '/api/users', {
 *   method: 'POST',
 *   body: { name: 'Alice' },
 * });
 *
 * // Match requests with specific headers
 * expect(server, 'to have handled request to', '/api/users', {
 *   headers: { authorization: /^Bearer / },
 * });
 *
 * // Match request count
 * expect(server, 'to have handled request to', '/api/users', { times: 3 });
 * expect(server, 'to have handled request to', '/api/users', {
 *   once: true,
 * });
 * ```
 */
export interface RequestMatchOptions {
  /**
   * Expected request body (uses "to satisfy" semantics for matching).
   */
  body?: unknown;

  /**
   * Expected headers. Values can be strings (exact match) or RegExp patterns.
   */
  headers?: Record<string, RegExp | string>;

  /**
   * HTTP method to match (case-insensitive).
   */
  method?: string;

  /**
   * Shorthand for `times: 1`.
   */
  once?: boolean;

  /**
   * Exact number of times the request should have been made.
   */
  times?: number;
}

/**
 * Represents a tracked HTTP request with its parsed details.
 *
 * Captured when MSW handles a request through the `response:mocked` lifecycle
 * event.
 *
 * @example
 *
 * ```ts
 * const server = createTrackedServer(http.get('/api/users', () => ...));
 * server.listen();
 * await fetch('http://localhost/api/users');
 *
 * const [request] = server.trackedRequests;
 * console.log(request.method); // 'GET'
 * console.log(request.pathname); // '/api/users'
 * ```
 */
export interface TrackedRequest {
  /**
   * Parsed request body (JSON, text, or undefined).
   *
   * Note: This may be `undefined` initially while async parsing completes. Use
   * `bodyPromise` to await the parsed body.
   */
  body: unknown;

  /**
   * Promise that resolves to the parsed request body.
   *
   * Await this to ensure body parsing is complete before checking body content.
   */
  bodyPromise: Promise<unknown>;

  /**
   * Request headers as a key-value record.
   */
  headers: Record<string, string>;

  /**
   * HTTP method (GET, POST, etc.).
   */
  method: string;

  /**
   * URL pathname (without query string).
   */
  pathname: string;

  /**
   * The original Request object from the fetch event.
   */
  request: Request;

  /**
   * MSW's unique identifier for this request.
   */
  requestId: string;

  /**
   * The mocked Response object, if available.
   */
  response?: Response;

  /**
   * Timestamp when the request was tracked (ms since epoch).
   */
  timestamp: number;

  /**
   * Full URL string of the request.
   */
  url: string;
}

/**
 * A server instance with request tracking capabilities.
 *
 * Wraps MSW's `SetupServer` with additional methods and properties for tracking
 * and inspecting handled requests. Implements `Disposable` for automatic
 * cleanup with `using` syntax.
 *
 * @example
 *
 * ```ts
 * const server = createTrackedServer(
 *   http.get('/api/users', () => HttpResponse.json([])),
 * );
 *
 * server.listen();
 * await fetch('http://localhost/api/users');
 *
 * // Access tracked requests
 * console.log(server.trackedRequests);
 *
 * // Clear tracking history
 * server.clearTrackedRequests();
 *
 * // Type guard marker
 * console.log(server.isTrackedServer); // true
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
 *   await fetch('http://localhost/api/users');
 *   // server.close() called automatically when block exits
 * }
 * ```
 */
export interface TrackedServer extends Disposable, SetupServer {
  /**
   * Clears all tracked request history.
   */
  clearTrackedRequests(): void;

  /**
   * Type guard marker for identifying tracked servers.
   */
  readonly isTrackedServer: true;

  /**
   * Array of all tracked requests (copies, not live references).
   */
  readonly trackedRequests: TrackedRequest[];
}
