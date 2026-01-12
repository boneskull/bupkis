/**
 * Snapshot testing assertions for BUPKIS.
 *
 * Provides unified snapshot testing across multiple test frameworks including
 * node:test, Jest, Vitest, Mocha, and others.
 *
 * @packageDocumentation
 * @group Snapshot Assertions
 */

import { z } from 'zod';

import { SnapshotOptionsSchema } from '../../schema.js';
import { selectAdapter } from '../../snapshot/select-adapter.js';
import { createAssertion } from '../create.js';

/**
 * Asserts that a value matches a stored snapshot.
 *
 * This assertion provides unified snapshot testing across multiple test
 * frameworks. It automatically detects the test framework from the context
 * parameter and uses the appropriate snapshot mechanism.
 *
 * **Supported Frameworks:**
 *
 * - **node:test**: Native `assert.snapshot()` support
 * - **Jest/Vitest**: Coming in Phase 2
 * - **Mocha**: Custom snapshot storage
 * - **Any framework**: Use explicit string names
 *
 * **Basic Usage:**
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
 * **With Custom Serializer:**
 *
 * ```typescript
 * test('redacts sensitive data', (t) => {
 *   const data = { public: 'visible', secret: 'password123' };
 *   expect(data, 'to match snapshot', t, {
 *     serializer: (value: any) =>
 *       JSON.stringify({ ...value, secret: '[REDACTED]' }, null, 2),
 *   });
 * });
 * ```
 *
 * **Multiple Snapshots Per Test:**
 *
 * ```typescript
 * test('multi-step process', (t) => {
 *   const step1 = processStep1();
 *   expect(step1, 'to match snapshot', t, { hint: 'step-1' });
 *
 *   const step2 = processStep2();
 *   expect(step2, 'to match snapshot', t, { hint: 'step-2' });
 *
 *   const step3 = processStep3();
 *   expect(step3, 'to match snapshot', t, { hint: 'step-3' });
 * });
 * ```
 *
 * **Mocha Usage:**
 *
 * ```typescript
 * describe('MyComponent', function () {
 *   it('renders correctly', function () {
 *     const output = renderComponent();
 *     expect(output, 'to match snapshot', this);
 *   });
 * });
 * ```
 *
 * **Explicit Snapshot Names:**
 *
 * ```typescript
 * test('any framework', () => {
 *   const output = renderComponent();
 *   expect(output, 'to match snapshot', 'component-default-state');
 * });
 * ```
 *
 * **Chaining with Other Assertions:**
 *
 * ```typescript
 * test('validates and snapshots', (t) => {
 *   const user = getUserData();
 *   expect(
 *     user,
 *     'to satisfy',
 *     { name: 'Alice' },
 *     'and',
 *     'to have property',
 *     'email',
 *     'and',
 *     'to match snapshot',
 *     t,
 *   );
 * });
 * ```
 *
 * **Updating Snapshots:**
 *
 * ```sh
 * # node:test
 * node --test --test-update-snapshots
 *
 * # Jest/Vitest (Phase 2)
 * vitest -u
 *
 * # Other frameworks
 * BUPKIS_UPDATE_SNAPSHOTS=1 npm test
 * ```
 *
 * @example Basic snapshot assertion
 *
 * ```typescript
 * import test from 'node:test';
 * import { expect } from 'bupkis';
 *
 * test('renders user profile', (t) => {
 *   const profile = { name: 'Alice', age: 30, role: 'admin' };
 *   expect(profile, 'to match snapshot', t);
 * });
 * ```
 *
 * @example Snapshot with custom serialization
 *
 * ```typescript
 * test('redacts passwords', (t) => {
 *   const user = {
 *     username: 'alice',
 *     password: 'secret123',
 *     email: 'alice@example.com',
 *   };
 *
 *   expect(user, 'to match snapshot', t, {
 *     serializer: (value: any) => {
 *       return JSON.stringify(
 *         {
 *           ...value,
 *           password: '[REDACTED]',
 *         },
 *         null,
 *         2,
 *       );
 *     },
 *   });
 * });
 * ```
 *
 * @example Multiple snapshots with hints
 *
 * ```typescript
 * test('captures workflow steps', (t) => {
 *   const initial = { status: 'pending' };
 *   expect(initial, 'to match snapshot', t, { hint: 'initial-state' });
 *
 *   const processing = { status: 'processing', progress: 50 };
 *   expect(processing, 'to match snapshot', t, {
 *     hint: 'processing-state',
 *   });
 *
 *   const complete = { status: 'complete', result: 'success' };
 *   expect(complete, 'to match snapshot', t, { hint: 'complete-state' });
 * });
 * ```
 *
 * @param subject - The value to snapshot (any type)
 * @param context - Test context object or explicit snapshot name
 * @param options - Optional serialization and naming options
 * @group Snapshot Assertions
 * @bupkisAnchor unknown-to-match-snapshot
 * @bupkisAssertionCategory snapshot
 */
