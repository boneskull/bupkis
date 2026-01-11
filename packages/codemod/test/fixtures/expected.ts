import { describe, it } from '@jest/globals';
import { expect } from "bupkis";

describe('example test suite', () => {
  it('tests equality', () => {
    expect(42, 'to be', 42);
    expect({ a: 1 }, 'to deep equal', { a: 1 });
    expect({ a: 1, b: 2 }, 'to deep equal', { a: 1, b: 2 });
  });

  it('tests truthiness', () => {
    expect(true, 'to be truthy');
    expect(false, 'to be falsy');
    expect(null, 'to be null');
    expect(undefined, 'to be undefined');
    expect('defined', 'to be defined');
  });

  it('tests negation', () => {
    expect(42, 'not to be', 0);
    expect({}, 'not to deep equal', { a: 1 });
  });

  it('tests numbers', () => {
    expect(10, 'to be greater than', 5);
    expect(5, 'to be less than', 10);
    expect(0.1 + 0.2, 'to be close to', 0.3);
  });

  it('tests strings', () => {
    expect('hello world', 'to match', /hello/);
    expect('hello world', 'to contain', 'world');
  });

  it('tests arrays', () => {
    expect([1, 2, 3], 'to have length', 3);
    expect([1, 2, 3], 'to contain', 2);
  });

  it('tests objects', () => {
    expect({ a: 1, b: 2 }, 'to have property', 'a');
    expect({ a: 1, b: 2 }, 'to satisfy', { a: 1 });
  });

  it('tests errors', () => {
    expect(() => {
      throw new Error('oops');
    }, 'to throw');
  });

  it('tests instances', () => {
    expect(new Date(), 'to be an instance of', Date);
  });
});
