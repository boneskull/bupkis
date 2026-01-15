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
});
