import { describe, it } from 'node:test';
import { stripVTControlCharacters } from 'node:util';

import { UnknownAssertionError } from '../../src/error.js';
import {
  createAsyncAssertion,
  type Expect,
  expect,
  expectAsync,
  use,
  z,
} from '../../src/index.js';
import { type AnySyncAssertions } from '../../src/types.js';

describe('core API', () => {
  describe('expect()', () => {
    it('should have property "fail" of type function', () => {
      expect(expect.fail, 'to be a function');
    });

    describe('expect.fail()', () => {
      it('should throw an AssertionError when called without arguments', () => {
        expect(() => expect.fail(), 'to throw');
      });
    });

    describe('expect.use()', () => {
      it('should create a new API with custom assertions', () => {
        class Foo {
          bar = 'bar';
        }
        const myAssertion = expect.createAssertion(
          ['to be a Foo'],
          z.instanceof(Foo),
        );

        const assertions = [myAssertion] as const satisfies AnySyncAssertions;

        const {
          expect: myExpected,
          expectAsync: _,
          use: myUse,
        } = expect.use(assertions);

        const foo = new Foo();

        expect(() => myExpected(foo, 'to be a Foo'), 'not to throw');

        expect(() => myExpected(foo.bar, 'to be a string'), 'not to throw');

        expect(myUse, 'to be a function');
      });

      it('should validate type safety and proper error messages', () => {
        class Foo {
          bar = 'bar';
        }
        const myAssertion = expect.createAssertion(
          ['to be a Foo'],
          z.instanceof(Foo),
        );
        const { expect: myExpected } = expect.use([myAssertion]);

        // Test failure case
        let error: Error | undefined;
        try {
          myExpected('not a foo', 'to be a Foo');
        } catch (err) {
          error = err as Error;
        }

        expect(error, 'to be a', 'object');
        expect(error, 'to be an Error');
        expect(error?.message, 'to be a', 'string');
        expect(error!.message, 'to include', 'Input not instance of Foo');
      });

      it('should contain the entire API', () => {
        // Check original expect has all required properties

        const fnProps = [
          'fail',
          'createAssertion',
          'createAsyncAssertion',
          'use',
        ] as const satisfies (keyof Expect)[];

        fnProps.forEach((prop) => {
          expect(expect[prop], 'to be a function');
        });

        fnProps.forEach((prop) => {
          expect(expectAsync[prop], 'to be a function');
        });

        // Check extended expect retains all properties
        const customAssertion = expect.createAssertion(
          ['to be custom'],
          z.string(),
        );
        const { expect: expect2, expectAsync: expectAsync2 } = expect.use([
          customAssertion,
        ]);

        fnProps.forEach((prop) => {
          expect(expect2[prop], 'to be a function');
        });
        fnProps.forEach((prop) => {
          expect(expectAsync2[prop], 'to be a function');
        });
      });
    });

    describe('Error handling', () => {
      it('should provide nice error messages', () => {
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
        expect(error, 'to be an Error');
        expect(
          stripVTControlCharacters(error!.message),
          'to match',
          /expected string but received number/i,
        );

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
        expect(
          stripVTControlCharacters(error2!.message),
          'to match',
          /expected number but received string/i,
        );
      });

      it('should work with parameterized schema factory', () => {
        // Test that schema factories work with runtime parameters
        // These use z.number().gt() and z.number().lt() under the hood
        expect(() => expect(5, 'to be greater than', 3), 'not to throw');
        expect(() => expect(2, 'to be greater than', 5), 'to throw');

        expect(() => expect(3, 'to be less than', 5), 'not to throw');
        expect(() => expect(7, 'to be less than', 5), 'to throw');
      });

      it('should throw UnknownAssertionError for unknown assertions', () => {
        expect(
          () => {
            expect(42, 'to do something impossible');
          },
          'to throw a',
          UnknownAssertionError,
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

        expect(
          () => expect(Symbol('test'), 'to be a', 'Symbol'),
          'not to throw',
        );
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

    describe('Chaining expectations', () => {
      describe('when combined with negation', () => {
        it('should allow chaining with "and"', () => {
          expect(
            () =>
              expect(42, 'to be a', 'number', 'and', 'not to be less than', 10),
            'not to throw',
          );
        });
      });

      describe('when not combined with negation', () => {
        it('should allow chaining with "and"', () => {
          expect(
            () =>
              expect(42, 'to be a', 'number', 'and', 'to be less than', 100),
            'not to throw',
          );
        });
      });
    });

    describe('Schema-based async assertions', () => {
      describe('non-unknown subject type', () => {
        it('should reject when provided invalid parameters', async () => {
          const customAsyncAssertion = createAsyncAssertion(
            [z.string(), 'to be valid with param', z.number()],
            z.string().min(1),
          );

          const { expectAsync } = use([customAsyncAssertion]);
          await expectAsync(
            () =>
              expectAsync('hello', 'to be valid with param', 'not-a-number'),
            'to reject with an',
            UnknownAssertionError,
          );
        });
      });

      describe('unknown subject type', () => {
        it('should reject when provided invalid parameters', async () => {
          const customAsyncAssertion2 = createAsyncAssertion(
            ['to validate against', z.boolean()],
            z.string(),
            {
              anchor: 'foo',
              category: 'other',
            },
          );

          const { expectAsync } = use([customAsyncAssertion2]);

          await expectAsync(
            () =>
              expectAsync('test', 'to validate against', { not: 'boolean' }),
            'to reject with an',
            UnknownAssertionError,
          );
        });
      });
    });
  });
});
