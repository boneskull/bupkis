import { expect } from 'bupkis';
import { describe, it } from 'node:test';

import type {
  ChaiStyle,
  MatcherTransform,
  TransformMode,
} from '../src/types.js';

describe('types', () => {
  it('should export ChaiStyle type with bdd and tdd variants', () => {
    const bdd: ChaiStyle = 'bdd';
    const tdd: ChaiStyle = 'tdd';
    expect(bdd, 'to be', 'bdd');
    expect(tdd, 'to be', 'tdd');
  });

  it('should export TransformMode type', () => {
    const mode: TransformMode = 'best-effort';
    expect(mode, 'to be', 'best-effort');
  });

  it('should define MatcherTransform with required fields', () => {
    const transform: MatcherTransform = {
      bupkisPhrase: 'to be',
      chaiMatcher: 'equal',
      style: 'bdd',
    };
    expect(transform.bupkisPhrase, 'to be', 'to be');
    expect(transform.chaiMatcher, 'to be', 'equal');
    expect(transform.style, 'to be', 'bdd');
  });
});
