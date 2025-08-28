import { describe, it } from 'node:test';
import { inspect } from 'node:util';

import { expect } from '../../src/index.js';

describe('Parametric assertions', () => {
  describe('to be a <type>', () => {
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
      [[], 'array'],
      [new Date(), 'date'],
    ] as const) {
      describe(`when the value is ${inspect(value)} and the type is ${typeName}`, () => {
        it('should pass', () => {
          expect(() => expect(value, 'to be a', typeName), 'not to throw');
          expect(() => expect(value, 'to be an', typeName), 'not to throw');
        });
      });
    }

    for (const [value, typeName] of [
      [42, 'string'],
      ['hi', 'number'],
      [true, 'array'],
      [undefined, 'null'],
    ] as const) {
      describe(`when the value is ${inspect(value)} and the type is ${typeName}`, () => {
        it('should fail', () => {
          expect(() => expect(value, 'to be a', typeName), 'to throw');
        });
      });
    }
  });
});
