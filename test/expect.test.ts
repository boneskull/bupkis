import { describe, it } from 'node:test';

import { expect } from '../src/index.js';

describe('expect() API', () => {
  it('should have property "fail" of type function', () => {
    expect(expect.fail, 'to be a function');
  });

  describe('expect.fail()', () => {
    it('should throw an AssertionError when called without arguments', () => {
      expect(() => expect.fail(), 'to throw');
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
      expect(error!.message, 'to include', 'expected string, received number');

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
      expect(error2!.message, 'to match', /expected number, received string/);
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
      expect(
        () => {
          // @ts-expect-error - intentionally using unknown assertion
          expect(42, 'to do something impossible');
        },
        'to throw a',
        TypeError,
        'satisfying',
        /Invalid arguments. No assertion matched.+42.+to do something impossible/,
      );
    });
  });

  describe('Type assertion edge cases', () => {
    it('should handle capitalized type names in switch statement', () => {
      // Test uncovered switch cases for capitalized types
      expect(() => expect({}, 'to be an', 'Object'), 'not to throw');
      expect(() => expect('test', 'to be an', 'Object'), 'to throw');

      expect(() => expect(() => {}, 'to be a', 'Function'), 'not to throw');
      expect(() => expect(42, 'to be a', 'Function'), 'to throw');

      expect(() => expect([], 'to be an', 'Array'), 'not to throw');
      expect(() => expect(42, 'to be an', 'Array'), 'to throw');

      expect(() => expect(10n, 'to be a', 'BigInt'), 'not to throw');
      expect(() => expect(42, 'to be a', 'BigInt'), 'to throw');

      expect(() => expect(Symbol('test'), 'to be a', 'Symbol'), 'not to throw');
      expect(() => expect('test', 'to be a', 'Symbol'), 'to throw');
    });

    it('should handle the default case in type assertion switch', () => {
      // This tests the default case: if (typeof subject !== type) return false
      expect(() => expect('hello', 'to be a', 'string'), 'not to throw');
      expect(() => expect(42, 'to be a', 'string'), 'to throw');

      expect(() => expect(42, 'to be a', 'number'), 'not to throw');
      expect(() => expect('42', 'to be a', 'number'), 'to throw');

      expect(() => expect(true, 'to be a', 'boolean'), 'not to throw');
      expect(() => expect('true', 'to be a', 'boolean'), 'to throw');

      expect(() => expect(undefined, 'to be a', 'undefined'), 'not to throw');
      expect(() => expect(null, 'to be a', 'undefined'), 'to throw');
    });
  });

  describe('Function throwing edge cases', () => {
    it('should handle edge case when thrown value is not an object for object parameter matching', () => {
      // Test the case where error is not an object but object parameter is provided
      // This should trigger the "else return false" branch in the object parameter handling
      expect(() => {
        expect(
          () => {
            // eslint-disable-next-line @typescript-eslint/only-throw-error
            throw 'plain string error';
          },
          'to throw',
          { message: 'expected' },
        );
      }, 'to throw');

      expect(() => {
        expect(
          () => {
            // eslint-disable-next-line @typescript-eslint/only-throw-error
            throw 42; // number error
          },
          'to throw',
          { code: 'ERR_TEST' },
        );
      }, 'to throw');

      expect(() => {
        expect(
          () => {
            // eslint-disable-next-line @typescript-eslint/only-throw-error
            throw null; // null error
          },
          'to throw',
          { message: 'expected' },
        );
      }, 'to throw');
    });

    it('should handle complex error object parameter matching', () => {
      // Test successful simple object matching first
      expect(() => {
        expect(
          () => {
            const error = new Error('test message');
            throw error;
          },
          'to throw',
          { message: 'test message' },
        );
      }, 'not to throw');

      // Test that it fails when object doesn't match
      expect(() => {
        expect(
          () => {
            throw new Error('different message');
          },
          'to throw',
          { message: 'expected message' },
        );
      }, 'to throw');
    });
  });
});
