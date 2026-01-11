/**
 * Functional tests for Valibot Standard Schema interoperability.
 *
 * Tests that bupkis correctly handles assertions created with Valibot schemas,
 * validating both success and failure modes.
 */

import { describe, it } from 'node:test';

import { AssertionError } from '../../src/error.js';
import { expect } from '../../src/index.js';
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
        try {
          valibotStringAssertion.execute([42], [42], () => {});
          expect.fail('Should have thrown AssertionError');
        } catch (err) {
          expect(err, 'to be an', AssertionError);
        }
      });
    });

    describe('number assertion', () => {
      it('should pass with valid number', () => {
        valibotNumberAssertion.execute([42], [42], () => {});
      });

      it('should fail with non-number', () => {
        try {
          valibotNumberAssertion.execute(['hello'], ['hello'], () => {});
          expect.fail('Should have thrown AssertionError');
        } catch (err) {
          expect(err, 'to be an', AssertionError);
        }
      });

      it('should fail with Infinity', () => {
        try {
          valibotNumberAssertion.execute([Infinity], [Infinity], () => {});
          expect.fail('Should have thrown AssertionError');
        } catch (err) {
          expect(err, 'to be an', AssertionError);
        }
      });
    });

    describe('boolean assertion', () => {
      it('should pass with valid boolean', () => {
        valibotBooleanAssertion.execute([true], [true], () => {});
        valibotBooleanAssertion.execute([false], [false], () => {});
      });

      it('should fail with non-boolean', () => {
        try {
          valibotBooleanAssertion.execute([1], [1], () => {});
          expect.fail('Should have thrown AssertionError');
        } catch (err) {
          expect(err, 'to be an', AssertionError);
        }
      });
    });

    describe('array assertion', () => {
      it('should pass with valid array', () => {
        valibotArrayAssertion.execute([[1, 2, 3]], [[1, 2, 3]], () => {});
        valibotArrayAssertion.execute([[]], [[]], () => {});
      });

      it('should fail with non-array', () => {
        try {
          valibotArrayAssertion.execute(
            [{ foo: 'bar' }],
            [{ foo: 'bar' }],
            () => {},
          );
          expect.fail('Should have thrown AssertionError');
        } catch (err) {
          expect(err, 'to be an', AssertionError);
        }
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
        try {
          valibotEqualityAssertion.execute([5, 10], [5, 10], () => {});
          expect.fail('Should have thrown AssertionError');
        } catch (err) {
          expect(err, 'to be an', AssertionError);
        }
      });
    });

    describe('greater than assertion', () => {
      it('should pass when subject is greater', () => {
        valibotGreaterThanAssertion.execute([10, 5], [10, 5], () => {});
      });

      it('should fail when subject is not greater', () => {
        try {
          valibotGreaterThanAssertion.execute([3, 5], [3, 5], () => {});
          expect.fail('Should have thrown AssertionError');
        } catch (err) {
          expect(err, 'to be an', AssertionError);
        }
      });

      it('should fail when subject equals expected', () => {
        try {
          valibotGreaterThanAssertion.execute([5, 5], [5, 5], () => {});
          expect.fail('Should have thrown AssertionError');
        } catch (err) {
          expect(err, 'to be an', AssertionError);
        }
      });
    });

    describe('less than assertion', () => {
      it('should pass when subject is less', () => {
        valibotLessThanAssertion.execute([3, 10], [3, 10], () => {});
      });

      it('should fail when subject is not less', () => {
        try {
          valibotLessThanAssertion.execute([10, 5], [10, 5], () => {});
          expect.fail('Should have thrown AssertionError');
        } catch (err) {
          expect(err, 'to be an', AssertionError);
        }
      });

      it('should fail when subject equals expected', () => {
        try {
          valibotLessThanAssertion.execute([5, 5], [5, 5], () => {});
          expect.fail('Should have thrown AssertionError');
        } catch (err) {
          expect(err, 'to be an', AssertionError);
        }
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
        try {
          valibotStringContainsAssertion.execute(
            ['hello world', 'foo'],
            ['hello world', 'foo'],
            () => {},
          );
          expect.fail('Should have thrown AssertionError');
        } catch (err) {
          expect(err, 'to be an', AssertionError);
        }
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
        try {
          valibotArrayLengthAssertion.execute(
            [[1, 2, 3], 5],
            [[1, 2, 3], 5],
            () => {},
          );
          expect.fail('Should have thrown AssertionError');
        } catch (err) {
          expect(err, 'to be an', AssertionError);
        }
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
        try {
          valibotObjectHasPropertyAssertion.execute(
            [{ foo: 'bar' }, 'baz'],
            [{ foo: 'bar' }, 'baz'],
            () => {},
          );
          expect.fail('Should have thrown AssertionError');
        } catch (err) {
          expect(err, 'to be an', AssertionError);
        }
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
        try {
          valibotArrayContainsAssertion.execute(
            [[1, 2, 3], 5],
            [[1, 2, 3], 5],
            () => {},
          );
          expect.fail('Should have thrown AssertionError');
        } catch (err) {
          expect(err, 'to be an', AssertionError);
        }
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
      try {
        expect(5, 'to be greater than', 10);
        expect.fail('Should have thrown');
      } catch (err) {
        expect(err, 'to be an', AssertionError);
      }
    });
  });
});
