/**
 * Type tests for main exports (bupkis)
 *
 * @packageDocumentation
 */
import {
  type AssertionError,
  type AssertionFailure,
  type AssertionImplementationError,
  type Bupkis,
  type BupkisError,
  createAssertion,
  type CreateAssertionFn,
  createAsyncAssertion,
  type CreateAsyncAssertionFn,
  type Expect,
  expect,
  type ExpectAsync,
  expectAsync,
  fail,
  type FailAssertionError,
  type FailFn,
  type InvalidMetadataError,
  type InvalidObjectSchemaError,
  type SatisfactionError,
  type UnexpectedAsyncError,
  type UnknownAssertionError,
  use,
  type UseFn,
  z,
} from 'bupkis';
import { describe, it } from 'node:test';
import { expectAssignable, expectType } from 'tsd';

describe('expect', () => {
  it('should be a function', () => {
    expectAssignable<Expect>(expect);
  });

  it('should have createAssertion property', () => {
    expectType<CreateAssertionFn>(expect.createAssertion);
  });

  it('should have createAsyncAssertion property', () => {
    expectType<CreateAsyncAssertionFn>(expect.createAsyncAssertion);
  });

  it('should have fail property', () => {
    expectType<FailFn>(expect.fail);
  });

  it('should have use property', () => {
    expectAssignable<UseFn<any, any>>(expect.use);
  });

  it('should have it property for deferred assertions', () => {
    // Test that expect.it accepts various assertion signatures
    const isString = expect.it('to be a string');
    const isGreaterThan = expect.it('to be greater than', 5);
    const matches = expect.it('to match', /test/);
    const isArray = expect.it('to be an array');

    // Verify return types are properly typed ExpectItExecutor functions
    expectType<(subject: unknown) => void>(isString);
    expectType<(subject: number) => void>(isGreaterThan);
    expectType<(subject: string) => void>(matches);
    expectType<(subject: unknown) => void>(isArray);

    // Verify expect.it itself has proper overload signatures
    expectAssignable<typeof expect.it>(expect.it);
  });
});

describe('expectAsync', () => {
  it('should be a function', () => {
    expectAssignable<ExpectAsync>(expectAsync);
  });

  it('should have createAssertion property', () => {
    expectType<CreateAssertionFn>(expectAsync.createAssertion);
  });

  it('should have createAsyncAssertion property', () => {
    expectType<CreateAsyncAssertionFn>(expectAsync.createAsyncAssertion);
  });

  it('should have fail property', () => {
    expectType<FailFn>(expectAsync.fail);
  });

  it('should have use property', () => {
    expectAssignable<UseFn<any, any>>(expectAsync.use);
  });

  it('should have it property for deferred async assertions', () => {
    // Test that expectAsync.it accepts various assertion signatures
    const isString = expectAsync.it('to be a string');
    const resolves = expectAsync.it('to resolve');
    const rejectsWith = expectAsync.it('to reject with a', TypeError);

    // Verify return types are properly typed ExpectItExecutorAsync functions
    expectType<(subject: unknown) => Promise<void>>(isString);
    expectType<(subject: Promise<unknown>) => Promise<void>>(resolves);
    expectType<(subject: Promise<unknown>) => Promise<void>>(rejectsWith);

    // Verify expectAsync.it itself has proper overload signatures
    expectAssignable<typeof expectAsync.it>(expectAsync.it);
  });
});

