/**
 * @module @bupkis/from-chai
 * @bupkis/from-chai - Migrate Chai assertions to bupkis.
 */

export {
  allMatchers,
  bddMatchers,
  getMatcherTransform,
  isMatcherSupported,
  pluginMatchers,
  tddMatchers,
} from './matchers/index.js';
export { transform, transformCode } from './transform.js';
export type { CodeTransformResult } from './transform.js';
export type {
  ChaiStyle,
  FileTransformResult,
  MatcherTransform,
  MatcherTransformArgs,
  TransformError,
  TransformMode,
  TransformOptions,
  TransformResult,
  TransformWarning,
} from './types.js';
