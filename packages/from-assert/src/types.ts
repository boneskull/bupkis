/**
 * Node:assert import style: strict mode or legacy mode.
 *
 * - `strict`: Uses `node:assert/strict` or `{ strict as assert }`
 * - `legacy`: Uses plain `node:assert` (with loose equality semantics)
 */
export type AssertStyle = 'legacy' | 'strict';

/**
 * Result of transforming a single file.
 */
export interface FileTransformResult {
  /** Errors that prevented transformation */
  errors: TransformError[];

  /** Absolute path to the file */
  filePath: string;

  /** Whether the file was modified */
  modified: boolean;

  /** Number of transformations applied */
  transformCount: number;

  /** Warnings for manual review */
  warnings: TransformWarning[];
}

/**
 * A matcher transformation definition.
 */
export interface MatcherTransform {
  /** Node:assert method name (e.g., 'strictEqual', 'ok') */
  assertMethod: string;

  /** Bupkis phrase (e.g., 'to be', 'to deep equal') */
  bupkisPhrase: string;

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

/**
 * Arguments passed to custom matcher transformers.
 */
export interface MatcherTransformArgs {
  /** Arguments passed to the assert method */
  matcherArgs: string[];

  /** Whether the assertion is negated (e.g., notStrictEqual) */
  negated: boolean;

  /** The full original expression for context */
  originalExpression: string;

  /** The subject being tested (first argument to assert method) */
  subject: string;
}

/**
 * Error during transformation.
 */
export interface TransformError {
  /** Column number in source (if applicable) */
  column?: number;

  /** Line number in source (if applicable) */
  line?: number;

  /** Error message */
  message: string;
}

/**
 * Mode for handling ambiguous or unsupported transformations.
 */
export type TransformMode = 'best-effort' | 'interactive' | 'strict';

/**
 * Options for the transform function.
 */
export interface TransformOptions {
  /**
   * Working directory for resolving files.
   *
   * @default process.cwd()
   */
  cwd?: string;

  /**
   * File patterns to exclude (glob).
   */
  exclude?: string[];

  /**
   * File patterns to include (glob).
   */
  include?: string[];

  /**
   * How to handle ambiguous transformations.
   *
   * @default 'best-effort'
   */
  mode?: TransformMode;

  /**
   * Whether to write changes to disk.
   *
   * @default true
   */
  write?: boolean;
}

/**
 * Overall result of a transform operation.
 */
export interface TransformResult {
  /** Results for each file processed */
  files: FileTransformResult[];

  /** Total files modified */
  modifiedFiles: number;

  /** Total errors across all files */
  totalErrors: number;

  /** Total files processed */
  totalFiles: number;

  /** Total transformations applied */
  totalTransformations: number;

  /** Total warnings across all files */
  totalWarnings: number;
}

/**
 * Warning about a transformation that needs manual review.
 */
export interface TransformWarning {
  /** Column number in source */
  column: number;

  /** Line number in source */
  line: number;

  /** Description of what needs manual review */
  message: string;

  /** The original code that couldn't be fully transformed */
  originalCode: string;
}
