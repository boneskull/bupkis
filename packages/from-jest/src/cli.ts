#!/usr/bin/env node
import { ansi, bargs, opt, pos } from '@boneskull/bargs';
import { readFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import type {
  MockMatcherDetection,
  TransformMode,
  TransformResult,
} from './types.js';

import { transform } from './transform.js';

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

/**
 * Print mock matcher detection summary.
 *
 * @function
 */
const printMockMatcherDetections = (
  detections: MockMatcherDetection[],
): void => {
  // Group by file
  const byFile = new Map<string, MockMatcherDetection[]>();
  for (const detection of detections) {
    const existing = byFile.get(detection.filePath) ?? [];
    existing.push(detection);
    byFile.set(detection.filePath, existing);
  }

  const totalCount = detections.reduce((sum, d) => sum + d.count, 0);
  const fileCount = byFile.size;
  const cwd = process.cwd();

  console.log(
    `\n${ansi.yellow}⚠ Found ${totalCount} mock/spy matcher(s) in ${fileCount} file(s):${ansi.reset}`,
  );

  for (const [filePath, fileDetections] of byFile) {
    const relativePath = relative(cwd, filePath);
    const matcherSummary = fileDetections
      .map((d) => `${d.matcher}${d.count > 1 ? ` (x${d.count})` : ''}`)
      .join(', ');
    console.log(`  ${ansi.dim}${relativePath}:${ansi.reset} ${matcherSummary}`);
  }

  console.log(`
${ansi.cyan}To transform these, rerun with:${ansi.reset} npx @bupkis/from-jest --sinon

${ansi.yellow}Note: You'll need to:${ansi.reset}
  1. Install ${ansi.dim}@bupkis/sinon${ansi.reset} using your package manager
  2. Migrate jest.fn()/vi.fn() calls to Sinon spies (manual)
`);
};

const { positionals, values } = await bargs('bupkis-from-jest', {
  description: 'Migrate Jest and Vitest assertions to bupkis',
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
        sinon: opt.boolean({
          description: 'Transform mock/spy matchers to @bupkis/sinon',
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
  `${ansi.cyan}bupkis-from-jest${ansi.reset} - Migrating Jest/Vitest assertions to bupkis\n`,
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
    sinon: values.sinon,
    write: !values['dry-run'],
  });

  printResult(result);

  // Print mock matcher detection summary if any were found and --sinon not enabled
  if (result.mockMatcherDetections.length > 0 && !values.sinon) {
    printMockMatcherDetections(result.mockMatcherDetections);
  }

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
