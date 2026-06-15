import { expect } from 'bupkis';
import { describe, it } from 'node:test';

import { transformCode } from '../src/transform.js';

describe('transformCode', () => {
  describe('strict equality', () => {
    it('should transform assert.strictEqual() with import handling', async () => {
      const { code } = await transformCode(`
import assert from 'node:assert';
assert.strictEqual(foo, bar);
      `);
      expect(code, 'to contain', "expect(foo, 'to be', bar)");
      expect(code, 'to contain', "import { expect } from 'bupkis'");
    });

    it('should transform assert.notStrictEqual()', async () => {
      const { code } = await transformCode(`
import assert from 'node:assert';
assert.notStrictEqual(foo, bar);
      `);
      expect(code, 'to contain', "expect(foo, 'not to be', bar)");
    });
  });

  describe('truthiness', () => {
    it('should transform assert.ok()', async () => {
      const { code } = await transformCode(`
import assert from 'node:assert';
assert.ok(value);
      `);
      expect(code, 'to contain', "expect(value, 'to be truthy')");
    });

    it('should transform bare assert()', async () => {
      const { code } = await transformCode(`
import assert from 'node:assert';
assert(value);
      `);
      expect(code, 'to contain', "expect(value, 'to be truthy')");
    });
  });

  describe('async assertions', () => {
    it('should transform assert.rejects() and add expectAsync import', async () => {
      const { code } = await transformCode(`
import assert from 'node:assert';
assert.rejects(asyncFn);
      `);
      expect(code, 'to contain', "expectAsync(asyncFn, 'to reject')");
      expect(code, 'to contain', 'expectAsync');
    });

    it('should transform assert.rejects() with Error type', async () => {
      const { code } = await transformCode(`
import assert from 'node:assert';
assert.rejects(asyncFn, Error);
      `);
      expect(
        code,
        'to contain',
        "expectAsync(asyncFn, 'to reject with', Error)",
      );
    });

    it('should transform assert.doesNotReject()', async () => {
      const { code } = await transformCode(`
import assert from 'node:assert';
assert.doesNotReject(asyncFn);
      `);
      expect(code, 'to contain', "expectAsync(asyncFn, 'not to reject')");
    });
  });

  describe('import handling', () => {
    it('should replace node:assert import with bupkis', async () => {
      const { code } = await transformCode(`
import assert from 'node:assert';
assert.strictEqual(a, b);
      `);
      expect(code, 'not to contain', "from 'node:assert'");
      expect(code, 'to contain', "import { expect } from 'bupkis'");
    });

    it('should handle node:assert/strict', async () => {
      const { code } = await transformCode(`
import assert from 'node:assert/strict';
assert.strictEqual(a, b);
      `);
      expect(code, 'not to contain', "from 'node:assert/strict'");
      expect(code, 'to contain', "import { expect } from 'bupkis'");
    });

    it('should preserve non-assert imports', async () => {
      const { code } = await transformCode(`
import assert from 'node:assert';
import { describe, it } from 'node:test';
assert.strictEqual(a, b);
      `);
      expect(code, 'to contain', "import { describe, it } from 'node:test'");
    });
  });

  describe('transform result', () => {
    it('should return transform count', async () => {
      const { transformCount } = await transformCode(`
import assert from 'node:assert';
assert.strictEqual(a, b);
assert.ok(c);
      `);
      expect(transformCount, 'to be', 2);
    });

    it('should return warnings for unsupported methods in best-effort mode', async () => {
      const { code, warnings } = await transformCode(
        `
import assert from 'node:assert';
assert.ifError(err);
      `,
        { mode: 'best-effort' },
      );
      expect(warnings, 'to have length', 1);
      expect(warnings[0]?.message, 'to contain', 'ifError');
      // Code is left unchanged for unsupported methods
      expect(code, 'to contain', 'assert.ifError(err)');
    });

    it('should return no errors in best-effort mode', async () => {
      const { errors } = await transformCode(
        `
import assert from 'node:assert';
assert.strictEqual(a, b);
      `,
        { mode: 'best-effort' },
      );
      expect(errors, 'to have length', 0);
    });
  });

  describe('complex cases', () => {
    it('should handle multiple assertions', async () => {
      const { code, transformCount } = await transformCode(`
import assert from 'node:assert';
assert.strictEqual(a, b);
assert.deepStrictEqual(obj, expected);
assert.ok(value);
assert.throws(fn);
      `);
      expect(transformCount, 'to be', 4);
      expect(code, 'to contain', "expect(a, 'to be', b)");
      expect(code, 'to contain', "expect(obj, 'to deep equal', expected)");
      expect(code, 'to contain', "expect(value, 'to be truthy')");
      expect(code, 'to contain', "expect(fn, 'to throw')");
    });

    it('should handle mixed sync and async assertions', async () => {
      const { code } = await transformCode(`
import assert from 'node:assert';
assert.strictEqual(a, b);
assert.rejects(asyncFn);
      `);
      expect(code, 'to contain', "expect(a, 'to be', b)");
      expect(code, 'to contain', "expectAsync(asyncFn, 'to reject')");
      expect(code, 'to contain', 'expectAsync');
    });
  });
});