describe('Primitive Assertions', () => {
  it('should support "to be a string" assertion', () => {
    expectType<void>(expect('foo', 'to be a string'));
    expectType<void>(expect(42, 'not to be a string'));
  });

  it('should support "to be a number" assertion', () => {
    expectType<void>(expect(42, 'to be a number'));
    expectType<void>(expect('foo', 'not to be a number'));
  });

  it('should support "to be a boolean" assertion', () => {
    expectType<void>(expect(true, 'to be a boolean'));
    expectType<void>(expect(false, 'to be a bool'));
    expectType<void>(expect(42, 'not to be boolean'));
  });

  it('should support "to be null" assertion', () => {
    expectType<void>(expect(null, 'to be null'));
    expectType<void>(expect(undefined, 'not to be null'));
  });

  it('should support "to be undefined" assertion', () => {
    expectType<void>(expect(undefined, 'to be undefined'));
    expectType<void>(expect(null, 'not to be undefined'));
  });

  it('should support "to be a bigint" assertion', () => {
    expectType<void>(expect(42n, 'to be a bigint'));
    expectType<void>(expect(42, 'not to be a bigint'));
  });

  it('should support "to be a symbol" assertion', () => {
    expectType<void>(expect(Symbol('test'), 'to be a symbol'));
    expectType<void>(expect('test', 'not to be a symbol'));
  });

  it('should support "to be a primitive" assertion', () => {
    expectType<void>(expect('hello', 'to be a primitive'));
    expectType<void>(expect({}, 'not to be a primitive'));
  });
});

describe('Equality Assertions', () => {
  it('should support "to equal" assertion', () => {
    expectType<void>(expect(42, 'to equal', 42));
    expectType<void>(expect(42, 'to be', 42));
    expectType<void>(expect(42, 'not to equal', 43));
  });

  it('should support "to deep equal" assertion', () => {
    expectType<void>(expect({ a: 1 }, 'to deep equal', { a: 1 }));
    expectType<void>(expect([1, 2], 'to deeply equal', [1, 2]));
    expectType<void>(expect({ a: 1 }, 'not to deep equal', { a: 2 }));
  });

  it('should support "to be one of" assertion', () => {
    expectType<void>(expect(2, 'to be one of', [1, 2, 3]));
    expectType<void>(expect(5, 'not to be one of', [1, 2, 3]));
  });

  it('should support "to be an instance of" assertion', () => {
    expectType<void>(expect(new Date(), 'to be an instance of', Date));
    expectType<void>(expect([], 'to be a', Array));
    expectType<void>(expect('hello', 'not to be an instance of', Number));
  });

  it('should support "to be a {intrinsic-type}" assertion', () => {
    expectType<void>(expect(new Date(), 'to be a', 'Date'));
    expectType<void>(expect([], 'to be an', 'Array'));
    expectType<void>(expect(1, 'to have type', 'number'));
  });
});

describe('Numeric Assertions', () => {
  it('should support "to be positive" assertion', () => {
    expectType<void>(expect(42, 'to be positive'));
    expectType<void>(expect(3.14, 'to be a positive number'));
    expectType<void>(expect(-5, 'not to be positive'));
  });

  it('should support "to be negative" assertion', () => {
    expectType<void>(expect(-42, 'to be negative'));
    expectType<void>(expect(-3.14, 'to be a negative number'));
    expectType<void>(expect(5, 'not to be negative'));
  });

  it('should support "to be greater than" assertion', () => {
    expectType<void>(expect(5, 'to be greater than', 3));
    expectType<void>(expect(5, 'to be above', 3));
    expectType<void>(expect(2, 'not to be greater than', 5));
  });

  it('should support "to be less than" assertion', () => {
    expectType<void>(expect(3, 'to be less than', 5));
    expectType<void>(expect(3, 'to be below', 5));
    expectType<void>(expect(5, 'not to be less than', 3));
  });

  it('should support "to be at least" assertion', () => {
    expectType<void>(expect(5, 'to be at least', 5));
    expectType<void>(expect(5, 'to be greater than or equal to', 3));
    expectType<void>(expect(2, 'not to be at least', 5));
  });

  it('should support "to be at most" assertion', () => {
    expectType<void>(expect(5, 'to be at most', 5));
    expectType<void>(expect(3, 'to be less than or equal to', 5));
    expectType<void>(expect(10, 'not to be at most', 5));
  });

  it('should support "to be between" assertion', () => {
    expectType<void>(expect(5, 'to be between', 1, 10));
    expectType<void>(expect(0, 'not to be between', 1, 10));
  });

  it('should support "to be infinite" assertion', () => {
    expectType<void>(expect(Infinity, 'to be infinite'));
    expectType<void>(expect(42, 'not to be infinite'));
  });

  it('should support "to be NaN" assertion', () => {
    expectType<void>(expect(NaN, 'to be NaN'));
    expectType<void>(expect(42, 'not to be NaN'));
  });
});

