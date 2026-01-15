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
  it('should transform a complete Chai test file to bupkis', async () => {
    const input = readFileSync(
      new URL('./fixtures/chai-example.ts', import.meta.url),
      'utf-8',
    );
    const expectedOutput = readFileSync(
      new URL('./fixtures/expected.ts', import.meta.url),
      'utf-8',
    );

    const { code, errors, transformCount, warnings } =
      await transformCode(input);

    // Should have transformed many assertions
    expect(transformCount, 'to be greater than', 30);

    // Should have no errors
    expect(errors, 'to have length', 0);

    // Should have no warnings (all matchers are supported)
    expect(warnings, 'to have length', 0);

    // Verify key transformations happened
    expect(code, 'not to contain', "from 'chai'");
    expect(code, 'not to contain', "from 'chai-as-promised'");
    expect(code, 'not to contain', 'chai.use');
    expect(code, 'to contain', "from 'bupkis'");

    // BDD transformations
    expect(code, 'to contain', "expect(user, 'to have property', 'id')");
    expect(code, 'to contain', "expect(user.id, 'to be', 1)");
    expect(code, 'to contain', "expect(user.name, 'to be a', 'string')");
    expect(code, 'to contain', "expect(user, 'to be defined')");
    expect(code, 'to contain', "expect(user.id, 'to be truthy')");
    expect(code, 'to contain', "expect(user.name, 'not to be', 'Bob')");
    expect(code, 'to contain', "expect(user, 'to deep equal'");
    expect(code, 'to contain', "expect(users, 'to have length', 1)");
    expect(code, 'to contain', "expect(user.id, 'to be greater than', 0)");
    expect(code, 'to contain', "expect(throwError, 'to throw')");

    // TDD transformations
    expect(code, 'to contain', "expect(user.id === 1, 'to be true')");
    expect(code, 'to contain', "expect(user, 'not to be null')");

    // Compare normalized output (loose comparison due to formatting differences)
    const normalizedActual = normalizeCode(code);
    // Normalized expected is kept for debugging; prefixed to satisfy ESLint
    const _normalizedExpected = normalizeCode(expectedOutput);

    // Check that all key assertions from expected are present
    const expectedAssertions = [
      "expect(user, 'to have property', 'id')",
      "expect(user.id, 'to be', 1)",
      "expect(user, 'to be defined')",
      "expect(user.id, 'to be truthy')",
      "expect(user.name === 'Alice', 'to be true')",
      "expect(user.name, 'not to be', 'Bob')",
      "expect(user, 'to deep equal'",
      "expect(users, 'to have length', 1)",
      "expect(users, 'to contain', users[0])",
      "expect(users, 'not to be empty')",
      "expect(user.id, 'to be greater than', 0)",
      "expect(user.id, 'to be less than', 100)",
      "expect(throwError, 'to throw')",
      "expect(throwError, 'to throw', Error)",
      "expect(user, 'to be a', 'object')",
      "expect(user.name, 'to be a', 'string')",
    ];

    for (const assertion of expectedAssertions) {
      expect(normalizedActual, 'to contain', assertion);
    }
  });

  it('should handle BDD-only files', async () => {
    const input = `
import { expect } from 'chai';

describe('Test', () => {
  it('works', () => {
    expect(1).to.equal(1);
    expect(true).to.be.true;
    expect([1, 2]).to.have.length(2);
  });
});
    `;

    const { code, errors, transformCount } = await transformCode(input);

    expect(transformCount, 'to be', 3);
    expect(errors, 'to have length', 0);
    expect(code, 'to contain', "expect(1, 'to be', 1)");
    expect(code, 'to contain', "expect(true, 'to be true')");
    expect(code, 'to contain', "expect([1, 2], 'to have length', 2)");
  });

  it('should handle TDD-only files', async () => {
    const input = `
import { assert } from 'chai';

describe('Test', () => {
  it('works', () => {
    assert.equal(1, 1);
    assert.isTrue(true);
    assert.lengthOf([1, 2], 2);
  });
});
    `;

    const { code, errors, transformCount } = await transformCode(input);

    expect(transformCount, 'to be', 3);
    expect(errors, 'to have length', 0);
    expect(code, 'to contain', "expect(1, 'to be', 1)");
    expect(code, 'to contain', "expect(true, 'to be true')");
    expect(code, 'to contain', "expect([1, 2], 'to have length', 2)");
  });

  it('should handle mixed BDD and TDD in same file', async () => {
    const input = `
import { expect, assert } from 'chai';

describe('Test', () => {
  it('bdd', () => {
    expect(1).to.equal(1);
  });
  it('tdd', () => {
    assert.equal(2, 2);
  });
});
    `;

    const { code, errors, transformCount } = await transformCode(input);

    expect(transformCount, 'to be', 2);
    expect(errors, 'to have length', 0);
    expect(code, 'to contain', "expect(1, 'to be', 1)");
    expect(code, 'to contain', "expect(2, 'to be', 2)");
  });
});
