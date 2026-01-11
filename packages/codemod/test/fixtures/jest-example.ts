import { describe, it, expect } from '@jest/globals';

describe('example test suite', () => {
  it('tests equality', () => {
    expect(42).toBe(42);
    expect({ a: 1 }).toEqual({ a: 1 });
    expect({ a: 1, b: 2 }).toStrictEqual({ a: 1, b: 2 });
  });

  it('tests truthiness', () => {
    expect(true).toBeTruthy();
    expect(false).toBeFalsy();
    expect(null).toBeNull();
    expect(undefined).toBeUndefined();
    expect('defined').toBeDefined();
  });

  it('tests negation', () => {
    expect(42).not.toBe(0);
    expect({}).not.toEqual({ a: 1 });
  });

  it('tests numbers', () => {
    expect(10).toBeGreaterThan(5);
    expect(5).toBeLessThan(10);
    expect(0.1 + 0.2).toBeCloseTo(0.3);
  });

  it('tests strings', () => {
    expect('hello world').toMatch(/hello/);
    expect('hello world').toContain('world');
  });

  it('tests arrays', () => {
    expect([1, 2, 3]).toHaveLength(3);
    expect([1, 2, 3]).toContain(2);
  });

  it('tests objects', () => {
    expect({ a: 1, b: 2 }).toHaveProperty('a');
    expect({ a: 1, b: 2 }).toMatchObject({ a: 1 });
  });

  it('tests errors', () => {
    expect(() => {
      throw new Error('oops');
    }).toThrow();
  });

  it('tests instances', () => {
    expect(new Date()).toBeInstanceOf(Date);
  });
});
