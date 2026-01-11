import { describe, it } from 'node:test';

import { expect } from '../src/index.js';
import { isAssertionFailure } from '../src/internal-schema.js';

describe('isAssertionFailure', () => {
  describe('with new diff properties', () => {
    it('should accept diff string property', () => {
      const result = isAssertionFailure({
        actual: 'foo',
        diff: '- expected\n+ actual',
        expected: 'bar',
      });
      expect(result, 'to be true');
    });

    it('should accept formatActual function property', () => {
      const result = isAssertionFailure({
        actual: 'foo',
        expected: 'bar',
        formatActual: (v) => `formatted: ${v}`,
      });
      expect(result, 'to be true');
    });

    it('should accept formatExpected function property', () => {
      const result = isAssertionFailure({
        actual: 'foo',
        expected: 'bar',
        formatExpected: (v) => `formatted: ${v}`,
      });
      expect(result, 'to be true');
    });

    it('should accept diffOptions object property', () => {
      const result = isAssertionFailure({
        actual: 'foo',
        diffOptions: { expand: true },
        expected: 'bar',
      });
      expect(result, 'to be true');
    });

    it('should accept all new properties together', () => {
      const result = isAssertionFailure({
        actual: 'foo',
        diff: 'custom diff',
        diffOptions: { expand: true },
        expected: 'bar',
        formatActual: (v) => `${v}`,
        formatExpected: (v) => `${v}`,
        message: 'test message',
      });
      expect(result, 'to be true');
    });

    it('should reject non-string diff property', () => {
      const result = isAssertionFailure({
        actual: 'foo',
        diff: 123,
        expected: 'bar',
      });
      expect(result, 'to be false');
    });

    it('should reject non-function formatActual property', () => {
      const result = isAssertionFailure({
        actual: 'foo',
        expected: 'bar',
        formatActual: 'not a function',
      });
      expect(result, 'to be false');
    });
  });
});
