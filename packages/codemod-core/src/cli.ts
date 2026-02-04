import type { Theme } from '@boneskull/bargs';

import { ansi, opt } from '@boneskull/bargs';

import type { BaseTransformResult } from './types.js';

/**
 * Bupkis ANSI theme for CLI help output.
 *
 * Inspired by:
 *
 * - Bupkis brand colors from `bupkis-theme.css`
 * - Shiki "red" syntax highlighting theme (sans the red background)
 *
 * Designed for standard dark terminals.
 */
export const bupkisTheme: Theme = {
  colors: {
    // Commands - bright red like keywords (#f12727)
    command: ansi.brightRed,
    // Command aliases - standard red (dimmer)
    commandAlias: ansi.red,
    // Default text label - dim gray
    defaultText: ansi.brightBlack,
    // Default values - yellow (from red theme's string constants #ffe862)
    defaultValue: ansi.yellow,
    // Description text - standard white
    description: ansi.white,
    // Epilog (footer) - dim
    epilog: ansi.brightBlack,
    // Examples - white
    example: ansi.white,
    // Flags - bright red to match brand
    flag: ansi.brightRed,
    // Positional arguments - bright magenta (from red theme's pinkish strings)
    positional: ansi.brightMagenta,
    // Script name - bold bright red for brand prominence
    scriptName: `${ansi.bold}${ansi.brightRed}`,
    // Section headers - bold bright yellow
    sectionHeader: `${ansi.bold}${ansi.brightYellow}`,
    // Type annotations - yellow
    type: ansi.yellow,
    // URLs - bright cyan for links
    url: ansi.brightCyan,
    // Usage line - white
    usage: ansi.white,
  },
};

/**
 * Default glob patterns for test files.
 */
export const DEFAULT_PATTERNS = [
  '**/*.test.ts',
  '**/*.test.tsx',
  '**/*.spec.ts',
  '**/*.spec.tsx',
];

/**
 * Options for {@link printResult}.
 */
export interface PrintResultOptions<T extends BaseTransformResult> {
  /**
   * Optional callback invoked after printing the main result. Useful for
   * package-specific output like mock matcher detections.
   */
  afterPrint?: (result: T) => void;
}

/**
 * Print transformation result to the console.
 *
 * @function
 * @param result - The transform result to print
 * @param options - Optional configuration
 */
export const printResult = <T extends BaseTransformResult>(
  result: T,
  options?: PrintResultOptions<T>,
): void => {
  console.log(`${ansi.bold}\nResults:${ansi.reset}`);
  console.log(`  Files processed: ${result.totalFiles}`);
  console.log(
    `  Files modified: ${ansi.green}${result.modifiedFiles}${ansi.reset}`,
  );
  console.log(
    `  Transformations: ${ansi.green}${result.totalTransformations}${ansi.reset}`,
  );

  if (result.totalWarnings > 0) {
    console.log(
      `  Warnings: ${ansi.yellow}${result.totalWarnings}${ansi.reset}`,
    );
  }

  if (result.totalErrors > 0) {
    console.log(`  Errors: ${ansi.red}${result.totalErrors}${ansi.reset}`);
  }

  // Print file details with warnings/errors
  for (const file of result.files) {
    if (file.warnings.length > 0 || file.errors.length > 0) {
      console.log(`\n${ansi.dim}${file.filePath}${ansi.reset}`);

      for (const warning of file.warnings) {
        console.log(
          `  ${ansi.yellow}⚠${ansi.reset} Line ${warning.line}: ${warning.message}`,
        );
      }

      for (const error of file.errors) {
        console.log(
          `  ${ansi.red}✗${ansi.reset} ${error.line ? `Line ${error.line}: ` : ''}${error.message}`,
        );
      }
    }
  }

  console.log();

  if (result.totalWarnings > 0) {
    console.log(
      `${ansi.yellow}Note: Search for "TODO: Manual migration needed" in your code for items requiring manual review.${ansi.reset}`,
    );
  }

  // Allow packages to add custom output after the main result
  options?.afterPrint?.(result);
};

/**
 * Create standard CLI options for codemod tools.
 *
 * @function
 * @returns Bargs option definitions for common codemod flags
 */
export const createStandardOptions = () => ({
  'best-effort': opt.boolean({
    description: 'Transform what we can, add TODOs for the rest (default)',
  }),
  'dry-run': opt.boolean({
    description: 'Show what would be changed without writing',
  }),
  exclude: opt.array('string', {
    aliases: ['e'],
    default: ['**/node_modules/**'],
    description: 'Patterns to exclude',
  }),
  interactive: opt.boolean({
    description: 'Prompt for ambiguous cases',
  }),
  strict: opt.boolean({
    description: 'Fail on any unsupported transformation',
  }),
});

/**
 * Determine the transform mode from CLI flags.
 *
 * @function
 * @param values - The parsed CLI values
 * @returns The transform mode to use
 */
export const getTransformMode = (values: {
  interactive?: boolean;
  strict?: boolean;
}): 'best-effort' | 'interactive' | 'strict' =>
  values.strict ? 'strict' : values.interactive ? 'interactive' : 'best-effort';
