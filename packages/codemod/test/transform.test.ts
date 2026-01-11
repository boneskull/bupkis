import { expect } from 'bupkis';
import { describe, it } from 'node:test';

import { transformCode } from '../src/transform.ts';

describe('transformCode', () => {
  it('should transform expect().toBe() to expect(, "to be", )', async () => {
    const input = `expect(42).toBe(42);`;
    const result = await transformCode(input);
    expect(result.code, 'to contain', `expect(42, 'to be', 42)`);
    expect(result.transformCount, 'to equal', 1);
  });

  it('should transform expect().not.toBe() to expect(, "not to be", )', async () => {
    const input = `expect(42).not.toBe(0);`;
    const result = await transformCode(input);
    expect(result.code, 'to contain', `expect(42, 'not to be', 0)`);
  });

  it('should transform expect().toEqual() to expect(, "to deep equal", )', async () => {
    const input = `expect({a: 1}).toEqual({a: 1});`;
    const result = await transformCode(input);
    expect(
      result.code,
      'to contain',
      `expect({a: 1}, 'to deep equal', {a: 1})`,
    );
  });

  it('should handle multiple assertions in one file', async () => {
    const input = `
expect(1).toBe(1);
expect(2).toBe(2);
expect(3).toEqual(3);
`.trim();
    const result = await transformCode(input);
    expect(result.transformCount, 'to equal', 3);
  });

  it('should preserve non-expect code', async () => {
    const input = `
const x = 42;
expect(x).toBe(42);
console.log(x);
`.trim();
    const result = await transformCode(input);
    expect(result.code, 'to contain', 'const x = 42');
    expect(result.code, 'to contain', 'console.log(x)');
  });
});
