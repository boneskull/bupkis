import { Readable } from 'node:stream';
import { describe, it } from 'node:test';

import {
  collectAsync,
  collectSync,
  countAsync,
  countSync,
  firstAsync,
  firstSync,
  iterateFullyAsync,
  iterateFullySync,
  lastAsync,
  lastSync,
  toAsyncIterator,
  toIterator,
} from '../../src/assertion/impl/iteration-util.js';
import { expect } from '../../src/index.js';

// =============================================================================
// Sync Iteration Helpers
// =============================================================================

describe('iteration-util (sync)', () => {
  describe('toIterator', () => {
    it('should return iterator from array', () => {
      const arr = [1, 2, 3];
      const iter = toIterator(arr);
      expect(iter.next(), 'to satisfy', { done: false, value: 1 });
      expect(iter.next(), 'to satisfy', { done: false, value: 2 });
      expect(iter.next(), 'to satisfy', { done: false, value: 3 });
      expect(iter.next(), 'to satisfy', { done: true });
    });

    it('should return iterator from Set', () => {
      const set = new Set(['a', 'b']);
      const iter = toIterator(set);
      expect(iter.next(), 'to satisfy', { done: false, value: 'a' });
      expect(iter.next(), 'to satisfy', { done: false, value: 'b' });
      expect(iter.next(), 'to satisfy', { done: true });
    });

    it('should return iterator from generator', () => {
      const gen = function* () {
        yield 1;
        yield 2;
      };
      const iter = toIterator(gen());
      expect(iter.next(), 'to satisfy', { done: false, value: 1 });
      expect(iter.next(), 'to satisfy', { done: false, value: 2 });
      expect(iter.next(), 'to satisfy', { done: true });
    });

    it('should pass through raw iterator', () => {
      const rawIter = {
        _count: 0,
        next() {
          return this._count++ < 2
            ? { done: false, value: this._count }
            : { done: true, value: undefined };
        },
      };
      const iter = toIterator(rawIter);
      expect(iter, 'to be', rawIter);
    });
  });

  describe('collectSync', () => {
    it('should collect array values', () => {
      const result = collectSync([1, 2, 3]);
      expect(result, 'to deep equal', [1, 2, 3]);
    });

    it('should collect Set values', () => {
      const result = collectSync(new Set([1, 2, 3]));
      expect(result, 'to deep equal', [1, 2, 3]);
    });

    it('should collect generator values', () => {
      const gen = function* () {
        yield 'a';
        yield 'b';
      };
      const result = collectSync(gen());
      expect(result, 'to deep equal', ['a', 'b']);
    });

    it('should return empty array for empty iterable', () => {
      const result = collectSync([]);
      expect(result, 'to deep equal', []);
    });
  });

  describe('countSync', () => {
    it('should count array elements', () => {
      expect(countSync([1, 2, 3, 4, 5]), 'to equal', 5);
    });

    it('should count Set elements', () => {
      expect(countSync(new Set(['a', 'b'])), 'to equal', 2);
    });

    it('should return 0 for empty iterable', () => {
      expect(countSync([]), 'to equal', 0);
    });
  });

  describe('firstSync', () => {
    it('should get first element from array', () => {
      expect(firstSync([1, 2, 3]), 'to equal', 1);
    });

    it('should get first element from Set', () => {
      expect(firstSync(new Set(['x'])), 'to equal', 'x');
    });

    it('should return undefined for empty iterable', () => {
      expect(firstSync([]), 'to be undefined');
    });
  });

  describe('lastSync', () => {
    it('should get last element from array', () => {
      expect(lastSync([1, 2, 3]), 'to equal', 3);
    });

    it('should get last element from Set', () => {
      expect(lastSync(new Set(['a', 'b', 'c'])), 'to equal', 'c');
    });

    it('should return undefined for empty iterable', () => {
      expect(lastSync([]), 'to be undefined');
    });
  });

  describe('iterateFullySync', () => {
    it('should return count and last value', () => {
      const result = iterateFullySync([1, 2, 3]);
      expect(result, 'to satisfy', {
        count: 3,
        hasValue: true,
        lastValue: 3,
      });
    });

    it('should handle empty iterable', () => {
      const result = iterateFullySync([]);
      expect(result, 'to satisfy', {
        count: 0,
        hasValue: false,
      });
    });
  });
});

// =============================================================================
// Async Iteration Helpers
// =============================================================================