describe('String Assertions', () => {
  it('should support "to begin with" assertion', () => {
    expectType<void>(expect('hello world', 'to begin with', 'hello'));
    expectType<void>(expect('hello world', 'to start with', 'hello'));
    expectType<void>(expect('hello world', 'not to begin with', 'world'));
  });

  it('should support "to end with" assertion', () => {
    expectType<void>(expect('hello world', 'to end with', 'world'));
    expectType<void>(expect('hello world', 'not to end with', 'hello'));
  });

  it('should support "to match" assertion', () => {
    expectType<void>(expect('hello123', 'to match', /\d+/));
    expectType<void>(expect('hello', 'not to match', /\d+/));
  });

  it('should support "to be empty" for strings', () => {
    expectType<void>(expect('', 'to be empty'));
    expectType<void>(expect('hello', 'not to be empty'));
  });

  it('should support "to be non-empty" for strings', () => {
    expectType<void>(expect('hello', 'to be non-empty'));
    expectType<void>(expect('', 'not to be non-empty'));
  });

  it('should support "includes" assertion', () => {
    expectType<void>(expect('hello world', 'includes', 'world'));
    expectType<void>(expect('hello world', 'contains', 'world'));
    expectType<void>(expect('hello', 'not to include', 'world'));
  });

  it('should support "to be a RegExp" assertion', () => {
    expectType<void>(expect(/test/, 'to be a RegExp'));
    expectType<void>(expect(/test/, 'to be a regex'));
    expectType<void>(expect('test', 'not to be a regexp'));
  });
});

describe('Collection Assertions', () => {
  it('should support "to be an array" assertion', () => {
    expectType<void>(expect([], 'to be an array'));
    expectType<void>(expect([1, 2, 3], 'to be array'));
    expectType<void>(expect('hello', 'not to be an array'));
  });

  it('should support "to have length" assertion', () => {
    expectType<void>(expect([1, 2, 3], 'to have length', 3));
    expectType<void>(expect('hello', 'to have size', 5));
    expectType<void>(expect([1, 2], 'not to have length', 3));
  });

  it('should support "to be empty" for arrays', () => {
    expectType<void>(expect([], 'to be empty'));
    expectType<void>(expect([1, 2, 3], 'not to be empty'));
  });

  it('should support "to be non-empty" for arrays', () => {
    expectType<void>(expect([1, 2, 3], 'to be non-empty'));
    expectType<void>(expect([], 'not to be non-empty'));
  });

  it('should support "to contain" for arrays', () => {
    expectType<void>(expect([1, 2, 3], 'to contain', 2));
    expectType<void>(expect([1, 2, 3], 'to include', 2));
    expectType<void>(expect([1, 2, 3], 'not to contain', 5));
  });

  it('should support Map assertions', () => {
    expectType<void>(expect(new Map(), 'to be empty'));
    expectType<void>(
      expect(
        new Map([
          ['a', 1],
          ['b', 2],
        ]),
        'to have size',
        2,
      ),
    );
    expectType<void>(
      expect(
        new Map([
          ['a', 1],
          ['b', 2],
        ]),
        'to contain',
        'a',
      ),
    );
  });

  it('should support Set assertions', () => {
    expectType<void>(expect(new Set(), 'to be empty'));
    expectType<void>(expect(new Set([1, 2, 3]), 'to have size', 3));
    expectType<void>(expect(new Set([1, 2, 3]), 'to contain', 2));
    expectType<void>(expect(new Set([1, 2, 3]), 'to be a Set'));
  });

  it('should support WeakMap assertions', () => {
    const obj = {};
    expectType<void>(expect(new WeakMap([[obj, 'value']]), 'to contain', obj));
    expectType<void>(expect(new WeakMap(), 'to be a WeakMap'));
  });

  it('should support WeakSet assertions', () => {
    const obj = {};
    expectType<void>(expect(new WeakSet([obj]), 'to contain', obj));
    expectType<void>(expect(new WeakSet(), 'to be a WeakSet'));
  });
});

