import test from 'node:test';
import assert from 'node:assert/strict';
import { inspect } from 'node:util';

import { expect } from '../src/index.js';

class AssertionError extends Error {}

// happy path: to be a string
test('expect: to be a string', () => {
  assert.doesNotThrow(() => expect('hi', 'to be a string'));
});

// happy path: to be a <type>
for (const [value, typeName] of [
  ['hi', 'string'],
  [42, 'number'],
  [true, 'boolean'],
  [undefined, 'undefined'],
  [null, 'null'],
  [10n, 'bigint'],
  [Symbol('s'), 'symbol'],
  [{}, 'object'],
  [() => {}, 'function'],
] as const) {
  test(`expect: ${inspect(value)} to be a/an ${typeName}`, () => {
    assert.doesNotThrow(() => expect(value, 'to be a', typeName));
    assert.doesNotThrow(() => expect(value, 'to be an', typeName));
  });
}

// unhappy path: wrong type
for (const [value, typeName] of [
  [42, 'string'],
  ['hi', 'number'],
] as const) {
  test(`expect: throws when ${inspect(value)} is not a ${typeName}`, () => {
    assert.throws(() => expect(value, 'to be a', typeName));
  });
}

// greater than
test('expect: number to be greater than number (pass)', () => {
  assert.doesNotThrow(() => expect(5, 'to be greater than', 3));
});

test('expect: number to be greater than number (fail)', () => {
  assert.throws(() => expect(2, 'to be greater than', 3));
});

test('expect: function not to throw', () => {
  assert.doesNotThrow(() =>
    expect(() => {
      throw new Error();
    }, 'to throw'),
  );
});