describe('iteration-util (async)', () => {
  describe('toAsyncIterator', () => {
    it('should return async iterator from async generator', async () => {
      const asyncGen = async function* () {
        yield 1;
        yield 2;
      };
      const iter = toAsyncIterator(asyncGen());
      expect(await iter.next(), 'to satisfy', { done: false, value: 1 });
      expect(await iter.next(), 'to satisfy', { done: false, value: 2 });
      expect(await iter.next(), 'to satisfy', { done: true });
    });

    it('should wrap sync iterable as async', async () => {
      const iter = toAsyncIterator([1, 2, 3]);
      expect(await iter.next(), 'to satisfy', { done: false, value: 1 });
      expect(await iter.next(), 'to satisfy', { done: false, value: 2 });
      expect(await iter.next(), 'to satisfy', { done: false, value: 3 });
      expect(await iter.next(), 'to satisfy', { done: true });
    });

    it('should work with Node.js Readable stream', async () => {
      const readable = Readable.from(['chunk1', 'chunk2']);
      const iter = toAsyncIterator(readable);
      expect(await iter.next(), 'to satisfy', { done: false, value: 'chunk1' });
      expect(await iter.next(), 'to satisfy', { done: false, value: 'chunk2' });
      expect(await iter.next(), 'to satisfy', { done: true });
    });
  });

  describe('collectAsync', () => {
    it('should collect async generator values', async () => {
      const asyncGen = async function* () {
        yield 1;
        yield 2;
        yield 3;
      };
      const result = await collectAsync(asyncGen());
      expect(result, 'to deep equal', [1, 2, 3]);
    });

    it('should collect sync iterable values', async () => {
      const result = await collectAsync([1, 2, 3]);
      expect(result, 'to deep equal', [1, 2, 3]);
    });

    it('should collect Node.js Readable values', async () => {
      const readable = Readable.from(['a', 'b']);
      const result = await collectAsync(readable);
      expect(result, 'to deep equal', ['a', 'b']);
    });

    it('should return empty array for empty async iterable', async () => {
      const emptyGen = async function* () {
        // yields nothing
      };
      const result = await collectAsync(emptyGen());
      expect(result, 'to deep equal', []);
    });
  });

  describe('countAsync', () => {
    it('should count async generator values', async () => {
      const asyncGen = async function* () {
        yield 1;
        yield 2;
        yield 3;
      };
      expect(await countAsync(asyncGen()), 'to equal', 3);
    });

    it('should return 0 for empty async iterable', async () => {
      const emptyGen = async function* () {};
      expect(await countAsync(emptyGen()), 'to equal', 0);
    });
  });

  describe('firstAsync', () => {
    it('should get first value from async generator', async () => {
      const asyncGen = async function* () {
        yield 'first';
        yield 'second';
      };
      expect(await firstAsync(asyncGen()), 'to equal', 'first');
    });

    it('should return undefined for empty async iterable', async () => {
      const emptyGen = async function* () {};
      expect(await firstAsync(emptyGen()), 'to be undefined');
    });
  });

  describe('lastAsync', () => {
    it('should get last value from async generator', async () => {
      const asyncGen = async function* () {
        yield 'first';
        yield 'last';
      };
      expect(await lastAsync(asyncGen()), 'to equal', 'last');
    });

    it('should return undefined for empty async iterable', async () => {
      const emptyGen = async function* () {};
      expect(await lastAsync(emptyGen()), 'to be undefined');
    });
  });

  describe('iterateFullyAsync', () => {
    it('should return count and last value on success', async () => {
      const asyncGen = async function* () {
        yield 1;
        yield 2;
        yield 3;
      };
      const result = await iterateFullyAsync(asyncGen());
      expect(result, 'to satisfy', {
        completed: true,
        count: 3,
        hasValue: true,
        lastValue: 3,
      });
    });

    it('should handle empty async iterable', async () => {
      const emptyGen = async function* () {};
      const result = await iterateFullyAsync(emptyGen());
      expect(result, 'to satisfy', {
        completed: true,
        count: 0,
        hasValue: false,
      });
    });

    it('should capture error on rejection', async () => {
      const failingGen = async function* () {
        yield 1;
        throw new Error('Test error');
      };
      const result = await iterateFullyAsync(failingGen());
      expect(result, 'to satisfy', {
        completed: false,
        count: 1,
        error: expect.it('to be an', Error),
      });
      expect((result.error as Error).message, 'to equal', 'Test error');
    });
  });
});
