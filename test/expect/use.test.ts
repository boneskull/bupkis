import { describe, it } from 'node:test';
import { z } from 'zod/v4';

import { type AnySyncAssertions } from '../../src/assertion/assertion-types.js';
import { expect, expectAsync } from '../../src/bootstrap.js';
import { type Expect } from '../../src/types.js';

describe('expect.use()', () => {
  it('should create a new API with custom assertions', () => {
    class Foo {
      bar = 'bar';
    }
    const myAssertion = expect.createAssertion(
      ['to be a Foo'],
      z.instanceof(Foo),
    );

    const assertions = [myAssertion] as const satisfies AnySyncAssertions;

    const {
      expect: myExpected,
      expectAsync: _,
      use: myUse,
    } = expect.use(assertions);

    const foo = new Foo();

    expect(() => myExpected(foo, 'to be a Foo'), 'not to throw');

    expect(() => myExpected(foo.bar, 'to be a string'), 'not to throw');

    expect(myUse, 'to be a function');
  });

  it('should validate type safety and proper error messages', () => {
    class Foo {
      bar = 'bar';
    }
    const myAssertion = expect.createAssertion(
      ['to be a Foo'],
      z.instanceof(Foo),
    );
    const { expect: myExpected } = expect.use([myAssertion]);

    // Test failure case
    let error: Error | undefined;
    try {
      myExpected('not a foo', 'to be a Foo');
    } catch (err) {
      error = err as Error;
    }

    expect(error, 'to be a', 'object');
    expect(error, 'to be an Error');
    expect(error?.message, 'to be a', 'string');
    expect(error!.message, 'to include', 'Input not instance of Foo');
  });

  it('should contain the entire API', () => {
    // Check original expect has all required properties

    const fnProps = [
      'fail',
      'createAssertion',
      'createAsyncAssertion',
      'use',
    ] as const satisfies (keyof Expect)[];

    fnProps.forEach((prop) => {
      expect(expect[prop], 'to be a function');
    });

    fnProps.forEach((prop) => {
      expect(expectAsync[prop], 'to be a function');
    });

    // Check extended expect retains all properties
    const customAssertion = expect.createAssertion(
      ['to be custom'],
      z.string(),
    );
    const { expect: expect2, expectAsync: expectAsync2 } = expect.use([
      customAssertion,
    ]);

    fnProps.forEach((prop) => {
      expect(expect2[prop], 'to be a function');
    });
    fnProps.forEach((prop) => {
      expect(expectAsync2[prop], 'to be a function');
    });
  });
});
