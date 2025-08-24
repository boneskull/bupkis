/* eslint-disable @typescript-eslint/only-throw-error */
import { describe, it } from 'node:test';
import { inspect } from 'node:util';

import { expect } from '../../src/index.js';

describe('Synchronous expect assertions', () => {
  describe('Type assertions', () => {
    it('should accept a string value with "to be a string"', () => {
      expect(() => expect('hi', 'to be a string'), 'not to throw');
    });

    // happy path: to be a <type>
    for (const [value, kind] of [
      ['hi', 'string'],
      [42, 'number'],
      [true, 'boolean'],
      [undefined, 'undefined'],
      [null, 'null'],
      [10n, 'bigint'],
      [Symbol('s'), 'symbol'],
      [{}, 'object'],
      [() => {}, 'function'],
      [[], 'array'],
      [new Date(), 'date'],
    ] as const) {
      it(`should accept ${inspect(value)} as a/an ${inspect(kind)}`, () => {
        expect(() => expect(value, 'to be a', kind), 'not to throw');
        expect(() => expect(value, 'to be an', kind), 'not to throw');
      });
    }

    // unhappy path: wrong type
    for (const [value, typeName] of [
      [42, 'string'],
      ['hi', 'number'],
      [true, 'array'],
      [undefined, 'null'],
    ] as const) {
      it(`should reject when ${inspect(value)} is not a ${typeName}`, () => {
        expect(() => expect(value, 'to be a', typeName), 'to throw');
      });
    }
  });

  describe('Comparison assertions', () => {
    it('should pass when number is greater than another number', () => {
      expect(() => expect(5, 'to be greater than', 3), 'not to throw');
    });

    it('should fail when number is not greater than another number', () => {
      expect(() => expect(2, 'to be greater than', 3), 'to throw');
    });

    it('should pass when number is less than another number', () => {
      expect(() => expect(2, 'to be less than', 5), 'not to throw');
    });

    it('should fail when number is not less than another number', () => {
      expect(() => expect(5, 'to be less than', 2), 'to throw');
    });

    it('should pass when number is greater than or equal to another number', () => {
      expect(
        () => expect(5, 'to be greater than or equal to', 3),
        'not to throw',
      );
      expect(
        () => expect(5, 'to be greater than or equal to', 5),
        'not to throw',
      );
      expect(() => expect(5, 'to be at least', 3), 'not to throw');
      expect(() => expect(5, 'to be at least', 5), 'not to throw');
    });

    it('should fail when number is not greater than or equal to another number', () => {
      expect(() => expect(2, 'to be greater than or equal to', 5), 'to throw');
      expect(() => expect(3, 'to be at least', 5), 'to throw');
    });

    it('should pass when number is less than or equal to another number', () => {
      expect(() => expect(3, 'to be less than or equal to', 5), 'not to throw');
      expect(() => expect(5, 'to be less than or equal to', 5), 'not to throw');
      expect(() => expect(3, 'to be at most', 5), 'not to throw');
      expect(() => expect(5, 'to be at most', 5), 'not to throw');
    });

    it('should fail when number is not less than or equal to another number', () => {
      expect(() => expect(7, 'to be less than or equal to', 5), 'to throw');
      expect(() => expect(6, 'to be at most', 5), 'to throw');
    });
  });

  describe('Boolean value assertions', () => {
    it('should pass when value is true', () => {
      expect(() => expect(true, 'to be true'), 'not to throw');
    });

    it('should fail when value is not true', () => {
      expect(() => expect(false, 'to be true'), 'to throw');
    });

    it('should pass when value is false', () => {
      expect(() => expect(false, 'to be false'), 'not to throw');
    });

    it('should fail when value is not false', () => {
      expect(() => expect(true, 'to be false'), 'to throw');
    });

    it('should pass when value is null', () => {
      expect(() => expect(null, 'to be null'), 'not to throw');
    });

    it('should fail when value is not null', () => {
      expect(() => expect(undefined, 'to be null'), 'to throw');
    });

    it('should pass when value is undefined', () => {
      expect(() => expect(undefined, 'to be undefined'), 'not to throw');
    });

    it('should fail when value is not undefined', () => {
      expect(() => expect(null, 'to be undefined'), 'to throw');
    });
  });

  describe('Equality assertions', () => {
    it('should pass when values are equal', () => {
      expect(() => expect(42, 'to be', 42), 'not to throw');
      expect(() => expect(42, 'to equal', 42), 'not to throw');
      expect(() => expect('hi', 'equals', 'hi'), 'not to throw');
      expect(() => expect(42, 'is', 42), 'not to throw');
      expect(() => expect(null, 'is equal to', null), 'not to throw');
      expect(() => expect('test', 'to strictly equal', 'test'), 'not to throw');
    });

    it('should fail when values are not equal', () => {
      expect(() => expect(42, 'to be', 24), 'to throw');
      expect(() => expect(42, 'to equal', 24), 'to throw');
      expect(() => expect('hi', 'equals', 'bye'), 'to throw');
    });

    it('should pass when values are not equal (inequality)', () => {
      expect(() => expect(42, 'not to be', 24), 'not to throw');
      expect(() => expect(42, 'to not equal', 24), 'not to throw');
      expect(() => expect('hi', 'not to equal', 'bye'), 'not to throw');
      expect(() => expect(42, 'is not', 24), 'not to throw');
      expect(() => expect(42, "isn't", 24), 'not to throw');
      expect(() => expect(42, 'not to strictly equal', 24), 'not to throw');
      expect(() => expect(42, 'to not strictly equal', 24), 'not to throw');
    });

    it('should fail when values are equal (inequality)', () => {
      expect(() => expect(42, 'not to be', 42), 'to throw');
      expect(() => expect(42, 'to not equal', 42), 'to throw');
      expect(() => expect(42, "isn't", 42), 'to throw');
    });
  });

  describe('Empty/non-empty assertions', () => {
    it('should pass when object is empty', () => {
      expect(() => expect({}, 'to be empty'), 'not to throw');
    });

    it('should pass when array is empty', () => {
      expect(() => expect([], 'to be empty'), 'not to throw');
    });

    it('should fail when array is not empty', () => {
      expect(() => expect([1, 2, 3], 'to be empty'), 'to throw');
    });

    it('should fail when object is not empty', () => {
      expect(() => expect({ a: 1 }, 'to be empty'), 'to throw');
    });

    it('should pass when object is not empty', () => {
      expect(() => expect({ a: 1 }, 'to not be empty'), 'not to throw');
      expect(() => expect({ a: 1 }, 'not to be empty'), 'not to throw');
    });

    it('should fail when empty object is expected to not be empty', () => {
      expect(() => expect({}, 'to not be empty'), 'to throw');
      expect(() => expect({}, 'not to be empty'), 'to throw');
    });

    it('should pass when array is not empty', () => {
      expect(() => expect([1], 'to not be empty'), 'not to throw');
      expect(() => expect([1], 'not to be empty'), 'not to throw');
    });

    it('should fail when empty array is expected to not be empty', () => {
      expect(() => expect([], 'to not be empty'), 'to throw');
      expect(() => expect([], 'not to be empty'), 'to throw');
    });
  });

  describe('Function throwing assertions', () => {
    it('should pass when function does not throw', () => {
      expect(() => expect(() => 'safe', 'not to throw'), 'not to throw');
      expect(() => expect(() => 'safe', 'to not throw'), 'not to throw');
    });

    it('should fail when function throws but expected not to', () => {
      expect(
        () =>
          expect(() => {
            throw new Error('boom');
          }, 'not to throw'),
        'to throw',
      );
      expect(
        () =>
          expect(() => {
            throw new Error('boom');
          }, 'to not throw'),
        'to throw',
      );
    });

    it('should pass when function throws as expected', () => {
      expect(
        () =>
          expect(() => {
            throw new Error();
          }, 'to throw'),
        'not to throw',
      );
    });

    describe('Parameterized "to throw" assertions', () => {
      describe('String parameter matching', () => {
        it('should pass when error message matches string exactly', () => {
          expect(
            () =>
              expect(
                () => {
                  throw new Error('stuff');
                },
                'to throw',
                'stuff',
              ),
            'not to throw',
          );
        });

        it('should pass when error subject (string) matches parameter exactly', () => {
          expect(
            () =>
              expect(
                () => {
                  throw 'stuff';
                },
                'to throw',
                'stuff',
              ),
            'not to throw',
          );
        });

        it('should fail when error message does not match string', () => {
          expect(
            () =>
              expect(
                () => {
                  throw new Error('different');
                },
                'to throw',
                'stuff',
              ),
            'to throw',
          );
        });

        it('should fail when error subject (string) does not match parameter', () => {
          expect(
            () =>
              expect(
                () => {
                  throw 'different';
                },
                'to throw',
                'stuff',
              ),
            'to throw',
          );
        });

        it('should fail when function does not throw but string parameter provided', () => {
          expect(
            () => expect(() => 'safe', 'to throw', 'anything'),
            'to throw',
          );
        });
      });

      describe('RegExp parameter matching', () => {
        it('should pass when error message matches RegExp', () => {
          expect(
            () =>
              expect(
                () => {
                  throw new Error('stuff');
                },
                'to throw',
                /uff/,
              ),
            'not to throw',
          );
        });

        it('should pass when error subject (string) matches RegExp', () => {
          expect(
            () =>
              expect(
                () => {
                  throw 'stuff';
                },
                'to throw',
                /uff/,
              ),
            'not to throw',
          );
        });

        it('should fail when error message does not match RegExp', () => {
          expect(
            () =>
              expect(
                () => {
                  throw new Error('different');
                },
                'to throw',
                /uff/,
              ),
            'to throw',
          );
        });

        it('should fail when error subject (string) does not match RegExp', () => {
          expect(
            () =>
              expect(
                () => {
                  throw 'different';
                },
                'to throw',
                /uff/,
              ),
            'to throw',
          );
        });

        it('should fail when function does not throw but RegExp parameter provided', () => {
          expect(
            () => expect(() => 'safe', 'to throw', /anything/),
            'to throw',
          );
        });
      });

      describe('Object parameter matching (satisfy semantics)', () => {
        it('should pass when error properties match object with string values', () => {
          expect(
            () =>
              expect(
                () => {
                  throw new Error('stuff');
                },
                'to throw',
                { message: 'stuff' },
              ),
            'not to throw',
          );
        });

        it('should pass when error properties match object with RegExp values', () => {
          expect(
            () =>
              expect(
                () => {
                  throw new Error('stuff');
                },
                'to throw',
                { message: /uff/ },
              ),
            'not to throw',
          );
        });

        it('should pass when custom error properties match object', () => {
          expect(
            () =>
              expect(
                () => {
                  const error = new Error('test') as any;
                  error.code = 'TEST_ERROR';
                  error.status = 500;
                  throw error;
                },
                'to throw',
                {
                  code: 'TEST_ERROR',
                  message: 'test',
                  status: 500,
                },
              ),
            'not to throw',
          );
        });

        it('should pass when custom error properties match object with mixed RegExp/string values', () => {
          expect(
            () =>
              expect(
                () => {
                  const error = new Error('test message');
                  (error as any).code = 'TEST_ERROR';
                  throw error;
                },
                'to throw',
                {
                  code: 'TEST_ERROR',
                  message: /test/,
                },
              ),
            'not to throw',
          );
        });

        it('should fail when error message does not match object property', () => {
          expect(
            () =>
              expect(
                () => {
                  throw new Error('different');
                },
                'to throw',
                { message: 'stuff' },
              ),
            'to throw',
          );
        });

        it('should fail when error message does not match object RegExp property', () => {
          expect(
            () =>
              expect(
                () => {
                  throw new Error('different');
                },
                'to throw',
                { message: /uff/ },
              ),
            'to throw',
          );
        });

        it('should fail when custom error property does not match object', () => {
          expect(
            () =>
              expect(
                () => {
                  const error = new Error('test');
                  (error as any).code = 'WRONG_ERROR';
                  throw error;
                },
                'to throw',
                {
                  code: 'TEST_ERROR',
                  message: 'test',
                },
              ),
            'to throw',
          );
        });

        it('should fail when error is missing expected property', () => {
          expect(
            () =>
              expect(
                () => {
                  throw new Error('test');
                  // error does not have 'code' property
                },
                'to throw',
                {
                  code: 'TEST_ERROR',
                  message: 'test',
                },
              ),
            'to throw',
          );
        });

        it('should fail when function does not throw but object parameter provided', () => {
          expect(
            () => expect(() => 'safe', 'to throw', { message: 'anything' }),
            'to throw',
          );
        });

        it('should handle nested object matching', () => {
          expect(
            () =>
              expect(
                () => {
                  const error = new Error('test');
                  (error as any).details = { level: 'critical', source: 'api' };
                  throw error;
                },
                'to throw',
                {
                  details: { level: 'critical', source: 'api' },
                  message: 'test',
                },
              ),
            'not to throw',
          );
        });

        it('should fail nested object matching when values differ', () => {
          expect(
            () =>
              expect(
                () => {
                  const error = new Error('test');
                  (error as any).details = { level: 'warning', source: 'api' };
                  throw error;
                },
                'to throw',
                {
                  details: { level: 'critical', source: 'api' },
                  message: 'test',
                },
              ),
            'to throw',
          );
        });
      });

      describe('Edge cases', () => {
        it('should handle null thrown values', () => {
          expect(
            () =>
              expect(
                () => {
                  throw null;
                },
                'to throw',
                'null',
              ),
            'to throw', // null doesn't have a message property and won't coerce to 'null' string
          );
        });

        it('should handle undefined thrown values', () => {
          expect(
            () =>
              expect(
                () => {
                  throw undefined;
                },
                'to throw',
                'undefined',
              ),
            'to throw', // undefined doesn't have a message property and won't coerce to 'undefined' string
          );
        });

        it('should handle number thrown values', () => {
          expect(
            () =>
              expect(
                () => {
                  throw 404;
                },
                'to throw',
                '404',
              ),
            'not to throw', // numbers coerce to strings
          );
        });

        it('should handle boolean thrown values', () => {
          expect(
            () =>
              expect(
                () => {
                  throw true;
                },
                'to throw',
                'true',
              ),
            'not to throw', // booleans coerce to strings
          );
        });
      });
    });
  });

  describe('String pattern matching', () => {
    it('should pass when string matches regex', () => {
      expect(() => expect('hello', 'to match', /h.*o/), 'not to throw');
      expect(() => expect('test123', 'to match', /\d+$/), 'not to throw');
    });

    it('should fail when string does not match regex', () => {
      expect(() => expect('hello', 'to match', /xyz/), 'to throw');
      expect(() => expect('abc', 'to match', /\d+/), 'to throw');
    });

    it('should pass when string includes substring', () => {
      expect(() => expect('hello world', 'includes', 'world'), 'not to throw');
      expect(() => expect('hello world', 'contains', 'hello'), 'not to throw');
      expect(() => expect('test string', 'to include', 'test'), 'not to throw');
      expect(
        () => expect('test string', 'to contain', 'string'),
        'not to throw',
      );
    });

    it('should fail when string does not include substring', () => {
      expect(() => expect('hello', 'includes', 'xyz'), 'to throw');
      expect(() => expect('hello', 'contains', 'world'), 'to throw');
    });
  });

  describe('Object satisfaction', () => {
    it('should pass when object satisfies partial match', () => {
      expect(
        () => expect({ a: 1, b: 2 }, 'to satisfy', { a: 1 }),
        'not to throw',
      );
      expect(
        () => expect({ a: 1, b: 2 }, 'to be like', { a: 1 }),
        'not to throw',
      );
      expect(
        () => expect({ a: 1, b: 2 }, 'to match', { b: 2 }),
        'not to throw',
      );
      expect(
        () => expect({ a: 1, b: 2, c: 3 }, 'to satisfy', { a: 1, c: 3 }),
        'not to throw',
      );
    });

    it('should fail when object does not satisfy requirements', () => {
      expect(() => expect({ a: 1 }, 'to satisfy', { a: 1, b: 2 }), 'to throw'); // missing key
      expect(() => expect({ a: 1 }, 'to be like', { a: 2 }), 'to throw'); // wrong value
      expect(() => expect({ a: 1, b: 2 }, 'to match', { c: 3 }), 'to throw'); // missing key
    });
  });

  describe('Constructor and class assertions', () => {
    it('should pass when value is instance of constructor', () => {
      expect(
        () => expect(new String('test'), 'to be a String'),
        'not to throw',
      );
      expect(() => expect(new Number(42), 'to be a Number'), 'not to throw');
      expect(
        () => expect(new Boolean(true), 'to be a Boolean'),
        'not to throw',
      );
    });

    it('should fail when primitive is expected to be constructor instance', () => {
      expect(() => expect('test', 'to be a String'), 'to throw'); // primitive string
      expect(() => expect(42, 'to be a Number'), 'to throw'); // primitive number
      expect(() => expect(true, 'to be a Boolean'), 'to throw'); // primitive boolean
    });

    it('should pass when value is a class or constructor', () => {
      class TestClass {}
      function TestFunction() {}

      expect(() => expect(TestClass, 'to be a class'), 'not to throw');
      expect(() => expect(TestClass, 'to be a constructor'), 'not to throw');
      expect(() => expect(TestFunction, 'to be a class'), 'not to throw');
      expect(() => expect(TestFunction, 'to be a constructor'), 'not to throw');
    });

    it('should fail when value is not a class or constructor', () => {
      expect(() => expect({}, 'to be a class'), 'to throw');
      expect(() => expect('not a class', 'to be a constructor'), 'to throw');
    });

    it('should pass when value is a RegExp', () => {
      expect(() => expect(/test/, 'to be a RegExp'), 'not to throw');
      expect(() => expect(/test/, 'to be a regex'), 'not to throw');
      expect(() => expect(/test/, 'to be a regexp'), 'not to throw');
      expect(
        () => expect(new RegExp('test'), 'to be a RegExp'),
        'not to throw',
      );
    });

    it('should fail when value is not a RegExp', () => {
      expect(() => expect('not a regex', 'to be a RegExp'), 'to throw');
      expect(() => expect({}, 'to be a regex'), 'to throw');
    });
  });

  describe('Truthiness assertions', () => {
    it('should pass when value is truthy', () => {
      expect(() => expect(1, 'to be truthy'), 'not to throw');
      expect(() => expect('hello', 'to exist'), 'not to throw');
      expect(() => expect([], 'to be truthy'), 'not to throw');
      expect(() => expect({}, 'to exist'), 'not to throw');
    });

    it('should pass when value is falsy', () => {
      expect(() => expect(0, 'to be falsy'), 'not to throw');
      expect(() => expect('', 'not to exist'), 'not to throw');
      expect(() => expect(null, 'to be falsy'), 'not to throw');
      expect(() => expect(undefined, 'not to exist'), 'not to throw');
      expect(() => expect(false, 'to be falsy'), 'not to throw');
    });

    it('should fail when truthy value is expected to be falsy', () => {
      expect(() => expect(1, 'to be falsy'), 'to throw');
    });

    it('should fail when falsy value is expected to be truthy', () => {
      expect(() => expect(0, 'to be truthy'), 'to throw');
    });
  });

  describe('Number properties', () => {
    it('should pass when number is positive', () => {
      expect(() => expect(1, 'to be positive'), 'not to throw');
      expect(() => expect(100, 'to be positive'), 'not to throw');
    });

    it('should fail when number is not positive', () => {
      expect(() => expect(-1, 'to be positive'), 'to throw');
      expect(() => expect(0, 'to be positive'), 'to throw');
    });

    it('should pass when number is negative', () => {
      expect(() => expect(-1, 'to be negative'), 'not to throw');
      expect(() => expect(-100, 'to be negative'), 'not to throw');
    });

    it('should fail when number is not negative', () => {
      expect(() => expect(1, 'to be negative'), 'to throw');
      expect(() => expect(0, 'to be negative'), 'to throw');
    });

    it('should pass when value is zero', () => {
      expect(() => expect(0, 'to be zero'), 'not to throw');
      expect(() => expect(0, 'to be 0'), 'not to throw');
    });

    it('should pass when value is one', () => {
      expect(() => expect(1, 'to be 1'), 'not to throw');
      expect(() => expect(1, 'to be one'), 'not to throw');
    });

    it('should fail when non-zero value is expected to be zero', () => {
      expect(() => expect(1, 'to be zero'), 'to throw');
    });

    it('should fail when non-one value is expected to be one', () => {
      expect(() => expect(0, 'to be one'), 'to throw');
    });

    it('should pass when value is NaN', () => {
      expect(() => expect(NaN, 'to be NaN'), 'not to throw');
      expect(() => expect(Number.NaN, 'to be NaN'), 'not to throw');
    });

    it('should fail when value is not NaN', () => {
      expect(() => expect(42, 'to be NaN'), 'to throw');
      expect(() => expect('not a number', 'to be NaN'), 'to throw');
    });

    it('should pass when value is an integer', () => {
      expect(() => expect(42, 'to be an integer'), 'not to throw');
      expect(() => expect(-5, 'to be an integer'), 'not to throw');
      expect(() => expect(0, 'to be an integer'), 'not to throw');
    });

    it('should fail when value is not an integer', () => {
      expect(() => expect(3.14, 'to be an integer'), 'to throw');
      expect(() => expect('not a number', 'to be an integer'), 'to throw');
    });

    it('should pass when number is finite', () => {
      expect(() => expect(42, 'to be finite'), 'not to throw');
      expect(() => expect(-100, 'to be finite'), 'not to throw');
      expect(() => expect(0, 'to be finite'), 'not to throw');
    });

    it('should fail when number is not finite', () => {
      expect(() => expect(Infinity, 'to be finite'), 'to throw');
      expect(() => expect(-Infinity, 'to be finite'), 'to throw');
      expect(() => expect(NaN, 'to be finite'), 'to throw');
    });

    it('should pass when number is infinite', () => {
      expect(() => expect(Infinity, 'to be infinite'), 'not to throw');
      expect(() => expect(Infinity, 'to be Infinity'), 'not to throw');
    });

    it('should fail when number is not infinite', () => {
      expect(() => expect(42, 'to be infinite'), 'to throw');
      expect(() => expect(-Infinity, 'to be Infinity'), 'to throw');
    });

    it('should pass when number is safe', () => {
      expect(() => expect(42, 'to be a safe number'), 'not to throw');
      expect(() => expect(100, 'to be safe'), 'not to throw');
      expect(
        () => expect(Number.MAX_SAFE_INTEGER, 'to be safe'),
        'not to throw',
      );
    });

    it('should fail when number is not safe', () => {
      expect(
        () => expect(Number.MAX_SAFE_INTEGER + 1, 'to be safe'),
        'to throw',
      );
      expect(() => expect(1.5, 'to be a safe number'), 'to throw'); // not integer
    });
  });

  describe('Object properties', () => {
    it('should pass when value is an object', () => {
      expect(() => expect({}, 'to be an object'), 'not to throw');
      expect(() => expect([], 'to be an object'), 'not to throw');
      expect(() => expect(new Date(), 'to be an object'), 'not to throw');
    });

    it('should fail when value is not an object', () => {
      expect(() => expect('string', 'to be an object'), 'to throw');
      expect(() => expect(42, 'to be an object'), 'to throw');
    });

    it('should pass when object has null prototype', () => {
      const nullProtoObj = Object.create(null) as object;
      expect(
        () => expect(nullProtoObj, 'to have a null prototype'),
        'not to throw',
      );
    });

    it('should fail when object does not have null prototype', () => {
      const regularObj = {};
      expect(() => expect(regularObj, 'to have a null prototype'), 'to throw');
    });

    it('should pass when object is sealed', () => {
      const sealedObj = Object.seal({});
      expect(() => expect(sealedObj, 'to be sealed'), 'not to throw');
    });

    it('should fail when object is not sealed', () => {
      const regularObj = {};
      expect(() => expect(regularObj, 'to be sealed'), 'to throw');
    });

    it('should pass when object is frozen', () => {
      const frozenObj = Object.freeze({});
      expect(() => expect(frozenObj, 'to be frozen'), 'not to throw');
    });

    it('should fail when object is not frozen', () => {
      const regularObj = {};
      expect(() => expect(regularObj, 'to be frozen'), 'to throw');
    });

    it('should pass when property is enumerable', () => {
      const obj = { a: 1, b: 2 };
      Object.defineProperty(obj, 'c', {
        enumerable: false,
        value: 3,
      });

      expect(
        () => expect('a', 'to be an enumerable property of', obj),
        'not to throw',
      );
      expect(
        () => expect('b', 'to be an enumerable property of', obj),
        'not to throw',
      );
    });

    it('should fail when property is not enumerable', () => {
      const obj = { a: 1, b: 2 };
      Object.defineProperty(obj, 'c', {
        enumerable: false,
        value: 3,
      });

      expect(
        () => expect('c', 'to be an enumerable property of', obj),
        'to throw',
      );
      expect(
        () => expect('nonexistent', 'to be an enumerable property of', obj),
        'to throw',
      );
    });
  });

  describe('Error handling', () => {
    it('should provide schema-based error messages', () => {
      // Test that schema-based assertions provide readable error messages
      let error: Error | undefined;
      expect(() => {
        try {
          expect(42, 'to be a string');
        } catch (err) {
          error = err as Error;
          throw err;
        }
      }, 'to throw');
      expect(error, 'to be a', 'object');
      expect(error!.message.includes('Assertion failed'), 'to be true');

      // Test another schema-based assertion
      let error2: Error | undefined;
      expect(() => {
        try {
          expect('not a number', 'to be a number');
        } catch (err) {
          error2 = err as Error;
          throw err;
        }
      }, 'to throw');
      expect(error2, 'to be a', 'object');
      expect(error2!.message.includes('Assertion failed'), 'to be true');
    });

    it('should work with parameterized schema factory', () => {
      // Test that schema factories work with runtime parameters
      // These use z.number().gt() and z.number().lt() under the hood
      expect(() => expect(5, 'to be greater than', 3), 'not to throw');
      expect(() => expect(2, 'to be greater than', 5), 'to throw');

      expect(() => expect(3, 'to be less than', 5), 'not to throw');
      expect(() => expect(7, 'to be less than', 5), 'to throw');
    });

    it('should throw TypeError for unknown assertions', () => {
      let error: TypeError | undefined;
      expect(() => {
        try {
          // @ts-expect-error - intentionally using unknown assertion
          expect(42, 'to do something impossible');
        } catch (err) {
          error = err as TypeError;
          throw err;
        }
      }, 'to throw');

      expect(error, 'to be a', 'object');
      expect(error!.name, 'to equal', 'TypeError');
      expect(
        error!.message.includes('No assertion matched the provided arguments'),
        'to be true',
      );
      expect(error!.message.includes('number 42'), 'to be true');
      expect(
        error!.message.includes('string to do something impossible'),
        'to be true',
      );
    });
  });
});
