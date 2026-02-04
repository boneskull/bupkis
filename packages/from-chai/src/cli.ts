#!/usr/bin/env node
import { ansi, bargs, opt, pos } from '@boneskull/bargs';
import {
  bupkisTheme,
  DEFAULT_PATTERNS,
  getTransformMode,
  printResult,
} from '@bupkis/codemod-core';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { TransformResult } from './types.js';

import { transform } from './transform.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const { parse } = JSON;
const pkg = parse(
  readFileSync(join(__dirname, '..', 'package.json'), 'utf-8'),
) as { version: string };

const { positionals, values } = await bargs('bupkis-from-chai', {
  description: 'Migrate Chai assertions to bupkis',
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
const mode = getTransformMode(values);

console.log(
  `${ansi.cyan}bupkis-from-chai${ansi.reset} - Migrating Chai assertions to bupkis\n`,
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

  printResult<TransformResult>(result);

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
