/**
 * Snapshot testing utilities for BUPKIS.
 *
 * This module provides unified snapshot testing across multiple test frameworks
 * including node:test, Jest, Vitest, Mocha, and custom test runners.
 *
 * **Quick Start:**
 *
 * ```typescript
 * import test from 'node:test';
 * import { expect } from 'bupkis';
 *
 * test('component renders correctly', (t) => {
 *   const output = renderComponent();
 *   expect(output, 'to match snapshot', t);
 * });
 * ```
 *
 * **Key Features:**
 *
 * - Unified API across all frameworks
 * - Automatic framework detection
 * - Custom serialization support
 * - Multiple snapshots per test
 * - Chainable with other assertions
 *
 * @packageDocumentation
 * @see {@link snapshotAssertion} for the main snapshot assertion
 * @see {@link SnapshotAdapter} for custom adapter implementation
 * @see {@link defaultSerializer} for serialization utilities
 */

// Snapshot assertion (re-export from assertion module for convenience)
export {
  snapshotAssertion,
  SnapshotAssertions,
  type SnapshotAssertions as SnapshotAssertionsType,
} from '../assertion/impl/snapshot.js';

// Core types
export type {
  SnapshotAdapter,
  SnapshotContext,
  SnapshotOptions,
  SnapshotSerializer,
} from './adapter.js';

export { isTestContext } from './adapter.js';

// Built-in adapters
export { type FallbackAdapter, fallbackAdapter } from './adapters/fallback.js';

export { type NodeTestAdapter, nodeTestAdapter } from './adapters/node-test.js';

// Adapter selection
export {
  getRegisteredAdapters,
  registerAdapter,
  selectAdapter,
} from './select-adapter.js';

// Serialization
export {
  defaultSerializer,
  nodeTestCompatibleSerializer,
  type SerializerOptions,
} from './serializer.js';
