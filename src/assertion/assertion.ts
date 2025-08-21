import Debug from 'debug';
import { inspect } from 'util';
import { z } from 'zod/v4';
import { AssertionError } from '../error.js';
import {
  isAssertionImplFn,
  isAssertionSchemaFactory,
  isZodPromise,
  isZodType,
} from '../guards.js';
import { bupkisRegistry, kStringLiteral } from '../metadata.js';
import {
  AssertionImpl,
  AssertionImplFn,
  AssertionPart,
  AssertionParts,
  AssertionSchemaFactory,
  AssertionSlots,
  ParsedResult,
  ParsedSubject,
  ParsedValues,
  RestParsedValues,
} from './types.js';

const debug = Debug('bupkis:assertion');

export const kSchemaFactory = Symbol('schema-factory');

export class Assertion<Parts extends AssertionParts> {
  readonly implFn?: AssertionImplFn<Parts>;
  readonly schema?: z.ZodSchema<ParsedSubject<Parts>>;
  readonly factory?: AssertionSchemaFactory<Parts>;
  readonly slots: AssertionSlots<Parts>;

  readonly __parts!: Parts;

  get subject() {
    return this.slots[0];
  }

  get subjectType() {
    return this.subject.def.type;
  }

  constructor(slots: AssertionSlots<Parts>, impl: AssertionImpl<Parts>) {
    this.slots = slots;

    // Type guard to determine if it's a schema or implementation
    if (isZodType(impl)) {
      this.schema = impl;
    } else if (isAssertionSchemaFactory(impl)) {
      this.factory = impl;
    } else if (isAssertionImplFn(impl)) {
      this.implFn = impl;
    } else {
      throw new TypeError(`Invalid assertion implementation: ${inspect(impl)}`);
    }
  }

  private translateZodError(
    zodError: z.ZodError,
    context?: string,
  ): AssertionError {
    const pretty = z.prettifyError(zodError);
    return new AssertionError(
      `Assertion failed${context ? ` ${context}` : ''}: ${pretty}`,
    );
  }

  execute<T extends ParsedValues<Parts>>(
    parsedValues: T,
    rawArgs: readonly unknown[],
  ): Awaited<void> {
    let schema: z.ZodType | undefined;
    const [subject, ...rest] = parsedValues;
    if (this.factory) {
      schema = this.factory.call(null, ...rest);
    } else if (this.schema) {
      schema = this.schema;
    }
    if (schema) {
      try {
        schema.parse(subject);
      } catch (error) {
        if (error instanceof z.ZodError) {
          throw this.translateZodError(error);
        }
        throw error;
      }
    } else if (this.implFn) {
      // Function-based implementation
      this.implFn.call(
        null,
        { raw: rawArgs, slots: this.slots },
        ...(parsedValues as any),
      ) as Awaited<void>;
      return;
    } else {
      throw new Error('Assertion has neither implementation nor schema');
    }
  }

  // Static factory: build an Assertion instance from author-provided parts
  static fromParts<const Parts extends AssertionParts>(
    parts: Parts,
    implFn: AssertionImplFn<Parts>,
  ): Assertion<Parts>;
  static fromParts<const Parts extends AssertionParts>(
    parts: Parts,
    schema: z.ZodType,
  ): Assertion<Parts>;
  static fromParts<const Parts extends AssertionParts>(
    parts: Parts,
    factory: AssertionSchemaFactory<Parts>,
  ): Assertion<Parts>;
  static fromParts<const Parts extends AssertionParts>(
    parts: Parts,
    impl: AssertionImpl<Parts>,
  ): Assertion<Parts> {
    if (!parts || parts.length === 0) {
      throw new TypeError('At least one value is required for an assertion');
    }
    // Build slots tuple: prepend z.unknown() if first is string or string[]; map strings -> branded literals
    const mapped = parts.flatMap((part, index) => {
      const result: z.ZodType[] = [];
      if (
        index === 0 &&
        (isStringTupleAssertionPart(part) || typeof part === 'string')
      ) {
        result.push(z.unknown().describe('subject'));
      }

      if (isStringTupleAssertionPart(part)) {
        result.push(
          z
            .enum(part)
            .brand('string-literal')
            .register(bupkisRegistry, {
              [kStringLiteral]: true,
              values: part,
            }),
        );
      } else if (typeof part === 'string') {
        result.push(
          z
            .literal(part)
            .brand('string-literal')
            .register(bupkisRegistry, {
              [kStringLiteral]: true,
              value: part,
            }),
        );
      } else {
        result.push(part);
      }
      return result;
    });

    return new Assertion(mapped as unknown as AssertionSlots<Parts>, impl);
  }

