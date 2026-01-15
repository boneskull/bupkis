import { expect } from 'bupkis';
import { describe, it } from 'node:test';

import { transformCode } from '../src/transform.js';

describe('transformCode', () => {
  describe('BDD style (expect)', () => {
    it('should transform expect().to.equal()', async () => {
      const { code } = await transformCode(`
import { expect } from 'chai';
expect(foo).to.equal(bar);
      `);
      expect(code, 'to contain', "expect(foo, 'to be', bar)");
      expect(code, 'to contain', "import { expect } from 'bupkis'");
    });

    it('should transform negated expect().to.not.equal()', async () => {
      const { code } = await transformCode(`
import { expect } from 'chai';
expect(foo).to.not.equal(bar);
      `);
      expect(code, 'to contain', "expect(foo, 'not to be', bar)");
    });
  });

  describe('TDD style (assert)', () => {
    it('should transform assert.equal()', async () => {
      const { code } = await transformCode(`
import { assert } from 'chai';
assert.equal(foo, bar);
      `);
      expect(code, 'to contain', "expect(foo, 'to be', bar)");
      expect(code, 'to contain', "import { expect } from 'bupkis'");
    });

    it('should transform assert.isTrue()', async () => {
      const { code } = await transformCode(`
import { assert } from 'chai';
assert.isTrue(result);
      `);
      expect(code, 'to contain', "expect(result, 'to be true')");
    });
  });

  describe('mixed styles', () => {
    it('should transform both BDD and TDD in the same file', async () => {
      const { code, transformCount } = await transformCode(`
import { expect, assert } from 'chai';
expect(a).to.equal(b);
assert.isTrue(c);
      `);
      expect(code, 'to contain', "expect(a, 'to be', b)");
      expect(code, 'to contain', "expect(c, 'to be true')");
      expect(transformCount, 'to be', 2);
    });
  });

  describe('import handling', () => {
    it('should remove chai plugin imports', async () => {
      const { code } = await transformCode(`
import { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);
expect(foo).to.be.true;
      `);
      expect(code, 'not to contain', 'chai-as-promised');
      expect(code, 'not to contain', 'chai.use');
    });

    it('should preserve non-chai imports', async () => {
      const { code } = await transformCode(`
import { expect } from 'chai';
import { describe, it } from 'node:test';
expect(foo).to.be.true;
      `);
      expect(code, 'to contain', "import { describe, it } from 'node:test'");
    });
  });

  describe('transform result', () => {
    it('should return transform count', async () => {
      const { transformCount } = await transformCode(`
import { expect } from 'chai';
expect(a).to.equal(b);
expect(c).to.be.true;
      `);
      expect(transformCount, 'to be', 2);
    });

    it('should return warnings for unsupported matchers in best-effort mode', async () => {
      const { warnings } = await transformCode(
        `
import { expect } from 'chai';
expect(obj).to.respondTo('unknownMethod');
      `,
        { mode: 'best-effort' },
      );
      // respondTo is supported, so no warnings
      expect(warnings, 'to have length', 0);
    });

    it('should return errors in strict mode for unsupported', async () => {
      // This should not throw in best-effort mode
      const { errors } = await transformCode(
        `
import { expect } from 'chai';
expect(a).to.equal(b);
      `,
        { mode: 'best-effort' },
      );
      expect(errors, 'to have length', 0);
    });
  });
});
