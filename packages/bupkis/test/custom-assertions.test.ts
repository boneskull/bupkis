/**
 * Tests for custom test assertions used in the bupkis test suite.
 *
 * These assertions provide domain-specific semantics for testing assertion
 * behavior.
 */

import { describe, it } from 'node:test';

import { AssertionError, AssertionImplementationError } from '../src/error.js';
import { expect } from './custom-assertions.js';

describe('custom test assertions', () => {
  describe("'to be a passing assertion' / 'to pass'", () => {
    it('should pass when the assertion succeeds', () => {
      expect(
        () => expect('hello', 'to be a string'),
        'to be a passing assertion',
      );
    });

    it('should pass using the short alias', () => {
      expect(() => expect(42, 'to be a number'), 'to pass');
    });

    it('should fail when the assertion throws AssertionError', () => {
      expect(
        () =>
          expect(
            () => expect(42, 'to be a string'),
            'to be a passing assertion',
          ),
        'to be a failing assertion',
      );
    });

    it('should re-throw non-AssertionError errors (wrapped by bupkis)', () => {
      // When a non-AssertionError is thrown from within an assertion implementation,
      // bupkis wraps it in AssertionImplementationError. This is expected behavior.
      expect(
        () =>
          expect(() => {
            throw new TypeError('Not an assertion error');
          }, 'to pass'),
        'to throw an',
        AssertionImplementationError,
      );
    });

    it('should support negation', () => {
      expect(
        () => expect(42, 'to be a string'),
        'not to be a passing assertion',
      );
    });
  });

  describe("'to be a failing assertion' / 'to fail'", () => {
    it('should pass when the assertion throws AssertionError', () => {
      expect(() => expect(42, 'to be a string'), 'to be a failing assertion');
    });

    it('should pass using the short alias', () => {
      expect(() => expect('hello', 'to be a number'), 'to fail');
    });

    it('should fail when the assertion succeeds', () => {
      expect(
        () =>
          expect(
            () => expect('hello', 'to be a string'),
            'to be a failing assertion',
          ),
        'to be a failing assertion',
      );
    });

    it('should fail when a non-AssertionError is thrown', () => {
      const customError = new TypeError('Not an assertion error');
      expect(
        () =>
          expect(() => {
            throw customError;
          }, 'to fail'),
        'to be a failing assertion',
      );
    });

    it('should support negation', () => {
      expect(
        () => expect('hello', 'to be a string'),
        'not to be a failing assertion',
      );
    });
  });

  describe("'to be a failing assertion with message matching' / 'to fail with message matching'", () => {
    it('should pass when AssertionError message matches pattern', () => {
      expect(
        () => expect(42, 'to be a string'),
        'to be a failing assertion with message matching',
        /expected.*string/is,
      );
    });

    it('should pass using the short alias', () => {
      expect(
        () => expect('hello', 'to be a number'),
        'to fail with message matching',
        /expected.*number/is,
      );
    });

    it('should fail when message does not match pattern', () => {
      expect(
        () =>
          expect(
            () => expect(42, 'to be a string'),
            'to fail with message matching',
            /totally wrong pattern/,
          ),
        'to be a failing assertion',
      );
    });

    it('should fail when the assertion succeeds', () => {
      expect(
        () =>
          expect(
            () => expect('hello', 'to be a string'),
            'to fail with message matching',
            /some pattern/,
          ),
        'to be a failing assertion',
      );
    });

    it('should fail when a non-AssertionError is thrown', () => {
      const customError = new TypeError('Not an assertion error');
      expect(
        () =>
          expect(
            () => {
              throw customError;
            },
            'to fail with message matching',
            /assertion/,
          ),
        'to be a failing assertion',
      );
    });

    it('should support negation', () => {
      // Message matches, so negation should fail
      expect(
        () =>
          expect(
            () => expect(42, 'to be a string'),
            'not to fail with message matching',
            /expected.*string/is,
          ),
        'to fail',
      );
    });
  });

  describe('error typing', () => {
    it('should specifically catch AssertionError instances', () => {
      // Verify the assertions use isAssertionError for type checking
      const bupkisError = new AssertionError({
        id: 'test',
        message: 'custom bupkis error',
      });

      expect(
        () => {
          throw bupkisError;
        },
        'to fail with message matching',
        /custom bupkis error/,
      );
    });
  });
});
