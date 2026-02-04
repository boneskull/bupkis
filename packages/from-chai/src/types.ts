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
 * Chai assertion style: BDD (expect/should) or TDD (assert).
 */
export type ChaiStyle = 'bdd' | 'tdd';

/**
 * A matcher transformation definition.
 */
export interface MatcherTransform extends BaseMatcherTransform {
  /** Chai matcher/assertion name (e.g., 'equal', 'isTrue') */
  chaiMatcher: string;

  /** Whether this is a BDD or TDD style matcher */
  style: ChaiStyle;

  /**
   * Optional transformer for complex cases. Return null to skip transformation
   * (will add TODO comment).
   */
  transform?: (args: MatcherTransformArgs) => null | string;
}
