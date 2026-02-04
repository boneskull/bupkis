import { expect } from 'bupkis';
import { execSync } from 'node:child_process';
import { describe, it } from 'node:test';

describe('CLI', () => {
  it('should display help with --help flag', () => {
    const output = execSync('npx tsx src/cli.ts --help', {
      cwd: new URL('..', import.meta.url).pathname,
      encoding: 'utf-8',
    });
    expect(output, 'to contain', 'bupkis-from-assert');
    expect(output, 'to contain', 'Migrate node:assert assertions to bupkis');
    expect(output, 'to contain', '--dry-run');
    expect(output, 'to contain', '--strict');
    expect(output, 'to contain', '--best-effort');
  });

  it('should display version with --version flag', () => {
    const output = execSync('npx tsx src/cli.ts --version', {
      cwd: new URL('..', import.meta.url).pathname,
      encoding: 'utf-8',
    });
    expect(output, 'to match', /\d+\.\d+\.\d+/);
  });
});
