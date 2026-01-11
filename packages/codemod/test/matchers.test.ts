import { expect } from 'bupkis';
import { describe, it } from 'node:test';

import { getCoreMatchers, getMatcherTransform } from '../src/matchers/index.js';

describe('matcher registry', () => {
  describe('getCoreMatchers', () => {
    it('should include toBe matcher', () => {
      const matchers = getCoreMatchers();
      expect(matchers, 'to have property', 'toBe');
    });

    it('should include toEqual matcher', () => {
      const matchers = getCoreMatchers();
      expect(matchers, 'to have property', 'toEqual');
    });

    it('should include toStrictEqual matcher', () => {
      const matchers = getCoreMatchers();
      expect(matchers, 'to have property', 'toStrictEqual');
    });
  });

  describe('getMatcherTransform', () => {
    it('should return transform for known matcher', () => {
      const transform = getMatcherTransform('toBe');
      expect(transform, 'to be defined');
      expect(transform?.bupkisPhrase, 'to equal', 'to be');
    });

    it('should return undefined for unknown matcher', () => {
      const transform = getMatcherTransform('toBeWeird');
      expect(transform, 'to be undefined');
    });
  });
});
