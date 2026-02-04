import {
  addSourceFiles,
  aggregateResults,
  createInMemoryProject,
  createProject,
  DEFAULT_PATTERNS,
  shouldExcludeFile,
} from '@bupkis/codemod-core';

import type { MockMatcherInfo } from './transformers/expect-transformer.js';
import type {
  FileTransformResult,
  MockMatcherDetection,
  TransformError,
  TransformOptions,
  TransformResult,
  TransformWarning,
} from './types.js';

import { transformExpectCalls } from './transformers/expect-transformer.js';
import { transformImports } from './transformers/import-transformer.js';

export interface CodeTransformResult {
  code: string;
  errors: TransformError[];

  /** Mock matchers detected (when sinon not enabled) */
  mockMatchers: MockMatcherInfo[];

  transformCount: number;
  warnings: TransformWarning[];
}

/**
 * Transform a code string from Jest to bupkis assertions.
 *
 * @function
 * @param code - The code to transform
 * @param options - Transform options
 * @returns The transformed code and metadata
 */
export const transformCode = async (
  code: string,
  options: { mode?: TransformOptions['mode']; sinon?: boolean } = {},
): Promise<CodeTransformResult> => {
  const project = createInMemoryProject();

  const sourceFile = project.createSourceFile('temp.ts', code);
  const result = transformExpectCalls(sourceFile, {
    mode: options.mode ?? 'best-effort',
    sinon: options.sinon,
  });

  // Transform imports after expect calls
  // Use sinon imports if any mock matchers were transformed
  // Use expectAsync imports if any promise matchers were transformed
  transformImports(sourceFile, {
    useExpectAsync: result.promiseMatcherTransformCount > 0,
    useSinon: options.sinon && result.mockMatcherTransformCount > 0,
  });

  return {
    code: sourceFile.getFullText(),
    errors: result.errors,
    mockMatchers: result.mockMatchers,
    transformCount: result.transformCount,
    warnings: result.warnings,
  };
};

/**
 * Aggregate mock matcher detections by file and matcher.
 *
 * @function
 */
const aggregateMockMatchers = (
  filePath: string,
  matchers: MockMatcherInfo[],
): MockMatcherDetection[] => {
  const counts = new Map<string, number>();

  for (const { matcher } of matchers) {
    counts.set(matcher, (counts.get(matcher) ?? 0) + 1);
  }

  return [...counts.entries()].map(([matcher, count]) => ({
    count,
    filePath,
    matcher,
  }));
};

/**
 * Transform files matching glob patterns.
 *
 * @function
 * @param options - Transform options
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
    sinon = false,
    write = true,
  } = options;

  const project = createProject(cwd);
  addSourceFiles(project, cwd, include);

  const files: FileTransformResult[] = [];
  const mockMatcherDetections: MockMatcherDetection[] = [];

  for (const sourceFile of project.getSourceFiles()) {
    const filePath = sourceFile.getFilePath();

    // Skip excluded files
    if (shouldExcludeFile(filePath, exclude)) {
      continue;
    }

    const result = transformExpectCalls(sourceFile, { mode, sinon });

    // Aggregate mock matcher detections for this file
    if (result.mockMatchers.length > 0) {
      mockMatcherDetections.push(
        ...aggregateMockMatchers(filePath, result.mockMatchers),
      );
    }

    // Transform imports after expect calls
    // Use sinon imports if any mock matchers were transformed
    // Use expectAsync imports if any promise matchers were transformed
    transformImports(sourceFile, {
      useExpectAsync: result.promiseMatcherTransformCount > 0,
      useSinon: sinon && result.mockMatcherTransformCount > 0,
    });

    const fileResult: FileTransformResult = {
      errors: result.errors,
      filePath,
      modified: result.transformCount > 0,
      transformCount: result.transformCount,
      warnings: result.warnings,
    };

    files.push(fileResult);

    if (result.transformCount > 0 && write) {
      await sourceFile.save();
    }
  }

  const stats = aggregateResults(files);

  return {
    files,
    mockMatcherDetections,
    ...stats,
  };
};
