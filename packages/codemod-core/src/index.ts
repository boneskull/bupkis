/**
 * Shared utilities for bupkis codemods.
 *
 * @packageDocumentation
 */

// CLI utilities
export {
  bupkisTheme,
  createStandardOptions,
  DEFAULT_PATTERNS,
  getTransformMode,
  printResult,
} from './cli.js';

export type { PrintResultOptions } from './cli.js';
// Import utilities
export {
  addBupkisImport,
  getBupkisImport,
  getImportsFrom,
  hasBupkisImport,
  hasCallUsage,
  hasImportFrom,
  isCallExpression,
  removeNamedImport,
} from './imports.js';

// Parsing utilities
export {
  extractBalancedContent,
  extractCallSubject,
  parseArguments,
} from './parsing.js';
export type { ExtractedContent } from './parsing.js';

// Project utilities
export {
  addSourceFiles,
  aggregateResults,
  createInMemoryProject,
  createProject,
  getSourceFiles,
  shouldExcludeFile,
} from './project.js';
export type { AggregatedStats } from './project.js';

// Types
export type {
  BaseMatcherTransform,
  BaseTransformOptions,
  BaseTransformResult,
  CodeTransformResult,
  FileTransformResult,
  MatcherTransformArgs,
  TransformError,
  TransformMode,
  TransformWarning,
} from './types.js';
