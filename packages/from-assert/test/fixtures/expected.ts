/**
 * Example node:assert test file for integration testing. This file demonstrates
 * various node:assert assertion patterns.
 */
import { describe, it } from 'node:test';
import { expect, expectAsync } from 'bupkis';

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
      expect(user.id, 'to be', 1);
      expect(user.name, 'to be', 'Alice');
    });

    it('should handle notStrictEqual', () => {
      const user = getUser();
      expect(user.id, 'not to be', 2);
      expect(user.name, 'not to be', 'Bob');
    });

    it('should handle deepStrictEqual', () => {
      const user = getUser();
      expect(user, 'to deep equal', {
        id: 1,
        name: 'Alice',
        email: 'alice@example.com',
      });
    });

    it('should handle notDeepStrictEqual', () => {
      const user = getUser();
      expect(user, 'not to deep equal', {
        id: 2,
        name: 'Bob',
        email: 'bob@example.com',
      });
    });
  });

  describe('truthiness', () => {
    it('should handle bare assert()', () => {
      const user = getUser();
      expect(user, 'to be truthy');
      expect(user.id, 'to be truthy');
      expect(user.name.length > 0, 'to be truthy');
    });

    it('should handle assert.ok()', () => {
      const user = getUser();
      expect(user, 'to be truthy');
      expect(user.id, 'to be truthy');
    });
  });

  describe('throws', () => {
    it('should handle throws without args', () => {
      expect(throwError, 'to throw');
    });

    it('should handle throws with Error type', () => {
      expect(throwError, 'to throw', Error);
    });

    it('should handle throws with regex', () => {
      expect(throwError, 'to throw', /Something went wrong/);
    });

    it('should handle doesNotThrow', () => {
      expect(() => {
        return 'ok';
      }, 'not to throw');
    });
  });

  describe('async assertions', () => {
    it('should handle rejects', async () => {
      await expectAsync(asyncReject, 'to reject');
    });

    it('should handle rejects with Error type', async () => {
      await expectAsync(asyncReject, 'to reject with', Error);
    });

    it('should handle doesNotReject', async () => {
      await expectAsync(asyncResolve, 'not to reject');
    });
  });

  describe('string matching', () => {
    it('should handle match', () => {
      const user = getUser();
      expect(user.email, 'to match', /@/);
      expect(user.email, 'to match', /example\.com$/);
    });

    it('should handle doesNotMatch', () => {
      const user = getUser();
      expect(user.email, 'not to match', /invalid/);
    });
  });

  describe('fail', () => {
    it('should handle fail without message', () => {
      // This would fail at runtime, just testing transformation
      // expect.fail();
    });

    it('should handle fail with message', () => {
      // expect.fail('Custom failure message');
    });
  });
});
