import { describe, it } from 'node:test';

import { expect } from '../src/index.js';

describe('expect()', () => {
  it('should have property "fail" of type function', () => {
    expect(expect.fail, 'to be a function');
  });
});

describe('expect.fail()', () => {
  it('should throw an AssertionError when called without arguments', () => {
    expect(() => expect.fail(), 'to throw');
  });
});
