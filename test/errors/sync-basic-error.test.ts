/**
 * Snapshot tests for sync-basic assertion errors.
 *
 * These tests capture the error output format for failing assertions to ensure
 * consistent error messages across versions.
 */

import { describe, it } from 'node:test';

import { expect } from '../../src/index.js';

describe('sync-basic error snapshots', () => {
  it('should capture string assertion error', (t) => {
    let error: unknown;
    try {
      expect(42, 'to be a string');
    } catch (err) {
      error = err;
    }
    t.assert.snapshot(error);
  });

  it('should capture number assertion error', (t) => {
    let error: unknown;
    try {
      expect('hello', 'to be a number');
    } catch (err) {
      error = err;
    }
    t.assert.snapshot(error);
  });

  it('should capture infinite assertion error', (t) => {
    let error: unknown;
    try {
      expect(42, 'to be infinite');
    } catch (err) {
      error = err;
    }
    t.assert.snapshot(error);
  });

  it('should capture positive infinity assertion error', (t) => {
    let error: unknown;
    try {
      expect(-Infinity, 'to be positive infinity');
    } catch (err) {
      error = err;
    }
    t.assert.snapshot(error);
  });

  it('should capture negative infinity assertion error', (t) => {
    let error: unknown;
    try {
      expect(Infinity, 'to be negative infinity');
    } catch (err) {
      error = err;
    }
    t.assert.snapshot(error);
  });

  it('should capture boolean assertion error', (t) => {
    let error: unknown;
    try {
      expect('hello', 'to be a boolean');
    } catch (err) {
      error = err;
    }
    t.assert.snapshot(error);
  });

  it('should capture positive assertion error', (t) => {
    let error: unknown;
    try {
      expect(-5, 'to be positive');
    } catch (err) {
      error = err;
    }
    t.assert.snapshot(error);
  });

  it('should capture positive integer assertion error', (t) => {
    let error: unknown;
    try {
      expect(-5, 'to be a positive integer');
    } catch (err) {
      error = err;
    }
    t.assert.snapshot(error);
  });

  it('should capture negative assertion error', (t) => {
    let error: unknown;
    try {
      expect(5, 'to be negative');
    } catch (err) {
      error = err;
    }
    t.assert.snapshot(error);
  });

  it('should capture negative integer assertion error', (t) => {
    let error: unknown;
    try {
      expect(5, 'to be a negative integer');
    } catch (err) {
      error = err;
    }
    t.assert.snapshot(error);
  });

  it('should capture true assertion error', (t) => {
    let error: unknown;
    try {
      expect(false, 'to be true');
    } catch (err) {
      error = err;
    }
    t.assert.snapshot(error);
  });

  it('should capture false assertion error', (t) => {
    let error: unknown;
    try {
      expect(true, 'to be false');
    } catch (err) {
      error = err;
    }
    t.assert.snapshot(error);
  });

  it('should capture bigint assertion error', (t) => {
    let error: unknown;
    try {
      expect(42, 'to be a bigint');
    } catch (err) {
      error = err;
    }
    t.assert.snapshot(error);
  });

  it('should capture symbol assertion error', (t) => {
    let error: unknown;
    try {
      expect('hello', 'to be a symbol');
    } catch (err) {
      error = err;
    }
    t.assert.snapshot(error);
  });

  it('should capture function assertion error', (t) => {
    let error: unknown;
    try {
      expect('hello', 'to be a function');
    } catch (err) {
      error = err;
    }
    t.assert.snapshot(error);
  });

  it('should capture async function assertion error', (t) => {
    let error: unknown;
    try {
      expect(() => {}, 'to be an async function');
    } catch (err) {
      error = err;
    }
    t.assert.snapshot(error);
  });

  it('should capture NaN assertion error', (t) => {
    let error: unknown;
    try {
      expect(42, 'to be NaN');
    } catch (err) {
      error = err;
    }
    t.assert.snapshot(error);
  });

  it('should capture integer assertion error', (t) => {
    let error: unknown;
    try {
      expect(3.14, 'to be an integer');
    } catch (err) {
      error = err;
    }
    t.assert.snapshot(error);
  });

  it('should capture null assertion error', (t) => {
    let error: unknown;
    try {
      expect(undefined, 'to be null');
    } catch (err) {
      error = err;
    }
    t.assert.snapshot(error);
  });

  it('should capture undefined assertion error', (t) => {
    let error: unknown;
    try {
      expect(null, 'to be undefined');
    } catch (err) {
      error = err;
    }
    t.assert.snapshot(error);
  });

  it('should capture array assertion error', (t) => {
    let error: unknown;
    try {
      expect('hello', 'to be an array');
    } catch (err) {
      error = err;
    }
    t.assert.snapshot(error);
  });

  it('should capture date assertion error', (t) => {
    let error: unknown;
    try {
      expect('hello', 'to be a date');
    } catch (err) {
      error = err;
    }
    t.assert.snapshot(error);
  });

  it('should capture class assertion error', (t) => {
    let error: unknown;
    try {
      expect('hello', 'to be a class');
    } catch (err) {
      error = err;
    }
    t.assert.snapshot(error);
  });

  it('should capture primitive assertion error', (t) => {
    let error: unknown;
    try {
      expect({}, 'to be a primitive');
    } catch (err) {
      error = err;
    }
    t.assert.snapshot(error);
  });

  it('should capture regexp assertion error', (t) => {
    let error: unknown;
    try {
      expect('hello', 'to be a regexp');
    } catch (err) {
      error = err;
    }
    t.assert.snapshot(error);
  });

  it('should capture truthy assertion error', (t) => {
    let error: unknown;
    try {
      expect(0, 'to be truthy');
    } catch (err) {
      error = err;
    }
    t.assert.snapshot(error);
  });

  it('should capture falsy assertion error', (t) => {
    let error: unknown;
    try {
      expect(1, 'to be falsy');
    } catch (err) {
      error = err;
    }
    t.assert.snapshot(error);
  });

  it('should capture object assertion error', (t) => {
    let error: unknown;
    try {
      expect('hello', 'to be an object');
    } catch (err) {
      error = err;
    }
    t.assert.snapshot(error);
  });

  it('should capture record assertion error', (t) => {
    let error: unknown;
    try {
      expect([], 'to be a record');
    } catch (err) {
      error = err;
    }
    t.assert.snapshot(error);
  });

  it('should capture empty array assertion error', (t) => {
    let error: unknown;
    try {
      expect([1, 2, 3], 'to be an empty array');
    } catch (err) {
      error = err;
    }
    t.assert.snapshot(error);
  });

  it('should capture empty object assertion error', (t) => {
    let error: unknown;
    try {
      expect({ foo: 'bar' }, 'to be an empty object');
    } catch (err) {
      error = err;
    }
    t.assert.snapshot(error);
  });

  it('should capture error assertion error', (t) => {
    let error: unknown;
    try {
      expect('hello', 'to be an error');
    } catch (err) {
      error = err;
    }
    t.assert.snapshot(error);
  });

  it('should capture empty string assertion error', (t) => {
    let error: unknown;
    try {
      expect('hello', 'to be an empty string');
    } catch (err) {
      error = err;
    }
    t.assert.snapshot(error);
  });

  it('should capture non empty string assertion error', (t) => {
    let error: unknown;
    try {
      expect('', 'to be a non empty string');
    } catch (err) {
      error = err;
    }
    t.assert.snapshot(error);
  });

  it('should capture defined assertion error', (t) => {
    let error: unknown;
    try {
      expect(undefined, 'to be defined');
    } catch (err) {
      error = err;
    }
    t.assert.snapshot(error);
  });

  it('should capture set assertion error', (t) => {
    let error: unknown;
    try {
      expect('hello', 'to be a Set');
    } catch (err) {
      error = err;
    }
    t.assert.snapshot(error);
  });

  it('should capture weak map assertion error', (t) => {
    let error: unknown;
    try {
      expect('hello', 'to be a WeakMap');
    } catch (err) {
      error = err;
    }
    t.assert.snapshot(error);
  });

  it('should capture weak set assertion error', (t) => {
    let error: unknown;
    try {
      expect('hello', 'to be a WeakSet');
    } catch (err) {
      error = err;
    }
    t.assert.snapshot(error);
  });
});
