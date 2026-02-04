import type { SourceFile } from 'ts-morph';

import { Project, QuoteKind } from 'ts-morph';

import type { FileTransformResult } from './types.js';

/**
 * Create a ts-morph Project for file-system transforms.
 *
 * @function
 * @param cwd - The working directory containing tsconfig.json
 * @returns A configured ts-morph Project
 */
export const createProject = (cwd: string): Project =>
  new Project({
    manipulationSettings: {
      quoteKind: QuoteKind.Single,
    },
    skipAddingFilesFromTsConfig: true,
    tsConfigFilePath: `${cwd}/tsconfig.json`,
  });

/**
 * Create a ts-morph Project for in-memory transforms.
 *
 * Useful for transforming code strings without touching the file system.
 *
 * @function
 * @returns A configured ts-morph Project with in-memory file system
 */
export const createInMemoryProject = (): Project =>
  new Project({
    compilerOptions: {
      allowJs: true,
    },
    manipulationSettings: {
      quoteKind: QuoteKind.Single,
    },
    useInMemoryFileSystem: true,
  });

/**
 * Add source files matching glob patterns to a project.
 *
 * @function
 * @param project - The ts-morph Project
 * @param cwd - The working directory
 * @param include - Glob patterns to include
 */
export const addSourceFiles = (
  project: Project,
  cwd: string,
  include: string[],
): void => {
  for (const pattern of include) {
    project.addSourceFilesAtPaths(`${cwd}/${pattern}`);
  }
};

/**
 * Check if a file should be excluded based on glob patterns.
 *
 * This is a simple substring match that strips glob wildcards like double-star
 * prefix and suffix patterns.
 *
 * @function
 * @param filePath - The file path to check
 * @param exclude - Array of glob patterns to exclude
 * @returns True if the file should be excluded
 */
export const shouldExcludeFile = (
  filePath: string,
  exclude: string[],
): boolean =>
  exclude.some((pattern) =>
    filePath.includes(pattern.replaceAll('**/', '').replaceAll('/**', '')),
  );

/**
 * Get source files from a project, excluding those matching patterns.
 *
 * @function
 * @param project - The ts-morph Project
 * @param exclude - Glob patterns to exclude
 * @returns Array of source files to process
 */
export const getSourceFiles = (
  project: Project,
  exclude: string[],
): SourceFile[] =>
  project
    .getSourceFiles()
    .filter(
      (sourceFile) => !shouldExcludeFile(sourceFile.getFilePath(), exclude),
    );

/**
 * Aggregated result statistics.
 */
export interface AggregatedStats {
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
 * Aggregate file results into overall statistics.
 *
 * @function
 * @param files - Array of file transform results
 * @returns Aggregated statistics
 */
export const aggregateResults = (
  files: FileTransformResult[],
): AggregatedStats => {
  let totalTransformations = 0;
  let totalWarnings = 0;
  let totalErrors = 0;
  let modifiedFiles = 0;

  for (const file of files) {
    totalTransformations += file.transformCount;
    totalWarnings += file.warnings.length;
    totalErrors += file.errors.length;
    if (file.modified) {
      modifiedFiles++;
    }
  }

  return {
    modifiedFiles,
    totalErrors,
    totalFiles: files.length,
    totalTransformations,
    totalWarnings,
  };
};
