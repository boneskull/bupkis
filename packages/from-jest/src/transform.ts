import { Project, QuoteKind } from 'ts-morph';

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
 */
export const transformCode = async (
  code: string,
  options: { mode?: TransformOptions['mode']; sinon?: boolean } = {},
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
  const result = transformExpectCalls(sourceFile, {
    mode: options.mode ?? 'best-effort',
    sinon: options.sinon,
  });

  // Transform imports after expect calls
  // Use sinon imports if any mock matchers were transformed
  transformImports(sourceFile, {
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
    sinon = false,
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
  const mockMatcherDetections: MockMatcherDetection[] = [];
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

    const result = transformExpectCalls(sourceFile, { mode, sinon });

    // Aggregate mock matcher detections for this file
    if (result.mockMatchers.length > 0) {
      mockMatcherDetections.push(
        ...aggregateMockMatchers(filePath, result.mockMatchers),
      );
    }

    // Transform imports after expect calls
    // Use sinon imports if any mock matchers were transformed
    transformImports(sourceFile, {
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
    totalTransformations += result.transformCount;
    totalWarnings += result.warnings.length;
    totalErrors += result.errors.length;

    if (result.transformCount > 0) {
      modifiedFiles++;
      if (write) {
        await sourceFile.save();
      }
    }
  }

  return {
    files,
    mockMatcherDetections,
    modifiedFiles,
    totalErrors,
    totalFiles: files.length,
    totalTransformations,
    totalWarnings,
  };
};
