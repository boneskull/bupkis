import assert, { type AssertionError as NodeAssertionError } from 'node:assert';
import { before, describe, it } from 'node:test';

import { expect } from '../../src/bootstrap.js';
import { type AssertionError, FailAssertionError } from '../../src/error.js';
import { errorSerializer } from './error-snapshot-util.js';

describe(`Comparison with Node.js' assert module`, () => {
  describe('deepStrictEqual / "to deep equal"', () => {
    const obj1 = { a: 1, b: { c: 2 } };
    const obj2 = { a: 1, b: { c: 3 } };
    let nodeAssertionError: NodeAssertionError;
    let bupkisAssertionError: AssertionError;

    before(() => {
      try {
        assert.deepStrictEqual(obj1, obj2);
        expect.fail('Expected assertion to fail');
      } catch (err) {
        if (FailAssertionError.isFailAssertionError(err)) {
          throw err;
        }
        nodeAssertionError = err as NodeAssertionError;
      }

      try {
        expect(obj1, 'to deep equal', obj2);
        expect.fail('Expected assertion to fail');
      } catch (err) {
        if (FailAssertionError.isFailAssertionError(err)) {
          throw err;
        }
        bupkisAssertionError = err as AssertionError;
      }
    });

    it('deepStrictEqual <snapshot>', (t) => {
      t.assert.snapshot(nodeAssertionError, { serializers: [errorSerializer] });
    });

    it('"to deep equal" <snapshot>', (t) => {
      t.assert.snapshot(bupkisAssertionError, {
        serializers: [errorSerializer],
      });
    });
  });
});
