import { describe, it } from 'node:test';

import { expectAsync } from '../../src/expect-async.js';

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

      if (!didReject) {
        throw new Error('Expected the assertion to reject, but it resolved');
      }
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

      if (!didReject) {
        throw new Error('Expected the assertion to reject, but it resolved');
      }
    });
  });
});
