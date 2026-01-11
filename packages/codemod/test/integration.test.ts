import { expect } from 'bupkis';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

import { transformCode } from '../src/transform.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));

describe('integration', () => {
  it('should transform Jest example to expected bupkis output', async () => {
    const input = readFileSync(
      join(__dirname, 'fixtures/jest-example.ts'),
      'utf-8',
    );
    const expected = readFileSync(
      join(__dirname, 'fixtures/expected.ts'),
      'utf-8',
    );

    const result = await transformCode(input);

    // Normalize whitespace for comparison
    const normalizeWs = (s: string) => s.replace(/\s+/g, ' ').trim();

    expect(normalizeWs(result.code), 'to equal', normalizeWs(expected));
    expect(result.warnings, 'to be empty');
    expect(result.errors, 'to be empty');
  });
});
