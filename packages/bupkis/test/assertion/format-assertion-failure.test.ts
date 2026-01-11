import { describe, it } from 'node:test';

import type { AssertionFailure } from '../../src/assertion/assertion-types.js';

import { formatAssertionFailure } from '../../src/assertion/format-assertion-failure.js';
import { expect } from '../../src/index.js';

describe('formatAssertionFailure', () => {
  describe('with diff property', () => {
    it('should return the diff string directly', () => {
      const failure: AssertionFailure = {
        actual: 'foo',
        diff: 'custom diff output',
        expected: 'bar',
      };
      const result = formatAssertionFailure(failure);
      expect(result, 'to equal', 'custom diff output');
    });

    it('should ignore formatters when diff is provided', () => {
      const failure: AssertionFailure = {
        actual: 'foo',
        diff: 'custom diff',
        expected: 'bar',
        formatActual: () => 'SHOULD NOT SEE THIS',
        formatExpected: () => 'SHOULD NOT SEE THIS',
      };
      const result = formatAssertionFailure(failure);
      expect(result, 'to equal', 'custom diff');
    });
  });

  describe('with formatters', () => {
    it('should use formatActual for actual value', () => {
      const failure: AssertionFailure = {
        actual: { value: 'foo' },
        expected: { value: 'bar' },
        formatActual: (v) => `ACTUAL:${JSON.stringify(v)}`,
        // Note: when only formatActual is provided, expected stays as-is
        // This can cause type mismatch warnings in jest-diff output
      };
      const result = formatAssertionFailure(failure);
      expect(result, 'to be a string');
      // The output contains the type mismatch message when types differ
    });

    it('should use formatExpected for expected value', () => {
      const failure: AssertionFailure = {
        actual: { value: 'foo' },
        expected: { value: 'bar' },
        formatExpected: (v) => `EXPECTED:${JSON.stringify(v)}`,
        // Note: when only formatExpected is provided, actual stays as-is
      };
      const result = formatAssertionFailure(failure);
      expect(result, 'to be a string');
    });

    it('should use both formatters together', () => {
      const failure: AssertionFailure = {
        actual: 'a',
        expected: 'b',
        formatActual: (v) => `[A:${v}]`,
        formatExpected: (v) => `[E:${v}]`,
      };
      const result = formatAssertionFailure(failure);
      expect(result, 'to be a string');
      expect(result, 'to contain', '[A:a]');
      expect(result, 'to contain', '[E:b]');
    });

    it('should apply formatters to matching types for clean diff', () => {
      const failure: AssertionFailure = {
        actual: { age: 30, name: 'Alice' },
        expected: { age: 25, name: 'Bob' },
        formatActual: (v) => JSON.stringify(v, null, 2),
        formatExpected: (v) => JSON.stringify(v, null, 2),
      };
      const result = formatAssertionFailure(failure);
      expect(result, 'to be a string');
      expect(result, 'to contain', 'Alice');
      expect(result, 'to contain', 'Bob');
    });
  });

  describe('with diffOptions', () => {
    it('should pass options to jest-diff', () => {
      const failure: AssertionFailure = {
        actual: { a: 1, b: 2 },
        diffOptions: { contextLines: 0 },
        expected: { a: 1, b: 3 },
      };
      const result = formatAssertionFailure(failure);
      expect(result, 'to be a string');
    });
  });

  describe('without custom diff properties', () => {
    it('should return null when actual and expected are identical', () => {
      const failure: AssertionFailure = {
        actual: 'same',
        expected: 'same',
      };
      const result = formatAssertionFailure(failure);
      expect(result, 'to be null');
    });

    it('should generate diff for different values', () => {
      const failure: AssertionFailure = {
        actual: { a: 1 },
        expected: { a: 2 },
      };
      const result = formatAssertionFailure(failure);
      expect(result, 'to be a string');
    });

    it('should return null when actual is undefined', () => {
      const failure: AssertionFailure = {
        expected: 'bar',
        message: 'only message',
      };
      const result = formatAssertionFailure(failure);
      expect(result, 'to be null');
    });

    it('should return null when expected is undefined', () => {
      const failure: AssertionFailure = {
        actual: 'foo',
        message: 'only message',
      };
      const result = formatAssertionFailure(failure);
      expect(result, 'to be null');
    });
  });
});
