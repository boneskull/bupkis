import { expect } from 'bupkis';
import { describe, it } from 'node:test';

import { transformCode } from '../src/transform.js';

describe('transformCode', () => {
  it('should transform expect().toBe() to expect(, "to be", )', async () => {
    const input = `expect(42).toBe(42);`;
    const result = await transformCode(input);
    expect(result.code, 'to contain', `expect(42, 'to be', 42)`);
    expect(result.transformCount, 'to equal', 1);
  });

  it('should transform expect().not.toBe() to expect(, "not to be", )', async () => {
    const input = `expect(42).not.toBe(0);`;
    const result = await transformCode(input);
    expect(result.code, 'to contain', `expect(42, 'not to be', 0)`);
  });

  it('should transform expect().toEqual() to expect(, "to deep equal", )', async () => {
    const input = `expect({a: 1}).toEqual({a: 1});`;
    const result = await transformCode(input);
    expect(
      result.code,
      'to contain',
      `expect({a: 1}, 'to deep equal', {a: 1})`,
    );
  });

  it('should handle multiple assertions in one file', async () => {
    const input = `
expect(1).toBe(1);
expect(2).toBe(2);
expect(3).toEqual(3);
`.trim();
    const result = await transformCode(input);
    expect(result.transformCount, 'to equal', 3);
  });

  it('should preserve non-expect code', async () => {
    const input = `
const x = 42;
expect(x).toBe(42);
console.log(x);
`.trim();
    const result = await transformCode(input);
    expect(result.code, 'to contain', 'const x = 42');
    expect(result.code, 'to contain', 'console.log(x)');
  });

  describe('mock matcher detection (sinon disabled)', () => {
    it('should detect toHaveBeenCalled without transforming', async () => {
      const input = `expect(spy).toHaveBeenCalled();`;
      const result = await transformCode(input, { sinon: false });
      expect(result.mockMatchers, 'to have length', 1);
      expect(result.mockMatchers[0]?.matcher, 'to equal', 'toHaveBeenCalled');
      expect(result.transformCount, 'to equal', 0);
      // Original code should remain unchanged
      expect(result.code, 'to contain', 'toHaveBeenCalled');
    });

    it('should detect multiple mock matchers', async () => {
      const input = `
expect(spy1).toHaveBeenCalled();
expect(spy2).toHaveBeenCalledWith('foo');
expect(spy3).toHaveBeenCalledTimes(3);
`.trim();
      const result = await transformCode(input, { sinon: false });
      expect(result.mockMatchers, 'to have length', 3);
      expect(result.transformCount, 'to equal', 0);
    });

    it('should transform non-mock matchers while detecting mock matchers', async () => {
      const input = `
expect(42).toBe(42);
expect(spy).toHaveBeenCalled();
`.trim();
      const result = await transformCode(input, { sinon: false });
      expect(result.mockMatchers, 'to have length', 1);
      expect(result.transformCount, 'to equal', 1);
      expect(result.code, 'to contain', `expect(42, 'to be', 42)`);
    });
  });

  describe('mock matcher transformation (sinon enabled)', () => {
    it('should transform toHaveBeenCalled', async () => {
      const input = `expect(spy).toHaveBeenCalled();`;
      const result = await transformCode(input, { sinon: true });
      expect(result.code, 'to contain', `expect(spy, 'was called')`);
      expect(result.transformCount, 'to equal', 1);
      expect(result.mockMatchers, 'to have length', 0);
    });

    it('should transform toHaveBeenCalledTimes', async () => {
      const input = `expect(spy).toHaveBeenCalledTimes(3);`;
      const result = await transformCode(input, { sinon: true });
      expect(result.code, 'to contain', `expect(spy, 'was called times', 3)`);
    });

    it('should transform toHaveBeenCalledWith (wrap args in array)', async () => {
      const input = `expect(spy).toHaveBeenCalledWith('foo', 42);`;
      const result = await transformCode(input, { sinon: true });
      expect(
        result.code,
        'to contain',
        `expect(spy, 'was called with', ['foo', 42])`,
      );
    });

    it('should transform toHaveBeenLastCalledWith (restructure subject)', async () => {
      const input = `expect(spy).toHaveBeenLastCalledWith('arg');`;
      const result = await transformCode(input, { sinon: true });
      expect(
        result.code,
        'to contain',
        `expect(spy.lastCall, 'to have args', ['arg'])`,
      );
    });

    it('should transform toHaveBeenNthCalledWith (adjust index)', async () => {
      const input = `expect(spy).toHaveBeenNthCalledWith(2, 'arg');`;
      const result = await transformCode(input, { sinon: true });
      expect(
        result.code,
        'to contain',
        `expect(spy.getCall(2 - 1), 'to have args', ['arg'])`,
      );
    });

    it('should transform toHaveReturned', async () => {
      const input = `expect(spy).toHaveReturned();`;
      const result = await transformCode(input, { sinon: true });
      expect(result.code, 'to contain', `expect(spy, 'to have returned')`);
    });

    it('should transform toHaveReturnedTimes', async () => {
      const input = `expect(spy).toHaveReturnedTimes(2);`;
      const result = await transformCode(input, { sinon: true });
      expect(
        result.code,
        'to contain',
        `expect(spy, 'to have returned times', 2)`,
      );
    });

    it('should transform toHaveReturnedWith', async () => {
      const input = `expect(spy).toHaveReturnedWith(42);`;
      const result = await transformCode(input, { sinon: true });
      expect(
        result.code,
        'to contain',
        `expect(spy, 'to have returned with', 42)`,
      );
    });

    it('should transform toHaveLastReturnedWith (restructure subject)', async () => {
      const input = `expect(spy).toHaveLastReturnedWith(42);`;
      const result = await transformCode(input, { sinon: true });
      expect(
        result.code,
        'to contain',
        `expect(spy.lastCall, 'to have returned', 42)`,
      );
    });

    it('should transform toHaveNthReturnedWith (adjust index)', async () => {
      const input = `expect(spy).toHaveNthReturnedWith(1, 42);`;
      const result = await transformCode(input, { sinon: true });
      expect(
        result.code,
        'to contain',
        `expect(spy.getCall(1 - 1), 'to have returned', 42)`,
      );
    });

    it('should handle negation', async () => {
      const input = `expect(spy).not.toHaveBeenCalled();`;
      const result = await transformCode(input, { sinon: true });
      expect(result.code, 'to contain', `expect(spy, 'not was called')`);
    });

    it('should transform Jest 29 aliases', async () => {
      const input = `expect(spy).toBeCalled();`;
      const result = await transformCode(input, { sinon: true });
      expect(result.code, 'to contain', `expect(spy, 'was called')`);
    });

    it('should transform Jest 29 aliases without "to" prefix', async () => {
      // These aliases were removed in Jest 30
      const lastCalledWith = await transformCode(
        `expect(spy).lastCalledWith('arg');`,
        { sinon: true },
      );
      expect(
        lastCalledWith.code,
        'to contain',
        `expect(spy.lastCall, 'to have args', ['arg'])`,
      );

      const nthCalledWith = await transformCode(
        `expect(spy).nthCalledWith(2, 'arg');`,
        { sinon: true },
      );
      expect(
        nthCalledWith.code,
        'to contain',
        `expect(spy.getCall(2 - 1), 'to have args', ['arg'])`,
      );

      const lastReturnedWith = await transformCode(
        `expect(spy).lastReturnedWith(42);`,
        { sinon: true },
      );
      expect(
        lastReturnedWith.code,
        'to contain',
        `expect(spy.lastCall, 'to have returned', 42)`,
      );

      const nthReturnedWith = await transformCode(
        `expect(spy).nthReturnedWith(1, 99);`,
        { sinon: true },
      );
      expect(
        nthReturnedWith.code,
        'to contain',
        `expect(spy.getCall(1 - 1), 'to have returned', 99)`,
      );
    });
  });

  describe('import transformation with sinon', () => {
    it('should add sinon imports when mock matchers are transformed', async () => {
      const input = `
import { expect } from '@jest/globals';
expect(spy).toHaveBeenCalled();
`.trim();
      const result = await transformCode(input, { sinon: true });
      expect(result.code, 'to contain', `import { use } from 'bupkis'`);
      expect(
        result.code,
        'to contain',
        `import sinonAssertions from '@bupkis/sinon'`,
      );
      expect(
        result.code,
        'to contain',
        `const { expect } = use(sinonAssertions)`,
      );
    });

    it('should not add sinon imports when no mock matchers', async () => {
      const input = `
import { expect } from '@jest/globals';
expect(42).toBe(42);
`.trim();
      const result = await transformCode(input, { sinon: true });
      expect(result.code, 'not to contain', '@bupkis/sinon');
      expect(result.code, 'to contain', `import { expect } from 'bupkis'`);
    });
  });

  describe('promise matcher transformation (resolves/rejects)', () => {
    describe('resolves with direct value matchers', () => {
      it('should transform resolves.toBe()', async () => {
        const input = `expect(promise).resolves.toBe(42);`;
        const result = await transformCode(input);
        expect(
          result.code,
          'to contain',
          `expectAsync(promise, 'to fulfill with value satisfying', 42)`,
        );
        expect(result.transformCount, 'to equal', 1);
      });

      it('should transform resolves.toEqual()', async () => {
        const input = `expect(promise).resolves.toEqual({ a: 1 });`;
        const result = await transformCode(input);
        expect(
          result.code,
          'to contain',
          `expectAsync(promise, 'to fulfill with value satisfying', { a: 1 })`,
        );
      });

      it('should transform resolves.toStrictEqual()', async () => {
        const input = `expect(promise).resolves.toStrictEqual({ a: 1 });`;
        const result = await transformCode(input);
        expect(
          result.code,
          'to contain',
          `expectAsync(promise, 'to fulfill with value satisfying', { a: 1 })`,
        );
      });

      it('should transform resolves.toMatchObject()', async () => {
        const input = `expect(promise).resolves.toMatchObject({ a: 1 });`;
        const result = await transformCode(input);
        expect(
          result.code,
          'to contain',
          `expectAsync(promise, 'to fulfill with value satisfying', { a: 1 })`,
        );
      });
    });

    describe('resolves with expect.it() wrapped matchers', () => {
      it('should transform resolves.toBeTruthy()', async () => {
        const input = `expect(promise).resolves.toBeTruthy();`;
        const result = await transformCode(input);
        expect(
          result.code,
          'to contain',
          `expectAsync(promise, 'to fulfill with value satisfying', expect.it('to be truthy'))`,
        );
      });

      it('should transform resolves.toBeFalsy()', async () => {
        const input = `expect(promise).resolves.toBeFalsy();`;
        const result = await transformCode(input);
        expect(
          result.code,
          'to contain',
          `expectAsync(promise, 'to fulfill with value satisfying', expect.it('to be falsy'))`,
        );
      });

      it('should transform resolves.toBeDefined()', async () => {
        const input = `expect(promise).resolves.toBeDefined();`;
        const result = await transformCode(input);
        expect(
          result.code,
          'to contain',
          `expectAsync(promise, 'to fulfill with value satisfying', expect.it('to be defined'))`,
        );
      });

      it('should transform resolves.toContain()', async () => {
        const input = `expect(promise).resolves.toContain('x');`;
        const result = await transformCode(input);
        expect(
          result.code,
          'to contain',
          `expectAsync(promise, 'to fulfill with value satisfying', expect.it('to contain', 'x'))`,
        );
      });

      it('should transform resolves.toHaveLength()', async () => {
        const input = `expect(promise).resolves.toHaveLength(5);`;
        const result = await transformCode(input);
        expect(
          result.code,
          'to contain',
          `expectAsync(promise, 'to fulfill with value satisfying', expect.it('to have length', 5))`,
        );
      });

      it('should transform resolves.toBeGreaterThan()', async () => {
        const input = `expect(promise).resolves.toBeGreaterThan(10);`;
        const result = await transformCode(input);
        expect(
          result.code,
          'to contain',
          `expectAsync(promise, 'to fulfill with value satisfying', expect.it('to be greater than', 10))`,
        );
      });
    });

    describe('resolves with negation', () => {
      it('should transform resolves.not.toBe()', async () => {
        const input = `expect(promise).resolves.not.toBe(42);`;
        const result = await transformCode(input);
        expect(
          result.code,
          'to contain',
          `expectAsync(promise, 'not to fulfill with value satisfying', 42)`,
        );
      });

      it('should transform resolves.not.toBeTruthy()', async () => {
        const input = `expect(promise).resolves.not.toBeTruthy();`;
        const result = await transformCode(input);
        expect(
          result.code,
          'to contain',
          `expectAsync(promise, 'not to fulfill with value satisfying', expect.it('not to be truthy'))`,
        );
      });
    });

    describe('rejects.toThrow() special cases', () => {
      it('should transform rejects.toThrow() with no args', async () => {
        const input = `expect(promise).rejects.toThrow();`;
        const result = await transformCode(input);
        expect(result.code, 'to contain', `expectAsync(promise, 'to reject')`);
      });

      it('should transform rejects.toThrow(ErrorClass)', async () => {
        const input = `expect(promise).rejects.toThrow(TypeError);`;
        const result = await transformCode(input);
        expect(
          result.code,
          'to contain',
          `expectAsync(promise, 'to reject with a', TypeError)`,
        );
      });

      it('should transform rejects.toThrow(string)', async () => {
        const input = `expect(promise).rejects.toThrow('error message');`;
        const result = await transformCode(input);
        expect(
          result.code,
          'to contain',
          `expectAsync(promise, 'to reject with error satisfying', 'error message')`,
        );
      });

      it('should transform rejects.toThrow(/regex/)', async () => {
        const input = `expect(promise).rejects.toThrow(/error/);`;
        const result = await transformCode(input);
        expect(
          result.code,
          'to contain',
          `expectAsync(promise, 'to reject with error satisfying', /error/)`,
        );
      });

      it('should transform rejects.toThrowError()', async () => {
        const input = `expect(promise).rejects.toThrowError('message');`;
        const result = await transformCode(input);
        expect(
          result.code,
          'to contain',
          `expectAsync(promise, 'to reject with error satisfying', 'message')`,
        );
      });
    });

    describe('rejects with other matchers', () => {
      it('should transform rejects.toBe()', async () => {
        const input = `expect(promise).rejects.toBe('error');`;
        const result = await transformCode(input);
        expect(
          result.code,
          'to contain',
          `expectAsync(promise, 'to reject with error satisfying', expect.it('to be', 'error'))`,
        );
      });

      it('should transform rejects.toEqual()', async () => {
        const input = `expect(promise).rejects.toEqual({ message: 'error' });`;
        const result = await transformCode(input);
        expect(
          result.code,
          'to contain',
          `expectAsync(promise, 'to reject with error satisfying', expect.it('to deep equal', { message: 'error' }))`,
        );
      });

      it('should transform rejects.toHaveProperty()', async () => {
        const input = `expect(promise).rejects.toHaveProperty('message');`;
        const result = await transformCode(input);
        expect(
          result.code,
          'to contain',
          `expectAsync(promise, 'to reject with error satisfying', expect.it('to have property', 'message'))`,
        );
      });
    });

    describe('rejects with negation', () => {
      it('should transform rejects.not.toThrow()', async () => {
        const input = `expect(promise).rejects.not.toThrow();`;
        const result = await transformCode(input);
        expect(
          result.code,
          'to contain',
          `expectAsync(promise, 'not to reject')`,
        );
      });

      it('should transform rejects.not.toThrow(Error)', async () => {
        const input = `expect(promise).rejects.not.toThrow(TypeError);`;
        const result = await transformCode(input);
        expect(
          result.code,
          'to contain',
          `expectAsync(promise, 'not to reject with a', TypeError)`,
        );
      });
    });

    describe('import handling for promise matchers', () => {
      it('should add expectAsync import when promise matchers are used', async () => {
        const input = `
import { expect } from '@jest/globals';
expect(promise).resolves.toBe(42);
`.trim();
        const result = await transformCode(input);
        expect(
          result.code,
          'to contain',
          `import { expect, expectAsync } from 'bupkis'`,
        );
      });

      it('should add both expect and expectAsync when both are used', async () => {
        const input = `
import { expect } from '@jest/globals';
expect(42).toBe(42);
expect(promise).resolves.toBe(42);
`.trim();
        const result = await transformCode(input);
        expect(
          result.code,
          'to contain',
          `import { expect, expectAsync } from 'bupkis'`,
        );
        expect(result.transformCount, 'to equal', 2);
      });

      it('should add expectAsync to existing bupkis import when needed', async () => {
        const input = `
import { expect } from 'bupkis';
expect(promise).resolves.toBe(42);
`.trim();
        const result = await transformCode(input);
        // Should not create duplicate import, should add expectAsync
        expect(
          result.code,
          'to contain',
          `import { expect, expectAsync } from 'bupkis'`,
        );
        // Should not have duplicate bupkis imports
        const importCount = (result.code.match(/from 'bupkis'/g) || []).length;
        expect(importCount, 'to equal', 1);
      });

      it('should not duplicate imports when bupkis already has expectAsync', async () => {
        const input = `
import { expect, expectAsync } from 'bupkis';
expect(promise).resolves.toBe(42);
`.trim();
        const result = await transformCode(input);
        // Should not create duplicate import
        const importCount = (result.code.match(/from 'bupkis'/g) || []).length;
        expect(importCount, 'to equal', 1);
      });
    });

    describe('promise matchers with function call subjects', () => {
      it('should handle resolves with function call subject', async () => {
        const input = `expect(fetchData()).resolves.toBe(42);`;
        const result = await transformCode(input);
        expect(
          result.code,
          'to contain',
          `expectAsync(fetchData(), 'to fulfill with value satisfying', 42)`,
        );
      });

      it('should handle rejects with function call subject', async () => {
        const input = `expect(getPromise()).rejects.toThrow();`;
        const result = await transformCode(input);
        expect(
          result.code,
          'to contain',
          `expectAsync(getPromise(), 'to reject')`,
        );
      });

      it('should handle nested function calls in subject', async () => {
        const input = `expect(fetchUser(getId())).resolves.toEqual({ name: 'test' });`;
        const result = await transformCode(input);
        expect(
          result.code,
          'to contain',
          `expectAsync(fetchUser(getId()), 'to fulfill with value satisfying', { name: 'test' })`,
        );
      });

      it('should handle method calls in subject', async () => {
        const input = `expect(service.fetchData()).resolves.toBeTruthy();`;
        const result = await transformCode(input);
        expect(
          result.code,
          'to contain',
          `expectAsync(service.fetchData(), 'to fulfill with value satisfying', expect.it('to be truthy'))`,
        );
      });
    });

    describe('promise matchers with sinon enabled', () => {
      it('should handle promise matchers with expect.it() when sinon is enabled', async () => {
        const input = `
import { expect } from '@jest/globals';
expect(promise).resolves.toBeTruthy();
`.trim();
        const result = await transformCode(input, { sinon: true });
        // Verify the transformed code uses expectAsync
        expect(
          result.code,
          'to contain',
          `expectAsync(promise, 'to fulfill with value satisfying', expect.it('to be truthy'))`,
        );
        // Verify expect is imported (needed for expect.it())
        expect(result.code, 'to contain', `import { expect, expectAsync }`);
      });

      it('should handle mixed sync and async assertions with sinon', async () => {
        const input = `
import { expect } from '@jest/globals';
expect(42).toBe(42);
expect(promise).resolves.toBe('value');
`.trim();
        const result = await transformCode(input, { sinon: true });
        expect(result.code, 'to contain', `expect(42, 'to be', 42)`);
        expect(
          result.code,
          'to contain',
          `expectAsync(promise, 'to fulfill with value satisfying', 'value')`,
        );
      });
    });
  });
});
