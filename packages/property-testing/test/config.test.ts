/**
 * Tests for configuration schema validation in @bupkis/property-testing.
 *
 * @packageDocumentation
 */

import { expect } from 'bupkis';
import fc from 'fast-check';
import { describe, it } from 'node:test';

import {
  PropertyTestConfigSchema,
  PropertyTestConfigVariantSchema,
} from '../src/config.js';

describe('config schemas', () => {
  describe('PropertyTestConfigVariantSchema', () => {
    describe('sync generators variant', () => {
      it('should validate variant with generators as single arbitrary', () => {
        const variant = {
          generators: fc.constant(['a', 'b']),
        };
        const result = PropertyTestConfigVariantSchema.safeParse(variant);
        expect(result.success, 'to be true');
      });

      it('should validate variant with generators as tuple', () => {
        const variant = {
          generators: [fc.anything(), fc.string()],
        };
        const result = PropertyTestConfigVariantSchema.safeParse(variant);
        expect(result.success, 'to be true');
      });

      it('should validate variant with runSize parameter', () => {
        const variant = {
          generators: fc.constant(['a', 'b']),
          runSize: 'small',
        };
        const result = PropertyTestConfigVariantSchema.safeParse(variant);
        expect(result.success, 'to be true');
      });
    });

    describe('async generators variant', () => {
      it('should validate async generators variant', () => {
        const variant = {
          async: true,
          generators: fc.constant(['a', 'b']),
        };
        const result = PropertyTestConfigVariantSchema.safeParse(variant);
        expect(result.success, 'to be true');
      });

      it('should validate async generators with runSize', () => {
        const variant = {
          async: true,
          generators: [fc.anything(), fc.string()],
          runSize: 'large',
        };
        const result = PropertyTestConfigVariantSchema.safeParse(variant);
        expect(result.success, 'to be true');
      });
    });

    describe('sync property variant', () => {
      it('should validate property variant', () => {
        const variant = {
          property: () => fc.property(fc.anything(), () => true),
        };
        const result = PropertyTestConfigVariantSchema.safeParse(variant);
        expect(result.success, 'to be true');
      });

      it('should validate property variant with runSize', () => {
        const variant = {
          property: () => fc.property(fc.anything(), () => true),
          runSize: 'medium',
        };
        const result = PropertyTestConfigVariantSchema.safeParse(variant);
        expect(result.success, 'to be true');
      });
    });

    describe('async property variant', () => {
      it('should validate asyncProperty variant', () => {
        const variant = {
          asyncProperty: () =>
            fc.asyncProperty(fc.anything(), async () => true),
        };
        const result = PropertyTestConfigVariantSchema.safeParse(variant);
        expect(result.success, 'to be true');
      });

      it('should validate asyncProperty variant with runSize', () => {
        const variant = {
          asyncProperty: () =>
            fc.asyncProperty(fc.anything(), async () => true),
          runSize: 'small',
        };
        const result = PropertyTestConfigVariantSchema.safeParse(variant);
        expect(result.success, 'to be true');
      });
    });

    describe('invalid configurations', () => {
      it('should reject invalid runSize value', () => {
        const variant = {
          generators: fc.constant(['a', 'b']),
          runSize: 'extra-large',
        };
        const result = PropertyTestConfigVariantSchema.safeParse(variant);
        expect(result.success, 'to be false');
      });

      // Note: The schema uses z.any() for generators, so empty objects and
      // objects without generators/property are currently accepted by the
      // schema. This is intentional - the schema is permissive and validation
      // happens at runtime through type guards like isPropertyTestConfigVariantGenerators.
    });
  });

  describe('PropertyTestConfigSchema', () => {
    describe('complete configurations', () => {
      it('should validate config with valid and invalid variants', () => {
        const config = {
          invalid: { generators: fc.constant(['a', 'b']) },
          valid: { generators: fc.constant(['x', 'y']) },
        };
        const result = PropertyTestConfigSchema.safeParse(config);
        expect(result.success, 'to be true');
      });

      it('should validate config with all four variants', () => {
        const config = {
          invalid: { generators: fc.constant(['a', 'b']) },
          invalidNegated: { generators: fc.constant(['i', 'n']) },
          valid: { generators: fc.constant(['x', 'y']) },
          validNegated: { generators: fc.constant(['v', 'n']) },
        };
        const result = PropertyTestConfigSchema.safeParse(config);
        expect(result.success, 'to be true');
      });

      it('should validate config with mixed variant types', () => {
        const config = {
          invalid: { generators: fc.constant(['a', 'b']) },
          valid: { property: () => fc.property(fc.anything(), () => true) },
        };
        const result = PropertyTestConfigSchema.safeParse(config);
        expect(result.success, 'to be true');
      });

      it('should validate config with top-level runSize', () => {
        const config = {
          invalid: { generators: fc.constant(['a', 'b']) },
          runSize: 'small',
          valid: { generators: fc.constant(['x', 'y']) },
        };
        const result = PropertyTestConfigSchema.safeParse(config);
        expect(result.success, 'to be true');
      });
    });

    describe('invalid configurations', () => {
      it('should reject config missing valid variant', () => {
        const config = {
          invalid: { generators: fc.constant(['a', 'b']) },
        };
        const result = PropertyTestConfigSchema.safeParse(config);
        expect(result.success, 'to be false');
      });

      it('should reject config missing invalid variant', () => {
        const config = {
          valid: { generators: fc.constant(['x', 'y']) },
        };
        const result = PropertyTestConfigSchema.safeParse(config);
        expect(result.success, 'to be false');
      });

      it('should reject empty config', () => {
        const config = {};
        const result = PropertyTestConfigSchema.safeParse(config);
        expect(result.success, 'to be false');
      });

      // Note: The variant schema accepts empty objects because it uses z.any()
      // for generators. Validation of variant structure happens at runtime via
      // type guards like isPropertyTestConfigVariantGenerators.
    });
  });
});
