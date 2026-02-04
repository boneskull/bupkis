import { expect } from 'bupkis';
import { describe, it } from 'node:test';

import {
  assertMatchers,
  getBaseMethod,
  getMatcherTransform,
  isAsyncMethod,
  isLegacyMethod,
  isMatcherSupported,
  isNegatedMethod,
} from '../../src/matchers/index.js';

describe('Assert matchers', () => {
  describe('assertMatchers', () => {
    it('should include strictEqual matcher', () => {
      const matcher = assertMatchers.find(
        (m) => m.assertMethod === 'strictEqual',
      );
      expect(matcher, 'to be defined');
      expect(matcher?.bupkisPhrase, 'to be', 'to be');
    });

    it('should include deepStrictEqual matcher', () => {
      const matcher = assertMatchers.find(
        (m) => m.assertMethod === 'deepStrictEqual',
      );
      expect(matcher, 'to be defined');
      expect(matcher?.bupkisPhrase, 'to be', 'to deep equal');
    });

    it('should include ok matcher', () => {
      const matcher = assertMatchers.find((m) => m.assertMethod === 'ok');
      expect(matcher, 'to be defined');
      expect(matcher?.bupkisPhrase, 'to be', 'to be truthy');
    });

    it('should include throws matcher', () => {
      const matcher = assertMatchers.find((m) => m.assertMethod === 'throws');
      expect(matcher, 'to be defined');
      expect(matcher?.bupkisPhrase, 'to be', 'to throw');
    });

    it('should include rejects matcher', () => {
      const matcher = assertMatchers.find((m) => m.assertMethod === 'rejects');
      expect(matcher, 'to be defined');
      expect(matcher?.bupkisPhrase, 'to be', 'to reject');
      expect(matcher?.isAsync, 'to be true');
    });

    it('should include match matcher', () => {
      const matcher = assertMatchers.find((m) => m.assertMethod === 'match');
      expect(matcher, 'to be defined');
      expect(matcher?.bupkisPhrase, 'to be', 'to match');
    });

    it('should include fail matcher with custom transform', () => {
      const matcher = assertMatchers.find((m) => m.assertMethod === 'fail');
      expect(matcher, 'to be defined');
      expect(matcher?.transform, 'to be defined');
    });
  });

  describe('getMatcherTransform', () => {
    it('should return matcher for known assertion', () => {
      const matcher = getMatcherTransform('strictEqual');
      expect(matcher, 'to be defined');
      expect(matcher?.bupkisPhrase, 'to be', 'to be');
    });

    it('should return matcher for ok', () => {
      const matcher = getMatcherTransform('ok');
      expect(matcher, 'to be defined');
      expect(matcher?.bupkisPhrase, 'to be', 'to be truthy');
    });

    it('should return undefined for unknown assertion', () => {
      const matcher = getMatcherTransform('unknownAssertion');
      expect(matcher, 'to be undefined');
    });

    it('should return undefined for unsupported assertion', () => {
      const matcher = getMatcherTransform('ifError');
      expect(matcher, 'to be undefined');
    });
  });

  describe('isMatcherSupported', () => {
    it('should return true for strictEqual', () => {
      expect(isMatcherSupported('strictEqual'), 'to be true');
    });

    it('should return true for ok', () => {
      expect(isMatcherSupported('ok'), 'to be true');
    });

    it('should return true for throws', () => {
      expect(isMatcherSupported('throws'), 'to be true');
    });

    it('should return true for rejects', () => {
      expect(isMatcherSupported('rejects'), 'to be true');
    });

    it('should return false for ifError', () => {
      expect(isMatcherSupported('ifError'), 'to be false');
    });

    it('should return false for CallTracker', () => {
      expect(isMatcherSupported('CallTracker'), 'to be false');
    });

    it('should return false for unknown methods', () => {
      expect(isMatcherSupported('unknownMethod'), 'to be false');
    });
  });

  describe('isNegatedMethod', () => {
    it('should return true for notStrictEqual', () => {
      expect(isNegatedMethod('notStrictEqual'), 'to be true');
    });

    it('should return true for notDeepStrictEqual', () => {
      expect(isNegatedMethod('notDeepStrictEqual'), 'to be true');
    });

    it('should return true for doesNotThrow', () => {
      expect(isNegatedMethod('doesNotThrow'), 'to be true');
    });

    it('should return true for doesNotReject', () => {
      expect(isNegatedMethod('doesNotReject'), 'to be true');
    });

    it('should return true for doesNotMatch', () => {
      expect(isNegatedMethod('doesNotMatch'), 'to be true');
    });

    it('should return false for strictEqual', () => {
      expect(isNegatedMethod('strictEqual'), 'to be false');
    });

    it('should return false for ok', () => {
      expect(isNegatedMethod('ok'), 'to be false');
    });
  });

  describe('getBaseMethod', () => {
    it('should return strictEqual for notStrictEqual', () => {
      expect(getBaseMethod('notStrictEqual'), 'to be', 'strictEqual');
    });

    it('should return deepStrictEqual for notDeepStrictEqual', () => {
      expect(getBaseMethod('notDeepStrictEqual'), 'to be', 'deepStrictEqual');
    });

    it('should return throws for doesNotThrow', () => {
      expect(getBaseMethod('doesNotThrow'), 'to be', 'throws');
    });

    it('should return rejects for doesNotReject', () => {
      expect(getBaseMethod('doesNotReject'), 'to be', 'rejects');
    });

    it('should return the same method for non-negated methods', () => {
      expect(getBaseMethod('strictEqual'), 'to be', 'strictEqual');
      expect(getBaseMethod('ok'), 'to be', 'ok');
    });
  });

  describe('isAsyncMethod', () => {
    it('should return true for rejects', () => {
      expect(isAsyncMethod('rejects'), 'to be true');
    });

    it('should return true for doesNotReject', () => {
      expect(isAsyncMethod('doesNotReject'), 'to be true');
    });

    it('should return false for throws', () => {
      expect(isAsyncMethod('throws'), 'to be false');
    });

    it('should return false for strictEqual', () => {
      expect(isAsyncMethod('strictEqual'), 'to be false');
    });
  });

  describe('isLegacyMethod', () => {
    it('should return true for equal', () => {
      expect(isLegacyMethod('equal'), 'to be true');
    });

    it('should return true for notEqual', () => {
      expect(isLegacyMethod('notEqual'), 'to be true');
    });

    it('should return true for deepEqual', () => {
      expect(isLegacyMethod('deepEqual'), 'to be true');
    });

    it('should return false for strictEqual', () => {
      expect(isLegacyMethod('strictEqual'), 'to be false');
    });

    it('should return false for deepStrictEqual', () => {
      expect(isLegacyMethod('deepStrictEqual'), 'to be false');
    });
  });
});
