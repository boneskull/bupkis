import { inspect } from 'util';
import z from 'zod/v4';

import { AssertionError, AssertionImplementationError } from '../error.js';
import {
  isA,
  isBoolean,
  isError,
  isStandardSchema,
  isZodType,
} from '../guards.js';
import {
  isAssertionFailure,
  isAssertionParseRequest,
} from '../internal-schema.js';
import {
  type AssertionAsync,
  type AssertionFunctionAsync,
  type AssertionImplAsync,
  type AssertionImplFnAsync,
  type AssertionImplFnReturnType,
  type AssertionImplSchemaAsync,
  type AssertionParts,
  type AssertionSchemaAsync,
  type AssertionSlots,
  type ParsedResult,
  type ParsedResultSuccess,
  type ParsedValues,
} from './assertion-types.js';
import { BupkisAssertion } from './assertion.js';
import { formatAssertionFailure } from './format-assertion-failure.js';

export abstract class BupkisAssertionAsync<
  Parts extends AssertionParts,
  Impl extends AssertionImplAsync<Parts>,
  Slots extends AssertionSlots<Parts>,
>
  extends BupkisAssertion<Parts, Impl, Slots>
  implements AssertionAsync<Parts, Impl, Slots>
{
  abstract executeAsync(
    parsedValues: ParsedValues<Parts>,
    args: unknown[],
    stackStartFn: (...args: any[]) => any,
    parseResult?: ParsedResult<Parts>,
  ): Promise<void>;

  async parseValuesAsync<Args extends readonly unknown[]>(
    args: Args,
  ): Promise<ParsedResult<Parts>> {
    const { slots } = this;
    const parsedValues: any[] = [];
    if (slots.length !== args.length) {
      return {
        success: false,
      };
    }
    let exactMatch = true;
    for (let i = 0; i < slots.length; i++) {
      const slot = slots[i]!;
      const arg = args[i];

      const parsedLiteralResult = this.parseSlotForLiteral(slot, i, arg);
      if (parsedLiteralResult === true) {
        continue;
      } else if (parsedLiteralResult !== false) {
        return parsedLiteralResult;
      }

      // unknown/any accept anything
      // IMPORTANT: do not use a type guard here; it will break inference
      if (slot.def.type === 'unknown' || slot.def.type === 'any') {
        parsedValues.push(arg);
        exactMatch = false;
        continue;
      }
      const result = await slot.safeParseAsync(arg);
      if (!result.success) {
        return {
          success: false,
        };
      }
      parsedValues.push(result.data);
    }
    return {
      exactMatch,
      parsedValues: parsedValues as unknown as ParsedValues<Parts>,
      success: true,
    };
  }
}
/**
 * An assertion implemented as a Zod schema.
 *
 * Async schemas are supported via {@link expectAsync}.
 */
/**
 * Optimized schema assertion that performs subject validation during
 * parseValues() to eliminate double parsing for simple schema-based
 * assertions.
 *
 * This class implements Option 2 from the z.function() analysis - it caches the
 * subject validation result during argument parsing and reuses it during
 * execution, eliminating the double parsing overhead.
 */

export class BupkisAssertionFunctionAsync<
  Parts extends AssertionParts,
  Impl extends AssertionImplFnAsync<Parts>,
  Slots extends AssertionSlots<Parts>,
>
  extends BupkisAssertionAsync<Parts, Impl, Slots>
  implements AssertionFunctionAsync<Parts, Impl, Slots>
{
  override async executeAsync(
    parsedValues: ParsedValues<Parts>,
    args: unknown[],
    stackStartFn: (...args: any[]) => any,
    _parseResult?: ParsedResult<Parts>,
  ): Promise<void> {
    let result: AssertionImplFnReturnType<Parts>;
    try {
      result = await (this.impl as AssertionImplFnAsync<Parts>).call(
        null,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        ...(parsedValues as any),
      );
    } catch (err) {
      if (AssertionError.isAssertionError(err)) {
        throw err;
      }
      if (isError(err) && err instanceof z.ZodError) {
        throw this.fromZodError(err, stackStartFn, parsedValues);
      }
      throw new AssertionImplementationError(
        `Unexpected error thrown from assertion ${this}: ${err}`,
        { cause: err },
      );
    }
    if (isZodType(result)) {
      try {
        await result.parseAsync(parsedValues[0]);
      } catch (error) {
        if (isA(error, z.ZodError)) {
          throw this.fromZodError(error, stackStartFn, parsedValues);
        }
        throw error;
      }
    } else if (isStandardSchema(result)) {
      const validationResult = result['~standard'].validate(parsedValues[0]);
      const finalResult =
        validationResult instanceof Promise
          ? await validationResult
          : validationResult;

      if (finalResult.issues) {
        throw this.fromStandardSchemaIssues(
          finalResult.issues,
          stackStartFn,
          parsedValues,
        );
      }
    } else if (isBoolean(result)) {
      if (!result) {
        throw new AssertionError({
          id: this.id,
          message: `Assertion ${this} failed for arguments: ${inspect(args)}`,
        });
      }
    } else if (isError(result) && result instanceof z.ZodError) {
      throw this.fromZodError(result, stackStartFn, parsedValues);
    } else if (isAssertionParseRequest(result)) {
      const { asyncSchema, schema, subject } = result;
      const schemaToUse = schema ?? asyncSchema;

      if (isZodType(schemaToUse)) {
        let zodResult: z.ZodSafeParseResult<unknown>;
        if (schema) {
          zodResult = schemaToUse.safeParse(subject);
        } else {
          zodResult = await schemaToUse.safeParseAsync(subject);
        }
        if (!zodResult.success) {
          throw this.fromZodError(zodResult.error, stackStartFn, subject);
        }
      } else if (isStandardSchema(schemaToUse)) {
        const validationResult = schemaToUse['~standard'].validate(subject);
        const finalResult =
          validationResult instanceof Promise
            ? await validationResult
            : validationResult;

        if (finalResult.issues) {
          throw this.fromStandardSchemaIssues(
            finalResult.issues,
            stackStartFn,
            subject,
          );
        }
      }
    } else if (isAssertionFailure(result)) {
      const diffOutput = formatAssertionFailure(result);
      const baseMessage =
        result.message ??
        `Assertion ${this} failed for arguments: ${inspect(args)}`;
      const message = diffOutput
        ? `${baseMessage}\n${diffOutput}`
        : baseMessage;

      throw new AssertionError({
        actual: result.actual,
        expected: result.expected,
        id: this.id,
        message,
      });
    } else if (result as unknown) {
      throw new AssertionImplementationError(
        `Invalid return type from assertion ${this}; expected boolean, ZodType, or AssertionFailure`,
        { result },
      );
    }
  }
}

