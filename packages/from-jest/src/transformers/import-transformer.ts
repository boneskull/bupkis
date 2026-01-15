import { type SourceFile, SyntaxKind } from 'ts-morph';

const JEST_IMPORT_SOURCES = ['@jest/globals', 'vitest', 'jest'];

/**
 * Options for import transformation.
 */
export interface ImportTransformOptions {
  /**
   * Whether sinon assertions are being used (adds @bupkis/sinon imports).
   */
  useSinon?: boolean;
}

/**
 * Transform Jest/Vitest imports to bupkis.
 *
 * @function
 */
export const transformImports = (
  sourceFile: SourceFile,
  options: ImportTransformOptions = {},
): {
  modified: boolean;
} => {
  const { useSinon = false } = options;

  let hasBupkisImport = false;
  let hasSinonImport = false;
  let hasExpectUsage = false;
  let modified = false;

  // Check if bupkis import already exists
  const imports = sourceFile.getImportDeclarations();
  for (const imp of imports) {
    const moduleSpecifier = imp.getModuleSpecifierValue();
    if (moduleSpecifier === 'bupkis') {
      const namedImports = imp.getNamedImports();
      // Check for 'expect' (standard) or 'use' (when using sinon)
      if (
        namedImports.some(
          (n) => n.getName() === 'expect' || n.getName() === 'use',
        )
      ) {
        hasBupkisImport = true;
      }
    } else if (moduleSpecifier === '@bupkis/sinon') {
      hasSinonImport = true;
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
    if (useSinon) {
      // When using sinon, import { use } from bupkis
      sourceFile.addImportDeclaration({
        moduleSpecifier: 'bupkis',
        namedImports: ['use'],
      });
    } else {
      // Standard bupkis import
      sourceFile.addImportDeclaration({
        moduleSpecifier: 'bupkis',
        namedImports: ['expect'],
      });
    }
    modified = true;
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
