/**
 * Zod schemas for Sinon types.
 *
 * @packageDocumentation
 */

import type { SinonSpy, SinonSpyCall } from 'sinon';

import { z } from 'bupkis';

import { isSpy, isSpyCall } from './guards.js';

/**
 * Schema that validates Sinon spies and stubs.
 */
export const SpySchema = z.custom<SinonSpy>(
  isSpy,
  'Expected a Sinon spy or stub',
);

/**
 * Schema that validates Sinon spy call objects.
 */
export const SpyCallSchema = z.custom<SinonSpyCall>(
  isSpyCall,
  'Expected a Sinon spy call',
);
