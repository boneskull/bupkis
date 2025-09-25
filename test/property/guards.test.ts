/* eslint-disable func-style */
/* eslint-disable prefer-arrow-callback */
import * as fc from 'fast-check';
import { describe, it } from 'node:test';

import { expect } from '../../src/bootstrap.js';
import { isConstructible } from '../../src/guards.js';
import {
  calculateNumRuns,
  filteredAnything,
  filteredObject,
} from './property-test-util.js';

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
            // eslint-disable-next-line @typescript-eslint/no-misused-promises
            async () => {
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
});