/**
 * A class representing an assertion implemented as a function.
 *
 * This function may:
 *
 * 1. Return a `boolean` indicating pass/fail.
 * 2. Return a `ZodType` which will be used to validate the subject.
 * 3. Return a `Promise` resolving to either of the above (when called via
 *    {@link expectAsync})
 * 4. Throw a {@link AssertionError}; when called via {@link expectAsync}, reject
 *    with an {@link AssertionError}
 */

export class BupkisAssertionSchemaAsync<
  Parts extends AssertionParts,
  Impl extends AssertionImplSchemaAsync<Parts>,
  Slots extends AssertionSlots<Parts>,
>
  extends BupkisAssertionAsync<Parts, Impl, Slots>
  implements AssertionSchemaAsync<Parts, Impl, Slots>
{
  override async executeAsync(
    parsedValues: ParsedValues<Parts>,
    _args: unknown[],
    stackStartFn: (...args: any[]) => any,
    parseResult?: ParsedResult<Parts>,
  ): Promise<void> {
    // Check if we have cached validation result from parseValuesAsync
    const cachedValidation = parseResult?.success
      ? parseResult.subjectValidationResult
      : undefined;

    if (cachedValidation && !cachedValidation.success) {
      // Subject validation failed during parseValuesAsync, throw the cached error
      if ('error' in cachedValidation) {
        throw this.fromZodError(
          cachedValidation.error,
          stackStartFn,
          parsedValues,
        );
      }
    }

    // Fall back to standard validation if no cached result
    const [subject] = parsedValues;
    try {
      await this.impl.parseAsync(subject);
    } catch (error) {
      if (isA(error, z.ZodError)) {
        throw this.fromZodError(error, stackStartFn, parsedValues);
      }
      /* c8 ignore next */
      throw error;
    }
  }

  override async parseValuesAsync<Args extends readonly unknown[]>(
    args: Args,
  ): Promise<ParsedResult<Parts>> {
    const { slots } = this;
    const parsedValues: any[] = [];
    const mismatch = this.maybeParseValuesArgMismatch(args);
    if (mismatch) {
      return mismatch;
    }

    let exactMatch = true;
    let subjectValidationResult: ParsedResultSuccess<Parts>['subjectValidationResult'];

    for (let i = 0; i < slots.length; i++) {
      const slot = slots[i]!;
      const arg = args[i];
      const parsedLiteralResult = this.parseSlotForLiteral(slot, i, arg);
      if (parsedLiteralResult === true) {
        continue;
      } else if (parsedLiteralResult !== false) {
        return parsedLiteralResult;
      }

      // For the subject slot (first slot if it's unknown/any), try optimized validation
      if (
        i === 0 &&
        (slot.def.type === 'unknown' || slot.def.type === 'any') &&
        this.isSimpleSchemaAssertion()
      ) {
        try {
          const result = await this.impl.parseAsync(arg);
          subjectValidationResult = { data: result, success: true };
          parsedValues.push(result); // Use validated data
        } catch (error) {
          if (isA(error, z.ZodError)) {
            subjectValidationResult = { error, success: false };
            parsedValues.push(arg); // Keep original for error reporting
          } else {
            throw error; // Re-throw non-Zod errors
          }
        }
        exactMatch = false; // Subject was validated, so we know the exact type
        continue;
      }

      // Standard slot processing for non-optimized cases
      if (slot.def.type === 'unknown' || slot.def.type === 'any') {
        parsedValues.push(arg);
        exactMatch = false;
        continue;
      }

      const result = await slot.safeParseAsync(arg);
      if (!result.success) {
        return {
          success: false,
        };
      }
      parsedValues.push(result.data);
    }

    const result: ParsedResultSuccess<Parts> = {
      exactMatch,
      parsedValues: parsedValues as unknown as ParsedValues<Parts>,
      success: true,
    };

    // Add cached validation result if we performed optimization
    if (subjectValidationResult) {
      result.subjectValidationResult = subjectValidationResult;
    }

    return result;
  }
}
