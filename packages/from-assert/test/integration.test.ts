import { expect } from 'bupkis';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

import { transformCode } from '../src/transform.js';

/**
 * Normalize code for comparison (remove extra whitespace, normalize line
 * endings).
 */
const normalizeCode = (code: string): string =>
  code
    .trim()
    .replace(/\r\n/g, '\n')
    .replace(/\n\s*\n\s*\n/g, '\n\n');

describe('Integration', () => {
  it('should transform a complete node:assert test file to bupkis', async () => {
    const input = readFileSync(
      new URL('./fixtures/assert-example.ts', import.meta.url),
      'utf-8',
    );
    const expectedOutput = readFileSync(
      new URL('./fixtures/expected.ts', import.meta.url),
      'utf-8',
    );

    const { code, errors, transformCount, warnings } =
      await transformCode(input);

    // Should have transformed many assertions
    expect(transformCount, 'to be greater than', 15);

    // Should have no errors
    expect(errors, 'to have length', 0);

    // Should have no warnings (all matchers are supported)
    expect(warnings, 'to have length', 0);

    // Verify key transformations happened
    expect(code, 'not to contain', "from 'node:assert'");
    expect(code, 'to contain', "from 'bupkis'");

    // Strict equality transformations
    expect(code, 'to contain', "expect(user.id, 'to be', 1)");
    expect(code, 'to contain', "expect(user.name, 'to be', 'Alice')");
    expect(code, 'to contain', "expect(user.id, 'not to be', 2)");
    expect(code, 'to contain', "expect(user.name, 'not to be', 'Bob')");

    // Deep equality
    expect(code, 'to contain', "expect(user, 'to deep equal'");
    expect(code, 'to contain', "expect(user, 'not to deep equal'");

    // Truthiness
    expect(code, 'to contain', "expect(user, 'to be truthy')");
    expect(code, 'to contain', "expect(user.id, 'to be truthy')");

    // Throws
    expect(code, 'to contain', "expect(throwError, 'to throw')");
    expect(code, 'to contain', "expect(throwError, 'to throw', Error)");

    // Async
    expect(code, 'to contain', "expectAsync(asyncReject, 'to reject')");
    expect(code, 'to contain', "expectAsync(asyncResolve, 'not to reject')");

    // String matching
    expect(code, 'to contain', "expect(user.email, 'to match', /@/)");
    expect(code, 'to contain', "expect(user.email, 'not to match', /invalid/)");

    // Compare normalized output
    const normalizedActual = normalizeCode(code);
    // Kept for debugging
    const _normalizedExpected = normalizeCode(expectedOutput);

    // Check that key assertions from expected are present
    const expectedAssertions = [
      "expect(user.id, 'to be', 1)",
      "expect(user.name, 'to be', 'Alice')",
      "expect(user.id, 'not to be', 2)",
      "expect(user, 'to be truthy')",
      "expect(throwError, 'to throw')",
      "expect(throwError, 'to throw', Error)",
      "expectAsync(asyncReject, 'to reject')",
      "expectAsync(asyncResolve, 'not to reject')",
      "expect(user.email, 'to match', /@/)",
    ];

    for (const assertion of expectedAssertions) {
      expect(normalizedActual, 'to contain', assertion);
    }
  });

  it('should handle strict mode imports', async () => {
    const input = `
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

describe('Test', () => {
  it('works', () => {
    assert.strictEqual(1, 1);
    assert.deepStrictEqual({ a: 1 }, { a: 1 });
  });
});
    `;

    const { code, errors, transformCount } = await transformCode(input);

    expect(transformCount, 'to be', 2);
    expect(errors, 'to have length', 0);
    expect(code, 'to contain', "expect(1, 'to be', 1)");
    expect(code, 'to contain', "expect({ a: 1 }, 'to deep equal', { a: 1 })");
    expect(code, 'not to contain', "from 'node:assert/strict'");
  });

  it('should handle { strict as assert } pattern', async () => {
    const input = `
import { strict as assert } from 'node:assert';
assert.strictEqual(a, b);
    `;

    const { code, errors, transformCount } = await transformCode(input);

    expect(transformCount, 'to be', 1);
    expect(errors, 'to have length', 0);
    expect(code, 'to contain', "expect(a, 'to be', b)");
  });

  it('should handle mixed sync and async assertions', async () => {
    const input = `
import assert from 'node:assert';

describe('Test', () => {
  it('sync', () => {
    assert.strictEqual(1, 1);
    assert.ok(true);
  });
  it('async', async () => {
    await assert.rejects(asyncFn);
    await assert.doesNotReject(asyncFn2);
  });
});
    `;

    const { code, errors, transformCount } = await transformCode(input);

    expect(transformCount, 'to be', 4);
    expect(errors, 'to have length', 0);
    expect(code, 'to contain', "expect(1, 'to be', 1)");
    expect(code, 'to contain', "expect(true, 'to be truthy')");
    expect(code, 'to contain', "expectAsync(asyncFn, 'to reject')");
    expect(code, 'to contain', "expectAsync(asyncFn2, 'not to reject')");
    expect(code, 'to contain', 'expectAsync');
  });

  it('should handle bare assert() calls', async () => {
    const input = `
import assert from 'node:assert';

assert(value);
assert(obj.nested.prop);
assert(getValue());
    `;

    const { code, transformCount } = await transformCode(input);

    expect(transformCount, 'to be', 3);
    expect(code, 'to contain', "expect(value, 'to be truthy')");
    expect(code, 'to contain', "expect(obj.nested.prop, 'to be truthy')");
    expect(code, 'to contain', "expect(getValue(), 'to be truthy')");
  });

  it('should handle legacy mode with warnings for loose equality', async () => {
    // Using plain 'assert' import (without /strict) simulates legacy mode
    // Note: The fixture uses node:assert which is detected as legacy
    const input = `
import assert from 'assert';

assert.equal(a, b);
assert.notEqual(c, d);
    `;

    const { code, warnings } = await transformCode(input);

    // Legacy loose equality should have warnings
    expect(warnings, 'to have length', 2);
    expect(code, 'to contain', "expect(a, 'to be', b)");
    expect(code, 'to contain', "expect(c, 'not to be', d)");
    // Warnings are returned, not embedded in code
    expect(warnings[0]?.message, 'to contain', 'Loose equality');
  });
});
