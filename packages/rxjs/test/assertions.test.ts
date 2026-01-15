import { expectAsync } from 'bupkis';
import { describe, it } from 'node:test';
import { EMPTY, of, throwError } from 'rxjs';

import { rxjsAssertions } from '../src/assertions.js';

const { expectAsync: e } = expectAsync.use(rxjsAssertions);

describe('@bupkis/rxjs', () => {
  describe('assertions', () => {
    describe('to complete', () => {
      it('should pass when Observable completes', async () => {
        await e(of(1, 2, 3), 'to complete');
      });

      it('should pass when empty Observable completes', async () => {
        await e(EMPTY, 'to complete');
      });

      it('should fail when Observable errors', async () => {
        await expectAsync(
          async () =>
            await e(
              throwError(() => new Error('oops')),
              'to complete',
            ),
          'to reject',
        );
      });
    });

    describe('to emit error', () => {
      it('should pass when Observable emits error', async () => {
        await e(
          throwError(() => new Error('oops')),
          'to emit error',
        );
      });

      it('should fail when Observable completes', async () => {
        await expectAsync(
          async () => await e(of(1, 2, 3), 'to emit error'),
          'to reject',
        );
      });

      it('should fail when empty Observable completes', async () => {
        await expectAsync(
          async () => await e(EMPTY, 'to emit error'),
          'to reject',
        );
      });
    });

    describe('to emit error with message', () => {
      it('should pass when error message matches string', async () => {
        await e(
          throwError(() => new Error('oops')),
          'to emit error',
          'oops',
        );
      });

      it('should pass when error message matches regex', async () => {
        await e(
          throwError(() => new Error('something went wrong')),
          'to emit error',
          /went wrong/,
        );
      });

      it('should fail when error message does not match string', async () => {
        await expectAsync(
          async () =>
            await e(
              throwError(() => new Error('oops')),
              'to emit error',
              'different message',
            ),
          'to reject',
        );
      });

      it('should fail when error message does not match regex', async () => {
        await expectAsync(
          async () =>
            await e(
              throwError(() => new Error('oops')),
              'to emit error',
              /no match/,
            ),
          'to reject',
        );
      });
    });

    describe('to emit error satisfying', () => {
      it('should pass when error satisfies spec with name', async () => {
        await e(
          throwError(() => new TypeError('type error')),
          'to emit error satisfying',
          { name: 'TypeError' },
        );
      });

      it('should pass when error satisfies spec with message', async () => {
        await e(
          throwError(() => new Error('oops')),
          'to emit error satisfying',
          { message: 'oops' },
        );
      });

      it('should pass when error satisfies spec with multiple properties', async () => {
        await e(
          throwError(() => new TypeError('type error')),
          'to emit error satisfying',
          { message: 'type error', name: 'TypeError' },
        );
      });

      it('should fail when error does not satisfy spec', async () => {
        await expectAsync(
          async () =>
            await e(
              throwError(() => new Error('oops')),
              'to emit error satisfying',
              { name: 'TypeError' },
            ),
          'to reject',
        );
      });

      it('should fail when Observable completes instead of erroring', async () => {
        await expectAsync(
          async () =>
            await e(of(1, 2, 3), 'to emit error satisfying', { name: 'Error' }),
          'to reject',
        );
      });
    });

    describe('to emit values', () => {
      it('should pass when values match exactly', async () => {
        await e(of('foo', 'bar'), 'to emit values', ['foo', 'bar']);
      });

      it('should pass with numeric values', async () => {
        await e(of(1, 2, 3), 'to emit values', [1, 2, 3]);
      });

      it('should pass with empty array for EMPTY', async () => {
        await e(EMPTY, 'to emit values', []);
      });

      it('should fail when values have different length', async () => {
        await expectAsync(
          async () => await e(of(1, 2, 3), 'to emit values', [1, 2]),
          'to reject',
        );
      });

      it('should fail when values are in different order', async () => {
        await expectAsync(
          async () => await e(of(1, 2), 'to emit values', [2, 1]),
          'to reject',
        );
      });

      it('should fail when Observable errors', async () => {
        await expectAsync(
          async () =>
            await e(
              throwError(() => new Error('oops')),
              'to emit values',
              [],
            ),
          'to reject',
        );
      });

      it('should use strict equality', async () => {
        const obj = { a: 1 };
        // Same reference should pass
        await e(of(obj), 'to emit values', [obj]);

        // Different reference with same shape should fail
        await expectAsync(
          async () => await e(of({ a: 1 }), 'to emit values', [{ a: 1 }]),
          'to reject',
        );
      });
    });

    describe('to emit times', () => {
      it('should pass when count matches', async () => {
        await e(of(1, 2, 3), 'to emit times', 3);
      });

      it('should pass with zero emissions', async () => {
        await e(EMPTY, 'to emit times', 0);
      });

      it('should fail when count does not match', async () => {
        await expectAsync(
          async () => await e(of(1, 2, 3), 'to emit times', 2),
          'to reject',
        );
      });

      it('should fail when Observable errors', async () => {
        await expectAsync(
          async () =>
            await e(
              throwError(() => new Error('oops')),
              'to emit times',
              0,
            ),
          'to reject',
        );
      });
    });

    describe('to emit once', () => {
      it('should pass when Observable emits exactly one value', async () => {
        await e(of(42), 'to emit once');
      });

      it('should fail when Observable emits zero values', async () => {
        await expectAsync(
          async () => await e(EMPTY, 'to emit once'),
          'to reject',
        );
      });

      it('should fail when Observable emits multiple values', async () => {
        await expectAsync(
          async () => await e(of(1, 2), 'to emit once'),
          'to reject',
        );
      });
    });

    describe('to emit twice', () => {
      it('should pass when Observable emits exactly two values', async () => {
        await e(of(1, 2), 'to emit twice');
      });

      it('should fail when Observable emits one value', async () => {
        await expectAsync(
          async () => await e(of(1), 'to emit twice'),
          'to reject',
        );
      });

      it('should fail when Observable emits three values', async () => {
        await expectAsync(
          async () => await e(of(1, 2, 3), 'to emit twice'),
          'to reject',
        );
      });
    });

    describe('to emit thrice', () => {
      it('should pass when Observable emits exactly three values', async () => {
        await e(of(1, 2, 3), 'to emit thrice');
      });

      it('should fail when Observable emits two values', async () => {
        await expectAsync(
          async () => await e(of(1, 2), 'to emit thrice'),
          'to reject',
        );
      });
    });

    describe('to be empty', () => {
      it('should pass when Observable completes without emitting', async () => {
        await e(EMPTY, 'to be empty');
      });

      it('should fail when Observable emits values', async () => {
        await expectAsync(
          async () => await e(of(1), 'to be empty'),
          'to reject',
        );
      });

      it('should fail when Observable errors', async () => {
        await expectAsync(
          async () =>
            await e(
              throwError(() => new Error('oops')),
              'to be empty',
            ),
          'to reject',
        );
      });
    });

    describe('to complete without emitting', () => {
      it('should pass when Observable completes without emitting (alternate phrase)', async () => {
        await e(EMPTY, 'to complete without emitting');
      });

      it('should fail when Observable emits values (alternate phrase)', async () => {
        await expectAsync(
          async () => await e(of(1), 'to complete without emitting'),
          'to reject',
        );
      });
    });

    describe('to complete with value', () => {
      it('should pass when last value matches', async () => {
        await e(of(1, 2, 'final'), 'to complete with value', 'final');
      });

      it('should pass with single value', async () => {
        await e(of(42), 'to complete with value', 42);
      });

      it('should fail when last value does not match', async () => {
        await expectAsync(
          async () => await e(of(1, 2, 3), 'to complete with value', 2),
          'to reject',
        );
      });

      it('should fail when Observable is empty', async () => {
        await expectAsync(
          async () => await e(EMPTY, 'to complete with value', 'any'),
          'to reject',
        );
      });

      it('should fail when Observable errors', async () => {
        await expectAsync(
          async () =>
            await e(
              throwError(() => new Error('oops')),
              'to complete with value',
              'any',
            ),
          'to reject',
        );
      });
    });

    describe('to complete with values', () => {
      it('should pass when all values match', async () => {
        await e(of('foo', 'bar', 'baz'), 'to complete with values', [
          'foo',
          'bar',
          'baz',
        ]);
      });

      it('should pass with empty array for EMPTY', async () => {
        await e(EMPTY, 'to complete with values', []);
      });

      it('should fail when values do not match', async () => {
        await expectAsync(
          async () => await e(of(1, 2, 3), 'to complete with values', [1, 2]),
          'to reject',
        );
      });
    });

    describe('to complete with value satisfying', () => {
      it('should pass when last value satisfies spec', async () => {
        await e(
          of({ status: 'pending' }, { result: 42, status: 'done' }),
          'to complete with value satisfying',
          { status: 'done' },
        );
      });

      it('should pass with multiple matching properties', async () => {
        await e(of({ a: 1, b: 2, c: 3 }), 'to complete with value satisfying', {
          a: 1,
          b: 2,
        });
      });

      it('should fail when last value does not satisfy spec', async () => {
        await expectAsync(
          async () =>
            await e(
              of({ status: 'pending' }),
              'to complete with value satisfying',
              { status: 'done' },
            ),
          'to reject',
        );
      });

      it('should fail when Observable is empty', async () => {
        await expectAsync(
          async () =>
            await e(EMPTY, 'to complete with value satisfying', {
              any: 'spec',
            }),
          'to reject',
        );
      });

      it('should fail when Observable errors', async () => {
        await expectAsync(
          async () =>
            await e(
              throwError(() => new Error('oops')),
              'to complete with value satisfying',
              { any: 'spec' },
            ),
          'to reject',
        );
      });
    });
  });
});
