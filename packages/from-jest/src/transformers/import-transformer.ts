import { type ImportDeclaration, type SourceFile, SyntaxKind } from 'ts-morph';

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
 */
export const transformImports = (
  sourceFile: SourceFile,
  options: ImportTransformOptions = {},
): {
  modified: boolean;
} => {
  const { useExpectAsync = false, useSinon = false } = options;

  let existingBupkisImport: ImportDeclaration | undefined;
  let hasExpectImport = false;
  let hasExpectAsyncImport = false;
  let hasSinonImport = false;
  let hasExpectUsage = false;
  let hasExpectAsyncUsage = false;
  let modified = false;

  // Check if bupkis import already exists
  const imports = sourceFile.getImportDeclarations();
  for (const imp of imports) {
    const moduleSpecifier = imp.getModuleSpecifierValue();
    if (moduleSpecifier === 'bupkis') {
      existingBupkisImport = imp;
      const namedImports = imp.getNamedImports();
      // Check for 'expect' (standard) or 'use' (when using sinon)
      if (
        namedImports.some(
          (n) => n.getName() === 'expect' || n.getName() === 'use',
        )
      ) {
        hasExpectImport = true;
      }
      // Check for 'expectAsync'
      if (namedImports.some((n) => n.getName() === 'expectAsync')) {
        hasExpectAsyncImport = true;
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
  hasExpectAsyncUsage = identifiers.some(
    (id) => id.getText() === 'expectAsync' && isExpectCall(id),
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

  // Determine what imports are needed
  const needsExpectAsync =
    (useExpectAsync || hasExpectAsyncUsage) && !hasExpectAsyncImport;
  // Need expect if: there are expect() calls OR we need expectAsync (for expect.it())
  const needsExpect = (hasExpectUsage || needsExpectAsync) && !hasExpectImport;

  // Handle bupkis imports
  if (needsExpect || needsExpectAsync) {
    if (existingBupkisImport) {
      // Add to existing bupkis import
      if (needsExpect) {
        existingBupkisImport.addNamedImport('expect');
      }
      if (needsExpectAsync) {
        existingBupkisImport.addNamedImport('expectAsync');
      }
      modified = true;
    } else if (useSinon) {
      // When using sinon, import { use } from bupkis (and optionally expectAsync)
      const namedImports: string[] = ['use'];
      if (needsExpectAsync) {
        namedImports.push('expectAsync');
      }
      sourceFile.addImportDeclaration({
        moduleSpecifier: 'bupkis',
        namedImports,
      });
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
      sourceFile.addImportDeclaration({
        moduleSpecifier: 'bupkis',
        namedImports,
      });
      modified = true;
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
