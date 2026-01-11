#!/usr/bin/env node
import { bargs, opt, pos } from '@boneskull/bargs';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import pc from 'picocolors';

import type { TransformMode, TransformResult } from './types.ts';

import { transform } from './transform.ts';

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

const { positionals, values } = await bargs('bupkis-codemod', {
  description: 'Migrate Jest assertions to bupkis',
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
  pc.cyan('bupkis-codemod') + ' - Migrating Jest assertions to bupkis\n',
);

if (values['dry-run']) {
  console.log(pc.yellow('Dry run mode - no files will be modified\n'));
}

console.log(`Mode: ${pc.bold(mode)}`);
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
    pc.red('Error:'),
    error instanceof Error ? error.message : error,
  );
  process.exit(1);
}

/**
 * Print transformation result.
 *
 * @function
 */
const printResult = (result: TransformResult): void => {
  console.log(pc.bold('\nResults:'));
  console.log(`  Files processed: ${result.totalFiles}`);
  console.log(`  Files modified: ${pc.green(String(result.modifiedFiles))}`);
  console.log(
    `  Transformations: ${pc.green(String(result.totalTransformations))}`,
  );

  if (result.totalWarnings > 0) {
    console.log(`  Warnings: ${pc.yellow(String(result.totalWarnings))}`);
  }

  if (result.totalErrors > 0) {
    console.log(`  Errors: ${pc.red(String(result.totalErrors))}`);
  }

  // Print file details with warnings/errors
  for (const file of result.files) {
    if (file.warnings.length > 0 || file.errors.length > 0) {
      console.log(`\n${pc.dim(file.filePath)}`);

      for (const warning of file.warnings) {
        console.log(
          `  ${pc.yellow('⚠')} Line ${warning.line}: ${warning.message}`,
        );
      }

      for (const error of file.errors) {
        console.log(
          `  ${pc.red('✗')} ${error.line ? `Line ${error.line}: ` : ''}${error.message}`,
        );
      }
    }
  }

  console.log();

  if (result.totalWarnings > 0) {
    console.log(
      pc.yellow(
        'Note: Search for "TODO: Manual migration needed" in your code for items requiring manual review.',
      ),
    );
  }
};
