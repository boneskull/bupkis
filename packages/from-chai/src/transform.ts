import {
  addSourceFiles,
  aggregateResults,
  createInMemoryProject,
  createProject,
  DEFAULT_PATTERNS,
  shouldExcludeFile,
} from '@bupkis/codemod-core';

import type {
  FileTransformResult,
  TransformError,
  TransformOptions,
  TransformResult,
  TransformWarning,
} from './types.js';

import { transformBddExpectCalls } from './transformers/bdd-transformer.js';
import { transformImports } from './transformers/import-transformer.js';
import { transformTddAssertCalls } from './transformers/tdd-transformer.js';

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
 * Transform a code string from Chai to bupkis assertions.
 *
 * This function handles both BDD (expect/should) and TDD (assert) styles.
 *
 * @example
 *
 * ```ts
 * import { transformCode } from '@bupkis/from-chai';
 *
 * const { code } = await transformCode(`
 *   import { expect } from 'chai';
 *   expect(foo).to.equal(bar);
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
  const project = createInMemoryProject();

  const sourceFile = project.createSourceFile('temp.ts', code);
  const mode = options.mode ?? 'best-effort';

  // Collect all errors and warnings from both transformers
  const errors: TransformError[] = [];
  const warnings: TransformWarning[] = [];
  let transformCount = 0;

  // Transform BDD-style expect() chains
  const bddResult = transformBddExpectCalls(sourceFile, mode);
  transformCount += bddResult.transformCount;
  errors.push(...bddResult.errors);
  warnings.push(...bddResult.warnings);

  // Transform TDD-style assert.xxx() calls
  const tddResult = transformTddAssertCalls(sourceFile, mode);
  transformCount += tddResult.transformCount;
  errors.push(...tddResult.errors);
  warnings.push(...tddResult.warnings);

  // Transform imports last (after we know what's being used)
  const importResult = transformImports(sourceFile);
  warnings.push(...importResult.warnings);

  return {
    code: sourceFile.getFullText(),
    errors,
    transformCount,
    warnings,
  };
};

/**
 * Transform files matching glob patterns from Chai to bupkis assertions.
 *
 * @example
 *
 * ```ts
 * import { transform } from '@bupkis/from-chai';
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
    include = DEFAULT_PATTERNS,
    mode = 'best-effort',
    write = true,
  } = options;

  const project = createProject(cwd);
  addSourceFiles(project, cwd, include);

  const files: FileTransformResult[] = [];

  for (const sourceFile of project.getSourceFiles()) {
    const filePath = sourceFile.getFilePath();

    // Skip excluded files
    if (shouldExcludeFile(filePath, exclude)) {
      continue;
    }

    // Collect results from both transformers
    const errors: TransformError[] = [];
    const warnings: TransformWarning[] = [];
    let fileTransformCount = 0;

    // Transform BDD-style expect() chains
    const bddResult = transformBddExpectCalls(sourceFile, mode);
    fileTransformCount += bddResult.transformCount;
    errors.push(...bddResult.errors);
    warnings.push(...bddResult.warnings);

    // Transform TDD-style assert.xxx() calls
    const tddResult = transformTddAssertCalls(sourceFile, mode);
    fileTransformCount += tddResult.transformCount;
    errors.push(...tddResult.errors);
    warnings.push(...tddResult.warnings);

    // Transform imports last
    const importResult = transformImports(sourceFile);
    warnings.push(...importResult.warnings);

    const fileResult: FileTransformResult = {
      errors,
      filePath,
      modified: fileTransformCount > 0,
      transformCount: fileTransformCount,
      warnings,
    };

    files.push(fileResult);

    if (fileTransformCount > 0 && write) {
      await sourceFile.save();
    }
  }

  const stats = aggregateResults(files);

  return {
    files,
    ...stats,
  };
};