describe('Object Assertions', () => {
  it('should support "to be an object" assertion', () => {
    expectType<void>(expect({}, 'to be an object'));
    expectType<void>(expect('hello', 'not to be an object'));
  });

  it('should support "to be a record" assertion', () => {
    expectType<void>(expect({}, 'to be a record'));
    expectType<void>(expect({ a: 1 }, 'to be a plain object'));
    expectType<void>(expect([], 'not to be a record'));
  });

  it('should support "to be empty" for objects', () => {
    expectType<void>(expect({}, 'to be empty'));
    expectType<void>(expect({ a: 1 }, 'not to be empty'));
  });

  it('should support "to have keys" assertion', () => {
    expectType<void>(expect({ a: 1, b: 2 }, 'to have keys', ['a', 'b']));
    expectType<void>(expect({ a: 1, b: 2 }, 'to have properties', ['a', 'b']));
    expectType<void>(expect({ a: 1 }, 'not to have keys', ['a', 'b']));
  });

  it('should support "to have key" assertion', () => {
    expectType<void>(expect({ a: 1 }, 'to have key', 'a'));
    expectType<void>(expect({ a: 1 }, 'to have property', 'a'));
    expectType<void>(expect({ a: 1 }, 'not to have key', 'b'));
  });

  it('should support "to have exact key" assertion', () => {
    expectType<void>(expect({ a: 1 }, 'to have exact key', 'a'));
    expectType<void>(expect({ a: 1 }, 'to have exact property', 'a'));
    expectType<void>(expect({ a: 1 }, 'not to have exact key', 'b'));
  });

  it('should support "to have a null prototype" assertion', () => {
    expectType<void>(
      expect(Object.create(null) as unknown, 'to have a null prototype'),
    );
    expectType<void>(expect({}, 'not to have a null prototype'));
    expectType<void>(
      expect(Object.create(null) as unknown, 'to be a dictionary'),
    );
  });

  it('should support "to be an enumerable property of" assertion', () => {
    expectType<void>(expect('a', 'to be an enumerable property of', { a: 1 }));
    expectType<void>(
      expect('b', 'not to be an enumerable property of', { a: 1 }),
    );
  });

  it('should support "to be sealed" assertion', () => {
    expectType<void>(expect(Object.seal({}), 'to be sealed'));
    expectType<void>(expect({}, 'not to be sealed'));
  });

  it('should support "to be frozen" assertion', () => {
    expectType<void>(expect(Object.freeze({}), 'to be frozen'));
    expectType<void>(expect({}, 'not to be frozen'));
  });

  it('should support "to be extensible" assertion', () => {
    expectType<void>(expect({}, 'to be extensible'));
    expectType<void>(
      expect(Object.preventExtensions({}), 'not to be extensible'),
    );
  });

  it('should support "to satisfy" assertion', () => {
    expectType<void>(
      expect({ a: 1, b: 2, c: 3 }, 'to satisfy', { a: 1, b: 2 }),
    );
    expectType<void>(expect({ a: 1, b: 2 }, 'to be like', { a: 1 }));
    expectType<void>(expect({ a: 1 }, 'not to satisfy', { a: 2 }));
  });
});

describe('Function Assertions', () => {
  it('should support "to be a function" assertion', () => {
    expectType<void>(expect(() => {}, 'to be a function'));
    expectType<void>(expect('hello', 'not to be a function'));
  });

  it('should support "to throw" assertion', () => {
    expectType<void>(
      expect(() => {
        throw new Error('test');
      }, 'to throw'),
    );
    expectType<void>(expect(() => {}, 'not to throw'));
  });

  it('should support "to throw a" assertion', () => {
    expectType<void>(
      expect(
        () => {
          throw new TypeError('test');
        },
        'to throw a',
        TypeError,
      ),
    );
  });

  it('should support "to throw error satisfying" assertion', () => {
    expectType<void>(
      expect(
        () => {
          throw new Error('test');
        },
        'to throw error satisfying',
        { message: 'test' },
      ),
    );
  });
});

