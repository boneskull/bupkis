import { Project } from 'ts-morph';

import type {
  FileTransformResult,
  TransformError,
  TransformOptions,
  TransformResult,
  TransformWarning,
} from './types.ts';

import { transformExpectCalls } from './transformers/expect-transformer.ts';
import { transformImports } from './transformers/import-transformer.ts';

export interface CodeTransformResult {
  code: string;
  errors: TransformError[];
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
  options: { mode?: TransformOptions['mode'] } = {},
): Promise<CodeTransformResult> => {
  const project = new Project({
    compilerOptions: {
      allowJs: true,
    },
    useInMemoryFileSystem: true,
  });

  const sourceFile = project.createSourceFile('temp.ts', code);
  const result = transformExpectCalls(
    sourceFile,
    options.mode ?? 'best-effort',
  );

  // Transform imports after expect calls
  transformImports(sourceFile);

  return {
    code: sourceFile.getFullText(),
    errors: result.errors,
    transformCount: result.transformCount,
    warnings: result.warnings,
  };
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
    write = true,
  } = options;

  const project = new Project({
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

    const result = transformExpectCalls(sourceFile, mode);

    // Transform imports after expect calls
    transformImports(sourceFile);

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
    modifiedFiles,
    totalErrors,
    totalFiles: files.length,
    totalTransformations,
    totalWarnings,
  };
};
