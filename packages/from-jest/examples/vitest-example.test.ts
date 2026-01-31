/**
 * Example Vitest test file demonstrating all supported matchers.
 *
 * This file can be transformed with: npx tsx src/cli.ts --dry-run
 * examples/vitest-example.test.ts
 */
import { describe, expect, it } from 'vitest';

describe('Equality matchers', () => {
  it('toBe - strict equality', () => {
    expect(42).toBe(42);
    expect('hello').toBe('hello');
  });

  it('not.toBe - strict inequality', () => {
    expect(42).not.toBe(0);
  });

  it('toEqual - deep equality', () => {
    expect({ a: 1 }).toEqual({ a: 1 });
    expect([1, 2, 3]).toEqual([1, 2, 3]);
  });
});

describe('Truthiness matchers', () => {
  it('toBeTruthy', () => {
    expect(true).toBeTruthy();
    expect(1).toBeTruthy();
  });

  it('toBeFalsy', () => {
    expect(false).toBeFalsy();
    expect(0).toBeFalsy();
  });

  it('toBeNull', () => {
    expect(null).toBeNull();
  });

  it('toBeUndefined', () => {
    expect(undefined).toBeUndefined();
  });

  it('toBeDefined', () => {
    expect('defined').toBeDefined();
  });
});

describe('Number matchers', () => {
  it('toBeGreaterThan', () => {
    expect(10).toBeGreaterThan(5);
  });

  it('toBeLessThan', () => {
    expect(5).toBeLessThan(10);
  });

  it('toBeCloseTo - floating point', () => {
    expect(0.1 + 0.2).toBeCloseTo(0.3);
  });
});

describe('String and Array matchers', () => {
  it('toMatch - regex', () => {
    expect('hello world').toMatch(/hello/);
  });

  it('toContain', () => {
    expect('hello world').toContain('world');
    expect([1, 2, 3]).toContain(2);
  });

  it('toHaveLength', () => {
    expect([1, 2, 3]).toHaveLength(3);
  });
});

describe('Object matchers', () => {
  it('toHaveProperty', () => {
    expect({ a: 1, b: 2 }).toHaveProperty('a');
  });

  it('toMatchObject', () => {
    expect({ a: 1, b: 2, c: 3 }).toMatchObject({ a: 1, b: 2 });
  });
});

describe('Type matchers', () => {
  it('toBeInstanceOf', () => {
    expect(new Date()).toBeInstanceOf(Date);
  });
});

describe('Error matchers', () => {
  it('toThrow', () => {
    expect(() => {
      throw new Error('oops');
    }).toThrow();
  });
});

describe('Negation examples', () => {
  it('not.toEqual', () => {
    expect({ a: 1 }).not.toEqual({ b: 2 });
  });

  it('not.toContain', () => {
    expect([1, 2, 3]).not.toContain(4);
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

  it('rejects.toThrow - promise rejects', async () => {
    await expect(Promise.reject(new Error('oops'))).rejects.toThrow();
  });

  it('rejects.toThrow - promise rejects with error type', async () => {
    await expect(Promise.reject(new TypeError('bad'))).rejects.toThrow(
      TypeError,
    );
  });
});