describe('Date Assertions', () => {
  it('should support "to be a Date" assertion', () => {
    expectType<void>(expect(new Date(), 'to be a Date'));
    expectType<void>(expect('2024-01-01', 'not to be a Date'));
  });

  it('should support "to be before" assertion', () => {
    expectType<void>(
      expect(new Date('2024-01-01'), 'to be before', new Date('2024-12-31')),
    );
  });

  it('should support "to be after" assertion', () => {
    expectType<void>(
      expect(new Date('2024-12-31'), 'to be after', new Date('2024-01-01')),
    );
  });

  it('should support "to be the same date as" assertion', () => {
    expectType<void>(
      expect(
        new Date('2024-01-01'),
        'to be the same date as',
        new Date('2024-01-01'),
      ),
    );
  });
});

describe('Error Assertions', () => {
  it('should support "to be an Error" assertion', () => {
    expectType<void>(expect(new Error('test'), 'to be an Error'));
    expectType<void>(expect('not an error', 'not to be an Error'));
  });
});

describe('Other Assertions', () => {
  it('should support "to be true" assertion', () => {
    expectType<void>(expect(true, 'to be true'));
    expectType<void>(expect(false, 'not to be true'));
  });

  it('should support "to be false" assertion', () => {
    expectType<void>(expect(false, 'to be false'));
    expectType<void>(expect(true, 'not to be false'));
  });

  it('should support "to be truthy" assertion', () => {
    expectType<void>(expect(1, 'to be truthy'));
    expectType<void>(expect(0, 'not to be truthy'));
  });

  it('should support "to be falsy" assertion', () => {
    expectType<void>(expect(0, 'to be falsy'));
    expectType<void>(expect(1, 'not to be falsy'));
  });
});

describe('Sync Iterable Assertions', () => {
  it('should support "to yield" assertion', () => {
    expectType<void>(expect([1, 2, 3], 'to yield', 2));
    expectType<void>(expect(new Set(['a', 'b']), 'to emit', 'a'));
    expectType<void>(
      expect([{ a: 1, b: 2 }], 'to yield value satisfying', { a: 1 }),
    );
    expectType<void>(expect([1, 2, 3], 'not to yield', 5));
  });

  it('should support "to yield value exhaustively satisfying" assertion', () => {
    expectType<void>(
      expect([{ a: 1 }], 'to yield value exhaustively satisfying', { a: 1 }),
    );
    expectType<void>(
      expect([{ a: 1, b: 2 }], 'not to yield value exhaustively satisfying', {
        a: 1,
      }),
    );
  });

  it('should support "to yield items satisfying" assertion', () => {
    expectType<void>(
      expect([{ a: 1 }, { a: 2 }], 'to yield items satisfying', { a: 1 }),
    );
  });

  it('should support "to yield items exhaustively satisfying" assertion', () => {
    expectType<void>(
      expect([{ a: 1 }], 'to yield items exhaustively satisfying', { a: 1 }),
    );
  });

  it('should support "to yield first" assertion', () => {
    expectType<void>(expect([1, 2, 3], 'to yield first', 1));
    expectType<void>(expect([{ a: 1 }], 'to yield first satisfying', { a: 1 }));
  });

  it('should support "to yield first exhaustively satisfying" assertion', () => {
    expectType<void>(
      expect([{ a: 1 }], 'to yield first exhaustively satisfying', { a: 1 }),
    );
  });

  it('should support "to yield last" assertion', () => {
    expectType<void>(expect([1, 2, 3], 'to yield last', 3));
    expectType<void>(expect([{ a: 1 }], 'to yield last satisfying', { a: 1 }));
  });

  it('should support "to yield last exhaustively satisfying" assertion', () => {
    expectType<void>(
      expect([{ a: 1 }], 'to yield last exhaustively satisfying', { a: 1 }),
    );
  });

  it('should support "to yield count" assertion', () => {
    expectType<void>(expect([1, 2, 3], 'to yield count', 3));
    expectType<void>(expect(new Set([1, 2]), 'to yield count', 2));
    expectType<void>(expect([1, 2, 3], 'not to yield count', 5));
  });

  it('should support "to yield at least" assertion', () => {
    expectType<void>(expect([1, 2, 3], 'to yield at least', 2));
  });

  it('should support "to yield at most" assertion', () => {
    expectType<void>(expect([1, 2], 'to yield at most', 3));
  });

  it('should support "to be an empty iterable" assertion', () => {
    expectType<void>(expect([], 'to be an empty iterable'));
    expectType<void>(expect([1, 2, 3], 'not to be an empty iterable'));
  });

  it('should support "to yield exactly" assertion', () => {
    expectType<void>(expect([1, 2, 3], 'to yield exactly', [1, 2, 3]));
    expectType<void>(expect([1, 2], 'not to yield exactly', [1, 2, 3]));
  });

  it('should support "to yield sequence satisfying" assertion', () => {
    expectType<void>(
      expect([{ a: 1 }], 'to yield sequence satisfying', [{ a: 1 }]),
    );
    expectType<void>(expect([1, 2, 3], 'to yield array satisfying', [1, 2, 3]));
  });

  it('should work with generators', () => {
    const gen = function* () {
      yield 1;
      yield 2;
    };
    expectType<void>(expect(gen(), 'to yield', 1));
    expectType<void>(expect(gen(), 'to yield count', 2));
  });

  it('should work with Maps (iterates entries)', () => {
    const map = new Map([
      ['a', 1],
      ['b', 2],
    ]);
    expectType<void>(expect(map, 'to yield count', 2));
  });

  it('should work with strings (iterates chars)', () => {
    expectType<void>(expect('abc', 'to yield', 'b'));
    expectType<void>(expect('abc', 'to yield count', 3));
  });
});

