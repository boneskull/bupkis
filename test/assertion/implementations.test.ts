import { describe, it } from 'node:test';

import { expect } from '../../src/index.js';

describe('Synchronous expect assertions', () => {
  describe('Collection assertions', () => {
    describe('Map assertions', () => {
      describe('to contain / to include', () => {
        describe('when Map contains the key', () => {
          it('should pass', () => {
            const map = new Map([
              ['key1', 'value1'],
              ['key2', 'value2'],
            ]);
            expect(() => expect(map, 'to contain', 'key1'), 'not to throw');
            expect(() => expect(map, 'to include', 'key2'), 'not to throw');

            const numMap = new Map([[42, 'value']]);
            expect(() => expect(numMap, 'to include', 42), 'not to throw');
          });
        });

        describe('when Map does not contain the key', () => {
          it('should fail', () => {
            const map = new Map([['key1', 'value1']]);
            expect(() => expect(map, 'to contain', 'key2'), 'to throw');
            expect(() => expect(map, 'to include', 'missing'), 'to throw');
          });
        });
      });

      describe('to have size', () => {
        describe('when Map has the correct size', () => {
          it('should pass', () => {
            const map = new Map([
              ['a', 1],
              ['b', 2],
              ['c', 3],
            ]);
            expect(() => expect(map, 'to have size', 3), 'not to throw');
          });
        });

        describe('when Map has incorrect size', () => {
          it('should fail', () => {
            const map = new Map([
              ['a', 1],
              ['b', 2],
            ]);
            expect(() => expect(map, 'to have size', 5), 'to throw');
          });
        });
      });

      describe('to be empty', () => {
        describe('when Map is empty', () => {
          it('should pass', () => {
            const map = new Map();
            expect(() => expect(map, 'to be empty'), 'not to throw');
          });
        });

        describe('when Map is not empty', () => {
          it('should fail', () => {
            const map = new Map([['a', 1]]);
            expect(() => expect(map, 'to be empty'), 'to throw');
          });
        });
      });
    });

    describe('Set assertions', () => {
      describe('to contain / to include', () => {
        describe('when Set contains the value', () => {
          it('should pass', () => {
            const set = new Set([42, true, 'value1']);
            expect(() => expect(set, 'to contain', 'value1'), 'not to throw');
            expect(() => expect(set, 'to include', 42), 'not to throw');
            expect(() => expect(set, 'to contain', true), 'not to throw');
          });
        });

        describe('when Set does not contain the value', () => {
          it('should fail', () => {
            const set = new Set(['value1']);
            expect(() => expect(set, 'to contain', 'value2'), 'to throw');
            expect(() => expect(set, 'to include', 'missing'), 'to throw');
          });
        });
      });

      describe('to have size', () => {
        describe('when Set has the correct size', () => {
          it('should pass', () => {
            const set = new Set(['a', 'b', 'c']);
            expect(() => expect(set, 'to have size', 3), 'not to throw');
          });
        });

        describe('when Set has incorrect size', () => {
          it('should fail', () => {
            const set = new Set(['a', 'b']);
            expect(() => expect(set, 'to have size', 5), 'to throw');
          });
        });
      });

      describe('to be empty', () => {
        describe('when Set is empty', () => {
          it('should pass', () => {
            const set = new Set();
            expect(() => expect(set, 'to be empty'), 'not to throw');
          });
        });

        describe('when Set is not empty', () => {
          it('should fail', () => {
            const set = new Set(['a']);
            expect(() => expect(set, 'to be empty'), 'to throw');
          });
        });
      });
    });

    describe('WeakMap assertions', () => {
      describe('to contain / to include', () => {
        describe('when WeakMap contains the object key', () => {
          it('should pass', () => {
            const key1 = {};
            const key2: object[] = [];
            const weakMap = new WeakMap([
              [key1, 'value1'],
              [key2, 'value2'],
            ]);
            expect(() => expect(weakMap, 'to contain', key1), 'not to throw');
            expect(() => expect(weakMap, 'to include', key2), 'not to throw');
          });
        });

        describe('when WeakMap does not contain the object key', () => {
          it('should fail', () => {
            const key1 = {};
            const key2 = {};
            const weakMap = new WeakMap([[key1, 'value1']]);
            expect(() => expect(weakMap, 'to contain', key2), 'to throw');
            expect(() => expect(weakMap, 'to include', key2), 'to throw');
          });
        });

        describe('when checking non-object keys', () => {
          it('should fail', () => {
            const weakMap = new WeakMap();
            expect(() => expect(weakMap, 'to contain', 'string'), 'to throw');
            expect(() => expect(weakMap, 'to include', 42), 'to throw');
            expect(() => expect(weakMap, 'to contain', null), 'to throw');
          });
        });
      });
    });

    describe('WeakSet assertions', () => {
      describe('to contain / to include', () => {
        describe('when WeakSet contains the object value', () => {
          it('should pass', () => {
            const obj1 = {};
            const obj2: object[] = [];
            const weakSet = new WeakSet([obj1, obj2]);
            expect(() => expect(weakSet, 'to contain', obj1), 'not to throw');
            expect(() => expect(weakSet, 'to include', obj2), 'not to throw');
          });
        });

        describe('when WeakSet does not contain the object value', () => {
          it('should fail', () => {
            const obj1 = {};
            const obj2 = {};
            const weakSet = new WeakSet([obj1]);
            expect(() => expect(weakSet, 'to contain', obj2), 'to throw');
            expect(() => expect(weakSet, 'to include', obj2), 'to throw');
          });
        });

        describe('when checking non-object values', () => {
          it('should fail', () => {
            const weakSet = new WeakSet();
            expect(() => expect(weakSet, 'to contain', 'string'), 'to throw');
            expect(() => expect(weakSet, 'to include', 42), 'to throw');
            expect(() => expect(weakSet, 'to contain', null), 'to throw');
          });
        });
      });
    });
  });
});
