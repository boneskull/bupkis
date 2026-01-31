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
import { describe, it } from '@jest/globals';
import { expect, expectAsync } from 'bupkis';

describe('Equality matchers', () => {
  it('toBe - strict equality', () => {
    expect(42, 'to be', 42);
    expect('hello', 'to be', 'hello');
    expect(true, 'to be', true);
  });

  it('not.toBe - strict inequality', () => {
    expect(42, 'not to be', 0);
    expect('hello', 'not to be', 'world');
  });

  it('toEqual - deep equality', () => {
    expect({ a: 1 }, 'to deep equal', { a: 1 });
    expect([1, 2, 3], 'to deep equal', [1, 2, 3]);
  });

  it('toStrictEqual - strict deep equality', () => {
    expect({ a: 1, b: 2 }, 'to deep equal', { a: 1, b: 2 });
  });
});

describe('Truthiness matchers', () => {
  it('toBeTruthy', () => {
    expect(true, 'to be truthy');
    expect(1, 'to be truthy');
    expect('non-empty', 'to be truthy');
    expect({}, 'to be truthy');
  });

  it('toBeFalsy', () => {
    expect(false, 'to be falsy');
    expect(0, 'to be falsy');
    expect('', 'to be falsy');
    expect(null, 'to be falsy');
  });

  it('toBeNull', () => {
    expect(null, 'to be null');
  });

  it('toBeUndefined', () => {
    expect(undefined, 'to be undefined');
  });

  it('toBeDefined', () => {
    expect('defined', 'to be defined');
    expect(0, 'to be defined');
  });

  it('toBeNaN', () => {
    expect(NaN, 'to be NaN');
    expect(0 / 0, 'to be NaN');
  });
});

describe('Number matchers', () => {
  it('toBeGreaterThan', () => {
    expect(10, 'to be greater than', 5);
    expect(100, 'to be greater than', 99);
  });

  it('toBeGreaterThanOrEqual', () => {
    expect(10, 'to be greater than or equal to', 10);
    expect(10, 'to be greater than or equal to', 5);
  });

  it('toBeLessThan', () => {
    expect(5, 'to be less than', 10);
    expect(-1, 'to be less than', 0);
  });

  it('toBeLessThanOrEqual', () => {
    expect(5, 'to be less than or equal to', 5);
    expect(5, 'to be less than or equal to', 10);
  });

  it('toBeCloseTo - floating point', () => {
    expect(0.1 + 0.2, 'to be close to', 0.3, 0.005);
    expect(0.1 + 0.2, 'to be close to', 0.3, 0.000005);
  });
});

describe('String matchers', () => {
  it('toMatch - regex', () => {
    expect('hello world', 'to match', /hello/);
    expect('test@example.com', 'to match', /@/);
  });

  // Note: toMatch with string is not supported in bupkis (use regex)

  it('toContain - substring', () => {
    expect('hello world', 'to contain', 'world');
    expect('testing', 'to contain', 'test');
  });
});

describe('Array matchers', () => {
  it('toHaveLength', () => {
    expect([1, 2, 3], 'to have length', 3);
    // Note: toHaveLength on strings is not supported in bupkis
    expect([], 'to have length', 0);
  });

  it('toContain - array element', () => {
    expect([1, 2, 3], 'to contain', 2);
    expect(['a', 'b', 'c'], 'to contain', 'b');
  });

  // Note: toContainEqual (deep equality) has no bupkis equivalent
  // bupkis 'to contain' uses reference equality
});

describe('Object matchers', () => {
  it('toHaveProperty - key exists', () => {
    expect({ a: 1, b: 2 }, 'to have property', 'a');
    expect({ nested: { value: 42 } }, 'to have property', 'nested');
  });

  it('toMatchObject - partial object match', () => {
    expect({ a: 1, b: 2, c: 3 }, 'to satisfy', { a: 1, b: 2 });
    expect({ name: 'test', count: 5 }, 'to satisfy', { name: 'test' });
  });
});

describe('Type matchers', () => {
  it('toBeInstanceOf', () => {
    expect(new Date(), 'to be an instance of', Date);
    expect(new Error('test'), 'to be an instance of', Error);
    expect([], 'to be an instance of', Array);
  });
});

describe('Error matchers', () => {
  it('toThrow - any error', () => {
    expect(() => {
      throw new Error('oops');
    }, 'to throw');
  });

  it('toThrow - specific message', () => {
    expect(
      () => {
        throw new Error('specific error');
      },
      'to throw',
      'specific error',
    );
  });

  it('toThrow - regex match', () => {
    expect(
      () => {
        throw new Error('something went wrong');
      },
      'to throw',
      /wrong/,
    );
  });

  it('toThrowError - alias', () => {
    expect(
      () => {
        throw new TypeError('type error');
      },
      'to throw',
      'type error',
    );
  });
});

describe('Negation examples', () => {
  it('not.toEqual', () => {
    expect({ a: 1 }, 'not to deep equal', { b: 2 });
  });

  it('not.toContain', () => {
    expect([1, 2, 3], 'not to contain', 4);
  });

  it('not.toBeNull', () => {
    expect('value', 'not to be null');
  });

  it('not.toThrow', () => {
    expect(() => {
      // This function doesn't throw
      return 42;
    }, 'not to throw');
  });
});

describe('Promise matchers (resolves/rejects)', () => {
  it('resolves.toBe - promise resolves to value', async () => {
    await expectAsync(
      Promise.resolve(42),
      'to fulfill with value satisfying',
      42,
    );
  });

  it('resolves.toEqual - promise resolves to object', async () => {
    await expectAsync(
      Promise.resolve({ a: 1 }),
      'to fulfill with value satisfying',
      { a: 1 },
    );
  });

  it('resolves.toBeTruthy - promise resolves to truthy value', async () => {
    await expectAsync(
      Promise.resolve('hello'),
      'to fulfill with value satisfying',
      expect.it('to be truthy'),
    );
  });

  it('resolves.toContain - promise resolves to array containing value', async () => {
    await expectAsync(
      Promise.resolve([1, 2, 3]),
      'to fulfill with value satisfying',
      expect.it('to contain', 2),
    );
  });

  it('resolves.toHaveLength - promise resolves to array with length', async () => {
    await expectAsync(
      Promise.resolve([1, 2, 3]),
      'to fulfill with value satisfying',
      expect.it('to have length', 3),
    );
  });

  it('resolves.not.toBe - promise resolves but not to specific value', async () => {
    await expectAsync(
      Promise.resolve(42),
      'not to fulfill with value satisfying',
      0,
    );
  });

  it('rejects.toThrow - promise rejects', async () => {
    await expectAsync(Promise.reject(new Error('oops')), 'to reject');
  });

  it('rejects.toThrow - promise rejects with specific error type', async () => {
    await expectAsync(
      Promise.reject(new TypeError('bad type')),
      'to reject with a',
      TypeError,
    );
  });

  it('rejects.toThrow - promise rejects with message', async () => {
    await expectAsync(
      Promise.reject(new Error('specific error')),
      'to reject with error satisfying',
      'specific error',
    );
  });

  it('rejects.toThrow - promise rejects with regex match', async () => {
    await expectAsync(
      Promise.reject(new Error('something failed')),
      'to reject with error satisfying',
      /failed/,
    );
  });
});
