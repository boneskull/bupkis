import { describe, it } from 'node:test';

import { slotify } from '../../src/assertion/slotify.js';
import { expect } from '../custom-assertions.js';

/**
 * `slotify()` converts {@link bupkis!types.AssertionParts | AssertionParts} into
 * {@link bupkis!types.AssertionSlots | AssertionSlots} by processing string
 * literals and Zod schemas, registering metadata for runtime introspection, and
 * handling validation constraints such as preventing "not " prefixes in string
 * literal parts.
 */
describe('slotify()', () => {
  describe('error handling', () => {
    describe('when the AssertionParts contain a phrase literal beginning with "not "', () => {
      it('should throw', () => {
        const parts = ['not to be a foo'] as const;
        expect(() => slotify(parts), 'to throw', {
          code: 'ERR_BUPKIS_ASSERTION_IMPL',
          message: /must not start with "not "/,
        });
      });
    });

    describe('when the AssertionParts contain a phrase literal choice beginning with "not "', () => {
      it('should throw', () => {
        const parts = [['stuff', 'not to be a foo']] as const;
        expect(() => slotify(parts), 'to throw', {
          code: 'ERR_BUPKIS_ASSERTION_IMPL',
          message: /must not include phrases starting with "not "/,
        });
      });
    });

    describe('when the AssertionParts contain a phrase literal "and" not followed by a schema', () => {
      it('should throw', () => {
        const parts = ['to be a foo', 'and', 'to be a bar'] as const;
        expect(() => slotify(parts), 'to throw', {
          code: 'ERR_BUPKIS_ASSERTION_IMPL',
          message: /must be followed by a schema/,
        });
      });

      describe('when "and" is the last part', () => {
        it('should throw', () => {
          const parts = ['to be a foo', 'and'] as const;
          expect(() => slotify(parts), 'to throw', {
            code: 'ERR_BUPKIS_ASSERTION_IMPL',
            message: /must be followed by a schema/,
          });
        });
      });
    });

    describe('when an invalid AssertionPart is provided', () => {
      it('should throw', () => {
        const parts = ['to be a foo', 42, 'to be a bar'] as const;
        // @ts-expect-error testing invalid input
        expect(() => slotify(parts), 'to throw', {
          code: 'ERR_BUPKIS_ASSERTION_IMPL',
          message: /Expected schema, phrase literal, or phrase literal choice/,
        });
      });
    });
  });
});
