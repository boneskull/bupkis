import type { Identifier, ImportDeclaration, SourceFile } from 'ts-morph';

import { SyntaxKind } from 'ts-morph';

/**
 * Check if an identifier is used as a function call (vs property access).
 *
 * @function
 * @param identifier - The identifier to check
 * @returns True if the identifier is part of a call expression
 */
export const isCallExpression = (identifier: Identifier): boolean => {
  const parent = identifier.getParent();
  return parent?.getKind() === SyntaxKind.CallExpression;
};

/**
 * Check if any identifier with the given name is used as a call expression.
 *
 * @function
 * @param sourceFile - The source file to search
 * @param name - The identifier name to look for
 * @returns True if the identifier is used as a call
 */
export const hasCallUsage = (sourceFile: SourceFile, name: string): boolean => {
  const identifiers = sourceFile.getDescendantsOfKind(SyntaxKind.Identifier);
  return identifiers.some(
    (id) => id.getText() === name && isCallExpression(id),
  );
};

/**
 * Check if a bupkis import already exists with a specific named import.
 *
 * @function
 * @param sourceFile - The source file to check
 * @param name - The named import to look for (e.g., 'expect', 'expectAsync')
 * @returns True if the import exists
 */
export const hasBupkisImport = (
  sourceFile: SourceFile,
  name: string,
): boolean => {
  const imports = sourceFile.getImportDeclarations();
  for (const imp of imports) {
    if (imp.getModuleSpecifierValue() === 'bupkis') {
      const namedImports = imp.getNamedImports();
      if (namedImports.some((n) => n.getName() === name)) {
        return true;
      }
    }
  }
  return false;
};

/**
 * Get the existing bupkis import declaration, if any.
 *
 * @function
 * @param sourceFile - The source file to check
 * @returns The bupkis import declaration, or undefined
 */
export const getBupkisImport = (
  sourceFile: SourceFile,
): ImportDeclaration | undefined => {
  const imports = sourceFile.getImportDeclarations();
  return imports.find((imp) => imp.getModuleSpecifierValue() === 'bupkis');
};

/**
 * Add named imports to the bupkis import, creating it if necessary.
 *
 * @function
 * @param sourceFile - The source file to modify
 * @param names - The named imports to add
 * @returns True if the import was modified or added
 */
export const addBupkisImport = (
  sourceFile: SourceFile,
  names: string[],
): boolean => {
  if (names.length === 0) {
    return false;
  }

  const existingImport = getBupkisImport(sourceFile);

  if (existingImport) {
    const existingNames = existingImport
      .getNamedImports()
      .map((n) => n.getName());
    const newNames = names.filter((name) => !existingNames.includes(name));
    if (newNames.length > 0) {
      for (const name of newNames) {
        existingImport.addNamedImport(name);
      }
      return true;
    }
    return false;
  }

  // Create new bupkis import
  sourceFile.addImportDeclaration({
    moduleSpecifier: 'bupkis',
    namedImports: names,
  });
  return true;
};

/**
 * Remove a named import from a module specifier.
 *
 * If removing the import leaves the import declaration empty, the entire
 * declaration is removed.
 *
 * @function
 * @param sourceFile - The source file to modify
 * @param moduleSpecifier - The module to remove from
 * @param name - The named import to remove
 * @returns True if the import was removed
 */
export const removeNamedImport = (
  sourceFile: SourceFile,
  moduleSpecifier: string,
  name: string,
): boolean => {
  const imports = sourceFile.getImportDeclarations();
  for (const imp of imports) {
    if (imp.getModuleSpecifierValue() === moduleSpecifier) {
      const namedImports = imp.getNamedImports();
      const targetImport = namedImports.find((n) => n.getName() === name);
      if (targetImport) {
        targetImport.remove();
        // If no other named imports remain, remove the entire import
        if (imp.getNamedImports().length === 0 && !imp.getDefaultImport()) {
          imp.remove();
        }
        return true;
      }
    }
  }
  return false;
};

/**
 * Check if any import exists from the given module specifiers.
 *
 * @function
 * @param sourceFile - The source file to check
 * @param moduleSpecifiers - Array of module specifiers to look for
 * @returns True if any import exists from the given modules
 */
export const hasImportFrom = (
  sourceFile: SourceFile,
  moduleSpecifiers: string[],
): boolean => {
  const imports = sourceFile.getImportDeclarations();
  return imports.some((imp) =>
    moduleSpecifiers.includes(imp.getModuleSpecifierValue()),
  );
};

/**
 * Get all import declarations from the given module specifiers.
 *
 * @function
 * @param sourceFile - The source file to check
 * @param moduleSpecifiers - Array of module specifiers to look for
 * @returns Array of matching import declarations
 */
export const getImportsFrom = (
  sourceFile: SourceFile,
  moduleSpecifiers: string[],
): ImportDeclaration[] => {
  const imports = sourceFile.getImportDeclarations();
  return imports.filter((imp) =>
    moduleSpecifiers.includes(imp.getModuleSpecifierValue()),
  );
};
