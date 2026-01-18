/**
 * Functional tests for Valibot Standard Schema interoperability.
 *
 * Tests that bupkis correctly handles assertions created with Valibot schemas,
 * validating both success and failure modes.
 */

import { describe, it } from 'node:test';

import { AssertionError } from '../../src/error.js';
import { expect } from '../custom-assertions.js';
import {
  valibotArrayAssertion,
  valibotArrayContainsAssertion,
  valibotArrayLengthAssertion,
  valibotBooleanAssertion,
  valibotEqualityAssertion,
  valibotGreaterThanAssertion,
  valibotLessThanAssertion,
  valibotNumberAssertion,
  valibotObjectHasPropertyAssertion,
  valibotStringAssertion,
  valibotStringContainsAssertion,
} from '../valibot-assertions.js';

describe('Valibot Standard Schema - Functional Tests', () => {
  describe('Basic Type Assertions', () => {
    describe('string assertion', () => {
      it('should pass with valid string', () => {
        valibotStringAssertion.execute(['hello'], ['hello'], () => {});
      });

      it('should fail with non-string', () => {
        expect(
          () => valibotStringAssertion.execute([42], [42], () => {}),
          'to throw an',
          AssertionError,
        );
      });
    });

    describe('number assertion', () => {
      it('should pass with valid number', () => {
        valibotNumberAssertion.execute([42], [42], () => {});
      });

      it('should fail with non-number', () => {
        expect(
          () => valibotNumberAssertion.execute(['hello'], ['hello'], () => {}),
          'to throw an',
          AssertionError,
        );
      });

      it('should fail with Infinity', () => {
        expect(
          () =>
            valibotNumberAssertion.execute([Infinity], [Infinity], () => {}),
          'to throw an',
          AssertionError,
        );
      });
    });

    describe('boolean assertion', () => {
      it('should pass with valid boolean', () => {
        valibotBooleanAssertion.execute([true], [true], () => {});
        valibotBooleanAssertion.execute([false], [false], () => {});
      });

      it('should fail with non-boolean', () => {
        expect(
          () => valibotBooleanAssertion.execute([1], [1], () => {}),
          'to throw an',
          AssertionError,
        );
      });
    });

    describe('array assertion', () => {
      it('should pass with valid array', () => {
        valibotArrayAssertion.execute([[1, 2, 3]], [[1, 2, 3]], () => {});
        valibotArrayAssertion.execute([[]], [[]], () => {});
      });

      it('should fail with non-array', () => {
        expect(
          () =>
            valibotArrayAssertion.execute(
              [{ foo: 'bar' }],
              [{ foo: 'bar' }],
              () => {},
            ),
          'to throw an',
          AssertionError,
        );
      });
    });
  });

  describe('Parametric Assertions', () => {
    describe('equality assertion', () => {
      it('should pass with equal values', () => {
        valibotEqualityAssertion.execute([5, 5], [5, 5], () => {});
        valibotEqualityAssertion.execute(
          ['hello', 'hello'],
          ['hello', 'hello'],
          () => {},
        );
      });

      it('should fail with unequal values', () => {
        expect(
          () => valibotEqualityAssertion.execute([5, 10], [5, 10], () => {}),
          'to throw an',
          AssertionError,
        );
      });
    });

    describe('greater than assertion', () => {
      it('should pass when subject is greater', () => {
        valibotGreaterThanAssertion.execute([10, 5], [10, 5], () => {});
      });

      it('should fail when subject is not greater', () => {
        expect(
          () => valibotGreaterThanAssertion.execute([3, 5], [3, 5], () => {}),
          'to throw an',
          AssertionError,
        );
      });

      it('should fail when subject equals expected', () => {
        expect(
          () => valibotGreaterThanAssertion.execute([5, 5], [5, 5], () => {}),
          'to throw an',
          AssertionError,
        );
      });
    });

    describe('less than assertion', () => {
      it('should pass when subject is less', () => {
        valibotLessThanAssertion.execute([3, 10], [3, 10], () => {});
      });

      it('should fail when subject is not less', () => {
        expect(
          () => valibotLessThanAssertion.execute([10, 5], [10, 5], () => {}),
          'to throw an',
          AssertionError,
        );
      });

      it('should fail when subject equals expected', () => {
        expect(
          () => valibotLessThanAssertion.execute([5, 5], [5, 5], () => {}),
          'to throw an',
          AssertionError,
        );
      });
    });

    describe('string contains assertion', () => {
      it('should pass when string contains substring', () => {
        valibotStringContainsAssertion.execute(
          ['hello world', 'world'],
          ['hello world', 'world'],
          () => {},
        );
      });

      it('should fail when string does not contain substring', () => {
        expect(
          () =>
            valibotStringContainsAssertion.execute(
              ['hello world', 'foo'],
              ['hello world', 'foo'],
              () => {},
            ),
          'to throw an',
          AssertionError,
        );
      });
    });

    describe('array length assertion', () => {
      it('should pass with correct length', () => {
        valibotArrayLengthAssertion.execute(
          [[1, 2, 3], 3],
          [[1, 2, 3], 3],
          () => {},
        );
      });

      it('should fail with incorrect length', () => {
        expect(
          () =>
            valibotArrayLengthAssertion.execute(
              [[1, 2, 3], 5],
              [[1, 2, 3], 5],
              () => {},
            ),
          'to throw an',
          AssertionError,
        );
      });
    });
  });

  describe('Collection Assertions', () => {
    describe('object has property assertion', () => {
      it('should pass when object has property', () => {
        valibotObjectHasPropertyAssertion.execute(
          [{ foo: 'bar' }, 'foo'],
          [{ foo: 'bar' }, 'foo'],
          () => {},
        );
      });

      it('should fail when object lacks property', () => {
        expect(
          () =>
            valibotObjectHasPropertyAssertion.execute(
              [{ foo: 'bar' }, 'baz'],
              [{ foo: 'bar' }, 'baz'],
              () => {},
            ),
          'to throw an',
          AssertionError,
        );
      });
    });

    describe('array contains assertion', () => {
      it('should pass when array contains value', () => {
        valibotArrayContainsAssertion.execute(
          [[1, 2, 3], 2],
          [[1, 2, 3], 2],
          () => {},
        );
      });

      it('should fail when array does not contain value', () => {
        expect(
          () =>
            valibotArrayContainsAssertion.execute(
              [[1, 2, 3], 5],
              [[1, 2, 3], 5],
              () => {},
            ),
          'to throw an',
          AssertionError,
        );
      });
    });
  });

  describe('Integration with native expect()', () => {
    it('should work when used via expect() API with string assertion', () => {
      expect('hello', 'to be a string');
    });

    it('should work when used via expect() API with greater than', () => {
      expect(10, 'to be greater than', 5);
    });

    it('should throw AssertionError via expect() API on failure', () => {
      expect(() => expect(5, 'to be greater than', 10), 'to fail');
    });
  });
});
