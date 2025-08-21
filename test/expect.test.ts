import assert from 'node:assert';
import test from 'node:test';
import { inspect } from 'node:util';

import { expect } from '../src/index.js';

class AssertionError extends Error {}

// happy path: to be a string
test('expect: to be a string', () => {
  expect(() => expect('hi', 'to be a string'), 'not to throw');
});

// happy path: to be a <type>
for (const [value, kind] of [
  ['hi', 'string'],
  [42, 'number'],
  [true, 'boolean'],
  [undefined, 'undefined'],
  [null, 'null'],
  [10n, 'bigint'],
  [Symbol('s'), 'symbol'],
  [{}, 'object'],
  [() => {}, 'function'],
  [[], 'array'],
  [new Date(), 'date'],
] as const) {
  test(`expect: ${inspect(value)} to be a/an ${inspect(kind)}`, () => {
    expect(() => expect(value, 'to be a', kind), 'not to throw');
    expect(() => expect(value, 'to be an', kind), 'not to throw');
  });
}

// unhappy path: wrong type
for (const [value, typeName] of [
  [42, 'string'],
  ['hi', 'number'],
  [true, 'array'],
  [undefined, 'null'],
] as const) {
  test(`expect: throws when ${inspect(value)} is not a ${typeName}`, () => {
    expect(() => expect(value, 'to be a', typeName), 'to throw');
  });
}

// greater than
test('expect: number to be greater than number (pass)', () => {
  expect(() => expect(5, 'to be greater than', 3), 'not to throw');
});

test('expect: number to be greater than number (fail)', () => {
  expect(() => expect(2, 'to be greater than', 3), 'to throw');
});

test('expect: function not to throw', () => {
  expect(
    () =>
      expect(() => {
        throw new Error();
      }, 'to throw'),
    'not to throw',
  );
});

test('expect: schema-based error messages', () => {
  // Test that schema-based assertions provide readable error messages
  let error: Error | undefined;
  expect(() => {
    try {
      expect(42, 'to be a string');
    } catch (err) {
      error = err as Error;
      throw err;
    }
  }, 'to throw');
  expect(error, 'to be a', 'object');
  expect(error!.message.includes('Assertion failed'), 'to be true');

  // Test another schema-based assertion
  let error2: Error | undefined;
  expect(() => {
    try {
      expect('not a number', 'to be a number');
    } catch (err) {
      error2 = err as Error;
      throw err;
    }
  }, 'to throw');
  expect(error2, 'to be a', 'object');
  expect(error2!.message.includes('Assertion failed'), 'to be true');
});

test('expect: parameterized schema factory', () => {
  // Test that schema factories work with runtime parameters
  // These use z.number().gt() and z.number().lt() under the hood
  expect(() => expect(5, 'to be greater than', 3), 'not to throw');
  expect(() => expect(2, 'to be greater than', 5), 'to throw');

  expect(() => expect(3, 'to be less than', 5), 'not to throw');
  expect(() => expect(7, 'to be less than', 5), 'to throw');
});

// New schema-based assertion tests
test('expect: to be true', () => {
  expect(() => expect(true, 'to be true'), 'not to throw');
  expect(() => expect(false, 'to be true'), 'to throw');
});

test('expect: to be false', () => {
  expect(() => expect(false, 'to be false'), 'not to throw');
  expect(() => expect(true, 'to be false'), 'to throw');
});

test('expect: to be null', () => {
  expect(() => expect(null, 'to be null'), 'not to throw');
  expect(() => expect(undefined, 'to be null'), 'to throw');
});

test('expect: to be undefined', () => {
  expect(() => expect(undefined, 'to be undefined'), 'not to throw');
  expect(() => expect(null, 'to be undefined'), 'to throw');
});

// Less than comparison tests
test('expect: number to be less than number (pass)', () => {
  expect(() => expect(2, 'to be less than', 5), 'not to throw');
});

test('expect: number to be less than number (fail)', () => {
  expect(() => expect(5, 'to be less than', 2), 'to throw');
});

// Equality assertion tests
test('expect: equality assertions (pass)', () => {
  expect(() => expect(42, 'to be', 42), 'not to throw');
  expect(() => expect(42, 'to equal', 42), 'not to throw');
  expect(() => expect('hi', 'equals', 'hi'), 'not to throw');
  expect(() => expect(42, 'is', 42), 'not to throw');
  expect(() => expect(null, 'is equal to', null), 'not to throw');
  expect(() => expect('test', 'to strictly equal', 'test'), 'not to throw');
});

test('expect: equality assertions (fail)', () => {
  expect(() => expect(42, 'to be', 24), 'to throw');
  expect(() => expect(42, 'to equal', 24), 'to throw');
  expect(() => expect('hi', 'equals', 'bye'), 'to throw');
});

