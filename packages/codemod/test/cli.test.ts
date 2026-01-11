import { expect } from 'bupkis';
import { execSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const packageDir = join(__dirname, '..');

describe('CLI', () => {
  it('should show help with --help', () => {
    const result = execSync('npx tsx src/cli.ts --help', {
      cwd: packageDir,
      encoding: 'utf-8',
      shell: '/bin/bash',
    });
    expect(result, 'to contain', 'Usage:');
    expect(result, 'to contain', 'bupkis-codemod');
  });

  it('should show version with --version', () => {
    const result = execSync('npx tsx src/cli.ts --version', {
      cwd: packageDir,
      encoding: 'utf-8',
      shell: '/bin/bash',
    });
    expect(result.trim(), 'to match', /^\d+\.\d+\.\d+/);
  });
});
