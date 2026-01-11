import { expect } from 'bupkis';
import { describe, it } from 'node:test';

import { transformCode } from '../src/transform.ts';

describe('import transformation', () => {
  it('should add bupkis import when expect is used as global', async () => {
    const input = `expect(42).toBe(42);`;
    const result = await transformCode(input);
    expect(result.code, 'to contain', 'import { expect } from "bupkis"');
  });

  it('should replace @jest/globals import', async () => {
    const input = `
import { expect } from '@jest/globals';
expect(42).toBe(42);
`.trim();
    const result = await transformCode(input);
    expect(result.code, 'to contain', 'import { expect } from "bupkis"');
    expect(result.code, 'not to contain', '@jest/globals');
  });

  it('should handle vitest import', async () => {
    const input = `
import { expect } from 'vitest';
expect(42).toBe(42);
`.trim();
    const result = await transformCode(input);
    expect(result.code, 'to contain', 'import { expect } from "bupkis"');
    expect(result.code, 'not to contain', "'vitest'");
  });

  it('should preserve other imports from @jest/globals', async () => {
    const input = `
import { describe, it, expect } from '@jest/globals';
expect(42).toBe(42);
`.trim();
    const result = await transformCode(input);
    expect(
      result.code,
      'to contain',
      "import { describe, it } from '@jest/globals'",
    );
    expect(result.code, 'to contain', 'import { expect } from "bupkis"');
  });
});
