import Debug from 'debug';
import { describe, it } from 'node:test';

import { AsyncAssertions, SyncAssertions } from '../src/assertion/index.js';
import { expect } from '../src/bootstrap.js';

const debug = Debug('bupkis:test');

describe('Assertion string representations', () => {
  it('should contain no duplicates', () => {
    const actual: Set<string> = new Set();
    const expected: string[] = [];
    for (const assertion of [...SyncAssertions, ...AsyncAssertions]) {
      const str = assertion.toString();
      debug(str);
      actual.add(str);
      expected.push(str);
    }

    expect(actual.size, 'to be', expected.length);
  });
});
