import { Project, QuoteKind } from 'ts-morph';

import type {
  FileTransformResult,
  TransformError,
  TransformOptions,
  TransformResult,
  TransformWarning,
} from './types.js';

import { transformAssertCalls } from './transformers/assert-transformer.js';
import {
  detectAssertStyle,
  transformImports,
} from './transformers/import-transformer.js';

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
 * Transform a code string from node:assert to bupkis assertions.
 *
 * @example
 *
 * ```ts
 * import { transformCode } from '@bupkis/from-assert';
 *
 * const { code } = await transformCode(`
 *   import assert from 'node:assert';
 *   assert.strictEqual(foo, bar);
 * `);
 * // code: "import { expect } from 'bupkis';\nexpect(foo, 'to be', bar);"
 * ```
 *
 * @function
 * @param code - The source code to transform
 * @param options - Transform options
 * @returns The transformed code and metadata
 */
export const transformCode = async (
  code: string,
  options: { mode?: TransformOptions['mode'] } = {},
): Promise<CodeTransformResult> => {
  const project = new Project({
    compilerOptions: {
      allowJs: true,
    },
    manipulationSettings: {
      quoteKind: QuoteKind.Single,
    },
    useInMemoryFileSystem: true,
  });

  const sourceFile = project.createSourceFile('temp.ts', code);
  const mode = options.mode ?? 'best-effort';

  // Detect assert style before transformation
  const assertStyle = detectAssertStyle(sourceFile);

  // Collect all errors and warnings
  const errors: TransformError[] = [];
  const warnings: TransformWarning[] = [];
  let transformCount = 0;

  // Transform assert calls
  const assertResult = transformAssertCalls(sourceFile, mode, assertStyle);
  transformCount += assertResult.transformCount;
  errors.push(...assertResult.errors);
  warnings.push(...assertResult.warnings);

  // Transform imports last (after we know what's being used)
  const importResult = transformImports(sourceFile, {
    useExpectAsync: assertResult.useExpectAsync,
  });
  warnings.push(...importResult.warnings);

  return {
    code: sourceFile.getFullText(),
    errors,
    transformCount,
    warnings,
  };
};

/**
 * Transform files matching glob patterns from node:assert to bupkis assertions.
 *
 * @example
 *
 * ```ts
 * import { transform } from '@bupkis/from-assert';
 *
 * const result = await transform({
 *   include: ['**\/*.test.ts'],
 *   mode: 'best-effort',
 *   write: true,
 * });
 *
 * console.log(`Transformed ${result.totalTransformations} assertions`);
 * ```
 *
 * @function
 * @param options - Transform options including file patterns and mode
 * @returns Results including per-file details and summary statistics
 */
export const transform = async (
  options: TransformOptions = {},
): Promise<TransformResult> => {
  const {
    cwd = process.cwd(),
    exclude = ['**/node_modules/**'],
    include = [
      '**/*.test.ts',
      '**/*.test.tsx',
      '**/*.spec.ts',
      '**/*.spec.tsx',
    ],
    mode = 'best-effort',
    write = true,
  } = options;

  const project = new Project({
    manipulationSettings: {
      quoteKind: QuoteKind.Single,
    },
    skipAddingFilesFromTsConfig: true,
    tsConfigFilePath: `${cwd}/tsconfig.json`,
  });

  // Add files matching include patterns
  for (const pattern of include) {
    project.addSourceFilesAtPaths(`${cwd}/${pattern}`);
  }

  const files: FileTransformResult[] = [];
  let totalTransformations = 0;
  let totalWarnings = 0;
  let totalErrors = 0;
  let modifiedFiles = 0;

  for (const sourceFile of project.getSourceFiles()) {
    const filePath = sourceFile.getFilePath();

    // Skip excluded files
    if (
      exclude.some((pattern) => filePath.includes(pattern.replace('**/', '')))
    ) {
      continue;
    }

    // Detect assert style for this file
    const assertStyle = detectAssertStyle(sourceFile);

    // Collect results
    const errors: TransformError[] = [];
    const warnings: TransformWarning[] = [];
    let fileTransformCount = 0;

    // Transform assert calls
    const assertResult = transformAssertCalls(sourceFile, mode, assertStyle);
    fileTransformCount += assertResult.transformCount;
    errors.push(...assertResult.errors);
    warnings.push(...assertResult.warnings);

    // Transform imports last
    const importResult = transformImports(sourceFile, {
      useExpectAsync: assertResult.useExpectAsync,
    });
    warnings.push(...importResult.warnings);

    const fileResult: FileTransformResult = {
      errors,
      filePath,
      modified: fileTransformCount > 0,
      transformCount: fileTransformCount,
      warnings,
    };

    files.push(fileResult);
    totalTransformations += fileTransformCount;
    totalWarnings += warnings.length;
    totalErrors += errors.length;

    if (fileTransformCount > 0) {
      modifiedFiles++;
      if (write) {
        await sourceFile.save();
      }
    }
  }

  return {
    files,
    modifiedFiles,
    totalErrors,
    totalFiles: files.length,
    totalTransformations,
    totalWarnings,
  };
};
