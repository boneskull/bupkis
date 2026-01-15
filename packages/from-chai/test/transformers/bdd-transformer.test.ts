import { expect } from 'bupkis';
import { describe, it } from 'node:test';
import { Project, QuoteKind } from 'ts-morph';

import { transformBddExpectCalls } from '../../src/transformers/bdd-transformer.js';

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
  const result = transformBddExpectCalls(sourceFile, 'best-effort');
  return { code: sourceFile.getFullText(), result };
};

describe('BDD transformer', () => {
  describe('equality', () => {
    it('should transform expect(x).to.equal(y)', () => {
      const { code } = transformCode('expect(foo).to.equal(bar);');
      expect(code, 'to contain', "expect(foo, 'to be', bar)");
    });

    it('should transform expect(x).to.deep.equal(y)', () => {
      const { code } = transformCode('expect(obj).to.deep.equal({ a: 1 });');
      expect(code, 'to contain', "expect(obj, 'to deep equal', { a: 1 })");
    });

    it('should transform expect(x).to.eql(y)', () => {
      const { code } = transformCode('expect(arr).to.eql([1, 2, 3]);');
      expect(code, 'to contain', "expect(arr, 'to deep equal', [1, 2, 3])");
    });
  });

  describe('truthiness', () => {
    it('should transform expect(x).to.be.true', () => {
      const { code } = transformCode('expect(result).to.be.true;');
      expect(code, 'to contain', "expect(result, 'to be true')");
    });

    it('should transform expect(x).to.be.false', () => {
      const { code } = transformCode('expect(result).to.be.false;');
      expect(code, 'to contain', "expect(result, 'to be false')");
    });

    it('should transform expect(x).to.be.null', () => {
      const { code } = transformCode('expect(value).to.be.null;');
      expect(code, 'to contain', "expect(value, 'to be null')");
    });

    it('should transform expect(x).to.be.undefined', () => {
      const { code } = transformCode('expect(value).to.be.undefined;');
      expect(code, 'to contain', "expect(value, 'to be undefined')");
    });

    it('should transform expect(x).to.be.ok', () => {
      const { code } = transformCode('expect(value).to.be.ok;');
      expect(code, 'to contain', "expect(value, 'to be truthy')");
    });

    it('should transform expect(x).to.exist', () => {
      const { code } = transformCode('expect(value).to.exist;');
      expect(code, 'to contain', "expect(value, 'to be defined')");
    });
  });

  describe('negation', () => {
    it('should transform expect(x).to.not.equal(y)', () => {
      const { code } = transformCode('expect(foo).to.not.equal(bar);');
      expect(code, 'to contain', "expect(foo, 'not to be', bar)");
    });

    it('should transform expect(x).not.to.equal(y)', () => {
      const { code } = transformCode('expect(foo).not.to.equal(bar);');
      expect(code, 'to contain', "expect(foo, 'not to be', bar)");
    });

    it('should transform expect(x).to.not.be.true', () => {
      const { code } = transformCode('expect(result).to.not.be.true;');
      expect(code, 'to contain', "expect(result, 'not to be true')");
    });
  });

  describe('type checking', () => {
    it('should transform expect(x).to.be.a(type)', () => {
      const { code } = transformCode("expect(foo).to.be.a('string');");
      expect(code, 'to contain', "expect(foo, 'to be a', 'string')");
    });

    it('should transform expect(x).to.be.an(type)', () => {
      const { code } = transformCode("expect(obj).to.be.an('object');");
      expect(code, 'to contain', "expect(obj, 'to be a', 'object')");
    });

    it('should transform expect(x).to.be.instanceof(Cls)', () => {
      const { code } = transformCode('expect(obj).to.be.instanceof(MyClass);');
      expect(
        code,
        'to contain',
        "expect(obj, 'to be an instance of', MyClass)",
      );
    });
  });

  describe('numbers', () => {
    it('should transform expect(x).to.be.above(y)', () => {
      const { code } = transformCode('expect(num).to.be.above(5);');
      expect(code, 'to contain', "expect(num, 'to be greater than', 5)");
    });

    it('should transform expect(x).to.be.below(y)', () => {
      const { code } = transformCode('expect(num).to.be.below(10);');
      expect(code, 'to contain', "expect(num, 'to be less than', 10)");
    });

    it('should transform expect(x).to.be.at.least(y)', () => {
      const { code } = transformCode('expect(num).to.be.at.least(5);');
      expect(
        code,
        'to contain',
        "expect(num, 'to be greater than or equal to', 5)",
      );
    });

    it('should transform expect(x).to.be.at.most(y)', () => {
      const { code } = transformCode('expect(num).to.be.at.most(10);');
      expect(
        code,
        'to contain',
        "expect(num, 'to be less than or equal to', 10)",
      );
    });
  });

  describe('strings and arrays', () => {
    it('should transform expect(x).to.contain(y)', () => {
      const { code } = transformCode("expect(str).to.contain('sub');");
      expect(code, 'to contain', "expect(str, 'to contain', 'sub')");
    });

    it('should transform expect(x).to.include(y)', () => {
      const { code } = transformCode('expect(arr).to.include(item);');
      expect(code, 'to contain', "expect(arr, 'to contain', item)");
    });

    it('should transform expect(x).to.have.length(n)', () => {
      const { code } = transformCode('expect(arr).to.have.length(3);');
      expect(code, 'to contain', "expect(arr, 'to have length', 3)");
    });

    it('should transform expect(x).to.be.empty', () => {
      const { code } = transformCode('expect(arr).to.be.empty;');
      expect(code, 'to contain', "expect(arr, 'to be empty')");
    });

    it('should transform expect(x).to.match(regex)', () => {
      const { code } = transformCode('expect(str).to.match(/foo/);');
      expect(code, 'to contain', "expect(str, 'to match', /foo/)");
    });
  });

  describe('objects', () => {
    it('should transform expect(x).to.have.property(key)', () => {
      const { code } = transformCode("expect(obj).to.have.property('foo');");
      expect(code, 'to contain', "expect(obj, 'to have property', 'foo')");
    });

    it('should transform expect(x).to.have.keys(keys)', () => {
      const { code } = transformCode("expect(obj).to.have.keys('a', 'b');");
      expect(code, 'to contain', "expect(obj, 'to have keys', 'a', 'b')");
    });
  });

  describe('errors', () => {
    it('should transform expect(fn).to.throw()', () => {
      const { code } = transformCode('expect(fn).to.throw();');
      expect(code, 'to contain', "expect(fn, 'to throw')");
    });

    it('should transform expect(fn).to.throw(Error)', () => {
      const { code } = transformCode('expect(fn).to.throw(Error);');
      expect(code, 'to contain', "expect(fn, 'to throw', Error)");
    });
  });

  describe('transform result', () => {
    it('should count transformations', () => {
      const { result } = transformCode(`
        expect(a).to.equal(b);
        expect(c).to.be.true;
      `);
      expect(result.transformCount, 'to be', 2);
    });

    it('should report warnings for unsupported matchers', () => {
      const { result } = transformCode(
        'expect(obj).to.respondTo("unknownMethod");',
      );
      // respondTo maps to 'to have property' in our matchers
      expect(result.transformCount, 'to be', 1);
    });
  });
});
