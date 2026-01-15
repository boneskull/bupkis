import { type SourceFile, SyntaxKind } from 'ts-morph';

import type { TransformWarning } from '../types.js';

/**
 * Chai-related import sources to transform/remove.
 */
const CHAI_IMPORT_SOURCES = ['chai'];

/**
 * Known chai plugin imports (for reference, but we match chai-* pattern).
 */
const KNOWN_CHAI_PLUGINS = new Set([
  'chai-arrays',
  'chai-as-promised',
  'chai-datetime',
  'chai-http',
  'chai-json-schema',
  'chai-sorted',
  'chai-spies',
  'chai-string',
  'chai-subset',
  'chai-things',
  'dirty-chai',
]);

/**
 * Pattern to match chai plugin imports (chai-*).
 */
const CHAI_PLUGIN_PATTERN = /^chai-/;

/**
 * Result of transforming imports.
 */
export interface ImportTransformResult {
  /** Whether any imports were modified */
  modified: boolean;

  /** Warnings about unrecognized plugins */
  warnings: TransformWarning[];
}

/**
 * Transform Chai imports to bupkis and remove plugin imports.
 *
 * @function
 * @param sourceFile - The source file to transform
 * @returns Whether any modifications were made and any warnings
 */
export const transformImports = (
  sourceFile: SourceFile,
): ImportTransformResult => {
  let hasBupkisImport = false;
  let hasExpectUsage = false;
  let modified = false;
  const warnings: TransformWarning[] = [];

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

  // Build a map of imported plugin identifiers for warning detection
  const pluginImportMap = buildPluginImportMap(sourceFile);

  // Remove chai.use() calls and collect warnings for unrecognized plugins
  const useWarnings = removeChaUseStatements(sourceFile, pluginImportMap);
  warnings.push(...useWarnings);

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

    // Remove any chai-* plugin imports (broad pattern matching)
    if (CHAI_PLUGIN_PATTERN.test(moduleSpecifier)) {
      imp.remove();
      modified = true;
      continue;
    }

    // Also remove dirty-chai (doesn't follow chai-* pattern)
    if (moduleSpecifier === 'dirty-chai') {
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

  return { modified, warnings };
};

/**
 * Build a map of imported identifier names to their module sources.
 *
 * @function
 */
const buildPluginImportMap = (sourceFile: SourceFile): Map<string, string> => {
  const map = new Map<string, string>();

  for (const imp of sourceFile.getImportDeclarations()) {
    const moduleSpecifier = imp.getModuleSpecifierValue();

    // Default import: import foo from 'module'
    const defaultImport = imp.getDefaultImport();
    if (defaultImport) {
      map.set(defaultImport.getText(), moduleSpecifier);
    }

    // Named imports: import { foo, bar } from 'module'
    for (const named of imp.getNamedImports()) {
      const alias = named.getAliasNode();
      const name = alias ? alias.getText() : named.getName();
      map.set(name, moduleSpecifier);
    }

    // Namespace import: import * as foo from 'module'
    const namespaceImport = imp.getNamespaceImport();
    if (namespaceImport) {
      map.set(namespaceImport.getText(), moduleSpecifier);
    }
  }

  return map;
};

/**
 * Check if a module source is a recognized chai plugin.
 *
 * @function
 */
const isRecognizedPlugin = (moduleSource: string): boolean => {
  return (
    CHAI_PLUGIN_PATTERN.test(moduleSource) ||
    KNOWN_CHAI_PLUGINS.has(moduleSource)
  );
};

/**
 * Remove all chai.use() call statements and warn about unrecognized plugins.
 *
 * @function
 */
const removeChaUseStatements = (
  sourceFile: SourceFile,
  pluginImportMap: Map<string, string>,
): TransformWarning[] => {
  const warnings: TransformWarning[] = [];
  const statements = sourceFile.getStatements();

  // Process in reverse to avoid position shifts
  for (let i = statements.length - 1; i >= 0; i--) {
    const stmt = statements[i]!;

    if (stmt.getKind() !== SyntaxKind.ExpressionStatement) {
      continue;
    }

    const text = stmt.getText();

    // Match chai.use(...) patterns
    const match = text.match(/^chai\.use\s*\(\s*(\w+)\s*\)/);
    if (match) {
      const pluginIdentifier = match[1];
      const line = stmt.getStartLineNumber();
      const column = stmt.getStartLinePos();

      // Check if we recognize this plugin
      if (pluginIdentifier) {
        const moduleSource = pluginImportMap.get(pluginIdentifier);

        if (moduleSource && !isRecognizedPlugin(moduleSource)) {
          warnings.push({
            column,
            line,
            message: `Unrecognized chai plugin '${moduleSource}' - manual migration may be needed`,
            originalCode: text,
          });
        } else if (!moduleSource) {
          // Plugin identifier not found in imports - could be inline or dynamic
          warnings.push({
            column,
            line,
            message: `chai.use() with untracked plugin '${pluginIdentifier}' - manual migration may be needed`,
            originalCode: text,
          });
        }
      }

      stmt.remove();
    }
  }

  return warnings;
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
