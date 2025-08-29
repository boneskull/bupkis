import { describe, it } from 'node:test';

import { expect } from '../src/index.js';

describe('Basic Optimization Test', () => {
  it('should work with string assertions', () => {
    expect(() => expect('hello', 'to be a string'), 'not to throw');
  });

  it('should work with negated assertions', () => {
    expect(() => expect(42, 'not to be a string'), 'not to throw');
  });

  it('should fail appropriately', () => {
    expect(() => expect(42, 'to be a string'), 'to throw');
  });
});
