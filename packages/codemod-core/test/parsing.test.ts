import { expect } from 'bupkis';
import { describe, it } from 'node:test';

import {
  extractBalancedContent,
  extractCallSubject,
  parseArguments,
} from '../src/parsing.js';

describe('parseArguments', () => {
  it('should parse simple arguments', () => {
    expect(parseArguments('a, b, c'), 'to deep equal', ['a', 'b', 'c']);
  });

  it('should handle single argument', () => {
    expect(parseArguments('foo'), 'to deep equal', ['foo']);
  });

  it('should handle empty string', () => {
    expect(parseArguments(''), 'to deep equal', []);
  });

  it('should handle whitespace-only string', () => {
    expect(parseArguments('   '), 'to deep equal', []);
  });

  it('should trim whitespace from arguments', () => {
    expect(parseArguments('  a  ,  b  '), 'to deep equal', ['a', 'b']);
  });

  it('should handle nested parentheses', () => {
    expect(parseArguments('foo(1, 2), bar'), 'to deep equal', [
      'foo(1, 2)',
      'bar',
    ]);
  });

  it('should handle nested brackets', () => {
    expect(parseArguments('[1, 2], [3, 4]'), 'to deep equal', [
      '[1, 2]',
      '[3, 4]',
    ]);
  });

  it('should handle nested braces', () => {
    expect(parseArguments('{ a: 1, b: 2 }, c'), 'to deep equal', [
      '{ a: 1, b: 2 }',
      'c',
    ]);
  });

  it('should handle deeply nested structures', () => {
    expect(parseArguments('foo({ a: [1, (2, 3)] }), bar'), 'to deep equal', [
      'foo({ a: [1, (2, 3)] })',
      'bar',
    ]);
  });

  it('should handle strings with commas', () => {
    expect(parseArguments('"a, b", c'), 'to deep equal', ['"a, b"', 'c']);
  });

  it('should handle single-quoted strings', () => {
    expect(parseArguments("'a, b', c"), 'to deep equal', ["'a, b'", 'c']);
  });

  it('should handle template literals', () => {
    expect(parseArguments('`a, b`, c'), 'to deep equal', ['`a, b`', 'c']);
  });

  it('should handle escaped quotes in strings', () => {
    expect(parseArguments('"a\\"b", c'), 'to deep equal', ['"a\\"b"', 'c']);
  });
});

describe('extractBalancedContent', () => {
  it('should extract content between parentheses', () => {
    const result = extractBalancedContent('(foo)', 0, '(', ')');
    expect(result, 'to satisfy', { content: 'foo', endIndex: 5 });
  });

  it('should handle nested parentheses', () => {
    const result = extractBalancedContent('(foo(bar))', 0, '(', ')');
    expect(result, 'to satisfy', { content: 'foo(bar)', endIndex: 10 });
  });

  it('should handle strings with parentheses', () => {
    const result = extractBalancedContent('("a)")', 0, '(', ')');
    expect(result, 'to satisfy', { content: '"a)"', endIndex: 6 });
  });

  it('should return null if not starting with open char', () => {
    const result = extractBalancedContent('foo)', 0, '(', ')');
    expect(result, 'to be null');
  });

  it('should return null if no matching close char', () => {
    const result = extractBalancedContent('(foo', 0, '(', ')');
    expect(result, 'to be null');
  });

  it('should handle brackets', () => {
    const result = extractBalancedContent('[1, 2]', 0, '[', ']');
    expect(result, 'to satisfy', { content: '1, 2', endIndex: 6 });
  });

  it('should handle braces', () => {
    const result = extractBalancedContent('{ a: 1 }', 0, '{', '}');
    expect(result, 'to satisfy', { content: 'a: 1', endIndex: 8 });
  });
});

describe('extractCallSubject', () => {
  it('should extract subject from expect call', () => {
    const result = extractCallSubject('expect(foo).toBe(1)', 'expect(');
    expect(result, 'to satisfy', { rest: '.toBe(1)', subject: 'foo' });
  });

  it('should handle nested calls in subject', () => {
    const result = extractCallSubject('expect(foo()).toBe(1)', 'expect(');
    expect(result, 'to satisfy', { rest: '.toBe(1)', subject: 'foo()' });
  });

  it('should handle complex subjects', () => {
    const result = extractCallSubject(
      'expect(obj.method(a, b)).toBe(1)',
      'expect(',
    );
    expect(result, 'to satisfy', {
      rest: '.toBe(1)',
      subject: 'obj.method(a, b)',
    });
  });

  it('should return null if prefix does not match', () => {
    const result = extractCallSubject('assert(foo)', 'expect(');
    expect(result, 'to be null');
  });

  it('should return null if parentheses are unbalanced', () => {
    const result = extractCallSubject('expect(foo', 'expect(');
    expect(result, 'to be null');
  });

  it('should work with different prefixes', () => {
    const result = extractCallSubject('assert(foo).equal(1)', 'assert(');
    expect(result, 'to satisfy', { rest: '.equal(1)', subject: 'foo' });
  });
});
