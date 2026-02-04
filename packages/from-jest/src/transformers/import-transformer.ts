import type { SourceFile } from 'ts-morph';

import {
  addBupkisImport,
  getBupkisImport,
  getImportsFrom,
  hasBupkisImport,
  hasCallUsage,
  hasImportFrom,
  removeNamedImport,
} from '@bupkis/codemod-core';

const JEST_IMPORT_SOURCES = ['@jest/globals', 'vitest', 'jest'];

/**
 * Options for import transformation.
 */
export interface ImportTransformOptions {
  /**
   * Whether expectAsync is needed (promise matchers were transformed).
   */
  useExpectAsync?: boolean;

  /**
   * Whether sinon assertions are being used (adds @bupkis/sinon imports).
   */
  useSinon?: boolean;
}

/**
 * Transform Jest/Vitest imports to bupkis.
 *
 * @function
 * @param sourceFile - The source file to transform
 * @param options - Transform options
 * @returns Whether the file was modified
 */
export const transformImports = (
  sourceFile: SourceFile,
  options: ImportTransformOptions = {},
): {
  modified: boolean;
} => {
  const { useExpectAsync = false, useSinon = false } = options;

  let modified = false;

  // Check existing imports
  const hasExpectImport =
    hasBupkisImport(sourceFile, 'expect') || hasBupkisImport(sourceFile, 'use');
  const hasExpectAsyncImport = hasBupkisImport(sourceFile, 'expectAsync');
  const hasSinonImport = hasImportFrom(sourceFile, ['@bupkis/sinon']);

  // Check for expect/expectAsync usage in code
  const hasExpectUsage = hasCallUsage(sourceFile, 'expect');
  const hasExpectAsyncUsage = hasCallUsage(sourceFile, 'expectAsync');

  // Transform Jest/Vitest imports - remove 'expect' from them
  const jestImports = getImportsFrom(sourceFile, JEST_IMPORT_SOURCES);
  for (const imp of jestImports) {
    const removed = removeNamedImport(
      sourceFile,
      imp.getModuleSpecifierValue(),
      'expect',
    );
    if (removed) {
      modified = true;
    }
  }

  // Determine what imports are needed
  const needsExpectAsync =
    (useExpectAsync || hasExpectAsyncUsage) && !hasExpectAsyncImport;
  // Need expect if: there are expect() calls OR we need expectAsync (for expect.it())
  const needsExpect = (hasExpectUsage || needsExpectAsync) && !hasExpectImport;

  // Handle bupkis imports
  if (needsExpect || needsExpectAsync) {
    const existingBupkisImport = getBupkisImport(sourceFile);
    if (existingBupkisImport) {
      // Add to existing bupkis import
      if (needsExpect) {
        existingBupkisImport.addNamedImport('expect');
        modified = true;
      }
      if (needsExpectAsync) {
        existingBupkisImport.addNamedImport('expectAsync');
        modified = true;
      }
    } else if (useSinon) {
      // When using sinon, import { use } from bupkis (and optionally expectAsync)
      const namedImports: string[] = ['use'];
      if (needsExpectAsync) {
        namedImports.push('expectAsync');
      }
      addBupkisImport(sourceFile, namedImports);
      modified = true;
    } else {
      // Create new bupkis import
      const namedImports: string[] = [];
      if (needsExpect) {
        namedImports.push('expect');
      }
      if (needsExpectAsync) {
        namedImports.push('expectAsync');
      }
      if (addBupkisImport(sourceFile, namedImports)) {
        modified = true;
      }
    }
  }

  // Add sinon imports if needed
  if (useSinon && hasExpectUsage && !hasSinonImport) {
    sourceFile.addImportDeclaration({
      defaultImport: 'sinonAssertions',
      moduleSpecifier: '@bupkis/sinon',
    });

    // Add the use() statement to create expect
    // Insert after all import declarations
    const allStatements = sourceFile.getStatements();
    const importDecls = sourceFile.getImportDeclarations();
    if (importDecls.length > 0) {
      const lastImport = importDecls.at(-1)!;
      const lastImportIndex = allStatements.indexOf(lastImport);
      sourceFile.insertStatements(lastImportIndex + 1, (writer) => {
        writer.blankLine();
        writer.writeLine('const { expect } = use(sinonAssertions);');
      });
    }
    modified = true;
  }

  return { modified };
};
