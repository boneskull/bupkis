// Re-export shared types
export type {
  FileTransformResult,
  MatcherTransformArgs,
  TransformError,
  TransformMode,
  BaseTransformOptions as TransformOptions,
  BaseTransformResult as TransformResult,
  TransformWarning,
} from '@bupkis/codemod-core';

import type {
  BaseMatcherTransform,
  MatcherTransformArgs,
} from '@bupkis/codemod-core';

/**
 * Node:assert import style: strict mode or legacy mode.
 *
 * - `strict`: Uses `node:assert/strict` or `{ strict as assert }`
 * - `legacy`: Uses plain `node:assert` (with loose equality semantics)
 */
export type AssertStyle = 'legacy' | 'strict';

/**
 * A matcher transformation definition.
 */
export interface MatcherTransform extends BaseMatcherTransform {
  /** Node:assert method name (e.g., 'strictEqual', 'ok') */
  assertMethod: string;

  /**
   * Whether this assertion requires expectAsync instead of expect.
   */
  isAsync?: boolean;

  /**
   * Whether this is a legacy loose assertion that may have different semantics.
   */
  isLegacy?: boolean;

  /**
   * Optional transformer for complex cases. Return null to skip transformation
   * (will add TODO comment).
   */
  transform?: (args: MatcherTransformArgs) => null | string;
}
