import { expect } from 'bupkis';
import { describe, it } from 'node:test';

import { getTransformMode } from '../src/cli.js';

describe('getTransformMode', () => {
  it('should return "best-effort" by default', () => {
    expect(getTransformMode({}), 'to be', 'best-effort');
  });

  it('should return "best-effort" when both flags are false', () => {
    expect(
      getTransformMode({ interactive: false, strict: false }),
      'to be',
      'best-effort',
    );
  });

  it('should return "interactive" when interactive is true', () => {
    expect(getTransformMode({ interactive: true }), 'to be', 'interactive');
  });

  it('should return "strict" when strict is true', () => {
    expect(getTransformMode({ strict: true }), 'to be', 'strict');
  });

  it('should prioritize "strict" over "interactive"', () => {
    expect(
      getTransformMode({ interactive: true, strict: true }),
      'to be',
      'strict',
    );
  });
});
