/**
 * @module @bupkis/from-assert
 * @bupkis/from-assert - Migrate node:assert assertions to bupkis.
 */

export {
  assertMatchers,
  getBaseMethod,
  getMatcherTransform,
  isAsyncMethod,
  isLegacyMethod,
  isMatcherSupported,
  isNegatedMethod,
  NEGATION_MAPPINGS,
  UNSUPPORTED_METHODS,
} from './matchers/index.js';
export { transform, transformCode } from './transform.js';
export type { CodeTransformResult } from './transform.js';
export type {
  AssertStyle,
  FileTransformResult,
  MatcherTransform,
  MatcherTransformArgs,
  TransformError,
  TransformMode,
  TransformOptions,
  TransformResult,
  TransformWarning,
} from './types.js';