export const snapshotAssertion = createAssertion(
  [
    z.unknown(),
    [
      'to match snapshot',
      'to match the snapshot',
      'to equal snapshot',
      'to equal the snapshot',
    ],
    z.unknown().nonoptional(),
  ],
  (actual, context) => {
    const adapter = selectAdapter(context);
    return adapter.validateSnapshot(actual, context);
  },
);

/**
 * Asserts that a value matches a stored snapshot with custom options.
 *
 * This is an extended version of {@link snapshotAssertion} that accepts explicit
 * options for serialization and snapshot naming via the `with options` syntax.
 *
 * @example Snapshot with custom serializer using 'with options'
 *
 * ```typescript
 * import test from 'node:test';
 * import { expect } from 'bupkis';
 *
 * test('redacts sensitive fields', (t) => {
 *   const data = { username: 'alice', password: 'secret123' };
 *
 *   expect(data, 'to match snapshot', t, 'with options', {
 *     serializer: (value: any) =>
 *       JSON.stringify({ ...value, password: '[REDACTED]' }, null, 2),
 *   });
 * });
 * ```
 *
 * @example Multiple snapshots with hints using 'with options'
 *
 * ```typescript
 * test('workflow stages', (t) => {
 *   const stage1 = { phase: 'init' };
 *   expect(stage1, 'to match snapshot', t, 'with options', {
 *     hint: 'stage-1',
 *   });
 *
 *   const stage2 = { phase: 'processing' };
 *   expect(stage2, 'to match snapshot', t, 'with options', {
 *     hint: 'stage-2',
 *   });
 * });
 * ```
 *
 * @param subject - The value to snapshot (any type)
 * @param context - Test context object or explicit snapshot name
 * @param options - Serialization and naming options
 * @group Snapshot Assertions
 * @bupkisAnchor unknown-to-match-snapshot-with-options
 * @bupkisAssertionCategory snapshot
 */
export const snapshotAssertionWithOptions = createAssertion(
  [
    z.unknown(),
    [
      'to match snapshot',
      'to match the snapshot',
      'to equal snapshot',
      'to equal the snapshot',
    ],
    z.unknown().nonoptional(),
    'with options',
    SnapshotOptionsSchema,
  ],
  (actual, context, options) => {
    const adapter = selectAdapter(context);
    return adapter.validateSnapshot(actual, context, options);
  },
);
/**
 * Collection of all snapshot assertions.
 *
 * Currently contains only the main snapshot assertion, but structured as a
 * collection for consistency with other assertion modules and to allow for
 * future expansion (e.g., inline snapshots, property matchers).
 *
 * @example
 *
 * ```typescript
 * import { SnapshotAssertions } from 'bupkis/assertions';
 *
 * // All snapshot assertions are available
 * const { snapshotAssertion } = SnapshotAssertions;
 * ```
 */
export const SnapshotAssertions = {
  snapshotAssertion,
  snapshotAssertionWithOptions,
} as const;

/**
 * Type for the snapshot assertions collection.
 *
 * This type can be used for type checking or documentation purposes.
 *
 * @example
 *
 * ```typescript
 * import type { SnapshotAssertions } from 'bupkis/assertions';
 *
 * function useSnapshotAssertions(assertions: SnapshotAssertions) {
 *   // assertions has the correct type
 * }
 * ```
 */
export type SnapshotAssertions = typeof SnapshotAssertions;
