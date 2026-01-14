import { expect } from 'bupkis';
import { describe, it } from 'node:test';
import { Project, QuoteKind } from 'ts-morph';

import { transformTddAssertCalls } from '../../src/transformers/tdd-transformer.js';

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
  const result = transformTddAssertCalls(sourceFile, 'best-effort');
  return { code: sourceFile.getFullText(), result };
};

describe('TDD transformer', () => {
  describe('equality', () => {
    it('should transform assert.equal(a, b)', () => {
      const { code } = transformCode('assert.equal(foo, bar);');
      expect(code, 'to contain', "expect(foo, 'to be', bar)");
    });

    it('should transform assert.strictEqual(a, b)', () => {
      const { code } = transformCode('assert.strictEqual(foo, bar);');
      expect(code, 'to contain', "expect(foo, 'to be', bar)");
    });

    it('should transform assert.deepEqual(a, b)', () => {
      const { code } = transformCode('assert.deepEqual(obj, { a: 1 });');
      expect(code, 'to contain', "expect(obj, 'to deep equal', { a: 1 })");
    });

    it('should transform assert.notEqual(a, b)', () => {
      const { code } = transformCode('assert.notEqual(foo, bar);');
      expect(code, 'to contain', "expect(foo, 'not to be', bar)");
    });

    it('should transform assert.notDeepEqual(a, b)', () => {
      const { code } = transformCode('assert.notDeepEqual(obj, other);');
      expect(code, 'to contain', "expect(obj, 'not to deep equal', other)");
    });
  });

  describe('truthiness', () => {
    it('should transform assert.isTrue(x)', () => {
      const { code } = transformCode('assert.isTrue(result);');
      expect(code, 'to contain', "expect(result, 'to be true')");
    });

    it('should transform assert.isFalse(x)', () => {
      const { code } = transformCode('assert.isFalse(result);');
      expect(code, 'to contain', "expect(result, 'to be false')");
    });

    it('should transform assert.isNull(x)', () => {
      const { code } = transformCode('assert.isNull(value);');
      expect(code, 'to contain', "expect(value, 'to be null')");
    });

    it('should transform assert.isUndefined(x)', () => {
      const { code } = transformCode('assert.isUndefined(value);');
      expect(code, 'to contain', "expect(value, 'to be undefined')");
    });

    it('should transform assert.isOk(x)', () => {
      const { code } = transformCode('assert.isOk(value);');
      expect(code, 'to contain', "expect(value, 'to be truthy')");
    });

    it('should transform assert.isNotTrue(x)', () => {
      const { code } = transformCode('assert.isNotTrue(result);');
      expect(code, 'to contain', "expect(result, 'not to be true')");
    });
  });

  describe('type checking', () => {
    it('should transform assert.typeOf(x, type)', () => {
      const { code } = transformCode("assert.typeOf(foo, 'string');");
      expect(code, 'to contain', "expect(foo, 'to be a', 'string')");
    });

    it('should transform assert.instanceOf(x, Cls)', () => {
      const { code } = transformCode('assert.instanceOf(obj, MyClass);');
      expect(
        code,
        'to contain',
        "expect(obj, 'to be an instance of', MyClass)",
      );
    });

    it('should transform assert.isArray(x)', () => {
      const { code } = transformCode('assert.isArray(arr);');
      expect(code, 'to contain', "expect(arr, 'to be a', 'array')");
    });

    it('should transform assert.isString(x)', () => {
      const { code } = transformCode('assert.isString(str);');
      expect(code, 'to contain', "expect(str, 'to be a', 'string')");
    });
  });

  describe('numbers', () => {
    it('should transform assert.isAbove(a, b)', () => {
      const { code } = transformCode('assert.isAbove(num, 5);');
      expect(code, 'to contain', "expect(num, 'to be greater than', 5)");
    });

    it('should transform assert.isBelow(a, b)', () => {
      const { code } = transformCode('assert.isBelow(num, 10);');
      expect(code, 'to contain', "expect(num, 'to be less than', 10)");
    });

    it('should transform assert.isAtLeast(a, b)', () => {
      const { code } = transformCode('assert.isAtLeast(num, 5);');
      expect(
        code,
        'to contain',
        "expect(num, 'to be greater than or equal to', 5)",
      );
    });

    it('should transform assert.isAtMost(a, b)', () => {
      const { code } = transformCode('assert.isAtMost(num, 10);');
      expect(
        code,
        'to contain',
        "expect(num, 'to be less than or equal to', 10)",
      );
    });
  });

  describe('strings and arrays', () => {
    it('should transform assert.include(arr, item)', () => {
      const { code } = transformCode('assert.include(arr, item);');
      expect(code, 'to contain', "expect(arr, 'to contain', item)");
    });

    it('should transform assert.lengthOf(arr, n)', () => {
      const { code } = transformCode('assert.lengthOf(arr, 3);');
      expect(code, 'to contain', "expect(arr, 'to have length', 3)");
    });

    it('should transform assert.isEmpty(arr)', () => {
      const { code } = transformCode('assert.isEmpty(arr);');
      expect(code, 'to contain', "expect(arr, 'to be empty')");
    });

    it('should transform assert.match(str, regex)', () => {
      const { code } = transformCode('assert.match(str, /foo/);');
      expect(code, 'to contain', "expect(str, 'to match', /foo/)");
    });
  });

  describe('objects', () => {
    it('should transform assert.property(obj, key)', () => {
      const { code } = transformCode("assert.property(obj, 'foo');");
      expect(code, 'to contain', "expect(obj, 'to have property', 'foo')");
    });

    it('should transform assert.hasAllKeys(obj, keys)', () => {
      const { code } = transformCode("assert.hasAllKeys(obj, ['a', 'b']);");
      expect(code, 'to contain', "expect(obj, 'to have keys', ['a', 'b'])");
    });
  });

  describe('errors', () => {
    it('should transform assert.throws(fn)', () => {
      const { code } = transformCode('assert.throws(fn);');
      expect(code, 'to contain', "expect(fn, 'to throw')");
    });

    it('should transform assert.throws(fn, Error)', () => {
      const { code } = transformCode('assert.throws(fn, Error);');
      expect(code, 'to contain', "expect(fn, 'to throw', Error)");
    });

    it('should transform assert.doesNotThrow(fn)', () => {
      const { code } = transformCode('assert.doesNotThrow(fn);');
      expect(code, 'to contain', "expect(fn, 'not to throw')");
    });
  });

  describe('transform result', () => {
    it('should count transformations', () => {
      const { result } = transformCode(`
        assert.equal(a, b);
        assert.isTrue(c);
      `);
      expect(result.transformCount, 'to be', 2);
    });

    it('should handle nested function calls in arguments', () => {
      const { code } = transformCode('assert.equal(getValue(), expected);');
      expect(code, 'to contain', "expect(getValue(), 'to be', expected)");
    });
  });
});
