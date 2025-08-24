import { describe, it } from 'node:test';

import { expectAsync } from '../../src/expect-async.js';
import { expect } from '../../src/expect.js';

describe('Asynchronous assertions', () => {
  describe('Promise resolution', () => {
    it('should pass when Promise resolves successfully', async () => {
      // These should resolve successfully without throwing
      await expectAsync(
        expectAsync(Promise.resolve(42), 'to resolve'),
        'to resolve',
      );
      await expectAsync(
        expectAsync(Promise.resolve(42), 'to fulfill'),
        'to resolve',
      );
    });

    it('should fail when Promise rejects but expected to resolve', async () => {
      // This expectAsync call should reject because the inner promise rejects
      const failingAssertion = expectAsync(
        Promise.reject(new Error('error')),
        'to resolve',
      );

      // We expect this assertion to fail, so we test that it rejects
      let didReject = false;
      try {
        await failingAssertion;
      } catch {
        didReject = true;
      }

      expect(didReject, 'to be true');
    });
  });

  describe('Promise-returning functions', () => {
    it('should pass when function returns resolving promise', async () => {
      const fn1 = async () => 42;
      const fn2 = () => Promise.resolve(42);

      // These should resolve successfully without throwing
      // Note: testing the promise returned by expectAsync rather than nesting calls
      await expectAsync(fn1, 'to resolve');
      await expectAsync(fn2, 'to fulfill');
    });

    it('should pass when the function is not Promise-returning', async () => {
      const fn = () => 42;
      await expectAsync(fn, 'to resolve');
      await expectAsync(fn, 'to fulfill');
    });

    it('should fail when function returns rejecting promise', async () => {
      const fn = () => Promise.reject(new Error());

      // This expectAsync call should reject because the function returns a rejecting promise
      // Note: passing the function itself, not the result of calling it
      const failingAssertion = expectAsync(fn, 'to fulfill');

      // We expect this assertion to fail, so we test that it rejects
      let didReject = false;
      try {
        await failingAssertion;
      } catch {
        didReject = true;
      }

      expect(didReject, 'to be true');
    });
  });

  describe('Promise rejection', () => {
    it('should pass when Promise rejects as expected', async () => {
      // These should resolve successfully because the inner promises reject as expected
      await expectAsync(
        expectAsync(Promise.reject(new Error('error')), 'to reject'),
        'to resolve',
      );
    });

    it('should fail when Promise resolves but expected to reject', async () => {
      // This expectAsync call should reject because the inner promise resolves instead of rejecting
      const failingAssertion = expectAsync(Promise.resolve(42), 'to reject');

      // We expect this assertion to fail, so we test that it rejects
      let didReject = false;
      try {
        await failingAssertion;
      } catch {
        didReject = true;
      }

      expect(didReject, 'to be true');
    });

    it('should pass when function returns rejecting promise', async () => {
      const fn1 = async () => {
        throw new Error('error');
      };
      const fn2 = () => Promise.reject(new Error('error'));

      // These should resolve successfully because the functions reject as expected
      await expectAsync(fn1, 'to reject');
      await expectAsync(fn2, 'to reject');
    });

    it('should fail when function resolves but expected to reject', async () => {
      const fn = () => Promise.resolve(42);

      // This expectAsync call should reject because the function returns a resolving promise
      const failingAssertion = expectAsync(fn, 'to reject');

      // We expect this assertion to fail, so we test that it rejects
      let didReject = false;
      try {
        await failingAssertion;
      } catch {
        didReject = true;
      }
      expect(didReject, 'to be true');
    });
  });

  describe('Parameterized "to reject" assertions', () => {
    describe('String parameter matching', () => {
      it('should pass when rejection message matches string exactly', async () => {
        const fn = () => Promise.reject(new Error('exact message'));
        await expectAsync(fn, 'to reject', 'exact message');
      });

      it('should fail when rejection message does not match string', async () => {
        const fn = () => Promise.reject(new Error('different message'));

        let didReject = false;
        try {
          await expectAsync(fn, 'to reject', 'exact message');
        } catch {
          didReject = true;
        }

        expect(didReject, 'to be true');
      });
    });

    describe('RegExp parameter matching', () => {
      it('should pass when rejection message matches RegExp', async () => {
        const fn = () => Promise.reject(new Error('test error message'));
        await expectAsync(fn, 'to reject', /test.*error/);
      });

      it('should fail when rejection message does not match RegExp', async () => {
        const fn = () => Promise.reject(new Error('different message'));

        let didReject = false;
        try {
          await expectAsync(fn, 'to reject', /test.*error/);
        } catch {
          didReject = true;
        }

        expect(didReject, 'to be true');
      });
    });

    describe('Object parameter matching', () => {
      it('should pass when rejection properties match object', async () => {
        const fn = () => {
          const error = new Error('test message');
          (error as any).code = 'TEST_ERROR';
          return Promise.reject(error);
        };

        await expectAsync(fn, 'to reject', {
          code: 'TEST_ERROR',
          message: 'test message',
        });
      });

      it('should fail when rejection properties do not match object', async () => {
        const fn = () => {
          const error = new Error('test message');
          (error as any).code = 'DIFFERENT_ERROR';
          return Promise.reject(error);
        };

        let didReject = false;
        try {
          await expectAsync(fn, 'to reject', {
            code: 'TEST_ERROR',
            message: 'test message',
          });
        } catch {
          didReject = true;
        }

        expect(didReject, 'to be true');
      });
    });

    describe('Class parameter matching', () => {
      it('should pass when rejection is instance of specified class', async () => {
        const fn = () => Promise.reject(new TypeError('type error'));
        await expectAsync(fn, 'to reject with a', TypeError);
      });

      it('should fail when rejection is not instance of specified class', async () => {
        const fn = () => Promise.reject(new Error('regular error'));

        let didReject = false;
        try {
          await expectAsync(fn, 'to reject with an', TypeError);
        } catch {
          didReject = true;
        }

        expect(didReject, 'to be true');
      });
    });
  });
});
