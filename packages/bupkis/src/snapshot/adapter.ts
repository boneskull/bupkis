/**
 * Adapter interface and types for snapshot testing across multiple frameworks.
 *
 * @packageDocumentation
 */

import { type AssertionFailure } from '../types.js';

/**
 * Adapter for framework-specific snapshot operations.
 *
 * Each test framework (node:test, Jest, Vitest, Mocha, etc.) has its own way of
 * providing test context and storing snapshots. Adapters abstract these
 * differences and provide a unified interface.
 *
 * @example
 *
 * ```typescript
 * class NodeTestAdapter implements SnapshotAdapter {
 *   readonly name = 'node:test';
 *
 *   canHandle(context: unknown): boolean {
 *     return (
 *       typeof context === 'object' &&
 *       context !== null &&
 *       'assert' in context &&
 *       typeof (context as any).assert?.snapshot === 'function'
 *     );
 *   }
 *
 *   getContext(context: unknown): SnapshotContext {
 *     // Extract test name, file path, update mode from node:test context
 *   }
 *
 *   assertSnapshot(
 *     value: unknown,
 *     context: unknown,
 *     options?: SnapshotOptions,
 *   ): void {
 *     // Delegate to context.assert.snapshot()
 *   }
 * }
 * ```
 */
export interface SnapshotAdapter {
  /**
   * Check if this adapter can handle the given test context.
   *
   * This is used for adapter selection. Adapters are checked in priority order,
   * and the first adapter that returns `true` is used.
   *
   * @example
   *
   * ```typescript
   * canHandle(context: unknown): boolean {
   *   // Check for node:test-specific properties
   *   return typeof context === 'object' &&
   *          context !== null &&
   *          'assert' in context &&
   *          typeof (context as any).assert?.snapshot === 'function';
   * }
   * ```
   *
   * @param context - Test context object from the test framework
   * @returns `true` if this adapter can handle the context
   */
  canHandle(context: unknown): boolean;

  /**
   * Extract normalized snapshot context from framework-specific context.
   *
   * This method should extract the test name/path, file path, and update mode
   * from the framework's test context object.
   *
   * @example
   *
   * ```typescript
   * getContext(context: unknown): SnapshotContext {
   *   const ctx = context as NodeTestContext;
   *   return {
   *     testPath: ctx.name,
   *     filePath: getFilePathFromStack(),
   *     isUpdateMode: process.argv.includes('--test-update-snapshots')
   *   };
   * }
   * ```
   *
   * @param context - Test context object from the test framework
   * @returns Normalized snapshot context
   * @throws {TypeError} If the context is invalid for this adapter
   */
  getContext(context: unknown): SnapshotContext;

  /**
   * Adapter name for debugging and logging.
   *
   * @example
   *
   * ```typescript
   * 'node:test';
   * 'jest';
   * 'fallback';
   * ```
   */
  readonly name: string;

  /**
   * Perform the snapshot assertion.
   *
   * This method should either:
   *
   * - Compare the value against the existing snapshot and throw if different
   * - Create/update the snapshot if in update mode
   *
   * @example
   *
   * ```typescript
   * assertSnapshot(value: unknown, context: unknown, options?: SnapshotOptions): void {
   *   const ctx = this.getContext(context);
   *   const serialized = options?.serializer?.(value) ?? defaultSerializer(value);
   *
   *   if (ctx.isUpdateMode) {
   *     saveSnapshot(ctx.testPath, serialized);
   *   } else {
   *     const expected = loadSnapshot(ctx.testPath);
   *     if (serialized !== expected) {
   *       throw new AssertionError('Snapshot mismatch');
   *     }
   *   }
   * }
   * ```
   *
   * @param value - The value to snapshot
   * @param context - Test context object from the test framework
   * @param options - Optional serialization and naming options
   * @returns {@link AssertionFailure} If the snapshot doesn't match, void
   *   otherwise
   */
  validateSnapshot(
    value: unknown,
    context: unknown,
    options?: SnapshotOptions,
  ): AssertionFailure | void;
}

/**
 * Context information extracted from a test framework's test context.
 *
 * This represents the normalized information needed to create and match
 * snapshots regardless of which test framework is being used.
 */
export interface SnapshotContext {
  /**
   * Absolute path to the test file.
   *
   * This is used to determine where to store the snapshot file.
   *
   * @example
   *
   * ```typescript
   * '/Users/name/project/test/component.test.ts';
   * ```
   */
  filePath: string;

  /**
   * Whether we're in update mode.
   *
   * When `true`, snapshots should be created or updated rather than compared.
   * This is typically controlled by CLI flags like `--test-update-snapshots` or
   * environment variables.
   */
  isUpdateMode: boolean;

  /**
   * Full test path/name including describe blocks.
   *
   * This should uniquely identify the test within the test file.
   *
   * @example
   *
   * ```typescript
   * 'MyComponent > renders > shows the title';
   * ```
   */
  testPath: string;
}

/**
 * Options for snapshot assertions.
 *
 * These options control how snapshots are created, matched, and stored.
 */
export interface SnapshotOptions {
  /**
   * Optional hint for the snapshot name.
   *
   * This can be used to give snapshots more descriptive names, especially when
   * multiple snapshots exist in a single test.
   *
   * @example
   *
   * ```typescript
   * {
   *   "hint": "after-user-login"
   * }
   * // Results in snapshot name: "test name [after-user-login]"
   * ```
   */
  hint?: string;

  /**
   * Custom serializer for the snapshot value.
   *
   * If provided, this serializer will be used instead of the default
   * serialization logic. This is useful for:
   *
   * - Redacting sensitive data
   * - Custom formatting
   * - Framework-specific serialization
   *
   * @example
   *
   * ```typescript
   * {
   *   serializer: (value) => {
   *     // Redact passwords before snapshotting
   *     return JSON.stringify({ ...value, password: '[REDACTED]' }, null, 2);
   *   }
   * }
   * ```
   */
  serializer?: SnapshotSerializer;
}

/**
 * Serializer function for converting values to snapshot strings.
 *
 * A serializer takes any JavaScript value and converts it to a string
 * representation suitable for storage in a snapshot file.
 *
 * @example
 *
 * ```typescript
 * const serializer: SnapshotSerializer = (value) => {
 *   return JSON.stringify(value, null, 2);
 * };
 * ```
 *
 * @param value - The value to serialize
 * @returns String representation of the value
 */
export type SnapshotSerializer = (value: unknown) => string;

/**
 * Type guard to check if a value is a test context object.
 *
 * This is a basic check that the value is a non-null object, which is the
 * minimum requirement for a test context.
 *
 * @example
 *
 * ```typescript
 * if (isTestContext(context)) {
 *   // context is Record<string, unknown>
 * }
 * ```
 *
 * @function
 * @param value - Value to check
 * @returns `true` if the value could be a test context
 */
export const isTestContext = (
  value: unknown,
): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null;
};
