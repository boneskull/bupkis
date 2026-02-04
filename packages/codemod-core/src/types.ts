/**
 * Base matcher transformation definition.
 *
 * Each codemod package extends this with a source-specific property (e.g.,
 * `jestMatcher`, `chaiMatcher`, `assertMethod`).
 */
export interface BaseMatcherTransform {
  /** Bupkis phrase (e.g., 'to be', 'to deep equal') */
  bupkisPhrase: string;

  /**
   * Optional transformer for complex cases. Return null to skip transformation
   * (will add TODO comment).
   */
  transform?: (args: MatcherTransformArgs) => null | string;
}

/**
 * Base options for the transform function.
 *
 * Package-specific codemods may extend this with additional options.
 */
export interface BaseTransformOptions {
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
 * Base result of a transform operation.
 *
 * Package-specific codemods may extend this with additional result data.
 */
export interface BaseTransformResult {
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
 * Result of transforming a code string.
 */
export interface CodeTransformResult {
  /** The transformed code */
  code: string;

  /** Errors that occurred during transformation */
  errors: TransformError[];

  /** Number of transformations applied */
  transformCount: number;

  /** Warnings for manual review */
  warnings: TransformWarning[];
}

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
 * Arguments passed to custom matcher transformers.
 */
export interface MatcherTransformArgs {
  /** Arguments passed to the source matcher */
  matcherArgs: string[];

  /** Whether the assertion is negated */
  negated: boolean;

  /** The full original expression for context */
  originalExpression: string;

  /** The subject being tested (the value passed to expect/assert) */
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