describe('Async Iterable Assertions', () => {
  it('should support "to yield" assertion for async iterables', () => {
    const asyncGen = async function* () {
      yield 1;
      yield 2;
    };
    expectType<Promise<void>>(expectAsync(asyncGen(), 'to yield', 2));
    expectType<Promise<void>>(expectAsync(asyncGen(), 'to emit', 1));
    expectType<Promise<void>>(
      expectAsync(asyncGen(), 'to yield value satisfying', 1),
    );
  });

  it('should support "to yield value exhaustively satisfying" assertion for async', () => {
    const asyncGen = async function* () {
      yield { a: 1 };
    };
    expectType<Promise<void>>(
      expectAsync(asyncGen(), 'to yield value exhaustively satisfying', {
        a: 1,
      }),
    );
  });

  it('should support "to yield items satisfying" assertion for async', () => {
    const asyncGen = async function* () {
      yield { a: 1 };
    };
    expectType<Promise<void>>(
      expectAsync(asyncGen(), 'to yield items satisfying', { a: 1 }),
    );
  });

  it('should support "to yield first" assertion for async', () => {
    const asyncGen = async function* () {
      yield 1;
    };
    expectType<Promise<void>>(expectAsync(asyncGen(), 'to yield first', 1));
    expectType<Promise<void>>(
      expectAsync(asyncGen(), 'to yield first satisfying', 1),
    );
  });

  it('should support "to yield last" assertion for async', () => {
    const asyncGen = async function* () {
      yield 1;
      yield 2;
    };
    expectType<Promise<void>>(expectAsync(asyncGen(), 'to yield last', 2));
  });

  it('should support "to yield count" assertion for async', () => {
    const asyncGen = async function* () {
      yield 1;
      yield 2;
    };
    expectType<Promise<void>>(expectAsync(asyncGen(), 'to yield count', 2));
  });

  it('should support "to yield at least" assertion for async', () => {
    const asyncGen = async function* () {
      yield 1;
      yield 2;
    };
    expectType<Promise<void>>(expectAsync(asyncGen(), 'to yield at least', 1));
  });

  it('should support "to yield at most" assertion for async', () => {
    const asyncGen = async function* () {
      yield 1;
    };
    expectType<Promise<void>>(expectAsync(asyncGen(), 'to yield at most', 2));
  });

  it('should support "to be an empty iterable" assertion for async', () => {
    const emptyGen = async function* () {};
    expectType<Promise<void>>(
      expectAsync(emptyGen(), 'to be an empty iterable'),
    );
  });

  it('should support "to yield exactly" assertion for async', () => {
    const asyncGen = async function* () {
      yield 1;
      yield 2;
    };
    expectType<Promise<void>>(
      expectAsync(asyncGen(), 'to yield exactly', [1, 2]),
    );
  });

  it('should support "to yield sequence satisfying" assertion for async', () => {
    const asyncGen = async function* () {
      yield { a: 1 };
    };
    expectType<Promise<void>>(
      expectAsync(asyncGen(), 'to yield sequence satisfying', [{ a: 1 }]),
    );
    expectType<Promise<void>>(
      expectAsync(asyncGen(), 'to yield array satisfying', [{ a: 1 }]),
    );
  });

  it('should support "to complete" assertion for async', () => {
    const asyncGen = async function* () {
      yield 1;
    };
    expectType<Promise<void>>(expectAsync(asyncGen(), 'to complete'));
    expectType<Promise<void>>(expectAsync(asyncGen(), 'to finish'));
  });

  it('should support "to reject" assertion for async iterables', () => {
    const failingGen = async function* () {
      throw new Error('test');
    };
    expectType<Promise<void>>(expectAsync(failingGen(), 'to reject'));
    expectType<Promise<void>>(expectAsync(failingGen(), 'to be rejected'));
  });

  it('should support "to reject with a" assertion for async iterables', () => {
    const failingGen = async function* () {
      throw new TypeError('test');
    };
    expectType<Promise<void>>(
      expectAsync(failingGen(), 'to reject with a', TypeError),
    );
    expectType<Promise<void>>(
      expectAsync(failingGen(), 'to reject with an', Error),
    );
  });

  it('should support "to reject with error satisfying" assertion for async iterables', () => {
    const failingGen = async function* () {
      throw new Error('test');
    };
    expectType<Promise<void>>(
      expectAsync(failingGen(), 'to reject with error satisfying', {
        message: 'test',
      }),
    );
    expectType<Promise<void>>(
      expectAsync(failingGen(), 'to be rejected with error satisfying', {
        message: 'test',
      }),
    );
  });

  it('should accept sync iterables in async assertions (auto-wrapped)', () => {
    expectType<Promise<void>>(expectAsync([1, 2, 3], 'to yield', 2));
    expectType<Promise<void>>(expectAsync([1, 2, 3], 'to yield count', 3));
  });
});

