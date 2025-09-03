import { describe, it } from 'node:test';
import { z } from 'zod/v4';

import { expect } from '../src/bootstrap.js';

describe('use()', () => {
  it('should work exactly like the design document example', () => {
    // Test basic functionality first
    expect('bar', 'to be a string'); // this comes from the builtin assertions
    console.log('✅ Built-in assertion works');

    // Create our own assertion exactly as shown in the design doc
    class Foo {
      bar = 'bar';
    }
    const myAssertion = expect.createAssertion(
      ['to be a Foo'],
      z.instanceof(Foo),
    );

    const { expect: myExpected, expectAsync: _ } = expect.use([myAssertion]);

    const foo = new Foo();

    // This will be typesafe - should not throw
    myExpected(foo, 'to be a Foo');
    console.log('✅ Custom assertion works');

    // This will be typesafe - should not throw; retained from original expect()
    myExpected(foo.bar, 'to be a string');
    console.log('✅ Built-in assertions retained in extended expect');

    console.log('✅ Complete design document example works!');
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
    expect(error?.message, 'to be a', 'string');
    expect(error!.message, 'to include', 'Input not instance of Foo');
    console.log('✅ Custom assertion errors work correctly');
  });

  it('should validate all required properties exist', () => {
    // Check original expect has all required properties
    expect(typeof expect.fail, 'to be', 'function');
    expect(typeof expect.createAssertion, 'to be', 'function');
    expect(typeof expect.createAsyncAssertion, 'to be', 'function');
    expect(typeof expect.use, 'to be', 'function');
    console.log('✅ Original expect has all required properties');

    // Check extended expect retains all properties
    const customAssertion = expect.createAssertion(
      ['to be custom'],
      z.string(),
    );
    const { expect: extended, expectAsync } = expect.use([customAssertion]);

    expect(typeof extended.fail, 'to be', 'function');
    expect(typeof extended.createAssertion, 'to be', 'function');
    expect(typeof extended.createAsyncAssertion, 'to be', 'function');
    expect(typeof extended.use, 'to be', 'function');
    console.log('✅ Extended expect has all required properties');

    expect(typeof expectAsync.fail, 'to be', 'function');
    expect(typeof expectAsync.createAssertion, 'to be', 'function');
    expect(typeof expectAsync.createAsyncAssertion, 'to be', 'function');
    expect(typeof expectAsync.use, 'to be', 'function');
    console.log('✅ Extended expectAsync has all required properties');
  });
});
