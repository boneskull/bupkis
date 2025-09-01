import { inspect } from 'util';
import { z } from 'zod/v4';

import type {
  AssertionFunctionAsync,
  AssertionFunctionSync,
  AssertionImplAsync,
  AssertionImplFnAsync,
  AssertionImplFnSync,
  AssertionImplSchemaAsync,
  AssertionImplSchemaSync,
  AssertionImplSync,
  AssertionParts,
  AssertionSchemaAsync,
  AssertionSchemaSync,
  AssertionSlots,
  RawAssertionImplSchemaSync,
} from './assertion-types.js';

import { kStringLiteral } from '../constant.js';
import {
  isFunction,
  isString,
  isStringTupleAssertionPart,
  isZodType,
} from '../guards.js';
import { BupkisRegistry } from '../metadata.js';
import {
  BupkisAssertionFunctionAsync,
  BupkisAssertionSchemaAsync,
} from './assertion-async.js';
import {
  BupkisAssertionFunctionSync,
  BupkisAssertionSchemaSync,
} from './assertion-sync.js';

/**
 * Create an async `Assertion` from {@link AssertionParts parts} and an async
 * {@link z.ZodType Zod schema}.
 *
 * @param parts Assertion parts defining the shape of the assertion
 * @param impl Implementation as a Zod schema (potentially async)
 * @param slots Slots type parameter to help with inference
 * @returns New `BupkisAssertionSchemaAsync` instance
 * @throws {TypeError} Invalid assertion implementation type
 */
export function createAsync<
  const Parts extends AssertionParts,
  Impl extends AssertionImplSchemaAsync<Parts>,
  Slots extends AssertionSlots<Parts>,
>(parts: Parts, impl: Impl): AssertionSchemaAsync<Parts, Impl, Slots>;
/**
 * Create an async `Assertion` from {@link AssertionParts parts} and an
 * implementation function.
 *
 * @param parts Assertion parts defining the shape of the assertion
 * @param impl Implementation as a function (potentially async)
 * @returns New `FunctionAssertion` instance
 * @throws {TypeError} Invalid assertion implementation type
 */
export function createAsync<
  const Parts extends AssertionParts,
  Impl extends AssertionImplFnAsync<Parts>,
  Slots extends AssertionSlots<Parts>,
>(parts: Parts, impl: Impl): AssertionFunctionAsync<Parts, Impl, Slots>;
export function createAsync<
  const Parts extends AssertionParts,
  Impl extends AssertionImplAsync<Parts>,
>(parts: Parts, impl: Impl) {
  if (!parts || parts.length === 0) {
    throw new TypeError('At least one value is required for an assertion');
  }
  const slots = slotify<Parts>(parts);

  if (isZodType(impl)) {
    return new BupkisAssertionSchemaAsync(parts, slots, impl);
  } else if (isFunction(impl)) {
    return new BupkisAssertionFunctionAsync(parts, slots, impl);
  }
  throw new TypeError(
    'Assertion implementation must be a function, Zod schema or Zod schema factory',
  );
} /**
 * Create a synchronous `Assertion` from {@link AssertionParts parts} and a
 * {@link z.ZodType Zod schema}.
 *
 * @param parts Assertion parts defining the shape of the assertion
 * @param impl Implementation as a Zod schema
 * @returns New `SchemaAssertion` instance
 * @throws {TypeError} Invalid assertion implementation type
 */
function create<
  const Parts extends AssertionParts,
  Impl extends RawAssertionImplSchemaSync<Parts>,
  Slots extends AssertionSlots<Parts>,
>(
  parts: Parts,
  impl: Impl,
): AssertionSchemaSync<Parts, AssertionImplSchemaSync<Parts>, Slots>;
/**
 * Create a synchronous `Assertion` from {@link AssertionParts parts} and an
 * implementation function.
 *
 * @param parts Assertion parts defining the shape of the assertion
 * @param impl Implementation as a function
 * @returns New `FunctionAssertion` instance
 * @throws {TypeError} Invalid assertion implementation type
 */
function create<
  const Parts extends AssertionParts,
  Impl extends AssertionImplFnSync<Parts>,
  Slots extends AssertionSlots<Parts>,
>(parts: Parts, impl: Impl): AssertionFunctionSync<Parts, Impl, Slots>;
function create<
  Impl extends AssertionImplSync<Parts>,
  const Parts extends AssertionParts,
>(parts: Parts, impl: Impl) {
  if (!parts || parts.length === 0) {
    throw new TypeError('At least one value is required for an assertion');
  }
  const slots = slotify<Parts>(parts);

  if (isZodType(impl)) {
    return new BupkisAssertionSchemaSync(parts, slots, impl);
  } else if (isFunction(impl)) {
    return new BupkisAssertionFunctionSync(parts, slots, impl);
  }
  throw new TypeError(
    'Assertion implementation must be a function, Zod schema or Zod schema factory',
  );
}
/**
 * Create a synchronous assertion from parts and implementation.
 */

export const createAssertion = create;
/**
 * Create an asynchronous assertion from parts and implementation.
 */

export const createAsyncAssertion = createAsync; /**
 * Builds slots out of assertion parts.
 *
 * @param parts Assertion parts
 * @returns Slots
 */

export function slotify<const Parts extends AssertionParts>(
  parts: Parts,
): AssertionSlots<Parts> {
  return parts.flatMap((part, index) => {
    const result: z.ZodType[] = [];
    if (index === 0 && (isStringTupleAssertionPart(part) || isString(part))) {
      result.push(z.unknown().describe('subject'));
    }

    if (isStringTupleAssertionPart(part)) {
      if (part.some((p) => p.startsWith('not '))) {
        throw new TypeError(
          `Failed to create Assertion containing phrases ${inspect(part, { depth: 1 })}; string literal parts cannot begin with "not"`,
        );
      }
      result.push(
        z
          .literal(part)
          .brand('string-literal')
          .register(BupkisRegistry, {
            [kStringLiteral]: true,
            values: part,
          }),
      );
    } else if (isString(part)) {
      if (part.startsWith('not ')) {
        throw new TypeError(
          `Failed to create Assertion containing phrase ${inspect(part, { depth: 1 })}; string literal parts cannot begin with "not"`,
        );
      }
      result.push(
        z
          .literal(part)
          .brand('string-literal')
          .register(BupkisRegistry, {
            [kStringLiteral]: true,
            value: part,
          }),
      );
    } else {
      result.push(part);
    }
    return result;
  }) as unknown as AssertionSlots<Parts>;
}
