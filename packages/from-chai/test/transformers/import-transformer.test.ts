import { expect } from 'bupkis';
import { describe, it } from 'node:test';
import { Project, QuoteKind } from 'ts-morph';

import { transformImports } from '../../src/transformers/import-transformer.js';

/**
 * Helper to transform code and return the result.
 */
const transformCode = (code: string) => {
  const project = new Project({
    compilerOptions: { allowJs: true },
    manipulationSettings: { quoteKind: QuoteKind.Single },
    useInMemoryFileSystem: true,
  });
  const sourceFile = project.createSourceFile('temp.ts', code);
  const result = transformImports(sourceFile);
  return { code: sourceFile.getFullText(), result };
};

describe('Import transformer', () => {
  describe('chai imports', () => {
    it('should replace { expect } from chai with bupkis', () => {
      const { code } = transformCode(`
import { expect } from 'chai';
expect(foo, 'to be', bar);
      `);
      expect(code, 'to contain', "import { expect } from 'bupkis'");
      expect(code, 'not to contain', "from 'chai'");
    });

    it('should replace { assert } from chai', () => {
      const { code } = transformCode(`
import { assert } from 'chai';
expect(foo, 'to be', bar);
      `);
      expect(code, 'to contain', "import { expect } from 'bupkis'");
      expect(code, 'not to contain', "from 'chai'");
    });

    it('should handle mixed imports from chai', () => {
      const { code } = transformCode(`
import { expect, should } from 'chai';
expect(foo, 'to be', bar);
      `);
      expect(code, 'to contain', "import { expect } from 'bupkis'");
    });

    it('should handle default import from chai', () => {
      const { code } = transformCode(`
import chai from 'chai';
expect(foo, 'to be', bar);
      `);
      expect(code, 'to contain', "import { expect } from 'bupkis'");
      expect(code, 'not to contain', "import chai from 'chai'");
    });
  });

  describe('chai plugin imports', () => {
    it('should remove chai-as-promised import', () => {
      const { code } = transformCode(`
import chaiAsPromised from 'chai-as-promised';
import { expect } from 'chai';
expect(foo, 'to be', bar);
      `);
      expect(code, 'not to contain', 'chai-as-promised');
      expect(code, 'to contain', "import { expect } from 'bupkis'");
    });

    it('should remove chai-string import', () => {
      const { code } = transformCode(`
import chaiString from 'chai-string';
expect(foo, 'to be', bar);
      `);
      expect(code, 'not to contain', 'chai-string');
    });

    it('should remove chai-subset import', () => {
      const { code } = transformCode(`
import chaiSubset from 'chai-subset';
expect(foo, 'to be', bar);
      `);
      expect(code, 'not to contain', 'chai-subset');
    });
  });

  describe('chai.use() calls', () => {
    it('should remove chai.use() statements', () => {
      const { code } = transformCode(`
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);
expect(foo, 'to be', bar);
      `);
      expect(code, 'not to contain', 'chai.use');
    });

    it('should remove multiple chai.use() calls', () => {
      const { code } = transformCode(`
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import chaiString from 'chai-string';
chai.use(chaiAsPromised);
chai.use(chaiString);
expect(foo, 'to be', bar);
      `);
      expect(code, 'not to contain', 'chai.use');
    });
  });

  describe('preserves other imports', () => {
    it('should keep non-chai imports', () => {
      const { code } = transformCode(`
import { expect } from 'chai';
import { describe, it } from 'node:test';
expect(foo, 'to be', bar);
      `);
      expect(code, 'to contain', "import { describe, it } from 'node:test'");
      expect(code, 'to contain', "import { expect } from 'bupkis'");
    });
  });

  describe('edge cases', () => {
    it('should not add duplicate bupkis import', () => {
      const { code } = transformCode(`
import { expect } from 'bupkis';
expect(foo, 'to be', bar);
      `);
      // Count occurrences of bupkis import
      const matches = code.match(/from 'bupkis'/g);
      expect(matches?.length, 'to be', 1);
    });

    it('should handle files with no chai imports', () => {
      const { code, result } = transformCode(`
const foo = 1;
      `);
      expect(result.modified, 'to be false');
      expect(code, 'not to contain', 'bupkis');
    });
  });
});
