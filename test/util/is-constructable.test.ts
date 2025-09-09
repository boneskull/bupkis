import * as fc from 'fast-check';
import { describe, it } from 'node:test';

import { expect } from '../../src/bootstrap.js';
import { isConstructable } from '../../src/guards.js';

describe('isConstructable property tests', () => {
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
        (ctor) => isConstructable(ctor),
      ),
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
        (ctor) => isConstructable(ctor),
      ),
    );
  });

  it('should return false for regular functions', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          () => {
            expect.fail('Should not have been called');
          },
          // eslint-disable-next-line @typescript-eslint/no-misused-promises
          async function asyncFunction() {
            expect.fail('Should not have been called');
          },
          // eslint-disable-next-line @typescript-eslint/no-misused-promises
          async () => {
            expect.fail('Should not have been called');
          },
          // eslint-disable-next-line require-yield
          function* generatorFunction() {
            expect.fail('Should not have been called');
          },
        ),
        (fn) => !isConstructable(fn),
      ),
    );
  });

  it('should return false for non-functions and unconstructable functions', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.string(),
          fc.integer(),
          fc.float(),
          fc.boolean(),
          fc.constantFrom(null, undefined),
          fc.object(),
          fc.array(fc.anything()),
          fc.bigInt(),
          fc.string().map(Symbol),
          fc.constantFrom(Symbol),
          fc.constantFrom(BigInt),
          fc.constantFrom(() => {}),
        ),
        (value) => !isConstructable(value),
      ),
    );
  });

  it('should handle edge cases correctly', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          // Bound functions
          function BoundTest() {}.bind(null),

          // Functions with modified prototype
          (() => {
            function Modified() {}
            Modified.prototype = null;
            return Modified;
          })(),

          // Functions with custom constructor property
          (() => {
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
        (fn) => {
          // We expect these to be detected as constructable since they can be called with `new`
          // This test will show us if our implementation handles these edge cases correctly
          const result = isConstructable(fn);

          if (!result) {
            return false;
          }
          try {
            expect(() => {
              new fn();
            }, 'not to throw');
          } catch {
            return false;
          }
          return true;
        },
      ),
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
            expect(() => isConstructable(value), 'not to throw');
            return true;
          } catch {
            return false;
          }
        },
      ),
    );
  });

  it('should be idempotent', () => {
    fc.assert(
      fc.property(fc.anything(), (value) => {
        const result1 = isConstructable(value);
        const result2 = isConstructable(value);
        const result3 = isConstructable(value);

        // Should return the same result every time
        return result1 === result2 && result2 === result3;
      }),
    );
  });
});
