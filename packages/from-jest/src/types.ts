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
  /** Bupkis phrase (e.g., 'to be', 'to deep equal') */
  bupkisPhrase: string;

  /** Jest matcher name (e.g., 'toBe', 'toEqual') */
  jestMatcher: string;

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
  /** Arguments passed to the Jest matcher */
  matcherArgs: string[];

  /** Whether the assertion is negated (.not) */
  negated: boolean;

  /** The full original expression for context */
  originalExpression: string;

  /** The subject being tested (the value passed to expect()) */
  subject: string;
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
   * Enable transformation of mock/spy matchers to @bupkis/sinon.
   *
   * @default false
   */
  sinon?: boolean;

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

  /** Mock matchers detected (when --sinon not enabled) */
  mockMatcherDetections: MockMatcherDetection[];

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
