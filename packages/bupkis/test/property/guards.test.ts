/* eslint-disable func-style */
/* eslint-disable prefer-arrow-callback */
import {
  calculateNumRuns,
  filteredAnything,
  filteredObject,
} from '@bupkis/property-testing';
import * as arktype from 'arktype';
import * as fc from 'fast-check';
import { describe, it } from 'node:test';
import * as valibot from 'valibot';
import { z } from 'zod';

import { expect } from '../../src/bootstrap.js';
import {
  isA,
  isBoolean,
  isConstructible,
  isError,
  isExpectItExecutor,
  isFunction,
  isNonNullObject,
  isObject,
  isPhrase,
  isPhraseLiteral,
  isPhraseLiteralChoice,
  isPromiseLike,
  isStandardSchema,
  isString,
  isWeakKey,
  isZodType,
} from '../../src/guards.js';

const numRuns = calculateNumRuns();

describe('type guard property tests', () => {
  describe('isConstructible()', () => {
    it('should return true for ES6 classes', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            class TestClass {},
            class Extends extends Array {},
            Error,
            Date,
            Array,
            Object,
            Map,
            Set,
            WeakMap,
            WeakSet,
            Promise,
            RegExp,
          ),
          (Ctor) => isConstructible(Ctor),
        ),
        { numRuns },
      );
    });

    it('should return true for constructor functions', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            function TestConstructor(this: any) {
              this.prop = 'value';
            },
            function AnotherConstructor(this: any, arg: string) {
              this.arg = arg;
            },
            function EmptyConstructor() {},
          ),
          (ctor) => isConstructible(ctor),
        ),
        { numRuns },
      );
    });

    it('should return false for regular functions', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            () => {
              expect.fail('Should not have been called');
            },

            async () => {
              expect.fail('Should not have been called');
            },

            async () => {
              expect.fail('Should not have been called');
            },
            // eslint-disable-next-line require-yield
            function* generatorFunction() {
              expect.fail('Should not have been called');
            },
          ),
          (fn) => !isConstructible(fn),
        ),
        { numRuns },
      );
    });

    it('should return false for non-functions and inconstructible functions', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.string(),
            fc.integer(),
            fc.float(),
            fc.boolean(),
            fc.constantFrom(null, undefined),
            filteredObject,
            fc.array(filteredAnything),
            fc.bigInt(),
            fc.string().map(Symbol),
            fc.constantFrom(Symbol),
            fc.constantFrom(BigInt),
            fc.constantFrom(() => {}),
          ),
          (value) => !isConstructible(value),
        ),
        { numRuns },
      );
    });

    it('should handle edge cases correctly', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            // Bound functions
            function BoundTest() {}.bind(null),

            // Functions with modified prototype
            (function () {
              function Modified() {}
              Modified.prototype = null;
              return Modified;
            })(),

            // Functions with custom constructor property
            (function () {
              const fn = function () {};
              fn.constructor = class {};
              return fn;
            })(),

            // Built-in constructors
            Boolean,
            Number,
            String,
            RegExp,
            Date,

            // Proxy around function
            new Proxy(function () {}, {}),

            // Function created with Function constructor
            // eslint-disable-next-line @typescript-eslint/no-implied-eval
            new Function('return this'),
            // eslint-disable-next-line @typescript-eslint/no-implied-eval
            new Function('a', 'b', 'return a + b'),
          ),
          (AllegedCtor) => {
            // We expect these to be detected as constructable since they can be called with `new`
            // This test will show us if our implementation handles these edge cases correctly
            const result = isConstructible(AllegedCtor);

            if (!result) {
              return false;
            }
            try {
              expect(() => {
                new AllegedCtor();
              }, 'not to throw');
            } catch {
              return false;
            }
            return true;
          },
        ),
        { numRuns },
      );
    });

    it('should handle problematic cases that might throw unexpected errors', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            // Objects with function-like properties but not actually functions
            Object.create(Function.prototype),

            // fast-check cannot use revoked proxies, otherwise it would be here

            // Frozen/sealed functions
            Object.freeze(function frozen() {}),
            Object.seal(function sealed() {}),

            // Functions with unusual properties
            (() => {
              const fn = function () {};
              Object.defineProperty(fn, 'prototype', {
                value: 42,
                writable: false,
              });
              return fn;
            })(),
          ),
          (value) => {
            try {
              expect(() => isConstructible(value), 'not to throw');
              return true;
            } catch {
              return false;
            }
          },
        ),
        { numRuns },
      );
    });

    it('should be idempotent', () => {
      fc.assert(
        fc.property(filteredAnything, (value) => {
          const result1 = isConstructible(value);
          const result2 = isConstructible(value);
          const result3 = isConstructible(value);

          // Should return the same result every time
          return result1 === result2 && result2 === result3;
        }),
        { numRuns },
      );
    });
  });

  describe('isStandardSchema()', () => {
    it('should return true for Standard Schema v1 schemas', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            z.string(),
            z.number(),
            z.boolean(),
            z.array(z.string()),
            z.object({ foo: z.string() }),
            arktype.type('string'),
            arktype.type('number'),
            arktype.type('boolean'),
            arktype.type('string[]'),
            arktype.type({ foo: 'string' }),
            valibot.string(),
            valibot.number(),
            valibot.boolean(),
            valibot.array(valibot.string()),
            valibot.object({ foo: valibot.string() }),
          ),
          (schema) => isStandardSchema(schema),
        ),
        { numRuns },
      );
    });

    it('should return false for non-Standard Schema v1 schemas', () => {
      fc.assert(
        fc.property(fc.anything(), (value) => !isStandardSchema(value)),
        { numRuns },
      );
    });
  });

  describe('isZodType()', () => {
    it('should return true for any Zod schema (no type arg)', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            z.string(),
            z.number(),
            z.boolean(),
            z.array(z.string()),
            z.object({ foo: z.string() }),
            z.null(),
            z.undefined(),
            z.union([z.string(), z.number()]),
            z.literal('hello'),
            z.record(z.string(), z.number()),
          ),
          (schema) => isZodType(schema),
        ),
        { numRuns },
      );
    });

    it('should return true for Zod schemas with matching type arg', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            [z.string(), 'string'] as const,
            [z.number(), 'number'] as const,
            [z.boolean(), 'boolean'] as const,
            [z.array(z.string()), 'array'] as const,
            [z.null(), 'null'] as const,
            [z.undefined(), 'undefined'] as const,
            [z.literal('hello'), 'literal'] as const,
            [z.union([z.string(), z.number()]), 'union'] as const,
          ),
          ([schema, type]) => isZodType(schema, type),
        ),
        { numRuns },
      );
    });

    it('should return false when type arg does not match the schema type', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            [z.string(), 'number'] as const,
            [z.number(), 'string'] as const,
            [z.boolean(), 'array'] as const,
            [z.array(z.string()), 'boolean'] as const,
            [z.null(), 'string'] as const,
          ),
          ([schema, type]) => !isZodType(schema, type),
        ),
        { numRuns },
      );
    });

    it('should return false for non-Zod values', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.string(),
            fc.integer(),
            fc.boolean(),
            fc.constantFrom(null, undefined),
            filteredObject,
            fc.array(filteredAnything),
          ),
          (value) => !isZodType(value),
        ),
        { numRuns },
      );
    });
  });

  describe('isObject()', () => {
    it('should return true for plain objects', () => {
      fc.assert(
        fc.property(filteredObject, (value) => isObject(value)),
        { numRuns },
      );
    });

    it('should return false for null, arrays, primitives, and functions', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.constant(null),
            fc.constant(undefined),
            fc.string(),
            fc.integer(),
            fc.boolean(),
            fc.bigInt(),
            fc.string().map(Symbol),
            fc.array(filteredAnything),
            fc.func(filteredAnything),
          ),
          (value) => !isObject(value),
        ),
        { numRuns },
      );
    });
  });

  describe('isPromiseLike()', () => {
    it('should return true for Promises and valid thenables', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            Promise.resolve(1),
            Promise.resolve('hello'),
            Promise.reject(new Error('test')).catch(() => {}),
            // Custom thenables with at least one param
            { then: (resolve: (v: number) => void) => resolve(1) },
            {
              then: (resolve: (v: string) => void, _reject: unknown) =>
                resolve('ok'),
            },
          ),
          (value) => isPromiseLike(value),
        ),
        { numRuns },
      );
    });

    it('should return false for non-thenables', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.string(),
            fc.integer(),
            fc.boolean(),
            fc.constantFrom(null, undefined),
            // Objects without `then`
            filteredObject,
            // Objects with non-function `then`
            fc.integer().map((n) => ({ then: n })),
            // Objects with zero-length `then` function
            fc.constant({ then: () => {} }),
          ),
          (value) => !isPromiseLike(value),
        ),
        { numRuns },
      );
    });
  });

  describe('isBoolean()', () => {
    it('should return true for boolean primitives', () => {
      fc.assert(
        fc.property(fc.boolean(), (value) => isBoolean(value)),
        { numRuns },
      );
    });

    it('should return false for non-booleans', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.string(),
            fc.integer(),
            fc.double({ noNaN: true }),
            fc.constantFrom(null, undefined),
            filteredObject,
            fc.array(filteredAnything),
            fc.bigInt(),
            fc.string().map(Symbol),
          ),
          (value) => !isBoolean(value),
        ),
        { numRuns },
      );
    });
  });

  describe('isFunction()', () => {
    it('should return true for arrow functions, regular functions, and async functions', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            () => {},
            function regular() {},
            async () => {},
            async function asyncRegular() {},
            function* gen() {},
            class MyClass {},
            Math.max,
            Object.assign,
          ),
          (fn) => isFunction(fn),
        ),
        { numRuns },
      );
    });

    it('should return false for non-functions', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.string(),
            fc.integer(),
            fc.boolean(),
            fc.constantFrom(null, undefined),
            filteredObject,
            fc.array(filteredAnything),
            fc.bigInt(),
          ),
          (value) => !isFunction(value),
        ),
        { numRuns },
      );
    });
  });

  describe('isString()', () => {
    it('should return true for any string including empty string', () => {
      fc.assert(
        fc.property(fc.string(), (value) => isString(value)),
        { numRuns },
      );
    });

    it('should return false for non-strings', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.integer(),
            fc.boolean(),
            fc.constantFrom(null, undefined),
            filteredObject,
            fc.array(filteredAnything),
            fc.bigInt(),
            fc.string().map(Symbol),
          ),
          (value) => !isString(value),
        ),
        { numRuns },
      );
    });
  });

  describe('isNonNullObject()', () => {
    it('should return true for non-null objects including arrays', () => {
      fc.assert(
        fc.property(
          fc.oneof(filteredObject, fc.array(filteredAnything)),
          (value) => isNonNullObject(value),
        ),
        { numRuns },
      );
    });

    it('should return false for null, undefined, primitives, and functions', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.constant(null),
            fc.constant(undefined),
            fc.string(),
            fc.integer(),
            fc.boolean(),
            fc.bigInt(),
            fc.string().map(Symbol),
            // functions are typeof 'function', not 'object'
            fc.func(filteredAnything),
          ),
          (value) => !isNonNullObject(value),
        ),
        { numRuns },
      );
    });
  });

  describe('isWeakKey()', () => {
    it('should return true for objects, functions, and symbols', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            filteredObject,
            fc.array(filteredAnything),
            fc.func(filteredAnything),
            fc.string().map(Symbol),
            fc.constant(Symbol.iterator),
          ),
          (value) => isWeakKey(value),
        ),
        { numRuns },
      );
    });

    it('should return false for null, undefined, and non-symbol primitives', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.constant(null),
            fc.constant(undefined),
            fc.string(),
            fc.integer(),
            fc.boolean(),
            fc.bigInt(),
          ),
          (value) => !isWeakKey(value),
        ),
        { numRuns },
      );
    });
  });

  describe('isPhraseLiteral()', () => {
    it('should return true for any string except "and"', () => {
      fc.assert(
        fc.property(
          fc.string().filter((s) => s !== 'and'),
          (value) => isPhraseLiteral(value),
        ),
        { numRuns },
      );
    });

    it('should return false for "and"', () => {
      fc.assert(
        fc.property(fc.constant('and'), (value) => !isPhraseLiteral(value)),
        { numRuns },
      );
    });

    it('should return false for non-strings', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.integer(),
            fc.boolean(),
            fc.constantFrom(null, undefined),
            filteredObject,
            fc.array(filteredAnything),
          ),
          (value) => !isPhraseLiteral(value),
        ),
        { numRuns },
      );
    });
  });

  describe('isPhraseLiteralChoice()', () => {
    it('should return true for non-empty arrays of phrase literals', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.string().filter((s) => s !== 'and'),
            { minLength: 1 },
          ),
          (value) => isPhraseLiteralChoice(value),
        ),
        { numRuns },
      );
    });

    it('should return false for empty arrays', () => {
      fc.assert(
        fc.property(fc.constant([]), (value) => !isPhraseLiteralChoice(value)),
        { numRuns },
      );
    });

    it('should return false for arrays containing "and"', () => {
      fc.assert(
        fc.property(
          // Guarantee at least one 'and' is present
          fc
            .tuple(fc.array(fc.string()), fc.constant('and'))
            .map(([arr, andStr]) => [...arr, andStr]),
          (value) => !isPhraseLiteralChoice(value),
        ),
        { numRuns },
      );
    });

    it('should return false for non-arrays', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.string(),
            fc.integer(),
            fc.boolean(),
            fc.constantFrom(null, undefined),
            filteredObject,
          ),
          (value) => !isPhraseLiteralChoice(value),
        ),
        { numRuns },
      );
    });
  });

  describe('isPhrase()', () => {
    it('should return true for phrase literals (non-"and" strings)', () => {
      fc.assert(
        fc.property(
          fc.string().filter((s) => s !== 'and'),
          (value) => isPhrase(value),
        ),
        { numRuns },
      );
    });

    it('should return true for phrase literal choices (non-empty string arrays without "and")', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.string().filter((s) => s !== 'and'),
            { minLength: 1 },
          ),
          (value) => isPhrase(value),
        ),
        { numRuns },
      );
    });

    it('should return false for "and", empty arrays, and non-string values', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.constant('and'),
            fc.constant([]),
            fc.integer(),
            fc.boolean(),
            fc.constantFrom(null, undefined),
            filteredObject,
            // arrays with 'and' in them
            fc
              .tuple(fc.array(fc.string()), fc.constant('and'))
              .map(([arr, andStr]) => [...arr, andStr]),
          ),
          (value) => !isPhrase(value),
        ),
        { numRuns },
      );
    });
  });

  describe('isA()', () => {
    it('should return true for instances of the given constructor', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            [new Date(), Date] as const,
            [new Map(), Map] as const,
            [new Set(), Set] as const,
            [new WeakMap(), WeakMap] as const,
            [new WeakSet(), WeakSet] as const,
            [new Error('test'), Error] as const,
            [new TypeError('type error'), TypeError] as const,
            [new RegExp(''), RegExp] as const,
          ),
          ([value, ctor]) => isA(value, ctor),
        ),
        { numRuns },
      );
    });

    it('should return false for mismatched constructors', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            [new Date(), Map] as const,
            [new Map(), Date] as const,
            [new Set(), WeakMap] as const,
            [new Error('test'), Set] as const,
          ),
          ([value, ctor]) => !isA(value, ctor),
        ),
        { numRuns },
      );
    });

    it('should return false for null, undefined, and primitives', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.constant(null),
            fc.constant(undefined),
            fc.string(),
            fc.integer(),
            fc.boolean(),
          ),
          (value) => !isA(value, Error),
        ),
        { numRuns },
      );
    });
  });

  describe('isError()', () => {
    it('should return true for Error instances and all built-in error subclasses', () => {
      fc.assert(
        fc.property(
          fc
            .tuple(
              fc.string(),
              fc.constantFrom(
                Error,
                TypeError,
                RangeError,
                ReferenceError,
                SyntaxError,
                URIError,
                EvalError,
              ),
            )
            .map(([msg, ErrorClass]) => new ErrorClass(msg)),
          (err) => isError(err),
        ),
        { numRuns },
      );
    });

    it('should return false for plain objects and primitives', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.string(),
            fc.integer(),
            fc.boolean(),
            fc.constantFrom(null, undefined),
            filteredObject,
          ),
          (value) => !isError(value),
        ),
        { numRuns },
      );
    });
  });

  describe('isExpectItExecutor()', () => {
    it('should return true for executors created by expect.it()', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            expect.it('to be a string'),
            expect.it('to be a number'),
            expect.it('to be true'),
            expect.it('to be undefined'),
            expect.it('to be null'),
            expect.it('to be an array'),
            expect.it('to be an object'),
            expect.it('to be greater than', 0),
            expect.it('to have length', 3),
          ),
          (executor) => isExpectItExecutor(executor),
        ),
        { numRuns },
      );
    });

    it('should return false for regular functions without the marker symbol', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            () => {},
            function regular() {},
            Math.max,
            Object.assign,
          ),
          (fn) => !isExpectItExecutor(fn),
        ),
        { numRuns },
      );
    });

    it('should return false for non-functions', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.string(),
            fc.integer(),
            fc.boolean(),
            fc.constantFrom(null, undefined),
            filteredObject,
          ),
          (value) => !isExpectItExecutor(value),
        ),
        { numRuns },
      );
    });
  });
});
