/**
 * Adapter for node:test's built-in snapshot support.
 *
 * Node.js native test runner includes snapshot testing capabilities as of
 * Node.js v20. This adapter delegates to node:test's native `assert.snapshot()`
 * function while providing the unified BUPKIS snapshot interface.
 *
 * @packageDocumentation
 * @see https://nodejs.org/api/test.html#snapshots
 */

import { AssertionError as NodeTestAssertionError } from 'node:assert';
import { type TestContext } from 'node:test';
import { inspect } from 'node:util';

import type {
  SnapshotAdapter,
  SnapshotContext,
  SnapshotOptions,
} from '../adapter.js';

import { isA, isError } from '../../guards.js';
import { type AssertionFailure } from '../../types.js';
import { isTestContext } from '../adapter.js';
import { defaultSerializer } from '../serializer.js';

/**
 * Node:test context interface.
 *
 * This represents the test context object passed to test callbacks in
 * node:test.
 *
 * @example
 *
 * ```typescript
 * import test from 'node:test';
 *
 * test('my test', (t) => {
 *   // t is NodeTestContext
 *   t.assert.snapshot(value);
 * });
 * ```
 */
type NodeTestContext = TestContext;

/**
 * Adapter for node:test snapshot support.
 *
 * This adapter leverages node:test's native snapshot functionality while
 * providing the unified BUPKIS snapshot interface. It's the preferred adapter
 * when running tests with node:test.
 *
 * **Features:**
 *
 * - Delegates to native `assert.snapshot()`
 * - Supports custom serializers
 * - Automatically detects update mode from CLI flags
 * - Zero configuration required
 *
 * **Detection:** The adapter detects node:test by checking for
 * `context.assert.snapshot`.
 *
 * **Update Mode:** Respects the `--test-update-snapshots` flag.
 *
 * @example
 *
 * ```typescript
 * import test from 'node:test';
 * import { expect } from 'bupkis';
 *
 * test('renders component', (t) => {
 *   const output = render(<MyComponent />);
 *   expect(output, 'to match snapshot', t);
 * });
 * ```
 *
 * @example
 *
 * ```typescript
 * // With custom serializer
 * test('redacts secrets', (t) => {
 *   const data = { public: 'visible', secret: 'password123' };
 *   expect(data, 'to match snapshot', t, {
 *     serializer: (value: any) =>
 *       JSON.stringify({ ...value, secret: '[REDACTED]' }, null, 2),
 *   });
 * });
 * ```
 */
export class NodeTestAdapter implements SnapshotAdapter {
  /**
   * Adapter name for identification and debugging.
   */
  readonly name = 'node:test';

  /**
   * Check if this adapter can handle the given context.
   *
   * Returns `true` if the context has the structure of a node:test context,
   * specifically checking for `context.assert.snapshot`.
   *
   * @param context - Test context to check
   * @returns `true` if this is a node:test context
   */
  canHandle(context: unknown): boolean {
    return isNodeTestContext(context);
  }

  /**
   * Extract snapshot context from node:test context.
   *
   * Extracts:
   *
   * - **testPath**: The test name from `context.name`
   * - **filePath**: Extracted from stack trace
   * - **isUpdateMode**: Detected from `--test-update-snapshots` flag
   *
   * @param context - Node:test context object
   * @returns Normalized snapshot context
   * @throws {TypeError} If context is not a valid node:test context
   */
  getContext(context: unknown): SnapshotContext {
    if (!isNodeTestContext(context)) {
      throw new TypeError('Invalid node:test context');
    }

    return {
      filePath: getTestFilePathFromStack(),
      isUpdateMode: isNodeTestUpdateMode(),
      testPath: context.name,
    };
  }

  /**
   * Perform snapshot assertion using node:test's native functionality.
   *
   * This method delegates to `context.assert.snapshot()`, which handles:
   *
   * - Snapshot file creation and management
   * - Snapshot comparison
   * - Update mode behavior
   * - Error messages and diffs
   *
   * If a custom serializer is provided in options, it will be passed to
   * node:test as a serializer function.
   *
   * @example
   *
   * ```typescript
   * const adapter = new NodeTestAdapter();
   * adapter.assertSnapshot({ foo: 'bar' }, testContext);
   * ```
   *
   * @param value - Value to snapshot
   * @param context - Node:test context object
   * @param options - Optional serialization options
   * @throws {TypeError} If context is not a valid node:test context
   * @throws {AssertionError} If snapshot doesn't match (via node:test)
   */
  validateSnapshot(
    value: unknown,
    context: TestContext,
    options?: SnapshotOptions,
  ): AssertionFailure | void {
    if (!isNodeTestContext(context)) {
      throw new TypeError('Invalid node:test context');
    }

    // Use custom serializer if provided, otherwise use default serializer
    // to handle circular references and special types
    const serializers = options?.serializer
      ? [options.serializer]
      : [defaultSerializer];

    try {
      // Build snapshot options - include hint as name if provided
      const snapshotOptions: {
        name?: string;
        serializers?: Array<(value: unknown) => string>;
      } = { serializers };

      if (options?.hint) {
        snapshotOptions.name = options.hint;
      }

      context.assert.snapshot(value, snapshotOptions);
    } catch (err) {
      if (isNodeAssertionError(err)) {
        return {
          actual: err.actual,
          expected: err.expected,
          message: err.message,
        };
      }
      if (isError(err)) {
        return {
          message: err.message,
        };
      }
      return {
        message: inspect(err),
      };
    }
  }
}

