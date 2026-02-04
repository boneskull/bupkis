// Re-export shared types
export type {
  FileTransformResult,
  MatcherTransformArgs,
  TransformError,
  TransformMode,
  TransformWarning,
} from '@bupkis/codemod-core';

import type {
  BaseMatcherTransform,
  BaseTransformOptions,
  BaseTransformResult,
  MatcherTransformArgs,
} from '@bupkis/codemod-core';

/**
 * A matcher transformation definition.
 */
export interface MatcherTransform extends BaseMatcherTransform {
  /** Jest matcher name (e.g., 'toBe', 'toEqual') */
  jestMatcher: string;

  /**
   * Optional transformer for complex cases. Return null to skip transformation
   * (will add TODO comment).
   */
  transform?: (args: MatcherTransformArgs) => null | string;
}

/**
 * Detection of a mock matcher that requires @bupkis/sinon.
 */
export interface MockMatcherDetection {
  /** Number of occurrences */
  count: number;

  /** File path where detected */
  filePath: string;

  /** Jest matcher name */
  matcher: string;
}

/**
 * Options for the transform function.
 */
export interface TransformOptions extends BaseTransformOptions {
  /**
   * Enable transformation of mock/spy matchers to @bupkis/sinon.
   *
   * @default false
   */
  sinon?: boolean;
}

/**
 * Overall result of a transform operation.
 */
export interface TransformResult extends BaseTransformResult {
  /** Mock matchers detected (when --sinon not enabled) */
  mockMatcherDetections: MockMatcherDetection[];
}
