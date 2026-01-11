import { type SourceFile, SyntaxKind } from 'ts-morph';

const JEST_IMPORT_SOURCES = ['@jest/globals', 'vitest', 'jest'];

/**
 * Transform Jest/Vitest imports to bupkis.
 *
 * @function
 */
export const transformImports = (
  sourceFile: SourceFile,
): {
  modified: boolean;
} => {
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

  // Check for expect usage in code
  const identifiers = sourceFile.getDescendantsOfKind(SyntaxKind.Identifier);
  hasExpectUsage = identifiers.some(
    (id) => id.getText() === 'expect' && isExpectCall(id),
  );

  // Transform Jest/Vitest imports
  for (const imp of imports) {
    const moduleSpecifier = imp.getModuleSpecifierValue();

    if (JEST_IMPORT_SOURCES.includes(moduleSpecifier)) {
      const namedImports = imp.getNamedImports();
      const expectImport = namedImports.find((n) => n.getName() === 'expect');

      if (expectImport) {
        // Remove expect from this import
        expectImport.remove();
        modified = true;

        // If no other named imports remain, remove the entire import
        if (imp.getNamedImports().length === 0) {
          imp.remove();
        }
      }
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