describe('Promise Assertions (Async)', () => {
  it('should support "to resolve" assertion', () => {
    expectType<Promise<void>>(expectAsync(Promise.resolve(42), 'to resolve'));
    expectType<Promise<void>>(
      expectAsync(Promise.resolve('test'), 'to fulfill'),
    );
    expectType<Promise<void>>(
      expectAsync(Promise.reject(new Error('error')), 'not to resolve'),
    );
  });

  it('should support "to reject" assertion', () => {
    expectType<Promise<void>>(
      expectAsync(Promise.reject(new Error('error')), 'to reject'),
    );
    expectType<Promise<void>>(
      expectAsync(Promise.resolve(42), 'not to reject'),
    );
  });

  it('should support "to reject with a" assertion', () => {
    expectType<Promise<void>>(
      expectAsync(
        Promise.reject(new TypeError('error')),
        'to reject with a',
        TypeError,
      ),
    );
    expectType<Promise<void>>(
      expectAsync(
        Promise.reject(new Error('error')),
        'to reject with an',
        Error,
      ),
    );
  });

  it('should support "to reject with error satisfying" assertion', () => {
    expectType<Promise<void>>(
      expectAsync(Promise.reject(new Error('test')), 'to reject with', 'test'),
    );
  });

  it('should support "to resolve with value satisfying" assertion', () => {
    expectType<Promise<void>>(
      expectAsync(
        Promise.resolve('Hello World'),
        'to fulfill with value satisfying',
        'Hello World',
      ),
    );
    expectType<Promise<void>>(
      expectAsync(
        Promise.resolve({ status: 'ok' }),
        'to resolve with value satisfying',
        { status: 'ok' },
      ),
    );
  });
});

