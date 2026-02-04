#!/usr/bin/env node
import type { Theme } from '@boneskull/bargs';

import { ansi, bargs, opt, pos } from '@boneskull/bargs';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { TransformMode, TransformResult } from './types.js';

import { transform } from './transform.js';

/**
 * Bupkis ANSI theme for CLI help output.
 *
 * Inspired by:
 *
 * - Bupkis brand colors from `bupkis-theme.css`
 * - Shiki "red" syntax highlighting theme (sans the red background)
 *
 * Designed for standard dark terminals.
 *
 * @internal
 */
const bupkisTheme: Theme = {
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

const __dirname = dirname(fileURLToPath(import.meta.url));
const { parse } = JSON;
const pkg = parse(
  readFileSync(join(__dirname, '..', 'package.json'), 'utf-8'),
) as { version: string };

const DEFAULT_PATTERNS = [
  '**/*.test.ts',
  '**/*.test.tsx',
  '**/*.spec.ts',
  '**/*.spec.tsx',
];

/**
 * Print transformation result.
 *
 * @function
 */
const printResult = (result: TransformResult): void => {
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
};

const { positionals, values } = await bargs('bupkis-from-assert', {
  description: 'Migrate node:assert assertions to bupkis',
  theme: bupkisTheme,
  version: pkg.version,
})
  .globals(
    pos.positionals(
      pos.variadic('string', {
        description: 'Glob patterns for files to transform',
        name: 'patterns',
      }),
    )(
      opt.options({
        'best-effort': opt.boolean({
          description:
            'Transform what we can, add TODOs for the rest (default)',
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
      }),
    ),
  )
  .parseAsync();

const [patterns] = positionals;
const actualPatterns = patterns.length > 0 ? patterns : DEFAULT_PATTERNS;

const mode: TransformMode = values.strict
  ? 'strict'
  : values.interactive
    ? 'interactive'
    : 'best-effort';

console.log(
  `${ansi.cyan}bupkis-from-assert${ansi.reset} - Migrating node:assert assertions to bupkis\n`,
);

if (values['dry-run']) {
  console.log(
    `${ansi.yellow}Dry run mode - no files will be modified${ansi.reset}\n`,
  );
}

console.log(`Mode: ${ansi.bold}${mode}${ansi.reset}`);
console.log(`Patterns: ${actualPatterns.join(', ')}`);
console.log(`Exclude: ${values.exclude.join(', ')}\n`);

try {
  const result = await transform({
    exclude: values.exclude,
    include: actualPatterns,
    mode,
    write: !values['dry-run'],
  });

  printResult(result);

  if (result.totalErrors > 0 && mode === 'strict') {
    process.exit(1);
  }
} catch (error) {
  console.error(
    `${ansi.red}Error:${ansi.reset}`,
    error instanceof Error ? error.message : error,
  );
  process.exit(1);
}
