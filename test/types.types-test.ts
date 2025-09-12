/* eslint-disable @typescript-eslint/no-floating-promises */
/**
 * A scattering of type-level tests. Not executed; just checked by `npm run
 * lint:types`.
 *
 * @packageDocumentation
 */

import { expectTypeOf } from 'expect-type';
import { describe, it } from 'node:test';
import { type NonEmptyTuple } from 'type-fest';
import { z } from 'zod/v4';

import {
  type AnyAssertion,
  type AnyAssertions,
  type AnySyncAssertion,
  type AnySyncAssertions,
  type AssertionSync,
} from '../src/assertion/assertion-types.js';
import { SyncAssertions } from '../src/assertion/impl/sync.js';
import { expect, expectAsync } from '../src/bootstrap.js';
import { isZodType } from '../src/guards.js';
import { type Concat, type ZodTypeMap } from '../src/types.js';

describe('UseFn', () => {
  it('should produce an expect() with existing and new assertions', () => {
    const myAssertions = [
      expect.createAssertion(['to be a Foo'], () => true),
    ] as const;

    expect('foo', 'to be a string');
    const myExpect = expect.use(myAssertions);
    expectTypeOf(myExpect)
      .toHaveProperty('expect')
      .toHaveProperty('assertions')
      // this should be working
      .toEqualTypeOf<Concat<typeof SyncAssertions, typeof myAssertions>>();

    myExpect.expect('foo', 'to be a string');
    class Foo {}
    const foo = new Foo();
    // this should be working
    myExpect.expect(foo, 'to be a Foo');
  });
});

describe('Custom Assertions', () => {
  const _subject = [
    expect.createAssertion(['to be a Foo'], () => true),
  ] as const;
  type Subject = typeof _subject;

  it('should extend AnySyncAssertions', () => {
    expectTypeOf<Subject>().toExtend<AnySyncAssertions>();
  });

  it('should extend NonEmptyTuple<AnySyncAssertion>', () => {
    expectTypeOf<Subject>().toExtend<NonEmptyTuple<AnySyncAssertion>>();
  });

  it('should extend AnyAssertions', () => {
    expectTypeOf<Subject>().toExtend<AnyAssertions>();
  });

  describe('members', () => {
    it('should extend AnySyncAssertion', () => {
      expectTypeOf<Subject[0]>().toExtend<AnySyncAssertion>();
    });

    it('should extend AnyAssertion', () => {
      expectTypeOf<Subject[0]>().toExtend<AnyAssertion>();
    });
    it('should extend AssertionSync', () => {
      expectTypeOf<Subject[0]>().toExtend<
        AssertionSync<
          Subject[0]['parts'],
          Subject[0]['impl'],
          Subject[0]['slots']
        >
      >();
    });
  });
});

describe('SyncAssertions', () => {
  const _subject = SyncAssertions;
  type Subject = typeof _subject;

  it('should extend AnySyncAssertions', () => {
    expectTypeOf<Subject>().toExtend<AnySyncAssertions>();
  });

  it('should extend NonEmptyTuple<AnySyncAssertion>', () => {
    expectTypeOf<Subject>().toExtend<NonEmptyTuple<AnySyncAssertion>>();
  });

  it('should extend AnyAssertions', () => {
    expectTypeOf<Subject>().toExtend<AnyAssertions>();
  });

  describe('members', () => {
    it('should extend AnySyncAssertion', () => {
      expectTypeOf<Subject[0]>().toExtend<AnySyncAssertion>();
    });

    it('should extend AnyAssertion', () => {
      expectTypeOf<Subject[0]>().toExtend<AnyAssertion>();
    });
    it('should extend AssertionSync', () => {
      expectTypeOf<Subject[0]>().toExtend<
        AssertionSync<
          Subject[0]['parts'],
          Subject[0]['impl'],
          Subject[0]['slots']
        >
      >();
    });
  });
});

describe('Expect', () => {
  describe('bootstrapped Expect', () => {
    it('should allow simple sync and async assertions', async () => {
      expect('foo', 'to be a string');
      await expectAsync(Promise.resolve(), 'to resolve');
    });
  });

  describe('extended Expect', () => {
    it('should allow a simple sync and async assertions', async () => {
      const myExpect = expect.use([]);
      myExpect.expect('foo', 'to be a string');
      await myExpect.expectAsync(Promise.resolve(), 'to resolve');
    });
  });
});

describe('util', () => {
  describe('Concat', () => {
    const _subjectA = [
      expect.createAssertion(['to be a Foo'], () => true),
    ] as const;
    type SubjectA = typeof _subjectA;
    type SubjectB = typeof SyncAssertions;

    type Subject = Concat<SubjectA, SubjectB>;

    it('should extend AnySyncAssertions', () => {
      expectTypeOf<Subject>().toExtend<AnySyncAssertions>();
    });

    it('should extend NonEmptyTuple<AnySyncAssertion>', () => {
      expectTypeOf<Subject>().toExtend<NonEmptyTuple<AnySyncAssertion>>();
    });

    it('should extend AnyAssertions', () => {
      expectTypeOf<Subject>().toExtend<AnyAssertions>();
    });

    describe('members', () => {
      it('should extend AnySyncAssertion', () => {
        expectTypeOf<Subject[0]>().toExtend<AnySyncAssertion>();
      });

      it('should extend AnyAssertion', () => {
        expectTypeOf<Subject[0]>().toExtend<AnyAssertion>();
      });
      it('should extend AssertionSync', () => {
        expectTypeOf<Subject[0]>().toExtend<
          AssertionSync<
            Subject[0]['parts'],
            Subject[0]['impl'],
            Subject[0]['slots']
          >
        >();
      });
    });

    it('should return a tuple type', () => {
      expectTypeOf<
        Concat<readonly ['a', 'b'], readonly ['c', 'd']>
      >().toEqualTypeOf<readonly ['a', 'b', 'c', 'd']>();
    });
  });
});

