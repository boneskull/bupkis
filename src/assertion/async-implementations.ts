import { FunctionSchema, WrappedPromiseLikeSchema } from '../schema.js';
import { createAssertion } from './index.js';

export const AsyncAssertions = [
  createAssertion(
    [FunctionSchema, ['to resolve', 'to fulfill']],
    async (subject) => {
      try {
        await subject();
        return true;
      } catch {
        return false;
      }
    },
  ),
  createAssertion(
    [WrappedPromiseLikeSchema, ['to resolve', 'to fulfill']],
    async (subject) => {
      try {
        await subject;
        return true;
      } catch {
        return false;
      }
    },
  ),
] as const;

export const Assertions = AsyncAssertions;
