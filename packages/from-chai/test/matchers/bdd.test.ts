import { expect } from 'bupkis';
import { describe, it } from 'node:test';

import { bddMatchers, getBddMatcher } from '../../src/matchers/bdd.js';

describe('BDD matchers', () => {
  describe('bddMatchers', () => {
    it('should include equal matcher', () => {
      const matcher = bddMatchers.find((m) => m.chaiMatcher === 'equal');
      expect(matcher, 'to be defined');
      expect(matcher?.bupkisPhrase, 'to be', 'to be');
    });

    it('should include deep.equal matcher', () => {
      const matcher = bddMatchers.find((m) => m.chaiMatcher === 'deep.equal');
      expect(matcher, 'to be defined');
      expect(matcher?.bupkisPhrase, 'to be', 'to deep equal');
    });

    it('should include be.true matcher', () => {
      const matcher = bddMatchers.find((m) => m.chaiMatcher === 'be.true');
      expect(matcher, 'to be defined');
      expect(matcher?.bupkisPhrase, 'to be', 'to be true');
    });

    it('should include be.a type matcher', () => {
      const matcher = bddMatchers.find((m) => m.chaiMatcher === 'be.a');
      expect(matcher, 'to be defined');
      expect(matcher?.bupkisPhrase, 'to be', 'to be a');
    });

    it('should include throw matcher', () => {
      const matcher = bddMatchers.find((m) => m.chaiMatcher === 'throw');
      expect(matcher, 'to be defined');
      expect(matcher?.bupkisPhrase, 'to be', 'to throw');
    });
  });

  describe('getBddMatcher', () => {
    it('should return matcher for known chain', () => {
      const matcher = getBddMatcher('equal');
      expect(matcher, 'to be defined');
      expect(matcher?.bupkisPhrase, 'to be', 'to be');
    });

    it('should return matcher for compound chain like deep.equal', () => {
      const matcher = getBddMatcher('deep.equal');
      expect(matcher, 'to be defined');
      expect(matcher?.bupkisPhrase, 'to be', 'to deep equal');
    });

    it('should return undefined for unknown chain', () => {
      const matcher = getBddMatcher('unknownMatcher');
      expect(matcher, 'to be undefined');
    });
  });
});
