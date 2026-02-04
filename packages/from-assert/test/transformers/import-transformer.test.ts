import { expect } from 'bupkis';
import { describe, it } from 'node:test';
import { Project, QuoteKind } from 'ts-morph';

import {
  detectAssertStyle,
  transformImports,
} from '../../src/transformers/import-transformer.js';

/**
 * Helper to transform code and return the result.
 */
const transformCode = (code: string, useExpectAsync = false) => {
  const project = new Project({
    compilerOptions: { allowJs: true },
    manipulationSettings: { quoteKind: QuoteKind.Single },
    useInMemoryFileSystem: true,
  });
  const sourceFile = project.createSourceFile('temp.ts', code);
  const result = transformImports(sourceFile, { useExpectAsync });
  return { code: sourceFile.getFullText(), result };
};

/**
 * Helper to detect assert style.
 */
const getAssertStyle = (code: string) => {
  const project = new Project({
    compilerOptions: { allowJs: true },
    useInMemoryFileSystem: true,
  });
  const sourceFile = project.createSourceFile('temp.ts', code);
  return detectAssertStyle(sourceFile);
};

describe('Import transformer', () => {
  describe('assert imports', () => {
    it('should replace default import from node:assert', () => {
      const { code } = transformCode(`
import assert from 'node:assert';
expect(foo, 'to be', bar);
      `);
      expect(code, 'to contain', "import { expect } from 'bupkis'");
      expect(code, 'not to contain', "from 'node:assert'");
    });

    it('should replace default import from node:assert/strict', () => {
      const { code } = transformCode(`
import assert from 'node:assert/strict';
expect(foo, 'to be', bar);
      `);
      expect(code, 'to contain', "import { expect } from 'bupkis'");
      expect(code, 'not to contain', "from 'node:assert/strict'");
    });

    it('should handle { strict as assert } destructuring', () => {
      const { code } = transformCode(`
import { strict as assert } from 'node:assert';
expect(foo, 'to be', bar);
      `);
      expect(code, 'to contain', "import { expect } from 'bupkis'");
      expect(code, 'not to contain', "from 'node:assert'");
    });

    it('should handle import without node: prefix', () => {
      const { code } = transformCode(`
import assert from 'assert';
expect(foo, 'to be', bar);
      `);
      expect(code, 'to contain', "import { expect } from 'bupkis'");
      expect(code, 'not to contain', "from 'assert'");
    });

    it('should handle import from assert/strict', () => {
      const { code } = transformCode(`
import assert from 'assert/strict';
expect(foo, 'to be', bar);
      `);
      expect(code, 'to contain', "import { expect } from 'bupkis'");
      expect(code, 'not to contain', "from 'assert/strict'");
    });
  });

  describe('expectAsync handling', () => {
    it('should add expectAsync when async assertions transformed', () => {
      const { code } = transformCode(
        `
import assert from 'node:assert';
expectAsync(asyncFn, 'to reject');
      `,
        true,
      );
      // Only expectAsync is used in this code, so only expectAsync is imported
      expect(code, 'to contain', "import { expectAsync } from 'bupkis'");
    });

    it('should not add expectAsync when no async assertions', () => {
      const { code } = transformCode(
        `
import assert from 'node:assert';
expect(foo, 'to be', bar);
      `,
        false,
      );
      expect(code, 'to contain', "import { expect } from 'bupkis'");
      expect(code, 'not to contain', 'expectAsync');
    });

    it('should add only expectAsync if expect already exists', () => {
      const { code } = transformCode(
        `
import assert from 'node:assert';
import { expect } from 'bupkis';
expectAsync(fn, 'to reject');
      `,
        true,
      );
      // Should add expectAsync to existing import
      expect(code, 'to contain', 'expectAsync');
    });
  });

  describe('preserves other imports', () => {
    it('should keep non-assert imports', () => {
      const { code } = transformCode(`
import assert from 'node:assert';
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

    it('should handle files with no assert imports', () => {
      const { code, result } = transformCode(`
const foo = 1;
      `);
      expect(result.modified, 'to be false');
      expect(code, 'not to contain', 'bupkis');
    });

    it('should handle files with no expect usage', () => {
      const { code, result } = transformCode(`
import assert from 'node:assert';
const foo = 1;
      `);
      // Import is removed but no bupkis added since no expect usage
      expect(result.modified, 'to be true');
      expect(code, 'not to contain', "from 'node:assert'");
    });
  });

  describe('assert style detection', () => {
    it('should detect strict style from node:assert/strict', () => {
      const style = getAssertStyle("import assert from 'node:assert/strict';");
      expect(style, 'to be', 'strict');
    });

    it('should detect strict style from assert/strict', () => {
      const style = getAssertStyle("import assert from 'assert/strict';");
      expect(style, 'to be', 'strict');
    });

    it('should detect strict style from { strict as assert }', () => {
      const style = getAssertStyle(
        "import { strict as assert } from 'node:assert';",
      );
      expect(style, 'to be', 'strict');
    });

    it('should detect legacy style from plain node:assert', () => {
      const style = getAssertStyle("import assert from 'node:assert';");
      expect(style, 'to be', 'legacy');
    });

    it('should detect legacy style from plain assert', () => {
      const style = getAssertStyle("import assert from 'assert';");
      expect(style, 'to be', 'legacy');
    });
  });
});
