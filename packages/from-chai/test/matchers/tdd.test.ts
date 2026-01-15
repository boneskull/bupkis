import { expect } from 'bupkis';
import { describe, it } from 'node:test';

import { getTddMatcher, tddMatchers } from '../../src/matchers/tdd.js';

describe('TDD matchers', () => {
  describe('tddMatchers', () => {
    it('should include equal matcher', () => {
      const matcher = tddMatchers.find((m) => m.chaiMatcher === 'equal');
      expect(matcher, 'to be defined');
      expect(matcher?.bupkisPhrase, 'to be', 'to be');
    });

    it('should include deepEqual matcher', () => {
      const matcher = tddMatchers.find((m) => m.chaiMatcher === 'deepEqual');
      expect(matcher, 'to be defined');
      expect(matcher?.bupkisPhrase, 'to be', 'to deep equal');
    });

    it('should include isTrue matcher', () => {
      const matcher = tddMatchers.find((m) => m.chaiMatcher === 'isTrue');
      expect(matcher, 'to be defined');
      expect(matcher?.bupkisPhrase, 'to be', 'to be true');
    });

    it('should include notEqual matcher', () => {
      const matcher = tddMatchers.find((m) => m.chaiMatcher === 'notEqual');
      expect(matcher, 'to be defined');
      expect(matcher?.bupkisPhrase, 'to be', 'to be');
    });

    it('should include throws matcher', () => {
      const matcher = tddMatchers.find((m) => m.chaiMatcher === 'throws');
      expect(matcher, 'to be defined');
      expect(matcher?.bupkisPhrase, 'to be', 'to throw');
    });
  });

  describe('getTddMatcher', () => {
    it('should return matcher for known assertion', () => {
      const matcher = getTddMatcher('equal');
      expect(matcher, 'to be defined');
      expect(matcher?.bupkisPhrase, 'to be', 'to be');
    });

    it('should return matcher for isTrue', () => {
      const matcher = getTddMatcher('isTrue');
      expect(matcher, 'to be defined');
      expect(matcher?.bupkisPhrase, 'to be', 'to be true');
    });

    it('should return undefined for unknown assertion', () => {
      const matcher = getTddMatcher('unknownAssertion');
      expect(matcher, 'to be undefined');
    });
  });
});
