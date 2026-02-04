// @ts-nocheck - This is a node:assert fixture file, intentionally not type-checked
/**
 * Example node:assert test file for integration testing. This file demonstrates
 * various node:assert assertion patterns.
 */
import assert from 'node:assert';
import { describe, it } from 'node:test';

interface User {
  id: number;
  name: string;
  email: string;
}

const getUser = (): User => ({
  id: 1,
  name: 'Alice',
  email: 'alice@example.com',
});

const throwError = (): never => {
  throw new Error('Something went wrong');
};

const asyncReject = async (): Promise<never> => {
  throw new Error('Async error');
};

const asyncResolve = async (): Promise<string> => {
  return 'success';
};

describe('User Service', () => {
  describe('strict equality', () => {
    it('should handle strictEqual', () => {
      const user = getUser();
      assert.strictEqual(user.id, 1);
      assert.strictEqual(user.name, 'Alice');
    });

    it('should handle notStrictEqual', () => {
      const user = getUser();
      assert.notStrictEqual(user.id, 2);
      assert.notStrictEqual(user.name, 'Bob');
    });

    it('should handle deepStrictEqual', () => {
      const user = getUser();
      assert.deepStrictEqual(user, {
        id: 1,
        name: 'Alice',
        email: 'alice@example.com',
      });
    });

    it('should handle notDeepStrictEqual', () => {
      const user = getUser();
      assert.notDeepStrictEqual(user, {
        id: 2,
        name: 'Bob',
        email: 'bob@example.com',
      });
    });
  });

  describe('truthiness', () => {
    it('should handle bare assert()', () => {
      const user = getUser();
      assert(user);
      assert(user.id);
      assert(user.name.length > 0);
    });

    it('should handle assert.ok()', () => {
      const user = getUser();
      assert.ok(user);
      assert.ok(user.id);
    });
  });

  describe('throws', () => {
    it('should handle throws without args', () => {
      assert.throws(throwError);
    });

    it('should handle throws with Error type', () => {
      assert.throws(throwError, Error);
    });

    it('should handle throws with regex', () => {
      assert.throws(throwError, /Something went wrong/);
    });

    it('should handle doesNotThrow', () => {
      assert.doesNotThrow(() => {
        return 'ok';
      });
    });
  });

  describe('async assertions', () => {
    it('should handle rejects', async () => {
      await assert.rejects(asyncReject);
    });

    it('should handle rejects with Error type', async () => {
      await assert.rejects(asyncReject, Error);
    });

    it('should handle doesNotReject', async () => {
      await assert.doesNotReject(asyncResolve);
    });
  });

  describe('string matching', () => {
    it('should handle match', () => {
      const user = getUser();
      assert.match(user.email, /@/);
      assert.match(user.email, /example\.com$/);
    });

    it('should handle doesNotMatch', () => {
      const user = getUser();
      assert.doesNotMatch(user.email, /invalid/);
    });
  });

  describe('fail', () => {
    it('should handle fail without message', () => {
      // This would fail at runtime, just testing transformation
      // assert.fail();
    });

    it('should handle fail with message', () => {
      // assert.fail('Custom failure message');
    });
  });
});
