/**
 * Example Vitest test file demonstrating all supported matchers.
 *
 * This file can be transformed with: npx tsx src/cli.ts --dry-run
 * examples/vitest-example.test.ts
 */
import { describe, it } from 'vitest';
import { expect } from 'bupkis';

describe('Equality matchers', () => {
  it('toBe - strict equality', () => {
    expect(42, 'to be', 42);
    expect('hello', 'to be', 'hello');
  });

  it('not.toBe - strict inequality', () => {
    expect(42, 'not to be', 0);
  });

  it('toEqual - deep equality', () => {
    expect({ a: 1 }, 'to deep equal', { a: 1 });
    expect([1, 2, 3], 'to deep equal', [1, 2, 3]);
  });
});

describe('Truthiness matchers', () => {
  it('toBeTruthy', () => {
    expect(true, 'to be truthy');
    expect(1, 'to be truthy');
  });

  it('toBeFalsy', () => {
    expect(false, 'to be falsy');
    expect(0, 'to be falsy');
  });

  it('toBeNull', () => {
    expect(null, 'to be null');
  });

  it('toBeUndefined', () => {
    expect(undefined, 'to be undefined');
  });

  it('toBeDefined', () => {
    expect('defined', 'to be defined');
  });
});

describe('Number matchers', () => {
  it('toBeGreaterThan', () => {
    expect(10, 'to be greater than', 5);
  });

  it('toBeLessThan', () => {
    expect(5, 'to be less than', 10);
  });

  it('toBeCloseTo - floating point', () => {
    expect(0.1 + 0.2, 'to be close to', 0.3, 0.005);
  });
});

describe('String and Array matchers', () => {
  it('toMatch - regex', () => {
    expect('hello world', 'to match', /hello/);
  });

  it('toContain', () => {
    expect('hello world', 'to contain', 'world');
    expect([1, 2, 3], 'to contain', 2);
  });

  it('toHaveLength', () => {
    expect([1, 2, 3], 'to have length', 3);
  });
});

describe('Object matchers', () => {
  it('toHaveProperty', () => {
    expect({ a: 1, b: 2 }, 'to have property', 'a');
  });

  it('toMatchObject', () => {
    expect({ a: 1, b: 2, c: 3 }, 'to satisfy', { a: 1, b: 2 });
  });
});

describe('Type matchers', () => {
  it('toBeInstanceOf', () => {
    expect(new Date(), 'to be an instance of', Date);
  });
});

describe('Error matchers', () => {
  it('toThrow', () => {
    expect(() => {
      throw new Error('oops');
    }, 'to throw');
  });
});

describe('Negation examples', () => {
  it('not.toEqual', () => {
    expect({ a: 1 }, 'not to deep equal', { b: 2 });
  });

  it('not.toContain', () => {
    expect([1, 2, 3], 'not to contain', 4);
  });
});