describe('createAssertion', () => {
  it('should be a function that creates sync assertions', () => {
    expectType<CreateAssertionFn>(createAssertion);
  });

  it('should create assertion from phrase and schema', () => {
    const assertion = createAssertion(['to be a string'], z.string());
    expectAssignable<{ parts: readonly ['to be a string'] }>(assertion);
  });

  it('should create parametric assertion with schema and callback', () => {
    const assertion = createAssertion(
      [z.number(), 'is greater than', z.number()],
      (_, expected) => z.number().gt(expected),
    );
    expectAssignable<{
      parts: readonly [z.ZodNumber, 'is greater than', z.ZodNumber];
    }>(assertion);
  });

  it('should create assertion with boolean function', () => {
    const assertion = createAssertion(
      [z.number(), 'is even'],
      (n) => n % 2 === 0,
    );
    expectAssignable<{ parts: readonly [z.ZodNumber, 'is even'] }>(assertion);
  });
});

describe('createAsyncAssertion', () => {
  it('should be a function that creates async assertions', () => {
    expectType<CreateAsyncAssertionFn>(createAsyncAssertion);
  });
});

describe('use', () => {
  it('should extend expect with custom assertions', () => {
    const customAssertion = createAssertion(['to be a Foo'], () => true);
    const result = use([customAssertion]);
    expectAssignable<Bupkis<any, any, any, any>>(result);
    expectAssignable<Expect>(result.expect);
    expectAssignable<ExpectAsync>(result.expectAsync);
  });
});

describe('fail', () => {
  it('should be a function that never returns', () => {
    expectType<FailFn>(fail);
  });
});

describe('z', () => {
  it('should be Zod v4 namespace', () => {
    expectType<typeof z>(z);
    expectType<z.ZodString>(z.string());
    expectType<z.ZodNumber>(z.number());
  });
});

describe('Error classes', () => {
  it('AssertionError should have required properties', () => {
    const err = {} as AssertionError;
    expectAssignable<Error>(err);
    expectAssignable<string>(err.assertionId);
  });

  it('BupkisError should be an Error', () => {
    const err = {} as BupkisError;
    expectAssignable<Error>(err);
  });

  it('AssertionImplementationError should be a BupkisError', () => {
    const err = {} as AssertionImplementationError;
    expectAssignable<BupkisError>(err);
    expectAssignable<string>(err.code);
  });

  it('FailAssertionError should be an AssertionError', () => {
    const err = {} as FailAssertionError;
    expectAssignable<AssertionError>(err);
  });

  it('InvalidMetadataError should be a BupkisError', () => {
    const err = {} as InvalidMetadataError;
    expectAssignable<BupkisError>(err);
    expectAssignable<string>(err.code);
  });

  it('InvalidObjectSchemaError should be a BupkisError', () => {
    const err = {} as InvalidObjectSchemaError;
    expectAssignable<BupkisError>(err);
    expectAssignable<string>(err.code);
  });

  it('SatisfactionError should be a BupkisError', () => {
    const err = {} as SatisfactionError;
    expectAssignable<BupkisError>(err);
    expectAssignable<string>(err.code);
  });

  it('UnexpectedAsyncError should be a BupkisError', () => {
    const err = {} as UnexpectedAsyncError;
    expectAssignable<BupkisError>(err);
    expectAssignable<string>(err.code);
  });

  it('UnknownAssertionError should be a BupkisError with args', () => {
    const err = {} as UnknownAssertionError<['foo']>;
    expectAssignable<BupkisError>(err);
    expectAssignable<string>(err.code);
    expectType<['foo']>(err.args);
  });
});

describe('Types', () => {
  it('AssertionFailure should describe failure shape', () => {
    const failure: AssertionFailure = {
      message: 'test',
    };
    expectType<AssertionFailure>(failure);
  });

  it('Bupkis should define the main API structure', () => {
    const api = use([]);
    expectAssignable<Bupkis<any, any>>(api);
    expectAssignable<{ expect: Expect; expectAsync: ExpectAsync }>(api);
  });
});