// Inequality assertion tests
test('expect: inequality assertions (pass)', () => {
  expect(() => expect(42, 'not to be', 24), 'not to throw');
  expect(() => expect(42, 'to not equal', 24), 'not to throw');
  expect(() => expect('hi', 'not to equal', 'bye'), 'not to throw');
  expect(() => expect(42, 'is not', 24), 'not to throw');
  expect(() => expect(42, "isn't", 24), 'not to throw');
  expect(() => expect(42, 'not to strictly equal', 24), 'not to throw');
  expect(() => expect(42, 'to not strictly equal', 24), 'not to throw');
});

test('expect: inequality assertions (fail)', () => {
  expect(() => expect(42, 'not to be', 42), 'to throw');
  expect(() => expect(42, 'to not equal', 42), 'to throw');
  expect(() => expect(42, "isn't", 42), 'to throw');
});

// Object empty/not empty tests
test('expect: object to be empty (pass)', () => {
  expect(() => expect({}, 'to be empty'), 'not to throw');
});

test('expect: object to be empty (fail)', () => {
  expect(() => expect({ a: 1 }, 'to be empty'), 'to throw');
});

test('expect: object not to be empty (pass)', () => {
  expect(() => expect({ a: 1 }, 'to not be empty'), 'not to throw');
  expect(() => expect({ a: 1 }, 'not to be empty'), 'not to throw');
  expect(() => expect({ a: 1 }, 'to have no keys'), 'not to throw');
  expect(() => expect({ a: 1 }, 'not to have keys'), 'not to throw');
  expect(() => expect({ a: 1 }, 'to have no properties'), 'not to throw');
  expect(() => expect({ a: 1 }, 'not to have properties'), 'not to throw');
});

test('expect: object not to be empty (fail)', () => {
  expect(() => expect({}, 'to not be empty'), 'to throw');
  expect(() => expect({}, 'not to be empty'), 'to throw');
});

// Promise resolution tests
test('expect: promise to resolve (pass)', async () => {
  await assert.doesNotReject(async () => {
    await expect(Promise.resolve(42), 'to resolve');
  });
  await assert.doesNotReject(async () => {
    await expect(Promise.resolve(42), 'to fulfill');
  });
});

test('expect: promise to resolve (fail)', async () => {
  await assert.rejects(async () => {
    await expect(Promise.reject('error'), 'to resolve');
  });
});

test('expect: function returning promise to resolve (pass)', async () => {
  await assert.doesNotReject(async () => {
    const fn = () => Promise.resolve(42);
    await expect(fn(), 'to resolve');
  });
  await assert.doesNotReject(async () => {
    const fn = () => Promise.resolve(42);
    await expect(fn(), 'to fulfill');
  });
});

test('expect: function returning promise to resolve (fail)', async () => {
  await assert.rejects(async () => {
    const fn = () => Promise.reject('error');
    await expect(fn(), 'to fulfill');
  });
});

// Function not throwing tests
test('expect: function not to throw (pass)', () => {
  expect(() => expect(() => 'safe', 'not to throw'), 'not to throw');
  expect(() => expect(() => 'safe', 'to not throw'), 'not to throw');
});

test('expect: function not to throw (fail)', () => {
  expect(
    () =>
      expect(() => {
        throw new Error('boom');
      }, 'not to throw'),
    'to throw',
  );
  expect(
    () =>
      expect(() => {
        throw new Error('boom');
      }, 'to not throw'),
    'to throw',
  );
});

// String regex matching tests
test('expect: string to match regex (pass)', () => {
  expect(() => expect('hello', 'to match', /h.*o/), 'not to throw');
  expect(() => expect('test123', 'to match', /\d+$/), 'not to throw');
});

test('expect: string to match regex (fail)', () => {
  expect(() => expect('hello', 'to match', /xyz/), 'to throw');
  expect(() => expect('abc', 'to match', /\d+/), 'to throw');
});

// Object satisfaction tests
test('expect: object to satisfy (pass)', () => {
  expect(() => expect({ a: 1, b: 2 }, 'to satisfy', { a: 1 }), 'not to throw');
  expect(() => expect({ a: 1, b: 2 }, 'to be like', { a: 1 }), 'not to throw');
  expect(() => expect({ a: 1, b: 2 }, 'to match', { b: 2 }), 'not to throw');
  expect(
    () => expect({ a: 1, b: 2, c: 3 }, 'to satisfy', { a: 1, c: 3 }),
    'not to throw',
  );
});

test('expect: object to satisfy (fail)', () => {
  expect(() => expect({ a: 1 }, 'to satisfy', { a: 1, b: 2 }), 'to throw'); // missing key
  expect(() => expect({ a: 1 }, 'to be like', { a: 2 }), 'to throw'); // wrong value
  expect(() => expect({ a: 1, b: 2 }, 'to match', { c: 3 }), 'to throw'); // missing key
});
