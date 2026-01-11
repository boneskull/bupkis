/**
 * Type guards for Sinon spy and stub detection.
 *
 * @packageDocumentation
 */

import type { SinonSpy, SinonSpyCall } from 'sinon';

const { isArray } = Array;

/**
 * Checks if a value is a Sinon spy or stub.
 *
 * Sinon spies have a unique `isSinonProxy` property set to `true`.
 *
 * @function
 */
export const isSpy = (value: unknown): value is SinonSpy =>
  typeof value === 'function' &&
  'isSinonProxy' in value &&
  value.isSinonProxy === true;

/**
 * Checks if a value is a Sinon spy call object.
 *
 * Spy calls are returned by `spy.getCall(n)` and have specific properties like
 * `args`, `thisValue`, `returnValue`, and `calledWith`.
 *
 * @function
 */
export const isSpyCall = (value: unknown): value is SinonSpyCall => {
  if (value === null || typeof value !== 'object') {
    return false;
  }
  const obj = value as Record<string, unknown>;
  return (
    'args' in obj &&
    isArray(obj.args) &&
    'thisValue' in obj &&
    'returnValue' in obj &&
    typeof obj.calledWith === 'function'
  );
};
