import { expect } from 'bupkis';
import { describe, it } from 'node:test';
import { Project, QuoteKind } from 'ts-morph';

import { transformAssertCalls } from '../../src/transformers/assert-transformer.js';

/**
 * Helper to transform code and return the result.
 */
const transformCode = (
  code: string,
  assertStyle: 'legacy' | 'strict' = 'strict',
) => {
  const project = new Project({
    compilerOptions: { allowJs: true },
    manipulationSettings: { quoteKind: QuoteKind.Single },
    useInMemoryFileSystem: true,
  });
  const sourceFile = project.createSourceFile('temp.ts', code);
  const result = transformAssertCalls(sourceFile, 'best-effort', assertStyle);
  return { code: sourceFile.getFullText(), result };
};

describe('Assert transformer', () => {
  describe('equality', () => {
    it('should transform assert.strictEqual(a, b)', () => {
      const { code } = transformCode('assert.strictEqual(foo, bar);');
      expect(code, 'to contain', "expect(foo, 'to be', bar)");
    });

    it('should transform assert.notStrictEqual(a, b)', () => {
      const { code } = transformCode('assert.notStrictEqual(foo, bar);');
      expect(code, 'to contain', "expect(foo, 'not to be', bar)");
    });

    it('should transform assert.deepStrictEqual(a, b)', () => {
      const { code } = transformCode('assert.deepStrictEqual(obj, { a: 1 });');
      expect(code, 'to contain', "expect(obj, 'to deep equal', { a: 1 })");
    });

    it('should transform assert.notDeepStrictEqual(a, b)', () => {
      const { code } = transformCode('assert.notDeepStrictEqual(obj, other);');
      expect(code, 'to contain', "expect(obj, 'not to deep equal', other)");
    });
  });

  describe('legacy equality (with warnings)', () => {
    it('should transform assert.equal(a, b) with warning in legacy mode', () => {
      const { code, result } = transformCode(
        'assert.equal(foo, bar);',
        'legacy',
      );
      expect(code, 'to contain', "expect(foo, 'to be', bar)");
      expect(result.warnings, 'to have length', 1);
      expect(result.warnings[0]?.message, 'to contain', 'Loose equality');
    });

    it('should transform assert.notEqual(a, b) with warning in legacy mode', () => {
      const { code, result } = transformCode(
        'assert.notEqual(foo, bar);',
        'legacy',
      );
      expect(code, 'to contain', "expect(foo, 'not to be', bar)");
      expect(result.warnings, 'to have length', 1);
      expect(result.warnings[0]?.message, 'to contain', 'Loose equality');
    });

    it('should transform assert.equal(a, b) without warning in strict mode', () => {
      const { code, result } = transformCode(
        'assert.equal(foo, bar);',
        'strict',
      );
      expect(code, 'to contain', "expect(foo, 'to be', bar)");
      expect(result.warnings, 'to have length', 0);
    });

    it('should transform assert.deepEqual(a, b)', () => {
      const { code } = transformCode('assert.deepEqual(obj, { a: 1 });');
      expect(code, 'to contain', "expect(obj, 'to deep equal', { a: 1 })");
    });

    it('should transform assert.notDeepEqual(a, b)', () => {
      const { code } = transformCode('assert.notDeepEqual(obj, other);');
      expect(code, 'to contain', "expect(obj, 'not to deep equal', other)");
    });
  });

  describe('truthiness', () => {
    it('should transform assert(value) - bare assert', () => {
      const { code } = transformCode('assert(value);');
      expect(code, 'to contain', "expect(value, 'to be truthy')");
    });

    it('should transform assert(complex.expression)', () => {
      const { code } = transformCode('assert(foo.bar.baz);');
      expect(code, 'to contain', "expect(foo.bar.baz, 'to be truthy')");
    });

    it('should transform assert(fn())', () => {
      const { code } = transformCode('assert(getValue());');
      expect(code, 'to contain', "expect(getValue(), 'to be truthy')");
    });

    it('should transform assert.ok(value)', () => {
      const { code } = transformCode('assert.ok(value);');
      expect(code, 'to contain', "expect(value, 'to be truthy')");
    });
  });

  describe('throws', () => {
    it('should transform assert.throws(fn)', () => {
      const { code } = transformCode('assert.throws(fn);');
      expect(code, 'to contain', "expect(fn, 'to throw')");
    });

    it('should transform assert.throws(fn, Error)', () => {
      const { code } = transformCode('assert.throws(fn, Error);');
      expect(code, 'to contain', "expect(fn, 'to throw', Error)");
    });

    it('should transform assert.throws(fn, /regex/)', () => {
      const { code } = transformCode('assert.throws(fn, /error message/);');
      expect(code, 'to contain', "expect(fn, 'to throw', /error message/)");
    });

    it('should transform assert.doesNotThrow(fn)', () => {
      const { code } = transformCode('assert.doesNotThrow(fn);');
      expect(code, 'to contain', "expect(fn, 'not to throw')");
    });
  });

  describe('async assertions', () => {
    it('should transform assert.rejects(asyncFn)', () => {
      const { code, result } = transformCode('assert.rejects(asyncFn);');
      expect(code, 'to contain', "expectAsync(asyncFn, 'to reject')");
      expect(result.useExpectAsync, 'to be true');
    });

    it('should transform assert.rejects(asyncFn, Error)', () => {
      const { code } = transformCode('assert.rejects(asyncFn, Error);');
      expect(
        code,
        'to contain',
        "expectAsync(asyncFn, 'to reject with', Error)",
      );
    });

    it('should transform assert.doesNotReject(asyncFn)', () => {
      const { code, result } = transformCode('assert.doesNotReject(asyncFn);');
      expect(code, 'to contain', "expectAsync(asyncFn, 'not to reject')");
      expect(result.useExpectAsync, 'to be true');
    });

    it('should track useExpectAsync flag', () => {
      const { result } = transformCode('assert.rejects(fn);');
      expect(result.useExpectAsync, 'to be true');
    });

    it('should not set useExpectAsync for sync assertions', () => {
      const { result } = transformCode('assert.throws(fn);');
      expect(result.useExpectAsync, 'to be false');
    });
  });

  describe('string matching', () => {
    it('should transform assert.match(str, /regex/)', () => {
      const { code } = transformCode('assert.match(str, /foo/);');
      expect(code, 'to contain', "expect(str, 'to match', /foo/)");
    });

    it('should transform assert.doesNotMatch(str, /regex/)', () => {
      const { code } = transformCode('assert.doesNotMatch(str, /bar/);');
      expect(code, 'to contain', "expect(str, 'not to match', /bar/)");
    });
  });

  describe('fail', () => {
    it('should transform assert.fail()', () => {
      const { code } = transformCode('assert.fail();');
      expect(code, 'to contain', 'expect.fail()');
    });

    it('should transform assert.fail(message)', () => {
      const { code } = transformCode("assert.fail('Custom message');");
      expect(code, 'to contain', "expect.fail('Custom message')");
    });
  });

  describe('unsupported', () => {
    it('should return warning for assert.ifError', () => {
      const { code, result } = transformCode('assert.ifError(err);');
      // Code is left unchanged
      expect(code, 'to contain', 'assert.ifError(err)');
      // Warning is returned
      expect(result.warnings, 'to have length', 1);
      expect(result.warnings[0]?.message, 'to contain', 'ifError');
    });
  });

  describe('transform result', () => {
    it('should count transformations', () => {
      const { result } = transformCode(`
        assert.strictEqual(a, b);
        assert.ok(c);
      `);
      expect(result.transformCount, 'to be', 2);
    });

    it('should handle nested function calls in arguments', () => {
      const { code } = transformCode(
        'assert.strictEqual(getValue(), expected);',
      );
      expect(code, 'to contain', "expect(getValue(), 'to be', expected)");
    });

    it('should handle complex expressions in arguments', () => {
      const { code } = transformCode(
        'assert.strictEqual(obj.nested.value, { key: fn() });',
      );
      expect(
        code,
        'to contain',
        "expect(obj.nested.value, 'to be', { key: fn() })",
      );
    });
  });
});