describe('ZodTypeMap', () => {
  it('should map primitive types correctly', () => {
    expectTypeOf<ZodTypeMap['string']>().toExtend<z.ZodString>();
    expectTypeOf<ZodTypeMap['number']>().toExtend<z.ZodNumber>();
    expectTypeOf<ZodTypeMap['boolean']>().toExtend<z.ZodBoolean>();
    expectTypeOf<ZodTypeMap['bigint']>().toExtend<z.ZodBigInt>();
    expectTypeOf<ZodTypeMap['symbol']>().toExtend<z.ZodSymbol>();
    expectTypeOf<ZodTypeMap['date']>().toExtend<z.ZodDate>();
  });

  it('should map collection types correctly', () => {
    expectTypeOf<ZodTypeMap['array']>().toExtend<z.ZodArray<any>>();
    expectTypeOf<ZodTypeMap['object']>().toExtend<z.ZodObject<any>>();
    expectTypeOf<ZodTypeMap['tuple']>().toExtend<z.ZodTuple<any>>();
    expectTypeOf<ZodTypeMap['map']>().toExtend<z.ZodMap<any, any>>();
    expectTypeOf<ZodTypeMap['set']>().toExtend<z.ZodSet<any>>();
    expectTypeOf<ZodTypeMap['record']>().toExtend<z.ZodRecord<any, any>>();
  });

  it('should map special value types correctly', () => {
    expectTypeOf<ZodTypeMap['null']>().toExtend<z.ZodNull>();
    expectTypeOf<ZodTypeMap['undefined']>().toExtend<z.ZodUndefined>();
    expectTypeOf<ZodTypeMap['void']>().toExtend<z.ZodVoid>();
    expectTypeOf<ZodTypeMap['any']>().toExtend<z.ZodAny>();
    expectTypeOf<ZodTypeMap['unknown']>().toExtend<z.ZodUnknown>();
    expectTypeOf<ZodTypeMap['never']>().toExtend<z.ZodNever>();
  });

  it('should map complex types correctly', () => {
    expectTypeOf<ZodTypeMap['union']>().toExtend<z.ZodUnion<any>>();
    expectTypeOf<ZodTypeMap['literal']>().toExtend<z.ZodLiteral<any>>();
    expectTypeOf<ZodTypeMap['enum']>().toExtend<z.ZodEnum<any>>();
    expectTypeOf<ZodTypeMap['function']>().toExtend<z.ZodFunction<any, any>>();
    expectTypeOf<ZodTypeMap['promise']>().toExtend<z.ZodPromise<any>>();
    expectTypeOf<ZodTypeMap['lazy']>().toExtend<z.ZodLazy<any>>();
  });

  it('should map modifier types correctly', () => {
    expectTypeOf<ZodTypeMap['optional']>().toExtend<z.ZodOptional<any>>();
    expectTypeOf<ZodTypeMap['nullable']>().toExtend<z.ZodNullable<any>>();
    expectTypeOf<ZodTypeMap['readonly']>().toExtend<z.ZodReadonly<any>>();
    expectTypeOf<ZodTypeMap['default']>().toExtend<z.ZodDefault<any>>();
    expectTypeOf<ZodTypeMap['catch']>().toExtend<z.ZodCatch<any>>();
  });

  it('should map transform types correctly', () => {
    expectTypeOf<ZodTypeMap['pipe']>().toExtend<z.ZodPipe<any, any>>();
  });

  it('should have correct keys', () => {
    type Keys = keyof ZodTypeMap;
    expectTypeOf<Keys>().toExtend<
      | 'any'
      | 'array'
      | 'bigint'
      | 'boolean'
      | 'catch'
      | 'date'
      | 'default'
      | 'enum'
      | 'function'
      | 'lazy'
      | 'literal'
      | 'map'
      | 'never'
      | 'null'
      | 'nullable'
      | 'number'
      | 'object'
      | 'optional'
      | 'pipe'
      | 'promise'
      | 'readonly'
      | 'record'
      | 'set'
      | 'string'
      | 'symbol'
      | 'tuple'
      | 'undefined'
      | 'union'
      | 'unknown'
      | 'void'
    >();
  });

  it('should work with isZodType function overloads', () => {
    const stringSchema = z.string();
    const arraySchema = z.array(z.number());

    // Test that the type narrowing works correctly
    if (isZodType(stringSchema)) {
      expectTypeOf(stringSchema).toExtend<z.ZodType>();
    }

    if (isZodType(stringSchema, 'string')) {
      expectTypeOf(stringSchema).toExtend<z.ZodString>();
    }

    if (isZodType(arraySchema, 'array')) {
      expectTypeOf(arraySchema).toExtend<z.ZodArray<any>>();
    }

    // Test with a promise schema
    const promiseSchema = z.promise(z.boolean());
    if (isZodType(promiseSchema, 'promise')) {
      expectTypeOf(promiseSchema).toExtend<z.ZodPromise<any>>();
    }
  });
});
