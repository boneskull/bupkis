import { expect } from 'bupkis';
import { describe, it } from 'node:test';

import {
  allMatchers,
  getMatcherTransform,
  isMatcherSupported,
} from '../../src/matchers/index.js';

describe('matchers index', () => {
  describe('allMatchers', () => {
    it('should include BDD matchers', () => {
      const matcher = allMatchers.find((m) => m.chaiMatcher === 'equal');
      expect(matcher, 'to be defined');
    });

    it('should include TDD matchers', () => {
      const matcher = allMatchers.find((m) => m.chaiMatcher === 'isTrue');
      expect(matcher, 'to be defined');
    });

    it('should include plugin matchers', () => {
      const matcher = allMatchers.find(
        (m) => m.chaiMatcher === 'eventually.equal',
      );
      expect(matcher, 'to be defined');
    });
  });

  describe('getMatcherTransform', () => {
    it('should find BDD matcher', () => {
      const matcher = getMatcherTransform('deep.equal');
      expect(matcher, 'to be defined');
      expect(matcher?.bupkisPhrase, 'to be', 'to deep equal');
    });

    it('should find TDD matcher', () => {
      const matcher = getMatcherTransform('deepEqual');
      expect(matcher, 'to be defined');
      expect(matcher?.bupkisPhrase, 'to be', 'to deep equal');
    });

    it('should find plugin matcher', () => {
      const matcher = getMatcherTransform('be.fulfilled');
      expect(matcher, 'to be defined');
      expect(matcher?.bupkisPhrase, 'to be', 'to be fulfilled');
    });

    it('should return undefined for unknown matcher', () => {
      const matcher = getMatcherTransform('unknownMatcher');
      expect(matcher, 'to be undefined');
    });
  });

  describe('isMatcherSupported', () => {
    it('should return true for BDD matcher', () => {
      expect(isMatcherSupported('equal'), 'to be true');
    });

    it('should return true for TDD matcher', () => {
      expect(isMatcherSupported('isTrue'), 'to be true');
    });

    it('should return true for plugin matcher', () => {
      expect(isMatcherSupported('startWith'), 'to be true');
    });

    it('should return false for unknown matcher', () => {
      expect(isMatcherSupported('unknownMatcher'), 'to be false');
    });
  });
});
