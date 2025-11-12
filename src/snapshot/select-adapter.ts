/**
 * Adapter selection logic for choosing the appropriate snapshot adapter.
 *
 * This module manages the registry of snapshot adapters and provides logic for
 * selecting the correct adapter based on the test context.
 *
 * @packageDocumentation
 */

import type { SnapshotAdapter } from './adapter.js';

import { fallbackAdapter } from './adapters/fallback.js';
import { nodeTestAdapter } from './adapters/node-test.js';

/**
 * Registered adapters in priority order.
 *
 * Adapters are checked in order, and the first adapter that can handle the
 * context is selected. The fallback adapter should always be last as it accepts
 * most inputs.
 *
 * **Default order:**
 *
 * 1. Node:test adapter (most specific)
 * 2. Fallback adapter (always matches)
 */
const adapters: SnapshotAdapter[] = [
  nodeTestAdapter,
  // jestVitestAdapter will be added in Phase 2
  fallbackAdapter, // Always last
];

/**
 * Get all registered adapters (for debugging).
 *
 * Returns a read-only copy of the adapter list in priority order. This is
 * useful for debugging adapter selection or verifying that custom adapters have
 * been registered correctly.
 *
 * @example
 *
 * ```typescript
 * import { getRegisteredAdapters } from 'bupkis/snapshot';
 *
 * const adapters = getRegisteredAdapters();
 * console.log(
 *   'Registered adapters:',
 *   adapters.map((a) => a.name),
 * );
 * // Output: ['node:test', 'fallback']
 * ```
 *
 * @example
 *
 * ```typescript
 * // After registering custom adapter
 * registerAdapter(customAdapter, 0);
 * const adapters = getRegisteredAdapters();
 * console.log(adapters.map((a) => a.name));
 * // Output: ['my-custom', 'node:test', 'fallback']
 * ```
 *
 * @function
 * @returns Read-only array of registered adapters
 */
export const getRegisteredAdapters = (): ReadonlyArray<SnapshotAdapter> => {
  return [...adapters];
};

/**
 * Register a custom snapshot adapter.
 *
 * This allows plugins or custom code to add new snapshot adapters for
 * frameworks not supported out of the box.
 *
 * **Important:** If an adapter with the same name is already registered, it
 * will be removed before the new adapter is inserted.
 *
 * @example
 *
 * ```typescript
 * import { registerAdapter } from 'bupkis/snapshot';
 *
 * const customAdapter = {
 *   name: 'my-framework',
 *   canHandle: (context) => {
 *     return (
 *       context &&
 *       typeof context === 'object' &&
 *       'myFrameworkMarker' in context
 *     );
 *   },
 *   getContext: (context) => {
 *     // Extract context from custom framework
 *   },
 *   assertSnapshot: (value, context, options) => {
 *     // Perform snapshot assertion
 *   },
 * };
 *
 * // Register with high priority (before node:test)
 * registerAdapter(customAdapter, 0);
 * ```
 *
 * @example
 *
 * ```typescript
 * // Register Jest adapter (Phase 2)
 * import { jestAdapter } from './adapters/jest.js';
 * registerAdapter(jestAdapter, 1); // After node:test, before fallback
 * ```
 *
 * @function
 * @param adapter - Custom adapter to register
 * @param priority - Priority index (lower = higher priority). Defaults to
 *   inserting before fallback.
 */
export const registerAdapter = (
  adapter: SnapshotAdapter,
  priority: number = adapters.length - 1,
): void => {
  // Remove if already registered
  const index = adapters.findIndex((a) => a.name === adapter.name);
  if (index !== -1) {
    adapters.splice(index, 1);
  }

  // Insert at specified priority
  adapters.splice(priority, 0, adapter);
};

/**
 * Select the appropriate snapshot adapter for the given context.
 *
 * Iterates through registered adapters in priority order and returns the first
 * adapter whose `canHandle()` method returns `true` for the context.
 *
 * Since the fallback adapter is always last and accepts most inputs, this
 * function is guaranteed to return a valid adapter.
 *
 * @example
 *
 * ```typescript
 * import test from 'node:test';
 * import { selectAdapter } from 'bupkis/snapshot';
 *
 * test('my test', (t) => {
 *   const adapter = selectAdapter(t);
 *   console.log(adapter.name); // 'node:test'
 *   adapter.assertSnapshot({ foo: 'bar' }, t);
 * });
 * ```
 *
 * @example
 *
 * ```typescript
 * // With explicit name (selects fallback)
 * const adapter = selectAdapter('my-snapshot-name');
 * console.log(adapter.name); // 'fallback'
 * ```
 *
 * @function
 * @param context - Test context object or explicit snapshot name
 * @returns Adapter that can handle the context
 */
export const selectAdapter = (context: unknown): SnapshotAdapter => {
  for (const adapter of adapters) {
    if (adapter.canHandle(context)) {
      return adapter;
    }
  }

  // This should never happen since fallback always handles
  return fallbackAdapter;
};
