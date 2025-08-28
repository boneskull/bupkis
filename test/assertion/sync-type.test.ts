import { describe, it } from 'node:test';

import { expect } from '../../src/expect.js';

describe('Synchronous type-based assertions', () => {
  describe('to be a string', () => {
    describe('when the value is a string', () => {
      it('should pass', () => {
        expect(() => expect('hi', 'to be a string'), 'not to throw');
      });
    });

    describe('when the value is not a string', () => {
      it('should fail', () => {
        expect(() => expect(42, 'to be a string'), 'to throw');
      });
    });
  });

  describe('to be a number / to be finite', () => {
    describe('when the value is a finite number', () => {
      it('should pass', () => {
        expect(() => expect(42, 'to be a number'), 'not to throw');
        expect(() => expect(3.14, 'to be a number'), 'not to throw');
        expect(() => expect(42, 'to be finite'), 'not to throw');
        expect(() => expect(3.14, 'to be finite'), 'not to throw');
      });
    });

    describe('when the value is not a finite number', () => {
      it('should fail', () => {
        expect(() => expect(NaN, 'to be a number'), 'to throw');
        expect(() => expect(Infinity, 'to be a number'), 'to throw');
        expect(() => expect(-Infinity, 'to be a number'), 'to throw');
        expect(() => expect(NaN, 'to be finite'), 'to throw');
        expect(() => expect(Infinity, 'to be finite'), 'to throw');
        expect(() => expect(-Infinity, 'to be finite'), 'to throw');
      });

      describe('when the value is not a number', () => {
        it('should fail', () => {
          expect(() => expect('42', 'to be a number'), 'to throw');
          expect(() => expect(null, 'to be a number'), 'to throw');
          expect(() => expect(undefined, 'to be a number'), 'to throw');
          expect(() => expect({}, 'to be a number'), 'to throw');
        });
      });
    });
  });

  describe('to be infinite', () => {
    describe('when the value is infinite', () => {
      it('should pass', () => {
        expect(() => expect(Infinity, 'to be infinite'), 'not to throw');
        expect(() => expect(-Infinity, 'to be infinite'), 'not to throw');
      });
    });

    describe('when the value is not infinite', () => {
      it('should fail', () => {
        expect(() => expect(42, 'to be infinite'), 'to throw');
        expect(() => expect(NaN, 'to be infinite'), 'to throw');
        expect(() => expect('Infinity', 'to be infinite'), 'to throw');
        expect(() => expect(null, 'to be infinite'), 'to throw');
        expect(() => expect(undefined, 'to be infinite'), 'to throw');
        expect(() => expect({}, 'to be infinite'), 'to throw');
      });
    });
  });

  describe('to be positive / to be a positive number', () => {
    describe('when the value is a positive number', () => {
      it('should pass', () => {
        expect(() => expect(42, 'to be a positive number'), 'not to throw');
        expect(() => expect(3.14, 'to be a positive number'), 'not to throw');
        expect(() => expect(42, 'to be positive'), 'not to throw');
        expect(() => expect(3.14, 'to be positive'), 'not to throw');
      });
    });

    describe('when the value is a non-positive number', () => {
      it('should fail', () => {
        expect(() => expect(-1, 'to be a positive number'), 'to throw');
        expect(() => expect(0, 'to be a positive number'), 'to throw');
        expect(() => expect(NaN, 'to be a positive number'), 'to throw');
        expect(() => expect(Infinity, 'to be a positive number'), 'to throw');
        expect(() => expect(-Infinity, 'to be a positive number'), 'to throw');
        expect(() => expect(-1, 'to be positive'), 'to throw');
        expect(() => expect(0, 'to be positive'), 'to throw');
        expect(() => expect(NaN, 'to be positive'), 'to throw');
        expect(() => expect(Infinity, 'to be positive'), 'to throw');
        expect(() => expect(-Infinity, 'to be positive'), 'to throw');
      });

      describe('when the value is not a number', () => {
        it('should fail', () => {
          expect(() => expect('42', 'to be a positive number'), 'to throw');
          expect(() => expect(null, 'to be a positive number'), 'to throw');
          expect(
            () => expect(undefined, 'to be a positive number'),
            'to throw',
          );
          expect(() => expect({}, 'to be a positive number'), 'to throw');
          expect(() => expect('42', 'to be positive'), 'to throw');
          expect(() => expect(null, 'to be positive'), 'to throw');
          expect(() => expect(undefined, 'to be positive'), 'to throw');
          expect(() => expect({}, 'to be positive'), 'to throw');
        });
      });
    });
  });

  describe('to be negative / to be a negative number', () => {
    describe('when the value is a negative number', () => {
      it('should pass', () => {
        expect(() => expect(-42, 'to be a negative number'), 'not to throw');
        expect(() => expect(-3.14, 'to be a negative number'), 'not to throw');
        expect(() => expect(-42, 'to be negative'), 'not to throw');
        expect(() => expect(-3.14, 'to be negative'), 'not to throw');
      });
    });

    describe('when the value is a non-negative number', () => {
      it('should fail', () => {
        expect(() => expect(1, 'to be a negative number'), 'to throw');
        expect(() => expect(0, 'to be a negative number'), 'to throw');
        expect(() => expect(NaN, 'to be a negative number'), 'to throw');
        expect(() => expect(Infinity, 'to be a negative number'), 'to throw');
        expect(() => expect(-Infinity, 'to be a negative number'), 'to throw');
        expect(() => expect(1, 'to be negative'), 'to throw');
        expect(() => expect(0, 'to be negative'), 'to throw');
        expect(() => expect(NaN, 'to be negative'), 'to throw');
        expect(() => expect(Infinity, 'to be negative'), 'to throw');
        expect(() => expect(-Infinity, 'to be negative'), 'to throw');
      });

      describe('when the value is not a number', () => {
        it('should fail', () => {
          expect(() => expect('42', 'to be a negative number'), 'to throw');
          expect(() => expect(null, 'to be a negative number'), 'to throw');
          expect(
            () => expect(undefined, 'to be a negative number'),
            'to throw',
          );
          expect(() => expect({}, 'to be a negative number'), 'to throw');
          expect(() => expect('42', 'to be negative'), 'to throw');
          expect(() => expect(null, 'to be negative'), 'to throw');
          expect(() => expect(undefined, 'to be negative'), 'to throw');
          expect(() => expect({}, 'to be negative'), 'to throw');
        });
      });
    });
  });

  describe('to be a boolean / to be boolean / to be a bool', () => {
    describe('when the value is a boolean', () => {
      it('should pass', () => {
        expect(() => expect(true, 'to be a boolean'), 'not to throw');
        expect(() => expect(false, 'to be a boolean'), 'not to throw');
        expect(() => expect(true, 'to be boolean'), 'not to throw');
        expect(() => expect(false, 'to be boolean'), 'not to throw');
        expect(() => expect(true, 'to be a bool'), 'not to throw');
        expect(() => expect(false, 'to be a bool'), 'not to throw');
      });
    });
    describe('when the value is not a boolean', () => {
      it('should fail', () => {
        expect(() => expect(1, 'to be a boolean'), 'to throw');
        expect(() => expect(0, 'to be a boolean'), 'to throw');
        expect(() => expect('true', 'to be a boolean'), 'to throw');
        expect(() => expect(null, 'to be a boolean'), 'to throw');
        expect(() => expect(undefined, 'to be a boolean'), 'to throw');
        expect(() => expect({}, 'to be a boolean'), 'to throw');
        expect(() => expect(1, 'to be boolean'), 'to throw');
      });
    });
  });

  describe('to be true', () => {
    describe('when the value is true', () => {
      it('should pass', () => {
        expect(() => expect(true, 'to be true'), 'not to throw');
      });
    });

    describe('when the value is not true', () => {
      it('should fail', () => {
        expect(() => expect(false, 'to be true'), 'to throw');
      });
    });
  });

  describe('to be false', () => {
    describe('when the value is false', () => {
      it('should pass', () => {
        expect(() => expect(false, 'to be false'), 'not to throw');
      });
    });

    describe('when the value is not false', () => {
      it('should fail', () => {
        expect(() => expect(true, 'to be false'), 'to throw');
      });
    });
  });

  describe('to be a bigint / to be a BigInt', () => {
    describe('when the value is a bigint', () => {
      it('should pass', () => {
        expect(() => expect(10n, 'to be a bigint'), 'not to throw');
        expect(() => expect(10n, 'to be a BigInt'), 'not to throw');
      });
    });
    describe('when the value is not a bigint', () => {
      it('should fail', () => {
        expect(() => expect(42, 'to be a bigint'), 'to throw');
        expect(() => expect(42, 'to be a BigInt'), 'to throw');
      });
    });
  });

  describe('to be a symbol / to be a Symbol', () => {
    describe('when the value is a symbol', () => {
      it('should pass', () => {
        expect(() => expect(Symbol('test'), 'to be a symbol'), 'not to throw');
        expect(() => expect(Symbol('test'), 'to be a Symbol'), 'not to throw');
      });
    });
    describe('when the value is not a symbol', () => {
      it('should fail', () => {
        expect(() => expect('test', 'to be a symbol'), 'to throw');
        expect(() => expect('test', 'to be a Symbol'), 'to throw');
      });
    });
  });

  describe('to be a safe number / to be safe', () => {
    describe('when the value is a safe number', () => {
      it('should pass', () => {
        expect(() => expect(42, 'to be a safe number'), 'not to throw');
        expect(() => expect(42, 'to be safe'), 'not to throw');
        expect(
          () => expect(Number.MAX_SAFE_INTEGER, 'to be a safe number'),
          'not to throw',
        );
        expect(
          () => expect(Number.MAX_SAFE_INTEGER, 'to be safe'),
          'not to throw',
        );
        expect(
          () => expect(Number.MIN_SAFE_INTEGER, 'to be a safe number'),
          'not to throw',
        );
        expect(
          () => expect(Number.MIN_SAFE_INTEGER, 'to be safe'),
          'not to throw',
        );
      });
    });

    describe('when the value is a non-safe number', () => {
      it('should fail', () => {
        expect(
          () => expect(Number.MAX_SAFE_INTEGER + 1, 'to be a safe number'),
          'to throw',
        );
        expect(
          () => expect(Number.MAX_SAFE_INTEGER + 1, 'to be safe'),
          'to throw',
        );
        expect(
          () => expect(Number.MIN_SAFE_INTEGER - 1, 'to be a safe number'),
          'to throw',
        );
        expect(
          () => expect(Number.MIN_SAFE_INTEGER - 1, 'to be safe'),
          'to throw',
        );
        expect(() => expect(NaN, 'to be a safe number'), 'to throw');
        expect(() => expect(NaN, 'to be safe'), 'to throw');
        expect(() => expect(Infinity, 'to be a safe number'), 'to throw');
        expect(() => expect(Infinity, 'to be safe'), 'to throw');
        expect(() => expect(-Infinity, 'to be a safe number'), 'to throw');
        expect(() => expect(-Infinity, 'to be safe'), 'to throw');
      });
    });

    describe('when the value is not a number', () => {
      it('should fail', () => {
        expect(() => expect('42', 'to be a safe number'), 'to throw');
        expect(() => expect(null, 'to be a safe number'), 'to throw');
        expect(() => expect(undefined, 'to be a safe number'), 'to throw');
        expect(() => expect({}, 'to be a safe number'), 'to throw');
        expect(() => expect('42', 'to be safe'), 'to throw');
        expect(() => expect(null, 'to be safe'), 'to throw');
        expect(() => expect(undefined, 'to be safe'), 'to throw');
        expect(() => expect({}, 'to be safe'), 'to throw');
      });
    });
  });

  describe('to be a function', () => {
    describe('when the value is a function', () => {
      it('should pass', () => {
        expect(() => expect(() => {}, 'to be a function'), 'not to throw');
        expect(
          () => expect(function () {}, 'to be a function'),
          'not to throw',
        );
        expect(
          () => expect(async () => {}, 'to be a function'),
          'not to throw',
        );
        expect(
          () => expect(async function () {}, 'to be a function'),
          'not to throw',
        );
        expect(
          () => expect(function* () {}, 'to be a function'),
          'not to throw',
        );
        expect(
          () => expect(async function* () {}, 'to be a function'),
          'not to throw',
        );
        expect(() => expect(class {}, 'to be a function'), 'not to throw');
      });
    });
    describe('when the value is not a function', () => {
      it('should fail', () => {
        expect(() => expect(42, 'to be a function'), 'to throw');
        expect(() => expect('function', 'to be a function'), 'to throw');
        expect(() => expect(null, 'to be a function'), 'to throw');
        expect(() => expect(undefined, 'to be a function'), 'to throw');
        expect(() => expect({}, 'to be a function'), 'to throw');
      });
    });
  });

  describe('to be an object', () => {
    it('should pass when value is an object', () => {
      expect(() => expect({}, 'to be an object'), 'not to throw');
      expect(() => expect([], 'to be an object'), 'not to throw');
      expect(() => expect(new Date(), 'to be an object'), 'not to throw');
      expect(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        () => expect(Object.create(null), 'to be an object'),
        'not to throw',
      );
      class TestClass {}
      expect(() => expect(new TestClass(), 'to be an object'), 'not to throw');
    });

    it('should fail when value is not an object', () => {
      expect(() => expect('string', 'to be an object'), 'to throw');
      expect(() => expect(42, 'to be an object'), 'to throw');
      expect(() => expect(null, 'to be an object'), 'to throw');
    });
  });

  describe('to be true', () => {
    describe('when the value is true', () => {
      it('should pass', () => {
        expect(() => expect(true, 'to be true'), 'not to throw');
      });
    });

    describe('when the value is false', () => {
      it('should fail', () => {
        expect(() => expect(false, 'to be true'), 'to throw');
      });
    });

    describe('when the value is not a boolean', () => {
      it('should fail', () => {
        expect(() => expect(1, 'to be true'), 'to throw');
        expect(() => expect('true', 'to be true'), 'to throw');
        expect(() => expect(null, 'to be true'), 'to throw');
        expect(() => expect(undefined, 'to be true'), 'to throw');
      });
    });
  });

  describe('to be false', () => {
    describe('when the value is false', () => {
      it('should pass', () => {
        expect(() => expect(false, 'to be false'), 'not to throw');
      });
    });

    describe('when the value is true', () => {
      it('should fail', () => {
        expect(() => expect(true, 'to be false'), 'to throw');
      });
    });

    describe('when the value is not a boolean', () => {
      it('should fail', () => {
        expect(() => expect(0, 'to be false'), 'to throw');
        expect(() => expect('false', 'to be false'), 'to throw');
        expect(() => expect(null, 'to be false'), 'to throw');
        expect(() => expect(undefined, 'to be false'), 'to throw');
      });
    });
  });
});
