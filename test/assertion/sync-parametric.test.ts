/* eslint-disable @typescript-eslint/only-throw-error */
import { describe, it } from 'node:test';
import { inspect } from 'node:util';

import { expect } from '../../src/index.js';

describe('Parametric assertions', () => {
  describe('to be a <type>', () => {
    // happy path: to be a <type>
    for (const [value, typeName] of [
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
      describe(`when the value is ${inspect(value)} and the type is ${typeName}`, () => {
        it('should pass', () => {
          expect(() => expect(value, 'to be a', typeName), 'not to throw');
          expect(() => expect(value, 'to be an', typeName), 'not to throw');
        });
      });
    }

    for (const [value, typeName] of [
      [42, 'string'],
      ['hi', 'number'],
      [true, 'array'],
      [undefined, 'null'],
    ] as const) {
      describe(`when the value is ${inspect(value)} and the type is ${typeName}`, () => {
        it('should fail', () => {
          expect(() => expect(value, 'to be a', typeName), 'to throw');
        });
      });
    }
  });

  describe('to be greater than <number>', () => {
    describe('when the subject is greater than expected', () => {
      it('should pass', () => {
        expect(() => expect(5, 'to be greater than', 3), 'not to throw');
      });
    });
    describe('when the subject is not greater than the expected', () => {
      it('should fail', () => {
        expect(() => expect(2, 'to be greater than', 3), 'to throw');
      });
    });
  });

  describe('to be less than <number>', () => {
    describe('when the subject is less than the expected', () => {
      it('should pass', () => {
        expect(() => expect(2, 'to be less than', 3), 'not to throw');
      });
    });

    describe('when the subject is not less than the expected', () => {
      it('should fail', () => {
        expect(() => expect(5, 'to be less than', 3), 'to throw');
      });
    });
  });

  describe('to be greater than or equal to / to be at least <number>', () => {
    describe('when the subject is greater than the expected', () => {
      it('should pass', () => {
        expect(() => expect(5, 'to be at least', 3), 'not to throw');
        expect(
          () => expect(5, 'to be greater than or equal to', 3),
          'not to throw',
        );
      });
    });

    describe('when the subject is equal to the expected', () => {
      it('should pass', () => {
        expect(() => expect(3, 'to be at least', 3), 'not to throw');
        expect(
          () => expect(3, 'to be greater than or equal to', 3),
          'not to throw',
        );
      });
    });

    describe('when the subject is less than the expected', () => {
      it('should fail', () => {
        expect(() => expect(2, 'to be at least', 3), 'to throw');
        expect(
          () => expect(2, 'to be greater than or equal to', 3),
          'to throw',
        );
      });
    });
  });

  describe('to be less than or equal to / to be at most <number>', () => {
    describe('when the subject is less than the expected', () => {
      it('should pass', () => {
        expect(() => expect(2, 'to be at most', 3), 'not to throw');
        expect(
          () => expect(2, 'to be less than or equal to', 3),
          'not to throw',
        );
      });
    });

    describe('when the subject is equal to the expected', () => {
      it('should pass', () => {
        expect(() => expect(3, 'to be at most', 3), 'not to throw');
        expect(
          () => expect(3, 'to be less than or equal to', 3),
          'not to throw',
        );
      });
    });

    describe('when the subject is greater than the expected', () => {
      it('should fail', () => {
        expect(() => expect(5, 'to be at most', 3), 'to throw');
        expect(() => expect(5, 'to be less than or equal to', 3), 'to throw');
      });
    });
  });

  describe('to be / to equal / equals / is / is equal to / to strictly equal <any>', () => {
    describe('when the subject is strictly equal to the expected', () => {
      it('should pass', () => {
        expect(() => expect(3, 'to be', 3), 'not to throw');
        expect(() => expect(3, 'to equal', 3), 'not to throw');
        expect(() => expect(3, 'equals', 3), 'not to throw');
        expect(() => expect(3, 'is', 3), 'not to throw');
        expect(() => expect(3, 'is equal to', 3), 'not to throw');
        expect(() => expect(3, 'to strictly equal', 3), 'not to throw');
      });
    });

    describe('when the subject is not strictly equal to the expected', () => {
      it('should fail', () => {
        expect(() => expect(3, 'to be', 4), 'to throw');
        expect(() => expect(3, 'to equal', 4), 'to throw');
        expect(() => expect(3, 'equals', 4), 'to throw');
        expect(() => expect(3, 'is', 4), 'to throw');
        expect(() => expect(3, 'is equal to', 4), 'to throw');
        expect(() => expect(3, 'to strictly equal', 4), 'to throw');
      });
    });
  });

  describe('to throw <string>', () => {
    describe('when the function throws an Error', () => {
      it('should match the error message and pass', () => {
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
    });
    describe('when the function throws a string 🤦‍♂️', () => {
      it('should match the string and pass', () => {
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
    });

    describe('when the function throws an Error containing message that does not match the expected', () => {
      it('should fail', () => {
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
    });

    describe('when the function throws a string that does not match the expected', () => {
      it('should fail', () => {
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
    });

    describe('when the function does not throw', () => {
      it('should fail', () => {
        expect(() => expect(() => 'safe', 'to throw', 'anything'), 'to throw');
      });
    });
  });

  describe('to throw <RegExp>', () => {
    describe('when the function throws an Error', () => {
      it('should match the error message and pass', () => {
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
    });

    describe('when the function throws a string 🤦‍♂️', () => {
      it('should match the string and pass', () => {
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
    });

    describe('when the function throws an Error containing message that does not match the expected', () => {
      it('should fail', () => {
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
    });

    describe('when the function throws a string that does not match the expected', () => {
      it('should fail', () => {
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
    });

    describe('when the function does not throw', () => {
      it('should fail', () => {
        expect(() => expect(() => 'safe', 'to throw', /anything/), 'to throw');
      });
    });
  });

  describe('to throw <shape>', () => {
    describe('when the function throws an Error matching the expected shape', () => {
      it('should pass', () => {
        expect(
          () =>
            expect(
              () => {
                throw Object.assign(new Error('stuff'), { code: 'TEST_ERROR' });
              },
              'to throw',
              { code: 'TEST_ERROR', message: 'stuff' },
            ),
          'not to throw',
        );
      });
    });

    describe('when the function throws an Error not matching the expected shape', () => {
      it('should fail', () => {
        expect(
          () =>
            expect(
              () => {
                throw Object.assign(new Error('stuff'), {
                  code: 'DIFFERENT_ERROR',
                });
              },
              'to throw',
              { code: 'TEST_ERROR', message: 'stuff' },
            ),
          'to throw',
        );
      });
    });

    describe('when the function does not throw', () => {
      it('should fail', () => {
        expect(
          () =>
            expect(
              () => 'safe',
              'to throw',
              // should be an object, but not an Error instance
              { code: 'TEST_ERROR', message: 'stuff' },
            ),
          'to throw',
        );
      });
    });

    describe('when the expected shape contains a first-level RegExp', () => {
      it('should pass when the thrown error matches the RegExp', () => {
        expect(
          () =>
            expect(
              () => {
                throw Object.assign(new Error('stuff'), {
                  code: 'TEST_ERROR',
                });
              },
              'to throw',
              { code: /TEST_/, message: /stuff/ },
            ),
          'not to throw',
        );
      });

      it('should fail when the thrown error does not match the RegExp', () => {
        expect(
          () =>
            expect(
              () => {
                throw Object.assign(new Error('stuff'), {
                  code: 'DIFFERENT_ERROR',
                });
              },
              'to throw',
              { code: /TEST_/, message: /stuff/ },
            ),
          'to throw',
        );
      });
    });

    describe('when the expected shape is a nested object', () => {
      describe('and the thrown error matches the shape', () => {
        it('should pass', () => {
          expect(
            () =>
              expect(
                () => {
                  throw Object.assign(new Error('stuff'), {
                    info: { code: 'TEST_ERROR' },
                  });
                },
                'to throw',
                { info: { code: 'TEST_ERROR' } },
              ),
            'not to throw',
          );
        });
      });

      describe('and the thrown error does not match the shape', () => {
        it('should fail', () => {
          expect(
            () =>
              expect(
                () => {
                  throw Object.assign(new Error('stuff'), {
                    info: { code: 'DIFFERENT_ERROR' },
                  });
                },
                'to throw',
                { info: { code: 'TEST_ERROR' } },
              ),
            'to throw',
          );
        });
      });

      describe('and the thrown error is missing the nested property', () => {
        it('should fail', () => {
          expect(
            () =>
              expect(
                () => {
                  throw Object.assign(new Error('stuff'), {});
                },
                'to throw',
                { info: { code: 'TEST_ERROR' } },
              ),
            'to throw',
          );
        });
      });
    });
  });

  describe('to match <RegExp>', () => {
    describe('when the subject matches the expected RegExp', () => {
      it('should pass', () => {
        expect(() => expect('foobar', 'to match', /foo/), 'not to throw');
      });
    });

    describe('when the subject does not match the expected RegExp', () => {
      it('should fail', () => {
        expect(() => expect('barbaz', 'to match', /foo/), 'to throw');
      });
    });
  });

  describe('to include <string>', () => {
    describe('when the subject includes the expected string', () => {
      it('should pass', () => {
        expect(() => expect('foobar', 'to include', 'oba'), 'not to throw');
      });
    });

    describe('when the subject does not include the expected string', () => {
      it('should fail', () => {
        expect(() => expect('barbaz', 'to include', 'foo'), 'to throw');
      });
    });
  });

  describe('to satisfy / to be like <shape>', () => {
    describe('when the subject matches the expected shape', () => {
      it('should pass', () => {
        expect(
          () => expect({ a: 1, b: 2, c: 3 }, 'to satisfy', { a: 1, c: 3 }),
          'not to throw',
        );
        expect(
          () => expect({ a: 1, b: 2, c: 3 }, 'to be like', { a: 1, c: 3 }),
          'not to throw',
        );
      });
    });

    describe('when the subject does not match the expected shape', () => {
      it('should fail', () => {
        expect(
          () => expect({ a: 1, b: 2, c: 3 }, 'to satisfy', { a: 1, c: 4 }),
          'to throw',
        );
        expect(
          () => expect({ a: 1, b: 2, c: 3 }, 'to be like', { a: 1, c: 4 }),
          'to throw',
        );
      });
    });
  });

  describe('to be a / to be an <instance>', () => {
    describe('when the subject is an instance of the expected class', () => {
      it('should pass', () => {
        expect(() => expect(new Date(), 'to be an', 'Date'), 'not to throw');
        expect(() => expect(new Map(), 'to be a', 'Map'), 'not to throw');
      });
    });

    describe('when the subject is not an instance of the expected class', () => {
      it('should fail', () => {
        expect(() => expect({}, 'to be a', 'Date'), 'to throw');
        expect(() => expect([], 'to be an', 'Map'), 'to throw');
      });
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