/**
 * Extract the test file path from the stack trace.
 *
 * This is a fallback method used when the test context doesn't provide the file
 * path directly. It searches the stack trace for lines that look like test file
 * paths (containing `.test.` or `.spec.`).
 *
 * @example
 *
 * ```typescript
 * // If called from /path/to/my.test.ts, returns '/path/to/my.test.ts'
 * const filePath = getTestFilePathFromStack();
 * ```
 *
 * @function
 * @returns Absolute file path, or 'unknown' if not found
 */
const getTestFilePathFromStack = (): string => {
  const stack = new Error().stack || '';
  const lines = stack.split('\n');

  // Look for first line that looks like a test file
  for (const line of lines) {
    const match = line.match(/\((.+\.(?:test|spec)\.[jt]s):\d+:\d+\)/);
    if (match && match[1]) {
      return match[1];
    }
  }

  return 'unknown';
};

/**
 * Type guard for node:test context.
 *
 * Checks if the given value is a valid node:test test context by verifying the
 * presence of required properties.
 *
 * @example
 *
 * ```typescript
 * if (isNodeTestContext(context)) {
 *   context.assert.snapshot(value);
 * }
 * ```
 *
 * @function
 * @param value - Value to check
 * @returns `true` if value is a node:test context
 */
const isNodeTestContext = (value: unknown): value is NodeTestContext => {
  return (
    isTestContext(value) &&
    'assert' in value &&
    typeof value.assert === 'object' &&
    value.assert !== null &&
    'snapshot' in value.assert &&
    typeof (value.assert as NodeTestContext['assert']).snapshot === 'function'
  );
};

/**
 * Check if we're running in node:test update mode.
 *
 * Node:test uses the `--test-update-snapshots` flag to indicate that snapshots
 * should be updated rather than compared. This function also respects the
 * `BUPKIS_UPDATE_SNAPSHOTS` environment variable for consistency with other
 * adapters.
 *
 * This function checks:
 *
 * 1. `process.execArgv` (flags passed to Node.js)
 * 2. `process.argv` (arguments passed to the script)
 * 3. `BUPKIS_UPDATE_SNAPSHOTS` environment variable
 *
 * @example
 *
 * ```sh
 * # These commands will trigger update mode:
 * node --test --test-update-snapshots
 * node --test-update-snapshots=true --test test.js
 * BUPKIS_UPDATE_SNAPSHOTS=1 node --test
 * ```
 *
 * @function
 * @returns `true` if in update mode
 */
const isNodeTestUpdateMode = (): boolean => {
  // Check for BUPKIS_UPDATE_SNAPSHOTS environment variable
  if (process.env.BUPKIS_UPDATE_SNAPSHOTS === '1') {
    return true;
  }

  // Check for --test-update-snapshots flag in exec args or argv
  return (
    process.execArgv.some(
      (arg) =>
        arg === '--test-update-snapshots' ||
        arg.startsWith('--test-update-snapshots='),
    ) ||
    process.argv.some(
      (arg) =>
        arg === '--test-update-snapshots' ||
        arg.startsWith('--test-update-snapshots='),
    )
  );
};

/**
 * Singleton instance of the node:test adapter.
 *
 * This is the primary export and should be used for adapter registration.
 *
 * @example
 *
 * ```typescript
 * import { nodeTestAdapter } from 'bupkis/snapshot';
 * import { registerAdapter } from 'bupkis/snapshot';
 *
 * registerAdapter(nodeTestAdapter);
 * ```
 */
export const nodeTestAdapter = new NodeTestAdapter();

/**
 * @function
 */
const isNodeAssertionError = (
  value: unknown,
): value is NodeTestAssertionError => isA(value, NodeTestAssertionError);
