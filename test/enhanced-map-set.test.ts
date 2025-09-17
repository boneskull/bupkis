import { describe, it } from 'node:test';

import { expect } from '../src/bootstrap.js';

// Test the new enhanced Map/Set assertions
describe('Enhanced Map/Set Operations', () => {
  describe('Set Operations', () => {
    it('should handle set equality (order-independent)', () => {
      expect(new Set([1, 2, 3]), 'to equal', new Set([1, 2, 3]));
      expect(new Set(['a', 'b']), 'to equal', new Set(['a', 'b']));
    });

    it('should handle subset operations', () => {
      expect(new Set([1, 2]), 'to be a subset of', new Set([1, 2, 3, 4]));
      expect(new Set(['a']), 'to be a subset of', new Set(['a', 'b', 'c']));
    });

    it('should handle superset operations', () => {
      expect(new Set([1, 2, 3, 4]), 'to be a superset of', new Set([1, 2]));
      expect(new Set(['a', 'b', 'c']), 'to be a superset of', new Set(['a']));
    });

    it('should handle intersection operations', () => {
      expect(new Set([1, 2, 3]), 'to intersect with', new Set([3, 4, 5]));
      expect(new Set(['a', 'b']), 'to intersect with', new Set(['b', 'c']));
    });

    it('should handle disjoint operations', () => {
      expect(new Set([1, 2]), 'to be disjoint from', new Set([3, 4]));
      expect(new Set(['a', 'b']), 'to be disjoint from', new Set(['c', 'd']));
    });

    it('should handle set arithmetic operations', () => {
      expect(
        new Set([1, 2]),
        'to have union',
        new Set([3]),
        'equal to',
        new Set([1, 2, 3]),
      );
      expect(
        new Set([1, 2, 3]),
        'to have intersection',
        new Set([2, 3, 4]),
        'equal to',
        new Set([2, 3]),
      );
      expect(
        new Set([1, 2, 3]),
        'to have difference',
        new Set([2]),
        'equal to',
        new Set([1, 3]),
      );
      expect(
        new Set([1, 2]),
        'to have symmetric difference',
        new Set([2, 3]),
        'equal to',
        new Set([1, 3]),
      );
    });
  });

  describe('Map Operations', () => {
    it('should handle map key validation', () => {
      const map = new Map<string, unknown>([
        ['age', 30],
        ['user', 'john'],
      ]);
      expect(map, 'to have key', 'user');
      expect(map, 'to have key', 'age');
    });

    it('should handle map value validation', () => {
      const map = new Map([
        ['role', 'admin'],
        ['status', 'active'],
      ]);
      expect(map, 'to have value', 'admin');
      expect(map, 'to have value', 'active');
    });

    it('should handle map entry validation', () => {
      const map = new Map<string, unknown>([
        ['id', 123],
        ['name', 'test'],
      ]);
      expect(map, 'to have entry', ['id', 123]);
      expect(map, 'to have entry', ['name', 'test']);
    });

    it('should handle map equality (order-independent)', () => {
      const map1 = new Map([
        ['a', 1],
        ['b', 2],
      ]);
      const map2 = new Map([
        ['a', 1],
        ['b', 2],
      ]);
      expect(map1, 'to equal', map2);
    });
  });

  describe('Size Constraints', () => {
    it('should handle size greater than', () => {
      expect(new Set([1, 2, 3, 4, 5]), 'to have size greater than', 3);
      expect(
        new Map([
          ['a', 1],
          ['b', 2],
          ['c', 3],
        ]),
        'to have size greater than',
        2,
      );
    });

    it('should handle size less than', () => {
      expect(new Set([1, 2]), 'to have size less than', 5);
      expect(new Map([['a', 1]]), 'to have size less than', 3);
    });

    it('should handle size between', () => {
      expect(new Set([1, 2, 3]), 'to have size between', [2, 5]);
      expect(
        new Map([
          ['a', 1],
          ['b', 2],
        ]),
        'to have size between',
        [1, 3],
      );
    });
  });
});
