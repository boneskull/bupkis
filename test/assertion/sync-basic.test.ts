import { describe, it } from 'node:test';

import { expect } from '../../src/expect.js';

describe('Synchronous basic assertions', () => {
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

  describe('to be a RegExp', () => {
    describe('when the value is a RegExp', () => {
      it('should pass', () => {
        expect(() => expect(/hi/, 'to be a RegExp'), 'not to throw');
        expect(
          () => expect(new RegExp('hi'), 'to be a RegExp'),
          'not to throw',
        );
      });
    });

    describe('when the value is not a RegExp', () => {
      it('should fail', () => {
        expect(() => expect('hi', 'to be a RegExp'), 'to throw');
        expect(() => expect(42, 'to be a RegExp'), 'to throw');
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

  describe('to be negative / to be a negative number', () => {
    describe('when the value is a negative number', () => {
      it('should pass', () => {
        expect(() => expect(-42, 'to be a negative number'), 'not to throw');
        expect(() => expect(-3.14, 'to be a negative number'), 'not to throw');
        expect(() => expect(-42, 'to be negative'), 'not to throw');
        expect(() => expect(-3.14, 'to be negative'), 'not to throw');
        expect(() => expect(-Number.EPSILON, 'to be negative'), 'not to throw');
        expect(
          () => expect(-Number.MAX_SAFE_INTEGER, 'to be negative'),
          'not to throw',
        );
      });
    });

    describe('when the value is a non-negative number', () => {
      it('should fail', () => {
        expect(() => expect(1, 'to be a negative number'), 'to throw');
        expect(() => expect(0, 'to be a negative number'), 'to throw');
        expect(() => expect(-0, 'to be a negative number'), 'to throw');
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

  describe('to be empty', () => {
    it('should pass when array is empty', () => {
      expect(() => expect([], 'to be empty'), 'not to throw');
    });

    it('should fail when array is not empty', () => {
      expect(() => expect([1, 2, 3], 'to be empty'), 'to throw');
    });

    it('should pass when object has no own properties', () => {
      expect(() => expect({}, 'to be empty'), 'not to throw');
      expect(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        () => expect(Object.create(null), 'to be empty'),
        'not to throw',
      );
    });
  });

  describe('to be a class / to be a constructor', () => {
    describe('when the value is a class or constructor function', () => {
      it('should pass', () => {
        expect(
          () =>
            expect(
              class MyClass {
                constructor() {}
              },
              'to be a class',
            ),
          'not to throw',
        );
        expect(
          () => expect(function MyFunction() {}, 'to be a constructor'),
          'not to throw',
        );
      });
    });

    describe('when the value is not a class or constructor function', () => {
      it('should fail', () => {
        expect(() => expect({}, 'to be a class'), 'to throw');
        expect(() => expect(42, 'to be a class'), 'to throw');
        expect(() => expect(null, 'to be a class'), 'to throw');
        expect(() => expect(undefined, 'to be a class'), 'to throw');
        expect(() => expect({}, 'to be a constructor'), 'to throw');
        expect(() => expect(42, 'to be a constructor'), 'to throw');
        expect(() => expect(null, 'to be a constructor'), 'to throw');
        expect(() => expect(undefined, 'to be a constructor'), 'to throw');
      });
    });
  });

  describe('to be truthy / to exist', () => {
    describe('when the value is truthy', () => {
      it('should pass', () => {
        expect(() => expect(true, 'to be truthy'), 'not to throw');
        expect(() => expect(1, 'to be truthy'), 'not to throw');
        expect(
          () => expect('non-empty string', 'to be truthy'),
          'not to throw',
        );
        expect(() => expect({}, 'to be truthy'), 'not to throw');
        expect(() => expect([], 'to be truthy'), 'not to throw');
        expect(() => expect(-42, 'to exist'), 'not to throw');
      });
    });

    describe('when the value is not truthy', () => {
      it('should fail', () => {
        expect(() => expect(false, 'to be truthy'), 'to throw');
        expect(() => expect(0, 'to be truthy'), 'to throw');
        expect(() => expect('', 'to be truthy'), 'to throw');
        expect(() => expect(null, 'to be truthy'), 'to throw');
        expect(() => expect(undefined, 'to be truthy'), 'to throw');
        expect(() => expect(false, 'to exist'), 'to throw');
      });
    });
  });

  describe('to be falsy', () => {
    describe('when the value is falsy', () => {
      it('should pass', () => {
        expect(() => expect(false, 'to be falsy'), 'not to throw');
        expect(() => expect(0, 'to be falsy'), 'not to throw');
        expect(() => expect('', 'to be falsy'), 'not to throw');
        expect(() => expect(null, 'to be falsy'), 'not to throw');
        expect(() => expect(undefined, 'to be falsy'), 'not to throw');
      });
    });

    describe('when the value is not falsy', () => {
      it('should fail', () => {
        expect(() => expect(true, 'to be falsy'), 'to throw');
        expect(() => expect(1, 'to be falsy'), 'to throw');
        expect(() => expect('non-empty string', 'to be falsy'), 'to throw');
        expect(() => expect({}, 'to be falsy'), 'to throw');
        expect(() => expect([], 'to be falsy'), 'to throw');
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
        expect(() => expect(Number.EPSILON, 'to be positive'), 'not to throw');
        expect(
          () => expect(Number.MAX_SAFE_INTEGER, 'to be positive'),
          'not to throw',
        );
      });
    });

    describe('when the value is a non-positive number', () => {
      it('should fail', () => {
        expect(() => expect(-1, 'to be a positive number'), 'to throw');
        expect(() => expect(0, 'to be a positive number'), 'to throw');
        expect(() => expect(-0, 'to be a positive number'), 'to throw');
        expect(() => expect(NaN, 'to be a positive number'), 'to throw');
        expect(() => expect(Infinity, 'to be a positive number'), 'to throw');
        expect(() => expect(-Infinity, 'to be a positive number'), 'to throw');
        expect(() => expect(-1, 'to be positive'), 'to throw');
        expect(() => expect(0, 'to be positive'), 'to throw');
        expect(() => expect(NaN, 'to be positive'), 'to throw');
        expect(() => expect(Infinity, 'to be positive'), 'to throw');
        expect(() => expect(-Infinity, 'to be positive'), 'to throw');
      });
    });
  });

  describe('to be NaN', () => {
    describe('when the value is NaN', () => {
      it('should pass', () => {
        expect(() => expect(NaN, 'to be NaN'), 'not to throw');
      });
    });

    describe('when the value is not NaN', () => {
      it('should fail', () => {
        expect(() => expect(42, 'to be NaN'), 'to throw');
        expect(() => expect(Infinity, 'to be NaN'), 'to throw');
        expect(() => expect(-Infinity, 'to be NaN'), 'to throw');
        expect(() => expect('NaN', 'to be NaN'), 'to throw');
        expect(() => expect(null, 'to be NaN'), 'to throw');
        expect(() => expect(undefined, 'to be NaN'), 'to throw');
        expect(() => expect({}, 'to be NaN'), 'to throw');
      });
    });
  });

  describe('to be an integer / to be a safe integer / to be an int / to be a safe int / to be finite', () => {
    describe('when the value is a safe integer', () => {
      it('should pass', () => {
        expect(() => expect(42, 'to be an integer'), 'not to throw');
        expect(() => expect(-42, 'to be an int'), 'not to throw');
        expect(() => expect(0, 'to be a safe integer'), 'not to throw');
        expect(() => expect(100, 'to be a safe int'), 'not to throw');
        expect(
          () => expect(Number.MAX_SAFE_INTEGER, 'to be a safe integer'),
          'not to throw',
        );
        expect(
          () => expect(Number.MIN_SAFE_INTEGER, 'to be a safe int'),
          'not to throw',
        );
        expect(() => expect(-3, 'to be finite'), 'not to throw');
      });
    });

    describe('when the value is not a safe integer', () => {
      it('should fail', () => {
        expect(() => expect(3.14, 'to be an integer'), 'to throw');
        expect(() => expect(-3.14, 'to be an int'), 'to throw');
        expect(() => expect(NaN, 'to be a safe integer'), 'to throw');
        expect(() => expect(Infinity, 'to be a safe int'), 'to throw');
        expect(() => expect(-Infinity, 'to be a safe integer'), 'to throw');
        expect(
          () => expect(Number.MAX_SAFE_INTEGER + 1, 'to be a safe int'),
          'to throw',
        );
        expect(
          () => expect(Number.MIN_SAFE_INTEGER - 1, 'to be a safe integer'),
          'to throw',
        );
        expect(() => expect(Infinity, 'to be finite'), 'to throw');
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
      });
    });
  });

  describe('to be Infinity', () => {
    describe('when the value is Infinity', () => {
      it('should pass', () => {
        expect(() => expect(Infinity, 'to be Infinity'), 'not to throw');
      });
    });

    describe('when the value is not Infinity', () => {
      it('should fail', () => {
        expect(() => expect(-Infinity, 'to be Infinity'), 'to throw');
        expect(() => expect(42, 'to be Infinity'), 'to throw');
        expect(() => expect(NaN, 'to be Infinity'), 'to throw');
        expect(() => expect('Infinity', 'to be Infinity'), 'to throw');
        expect(() => expect(null, 'to be Infinity'), 'to throw');
        expect(() => expect(undefined, 'to be Infinity'), 'to throw');
      });
    });
  });

  describe('to be -Infinity', () => {
    describe('when the value is -Infinity', () => {
      it('should pass', () => {
        expect(() => expect(-Infinity, 'to be -Infinity'), 'not to throw');
      });
    });

    describe('when the value is not -Infinity', () => {
      it('should fail', () => {
        expect(() => expect(Infinity, 'to be -Infinity'), 'to throw');
        expect(() => expect(42, 'to be -Infinity'), 'to throw');
        expect(() => expect(NaN, 'to be -Infinity'), 'to throw');
        expect(() => expect('-Infinity', 'to be -Infinity'), 'to throw');
        expect(() => expect(null, 'to be -Infinity'), 'to throw');
        expect(() => expect(undefined, 'to be -Infinity'), 'to throw');
      });
    });
  });

  describe('to be a Set', () => {
    describe('when value is a Set', () => {
      it('should pass', () => {
        expect(() => expect(new Set(), 'to be a Set'), 'not to throw');
        expect(() => expect(new Set([1, 2, 3]), 'to be a Set'), 'not to throw');
      });
    });

    describe('when value is not a Set', () => {
      it('should fail', () => {
        expect(() => expect(new Map(), 'to be a Set'), 'to throw');
        expect(() => expect(new WeakSet(), 'to be a Set'), 'to throw');
        expect(() => expect([], 'to be a Set'), 'to throw');
        expect(() => expect({}, 'to be a Set'), 'to throw');
        expect(() => expect('set', 'to be a Set'), 'to throw');
      });
    });
  });

  describe('to be a WeakMap', () => {
    describe('when value is a WeakMap', () => {
      it('should pass', () => {
        expect(() => expect(new WeakMap(), 'to be a WeakMap'), 'not to throw');
      });
    });

    describe('when value is not a WeakMap', () => {
      it('should fail', () => {
        expect(() => expect(new Map(), 'to be a WeakMap'), 'to throw');
        expect(() => expect(new WeakSet(), 'to be a WeakMap'), 'to throw');
        expect(() => expect({}, 'to be a WeakMap'), 'to throw');
        expect(() => expect('weakmap', 'to be a WeakMap'), 'to throw');
      });
    });
  });

  describe('to be a WeakSet', () => {
    describe('when value is a WeakSet', () => {
      it('should pass', () => {
        expect(() => expect(new WeakSet(), 'to be a WeakSet'), 'not to throw');
      });
    });

    describe('when value is not a WeakSet', () => {
      it('should fail', () => {
        expect(() => expect(new Set(), 'to be a WeakSet'), 'to throw');
        expect(() => expect(new WeakMap(), 'to be a WeakSet'), 'to throw');
        expect(() => expect([], 'to be a WeakSet'), 'to throw');
        expect(() => expect({}, 'to be a WeakSet'), 'to throw');
        expect(() => expect('weakset', 'to be a WeakSet'), 'to throw');
      });
    });
  });
});