  parseValues<Args extends readonly unknown[]>(
    args: Args,
  ): ParsedResult<Parts> {
    const { slots } = this;
    const parsedValues: any[] = [];
    if (slots.length !== args.length) {
      return {
        assertion: `${this}`,
        reason: 'Argument count mismatch',
        success: false,
      };
    }
    let exactMatch = true;
    for (let i = 0; i < slots.length; i++) {
      const slot = slots[i]!;
      const arg = args[i];
      const meta = bupkisRegistry.get(slot);
      // our branded literal slots are also tagged in meta for runtime
      if (meta && kStringLiteral in meta) {
        if ('value' in meta) {
          if (arg !== meta.value) {
            return {
              assertion: `${this}`,
              reason: `Expected ${meta.value} for slot ${i}, got ${inspect(arg)}`,
              success: false,
            };
          }
        } else if ('values' in meta) {
          const allowed = meta.values as readonly string[];
          if (!allowed.includes(arg as any)) {
            return {
              assertion: `${this}`,
              reason: `Expected one of ${allowed.join(', ')} for slot ${i}, got ${inspect(arg)}`,
              success: false,
            };
          }
        } else {
          debug('Invalid metadata for slot', i, 'with value', arg);
          return {
            assertion: `${this}`,
            reason: `Invalid metadata for slot ${i}`,
            success: false,
          };
        }
        // skip from impl params
        continue;
      }
      // unknown/any accept anything
      // IMPORTANT: do not use a type guard here
      if (slot.def.type === 'unknown' || slot.def.type === 'any') {
        debug('Skipping unknown/any slot validation for arg', arg);
        parsedValues.push(arg);
        exactMatch = false;
        continue;
      }
      if (isZodPromise(slot)) {
        // Avoid sync parsing of promises; match only if it's a thenable
        debug('Skipping validation for promise', arg);
        if (arg && typeof (arg as any).then === 'function') {
          parsedValues.push(arg);
          continue;
        }
        return {
          assertion: `${this}`,
          reason: `Expected promise for slot ${i}, got ${inspect(arg)}`,
          success: false,
        };
      }
      const result = slot.safeParse(arg);
      if (!result.success) {
        debug(
          'Validation failed for slot',
          i,
          'with value',
          arg,
          'error:',
          z.prettifyError(result.error),
        );
        return {
          assertion: `${this}`,
          reason: `Validation failed for slot ${i}: ${z.prettifyError(result.error)}`,
          success: false,
        };
      }
      parsedValues.push(result.data);
    }
    return {
      assertion: `${this}`,
      exactMatch,
      parsedValues: parsedValues as unknown as ParsedValues<Parts>,
      success: true,
    };
  }

  toString(): string {
    return `Assertion(${this.slots.map((s: z.ZodType) => (s.def.type === 'literal' ? JSON.stringify((s as z.ZodLiteral).def.values) : `z.${s.def.type}`)).join(', ')})`;
  }
}
export const isStringTupleAssertionPart = (
  value: AssertionPart,
): value is readonly [string, ...string[]] => Array.isArray(value);

// Wrapper function to create a marked schema factory
export function factory<Parts extends AssertionParts>(
  fn: (...values: RestParsedValues<Parts>) => z.ZodType,
): AssertionSchemaFactory<Parts> {
  Object.defineProperty(fn, kSchemaFactory, {
    value: true,
  });
  return fn as unknown as AssertionSchemaFactory<Parts>;
}
