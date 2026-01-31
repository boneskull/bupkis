/**
 * Example Jest test file demonstrating all supported matchers.
 *
 * This file can be:
 *
 * 1. Run with Jest: npm run example:jest
 * 2. Transformed with: npm run example:codemod
 * 3. Run with Jest again after transformation (see
 *    jest-example.transformed.test.ts)
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

  it('toBeCloseTo - floating point', () => {
    expect(0.1 + 0.2).toBeCloseTo(0.3);
    expect(0.1 + 0.2).toBeCloseTo(0.3, 5);
  });
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

  // Note: toContainEqual (deep equality) has no bupkis equivalent
  // bupkis 'to contain' uses reference equality
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

describe('Promise matchers (resolves/rejects)', () => {
  it('resolves.toBe - promise resolves to value', async () => {
    await expect(Promise.resolve(42)).resolves.toBe(42);
  });

  it('resolves.toEqual - promise resolves to object', async () => {
    await expect(Promise.resolve({ a: 1 })).resolves.toEqual({ a: 1 });
  });

  it('resolves.toBeTruthy - promise resolves to truthy value', async () => {
    await expect(Promise.resolve('hello')).resolves.toBeTruthy();
  });

  it('resolves.toContain - promise resolves to array containing value', async () => {
    await expect(Promise.resolve([1, 2, 3])).resolves.toContain(2);
  });

  it('resolves.toHaveLength - promise resolves to array with length', async () => {
    await expect(Promise.resolve([1, 2, 3])).resolves.toHaveLength(3);
  });

  it('resolves.not.toBe - promise resolves but not to specific value', async () => {
    await expect(Promise.resolve(42)).resolves.not.toBe(0);
  });

  it('rejects.toThrow - promise rejects', async () => {
    await expect(Promise.reject(new Error('oops'))).rejects.toThrow();
  });

  it('rejects.toThrow - promise rejects with specific error type', async () => {
    await expect(Promise.reject(new TypeError('bad type'))).rejects.toThrow(
      TypeError,
    );
  });

  it('rejects.toThrow - promise rejects with message', async () => {
    await expect(Promise.reject(new Error('specific error'))).rejects.toThrow(
      'specific error',
    );
  });

  it('rejects.toThrow - promise rejects with regex match', async () => {
    await expect(Promise.reject(new Error('something failed'))).rejects.toThrow(
      /failed/,
    );
  });
});
