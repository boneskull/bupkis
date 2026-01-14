import { type SourceFile, SyntaxKind } from 'ts-morph';

/**
 * Chai-related import sources to transform/remove.
 */
const CHAI_IMPORT_SOURCES = ['chai'];

/**
 * Chai plugin imports to remove entirely.
 */
const CHAI_PLUGIN_SOURCES = [
  'chai-as-promised',
  'chai-string',
  'chai-subset',
  'chai-datetime',
  'chai-json-schema',
  'chai-http',
  'chai-spies',
  'chai-things',
  'chai-arrays',
  'chai-sorted',
  'dirty-chai',
];

/**
 * Result of transforming imports.
 */
export interface ImportTransformResult {
  /** Whether any imports were modified */
  modified: boolean;
}

/**
 * Transform Chai imports to bupkis and remove plugin imports.
 *
 * @function
 * @param sourceFile - The source file to transform
 * @returns Whether any modifications were made
 */
export const transformImports = (
  sourceFile: SourceFile,
): ImportTransformResult => {
  let hasBupkisImport = false;
  let hasExpectUsage = false;
  let modified = false;

  // Check if bupkis import already exists
  const imports = sourceFile.getImportDeclarations();
  for (const imp of imports) {
    if (imp.getModuleSpecifierValue() === 'bupkis') {
      const namedImports = imp.getNamedImports();
      if (namedImports.some((n) => n.getName() === 'expect')) {
        hasBupkisImport = true;
      }
    }
  }

  // Check for expect usage in code (look for expect() calls)
  const identifiers = sourceFile.getDescendantsOfKind(SyntaxKind.Identifier);
  hasExpectUsage = identifiers.some(
    (id) => id.getText() === 'expect' && isExpectCall(id),
  );

  // Remove chai.use() calls first (before removing imports)
  removeChaUseStatements(sourceFile);

  // Get fresh imports list after potential modifications
  const currentImports = sourceFile.getImportDeclarations();

  // Transform Chai imports and remove plugin imports
  for (const imp of [...currentImports]) {
    const moduleSpecifier = imp.getModuleSpecifierValue();

    // Handle chai imports
    if (CHAI_IMPORT_SOURCES.includes(moduleSpecifier)) {
      // Remove the entire chai import (we'll add bupkis import later)
      imp.remove();
      modified = true;
      continue;
    }

    // Remove chai plugin imports entirely
    if (CHAI_PLUGIN_SOURCES.includes(moduleSpecifier)) {
      imp.remove();
      modified = true;
    }
  }

  // Add bupkis import if needed
  if (hasExpectUsage && !hasBupkisImport) {
    sourceFile.addImportDeclaration({
      moduleSpecifier: 'bupkis',
      namedImports: ['expect'],
    });
    modified = true;
  }

  return { modified };
};

/**
 * Remove all chai.use() call statements.
 *
 * @function
 */
const removeChaUseStatements = (sourceFile: SourceFile): void => {
  const statements = sourceFile.getStatements();

  // Process in reverse to avoid position shifts
  for (let i = statements.length - 1; i >= 0; i--) {
    const stmt = statements[i];

    if (stmt.getKind() !== SyntaxKind.ExpressionStatement) {
      continue;
    }

    const text = stmt.getText();

    // Match chai.use(...) patterns
    if (text.match(/^chai\.use\s*\(/)) {
      stmt.remove();
    }
  }
};

/**
 * Check if an identifier is an expect() call.
 *
 * @function
 */
const isExpectCall = (
  identifier: ReturnType<SourceFile['getDescendantsOfKind']>[0],
): boolean => {
  const parent = identifier.getParent();
  return parent?.getKind() === SyntaxKind.CallExpression;
};
