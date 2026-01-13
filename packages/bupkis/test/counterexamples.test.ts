/**
 * Tests for counterexamples discovered during fuzzing.
 *
 * These tests verify the expected behavior of edge cases found by the property
 * test fuzzer. Each test documents whether the counterexample was caused by an
 * invalid property test generator or an actual bug in the assertion
 * implementation.
 *
 * @packageDocumentation
 */

import { describe, it } from 'node:test';

import { expect, expectAsync } from '../src/index.js';

describe('fuzzing counterexamples', () => {
  describe('function-to-reject-with-error-satisfying (async)', () => {
    /**
     * Counterexample: [null, "to reject with error satisfying", {}]
     *
     * The subject `null` is not a function. The assertion should throw because
     * the subject type doesn't match the FunctionSchema.
     */
    it('should throw when subject is null (not a function)', async () => {
      let threw = false;
      try {
        await expectAsync(null, 'to reject with error satisfying', {});
      } catch {
        threw = true;
      }
      expect(threw, 'to be true');
    });
  });

  describe('object-to-satisfy', () => {
    /**
     * Counterexample: [{"": true, " ": []}, "to satisfy", {"": true}]
     *
     * The actual object {"": true, " ": []} DOES satisfy {"": true} because:
     *
     * - "to satisfy" uses looseObject semantics (extra properties allowed)
     * - The key "" exists with value true in both
     *
     * This is an INVALID PROPERTY - the generator filter
     * (JSON.stringify(actual) !== JSON.stringify(expected)) doesn't understand
     * partial matching semantics.
     */
    it('should pass when actual is a superset of expected', () => {
      // This should NOT throw - the actual satisfies the expected
      expect({ '': true, ' ': [] }, 'to satisfy', { '': true });
    });

    it('should fail when using "not to satisfy" with a superset', () => {
      // This SHOULD throw - the actual DOES satisfy expected
      let threw = false;
      try {
        expect({ '': true, ' ': [] }, 'not to satisfy', { '': true });
      } catch {
        threw = true;
      }
      expect(threw, 'to be true');
    });
  });

  describe('arraylike-to-deep-equal', () => {
    /**
     * Counterexample: [[[]], "to deep equal", [[null]]]
     *
     * [[]] and [[null]] are NOT deeply equal:
     *
     * - [[]] is an array containing an empty array
     * - [[null]] is an array containing an array with one null element
     *
     * The assertion should fail (throw).
     */
    it('should fail when comparing [[]] to [[null]]', () => {
      let threw = false;
      try {
        expect([[]], 'to deep equal', [[null]]);
      } catch {
        threw = true;
      }
      expect(threw, 'to be true');
    });

    it('should pass when using "not to deep equal" for [[]] vs [[null]]', () => {
      // This should NOT throw - they are NOT equal
      expect([[]], 'not to deep equal', [[null]]);
    });
  });

  describe('arraylike-to-satisfy', () => {
    /**
     * Counterexample (invalid): [[[]], "to satisfy", [[], null]]
     *
     * With literalTuples: true in "to satisfy" semantics:
     *
     * - [[]] has 1 element
     * - [[], null] has 2 elements
     *
     * Arrays with different lengths cannot satisfy each other as tuples. The
     * assertion should fail (throw).
     */
    it('should fail when array lengths differ ([[]] vs [[], null])', () => {
      let threw = false;
      try {
        expect([[]], 'to satisfy', [[], null]);
      } catch {
        threw = true;
      }
      expect(threw, 'to be true');
    });

    /**
     * Counterexample (validNegated): [[null], "to satisfy", [null, null]]
     *
     * Same issue - different lengths:
     *
     * - [null] has 1 element
     * - [null, null] has 2 elements
     *
     * Since they can't satisfy, "not to satisfy" should pass.
     */
    it('should pass with "not to satisfy" when lengths differ ([null] vs [null, null])', () => {
      // This should NOT throw - [null] cannot satisfy [null, null]
      expect([null], 'not to satisfy', [null, null]);
    });
  });
});
