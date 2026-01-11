/**
 * Example Jest test file demonstrating all supported matchers.
 *
 * This file can be:
 * 1. Run with Jest (npm test)
 * 2. Transformed with bupkis-codemod
 * 3. Run with node:test after transformation
 */
import { describe, expect, it } from '@jest/globals';

describe('Equality matchers', () => {
  it('toBe - strict equality', () => {
    expect(42).toBe(42);
    expect('hello').toBe('hello');
    expect(true).toBe(true);
  });

  it('not.toBe - strict inequality', () => {
    expect(42).not.toBe(0);
    expect('hello').not.toBe('world');
  });

  it('toEqual - deep equality', () => {
    expect({ a: 1 }).toEqual({ a: 1 });
    expect([1, 2, 3]).toEqual([1, 2, 3]);
  });

  it('toStrictEqual - strict deep equality', () => {
    expect({ a: 1, b: 2 }).toStrictEqual({ a: 1, b: 2 });
  });
});

describe('Truthiness matchers', () => {
  it('toBeTruthy', () => {
    expect(true).toBeTruthy();
    expect(1).toBeTruthy();
    expect('non-empty').toBeTruthy();
    expect({}).toBeTruthy();
  });

  it('toBeFalsy', () => {
    expect(false).toBeFalsy();
    expect(0).toBeFalsy();
    expect('').toBeFalsy();
    expect(null).toBeFalsy();
  });

  it('toBeNull', () => {
    expect(null).toBeNull();
  });

  it('toBeUndefined', () => {
    expect(undefined).toBeUndefined();
  });

  it('toBeDefined', () => {
    expect('defined').toBeDefined();
    expect(0).toBeDefined();
  });

  it('toBeNaN', () => {
    expect(NaN).toBeNaN();
    expect(0 / 0).toBeNaN();
  });
});

describe('Number matchers', () => {
  it('toBeGreaterThan', () => {
    expect(10).toBeGreaterThan(5);
    expect(100).toBeGreaterThan(99);
  });

  it('toBeGreaterThanOrEqual', () => {
    expect(10).toBeGreaterThanOrEqual(10);
    expect(10).toBeGreaterThanOrEqual(5);
  });

  it('toBeLessThan', () => {
    expect(5).toBeLessThan(10);
    expect(-1).toBeLessThan(0);
  });

  it('toBeLessThanOrEqual', () => {
    expect(5).toBeLessThanOrEqual(5);
    expect(5).toBeLessThanOrEqual(10);
  });

  // Note: toBeCloseTo is not supported in bupkis
  // Use explicit rounding for floating point comparisons instead
});

describe('String matchers', () => {
  it('toMatch - regex', () => {
    expect('hello world').toMatch(/hello/);
    expect('test@example.com').toMatch(/@/);
  });

  // Note: toMatch with string is not supported in bupkis (use regex)

  it('toContain - substring', () => {
    expect('hello world').toContain('world');
    expect('testing').toContain('test');
  });
});

describe('Array matchers', () => {
  it('toHaveLength', () => {
    expect([1, 2, 3]).toHaveLength(3);
    // Note: toHaveLength on strings is not supported in bupkis
    expect([]).toHaveLength(0);
  });

  it('toContain - array element', () => {
    expect([1, 2, 3]).toContain(2);
    expect(['a', 'b', 'c']).toContain('b');
  });

  // Note: toContainEqual (deep equality) is not fully supported in bupkis
  // bupkis 'to contain' uses shallow comparison
});

describe('Object matchers', () => {
  it('toHaveProperty - key exists', () => {
    expect({ a: 1, b: 2 }).toHaveProperty('a');
    expect({ nested: { value: 42 } }).toHaveProperty('nested');
  });

  it('toMatchObject - partial object match', () => {
    expect({ a: 1, b: 2, c: 3 }).toMatchObject({ a: 1, b: 2 });
    expect({ name: 'test', count: 5 }).toMatchObject({ name: 'test' });
  });
});

describe('Type matchers', () => {
  it('toBeInstanceOf', () => {
    expect(new Date()).toBeInstanceOf(Date);
    expect(new Error('test')).toBeInstanceOf(Error);
    expect([]).toBeInstanceOf(Array);
  });
});

describe('Error matchers', () => {
  it('toThrow - any error', () => {
    expect(() => {
      throw new Error('oops');
    }).toThrow();
  });

  it('toThrow - specific message', () => {
    expect(() => {
      throw new Error('specific error');
    }).toThrow('specific error');
  });

  it('toThrow - regex match', () => {
    expect(() => {
      throw new Error('something went wrong');
    }).toThrow(/wrong/);
  });

  it('toThrowError - alias', () => {
    expect(() => {
      throw new TypeError('type error');
    }).toThrowError('type error');
  });
});

describe('Negation examples', () => {
  it('not.toEqual', () => {
    expect({ a: 1 }).not.toEqual({ b: 2 });
  });

  it('not.toContain', () => {
    expect([1, 2, 3]).not.toContain(4);
  });

  it('not.toBeNull', () => {
    expect('value').not.toBeNull();
  });

  it('not.toThrow', () => {
    expect(() => {
      // This function doesn't throw
      return 42;
    }).not.toThrow();
  });
});
