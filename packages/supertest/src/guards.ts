/**
 * Type guards for HTTP response detection.
 *
 * @packageDocumentation
 */

/**
 * Represents an HTTP response object.
 *
 * This interface is designed to be compatible with:
 *
 * - Supertest/superagent Response objects
 * - Fetch Response objects (after conversion)
 * - Axios Response objects
 *
 * @example
 *
 * ```ts
 * // With supertest
 * const response = await request(app).get('/api/users');
 * // response satisfies HttpResponse
 *
 * // With fetch (after conversion)
 * const fetchResponse = await fetch('/api/users');
 * const response: HttpResponse = {
 *   status: fetchResponse.status,
 *   headers: Object.fromEntries(fetchResponse.headers),
 *   body: await fetchResponse.json(),
 * };
 * ```
 */
export interface HttpResponse {
  /**
   * Parsed response body.
   *
   * For JSON responses, this is the parsed object. For other responses, it may
   * be undefined or a string.
   */
  body?: unknown;

  /**
   * HTTP response headers (alternative property name).
   *
   * Superagent uses `header` (singular) for the same purpose.
   */
  header?: Record<string, string | string[] | undefined>;

  /**
   * HTTP response headers.
   *
   * Supertest uses `headers` as a record.
   */
  headers?: Record<string, string | string[] | undefined>;

  /**
   * HTTP status code (e.g., 200, 404, 500).
   */
  status: number;

  /**
   * Raw response body as text.
   */
  text?: string;

  /**
   * Content-Type of the response (without parameters).
   *
   * Supertest normalizes this from the Content-Type header.
   */
  type?: string;
}

/**
 * Checks if a value is an HTTP response object.
 *
 * @example
 *
 * ```ts
 * const response = await request(app).get('/api/users');
 * if (isHttpResponse(response)) {
 *   console.log(response.status); // TypeScript knows this is a number
 * }
 * ```
 *
 * @function
 * @param value - The value to check
 * @returns `true` if the value has a numeric `status` property
 */
export const isHttpResponse = (value: unknown): value is HttpResponse => {
  if (value === null || typeof value !== 'object') {
    return false;
  }
  const obj = value as Record<string, unknown>;
  return typeof obj.status === 'number';
};
