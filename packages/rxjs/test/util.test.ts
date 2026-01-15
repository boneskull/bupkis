import { expect } from 'bupkis';
import { describe, it } from 'node:test';
import { EMPTY, of, Subject, throwError } from 'rxjs';

import { collectObservable } from '../src/util.js';

describe('@bupkis/rxjs', () => {
  describe('util', () => {
    describe('collectObservable', () => {
      it('should collect all values from a completed Observable', async () => {
        const result = await collectObservable(of(1, 2, 3));

        expect(result, 'to satisfy', {
          completed: true,
          error: undefined,
          values: [1, 2, 3],
        });
      });

      it('should handle empty Observable', async () => {
        const result = await collectObservable(EMPTY);

        expect(result, 'to satisfy', {
          completed: true,
          error: undefined,
          values: [],
        });
      });

      it('should capture error from Observable', async () => {
        const testError = new Error('test error');
        const result = await collectObservable(throwError(() => testError));

        expect(result, 'to satisfy', {
          completed: false,
          values: [],
        });
        expect(result.error, 'to be', testError);
      });

      it('should collect values emitted before error', async () => {
        const subject = new Subject<number>();
        const resultPromise = collectObservable(subject);

        subject.next(1);
        subject.next(2);
        subject.error(new Error('after two values'));

        const result = await resultPromise;

        expect(result, 'to satisfy', {
          completed: false,
          values: [1, 2],
        });
        expect(result.error, 'to be an', Error);
      });

      it('should work with Subject', async () => {
        const subject = new Subject<string>();
        const resultPromise = collectObservable(subject);

        subject.next('foo');
        subject.next('bar');
        subject.complete();

        const result = await resultPromise;

        expect(result, 'to satisfy', {
          completed: true,
          error: undefined,
          values: ['foo', 'bar'],
        });
      });

      it('should preserve value order', async () => {
        const result = await collectObservable(of('a', 'b', 'c', 'd'));

        expect(result.values, 'to deeply equal', ['a', 'b', 'c', 'd']);
      });
    });
  });
});
