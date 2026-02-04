import type { SourceFile } from 'ts-morph';

import {
  addBupkisImport,
  getBupkisImport,
  hasBupkisImport,
  hasCallUsage,
} from '@bupkis/codemod-core';

import type { AssertStyle, TransformWarning } from '../types.js';

/**
 * Import sources for node:assert.
 */
const ASSERT_IMPORT_SOURCES = [
  'node:assert',
  'node:assert/strict',
  'assert',
  'assert/strict',
];

/**
 * Strict mode import sources.
 */
const STRICT_IMPORT_SOURCES = new Set(['assert/strict', 'node:assert/strict']);

/**
 * Options for import transformation.
 */
export interface ImportTransformOptions {
  /**
   * Whether expectAsync is needed (async assertions were transformed).
   */
  useExpectAsync?: boolean;
}

/**
 * Result of transforming imports.
 */
export interface ImportTransformResult {
  /** The detected assert style (strict or legacy) */
  assertStyle: AssertStyle;

  /** Whether any imports were modified */
  modified: boolean;

  /** Warnings about import handling */
  warnings: TransformWarning[];
}

/**
 * Transform node:assert imports to bupkis.
 *
 * @function
 * @param sourceFile - The source file to transform
 * @param options - Transform options
 * @returns Result including whether modifications were made and the detected
 *   assert style
 */
export const transformImports = (
  sourceFile: SourceFile,
  options: ImportTransformOptions = {},
): ImportTransformResult => {
  const { useExpectAsync = false } = options;

  let modified = false;
  let assertStyle: AssertStyle = 'strict';
  const warnings: TransformWarning[] = [];

  // Check if bupkis imports already exist
  const hasExpectImport = hasBupkisImport(sourceFile, 'expect');
  const hasExpectAsyncImport = hasBupkisImport(sourceFile, 'expectAsync');

  // Check for expect/expectAsync usage in code
  const hasExpectUsage = hasCallUsage(sourceFile, 'expect');
  const hasExpectAsyncUsage = hasCallUsage(sourceFile, 'expectAsync');

  // Get fresh imports list and process assert imports
  const currentImports = sourceFile.getImportDeclarations();

  for (const imp of [...currentImports]) {
    const moduleSpecifier = imp.getModuleSpecifierValue();

    // Check if this is an assert import
    if (ASSERT_IMPORT_SOURCES.includes(moduleSpecifier)) {
      // Determine assert style from import source
      if (STRICT_IMPORT_SOURCES.has(moduleSpecifier)) {
        assertStyle = 'strict';
      } else {
        // Check for { strict as assert } pattern
        const namedImports = imp.getNamedImports();
        const hasStrictDestructure = namedImports.some(
          (n) =>
            n.getName() === 'strict' &&
            n.getAliasNode()?.getText() === 'assert',
        );

        if (hasStrictDestructure) {
          assertStyle = 'strict';
        } else if (!STRICT_IMPORT_SOURCES.has(moduleSpecifier)) {
          // Plain node:assert or assert - legacy mode
          assertStyle = 'legacy';
        }
      }

      // Remove the assert import
      imp.remove();
      modified = true;
    }
  }

  // Determine what bupkis imports are needed
  const needsExpect = hasExpectUsage && !hasExpectImport;
  const needsExpectAsync =
    (useExpectAsync || hasExpectAsyncUsage) && !hasExpectAsyncImport;

  // Add bupkis imports if needed
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

  return { assertStyle, modified, warnings };
};

/**
 * Detect the assert style from imports without modifying them.
 *
 * @function
 * @param sourceFile - The source file to analyze
 * @returns The detected assert style
 */
export const detectAssertStyle = (sourceFile: SourceFile): AssertStyle => {
  const imports = sourceFile.getImportDeclarations();

  for (const imp of imports) {
    const moduleSpecifier = imp.getModuleSpecifierValue();

    if (ASSERT_IMPORT_SOURCES.includes(moduleSpecifier)) {
      // Check for strict import sources
      if (STRICT_IMPORT_SOURCES.has(moduleSpecifier)) {
        return 'strict';
      }

      // Check for { strict as assert } pattern
      const namedImports = imp.getNamedImports();
      const hasStrictDestructure = namedImports.some(
        (n) =>
          n.getName() === 'strict' && n.getAliasNode()?.getText() === 'assert',
      );

      if (hasStrictDestructure) {
        return 'strict';
      }

      // Plain node:assert - legacy mode
      return 'legacy';
    }
  }

  // Default to strict if no import found (shouldn't happen in practice)
  return 'strict';
};
