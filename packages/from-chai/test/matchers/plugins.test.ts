import { expect } from 'bupkis';
import { describe, it } from 'node:test';

import {
  getPluginMatcher,
  pluginMatchers,
} from '../../src/matchers/plugins.js';

describe('Plugin matchers', () => {
  describe('pluginMatchers', () => {
    // chai-as-promised
    it('should include eventually.equal matcher', () => {
      const matcher = pluginMatchers.find(
        (m) => m.chaiMatcher === 'eventually.equal',
      );
      expect(matcher, 'to be defined');
      expect(matcher?.bupkisPhrase, 'to be', 'to be fulfilled with');
    });

    it('should include be.fulfilled matcher', () => {
      const matcher = pluginMatchers.find(
        (m) => m.chaiMatcher === 'be.fulfilled',
      );
      expect(matcher, 'to be defined');
      expect(matcher?.bupkisPhrase, 'to be', 'to be fulfilled');
    });

    it('should include be.rejected matcher', () => {
      const matcher = pluginMatchers.find(
        (m) => m.chaiMatcher === 'be.rejected',
      );
      expect(matcher, 'to be defined');
      expect(matcher?.bupkisPhrase, 'to be', 'to be rejected');
    });

    it('should include be.rejectedWith matcher', () => {
      const matcher = pluginMatchers.find(
        (m) => m.chaiMatcher === 'be.rejectedWith',
      );
      expect(matcher, 'to be defined');
      expect(matcher?.bupkisPhrase, 'to be', 'to be rejected with');
    });

    // chai-string
    it('should include startWith matcher', () => {
      const matcher = pluginMatchers.find((m) => m.chaiMatcher === 'startWith');
      expect(matcher, 'to be defined');
      expect(matcher?.bupkisPhrase, 'to be', 'to start with');
    });

    it('should include endWith matcher', () => {
      const matcher = pluginMatchers.find((m) => m.chaiMatcher === 'endWith');
      expect(matcher, 'to be defined');
      expect(matcher?.bupkisPhrase, 'to be', 'to end with');
    });

    // chai-subset
    it('should include containSubset matcher', () => {
      const matcher = pluginMatchers.find(
        (m) => m.chaiMatcher === 'containSubset',
      );
      expect(matcher, 'to be defined');
      expect(matcher?.bupkisPhrase, 'to be', 'to satisfy');
    });
  });

  describe('getPluginMatcher', () => {
    it('should return matcher for known plugin chain', () => {
      const matcher = getPluginMatcher('eventually.equal');
      expect(matcher, 'to be defined');
      expect(matcher?.bupkisPhrase, 'to be', 'to be fulfilled with');
    });

    it('should return undefined for unknown chain', () => {
      const matcher = getPluginMatcher('unknownPlugin');
      expect(matcher, 'to be undefined');
    });
  });
});
