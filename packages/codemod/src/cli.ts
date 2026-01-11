#!/usr/bin/env node
import { Command } from 'commander';
import pc from 'picocolors';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { transform } from './transform.ts';
import type { TransformMode, TransformResult } from './types.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(
  readFileSync(join(__dirname, '..', 'package.json'), 'utf-8'),
) as { version: string };

const program = new Command();

program
  .name('bupkis-codemod')
  .description('Migrate Jest assertions to bupkis')
  .version(pkg.version)
  .argument('[patterns...]', 'Glob patterns for files to transform', [
    '**/*.test.ts',
    '**/*.test.tsx',
    '**/*.spec.ts',
    '**/*.spec.tsx',
  ])
  .option('--strict', 'Fail on any unsupported transformation')
  .option('--interactive', 'Prompt for ambiguous cases')
  .option(
    '--best-effort',
    'Transform what we can, add TODOs for the rest (default)',
  )
  .option('--dry-run', 'Show what would be changed without writing')
  .option('-e, --exclude <patterns...>', 'Patterns to exclude', [
    '**/node_modules/**',
  ])
  .action(async (patterns: string[], options) => {
    const mode: TransformMode = options.strict
      ? 'strict'
      : options.interactive
        ? 'interactive'
        : 'best-effort';

    console.log(
      pc.cyan('bupkis-codemod') + ' - Migrating Jest assertions to bupkis\n',
    );

    if (options.dryRun) {
      console.log(pc.yellow('Dry run mode - no files will be modified\n'));
    }

    console.log(`Mode: ${pc.bold(mode)}`);
    console.log(`Patterns: ${patterns.join(', ')}`);
    console.log(`Exclude: ${(options.exclude as string[]).join(', ')}\n`);

    try {
      const result = await transform({
        exclude: options.exclude as string[],
        include: patterns,
        mode,
        write: !options.dryRun,
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
  });

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

program.parse();
