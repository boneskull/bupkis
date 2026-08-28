/**
 * Edge-case tests for schemas
 *
 * @packageDocumentation
 */

import { describe, it } from 'node:test';

import { ConstructibleSchema } from '../../src/schema.js';
import { expect } from '../custom-assertions.js';

describe('schema', () => {
  describe('ConstructibleSchema', () => {
    it('should validate abstract classes', () => {
      abstract class Foo {}
      expect(() => ConstructibleSchema.parse(Foo), 'not to throw');
    });

    it('should validate concrete classes', () => {
      class Bar {}
      expect(() => ConstructibleSchema.parse(Bar), 'not to throw');
    });

    it('should validate functions', () => {
      // eslint-disable-next-line func-style
      function foo() {}
      expect(() => ConstructibleSchema.parse(foo), 'not to throw');
    });

    it('should validate arrow functions', () => {
      const foo = () => {};
      expect(() => ConstructibleSchema.parse(foo), 'to throw', {
        message: /must be a constructor, class, or a non-arrow function/,
      });
    });
  });
});
