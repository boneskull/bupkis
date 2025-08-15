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

import {
  type AnyAssertion,
  type AnyAssertions,
  type AnySyncAssertion,
  type AnySyncAssertions,
  type AssertionSync,
} from '../src/assertion/assertion-types.js';
import { SyncAssertions } from '../src/assertion/impl/sync.js';
import { expect, expectAsync } from '../src/bootstrap.js';
import { type Concat } from '../src/types.js';

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
