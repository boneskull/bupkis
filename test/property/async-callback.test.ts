import fc from 'fast-check';
import { describe } from 'node:test';

import * as assertions from '../../src/assertion/impl/async-callback.js';
import { AsyncCallbackAssertions } from '../../src/assertion/impl/async.js';
import { expectAsync } from '../../src/bootstrap.js';
import { type AnyAssertion } from '../../src/types.js';
import { hasKey, hasValue } from '../../src/util.js';
import {
  type PropertyTestConfig,
  type PropertyTestConfigParameters,
} from './property-test-config.js';
import { extractPhrases } from './property-test-util.js';
import {
  assertExhaustiveTestConfigs,
  runPropertyTests,
} from './property-test.macro.js';

/**
 * Test config defaults for callback assertions
 */
const testConfigDefaults = {} satisfies PropertyTestConfigParameters;

const objectFilter = fc
  .object()
  .filter(
    (o) =>
      Object.keys(o).length > 0 && !hasKey(o, '__proto__') && !hasValue(o, {}),
  );

const asyncTestConfigs = new Map<AnyAssertion, PropertyTestConfig>([
  [
    assertions.functionEventuallyCallCallbackAssertion,
    {
      invalid: {
        async: true,
        generators: [
          fc.constant(async () => {
            await new Promise((resolve) => setTimeout(resolve, 1));
            return 'no callback expected';
          }),
          fc.constantFrom(
            ...extractPhrases(
              assertions.functionEventuallyCallCallbackAssertion,
            ),
          ),
        ],
        shouldInterrupt: true,
        timeout: 2000,
      },
      valid: {
        async: true,
        generators: [
          fc.constant(async (callback: () => void) => {
            await new Promise((resolve) => setTimeout(resolve, 1));
            await Promise.resolve();
            callback();
          }),
          fc.constantFrom(
            ...extractPhrases(
              assertions.functionEventuallyCallCallbackAssertion,
            ),
          ),
        ],
        timeout: 2000,
      },
    },
  ],

  [
    assertions.functionEventuallyCallCallbackWithExactValueAssertion,
    {
      invalid: {
        asyncProperty: () =>
          fc.asyncProperty(
            fc
              .string()
              .filter((s) => s !== 'wrong')
              .chain((expectedValue) =>
                fc.tuple(
                  fc.constant(async (callback: (_value: any) => void) => {
                    await Promise.resolve();
                    callback('wrong');
                  }),
                  fc.constantFrom(
                    ...extractPhrases(
                      assertions.functionEventuallyCallCallbackWithExactValueAssertion,
                    ),
                  ),
                  fc.constant(expectedValue),
                ),
              ),
            async (params) => {
              try {
                await expectAsync(...params);
                return false;
              } catch {
                return true;
              }
            },
          ),
      },
      valid: {
        asyncProperty: () =>
          fc.asyncProperty(
            fc.string().chain((expectedValue) =>
              fc.tuple(
                fc.constant(async (callback: (value: unknown) => void) => {
                  await Promise.resolve();
                  callback(expectedValue);
                }),
                fc.constantFrom(
                  ...extractPhrases(
                    assertions.functionEventuallyCallCallbackWithExactValueAssertion,
                  ),
                ),
                fc.constant(expectedValue),
              ),
            ),
            async (params) => {
              await expectAsync(...params);
            },
          ),
      },
    },
  ],

  [
    assertions.functionEventuallyCallCallbackWithValueAssertion,
    {
      invalid: {
        asyncProperty: () =>
          fc.asyncProperty(
            fc
              .string()
              .filter((s) => s !== 'wrong')
              .chain((expectedValue) =>
                fc.tuple(
                  fc.constant(async (callback: (_value: any) => void) => {
                    await Promise.resolve();
                    callback('wrong');
                  }),
                  fc.constantFrom(
                    ...extractPhrases(
                      assertions.functionEventuallyCallCallbackWithValueAssertion,
                    ),
                  ),
                  fc.constant(expectedValue),
                ),
              ),
            async (params) => {
              try {
                await expectAsync(...params);
                return false;
              } catch {
                return true;
              }
            },
          ),
      },
      valid: {
        asyncProperty: () =>
          fc.asyncProperty(
            fc
              .anything()
              .filter(
                (v) => typeof v === 'object' && !!v && !hasKey(v, '__proto__'),
              )
              .chain((expectedValue) =>
                fc.tuple(
                  fc.constant(async (callback: (value: unknown) => void) => {
                    await Promise.resolve();
                    callback(expectedValue);
                  }),
                  fc.constantFrom(
                    ...extractPhrases(
                      assertions.functionEventuallyCallCallbackWithValueAssertion,
                    ),
                  ),
                  fc.constant(expectedValue),
                ),
              ),
            async (params) => {
              await expectAsync(...params);
            },
          ),
      },
    },
  ],

  [
    assertions.functionEventuallyCallCallbackWithValueSatisfyingAssertion,
    {
      invalid: {
        asyncProperty: () =>
          fc.asyncProperty(
            fc
              .oneof(
                fc.string().filter((s) => s !== 'wrongvalue'),
                objectFilter.filter(
                  (o) => !('different' in o) || o.different !== 'structure',
                ),
              )
              .chain((expectedValue) =>
                fc.tuple(
                  fc.oneof(
                    fc.constant(async (callback: (value: any) => void) => {
                      await Promise.resolve();
                      callback('wrongvalue');
                    }),

                    fc.constant(async (callback: (value: any) => void) => {
                      await Promise.resolve();
                      callback({ different: 'structure' });
                    }),
                  ),
                  fc.constantFrom(
                    ...extractPhrases(
                      assertions.functionEventuallyCallCallbackWithValueSatisfyingAssertion,
                    ),
                  ),
                  fc.constant(expectedValue),
                ),
              ),
            async (params) => {
              try {
                await expectAsync(...params);
                return false;
              } catch {
                return true;
              }
            },
          ),

        examples: [
          [
            async (callback: (value: any) => void) => {
              await Promise.resolve();

              callback({ different: 'structure' });
            },
            'to eventually call callback with value satisfying',
            { '': undefined },
          ],
        ],
      },
      invalidNegated: {
        asyncProperty: () =>
          fc.asyncProperty(
            fc.oneof(fc.string(), objectFilter).chain((expectedValue) =>
              fc.tuple(
                fc.constant(async (callback: (value: any) => void) => {
                  await Promise.resolve();
                  callback(expectedValue);
                }),
                fc.constantFrom(
                  ...extractPhrases(
                    assertions.functionEventuallyCallCallbackWithValueSatisfyingAssertion,
                  ),
                ),
                fc.constant(expectedValue),
              ),
            ),
            async (params) => {
              try {
                await expectAsync(
                  params[0],
                  `not ${params[1]}`,
                  ...params.slice(2),
                );
                return false;
              } catch {
                return true;
              }
            },
          ),
      },
      valid: {
        asyncProperty: () =>
          fc.asyncProperty(
            fc.oneof(fc.string(), objectFilter).chain((expectedValue) =>
              fc.tuple(
                fc.constant(async (callback: (value: any) => void) => {
                  await Promise.resolve();
                  callback(expectedValue);
                }),
                fc.constantFrom(
                  ...extractPhrases(
                    assertions.functionEventuallyCallCallbackWithValueSatisfyingAssertion,
                  ),
                ),
                fc.constant(expectedValue),
              ),
            ),
            async (params) => {
              await expectAsync(...params);
            },
          ),
      },
      validNegated: {
        asyncProperty: () =>
          fc.asyncProperty(
            fc
              .oneof(
                fc.string().filter((s) => s !== 'wrongvalue'),
                objectFilter.filter(
                  (o) => !('different' in o) || o.different !== 'structure',
                ),
              )
              .chain((expectedValue) =>
                fc.tuple(
                  fc.oneof(
                    fc.constant(async (callback: (value: any) => void) => {
                      await Promise.resolve();

                      callback('wrongvalue');
                    }),

                    fc.constant(async (callback: (value: any) => void) => {
                      await Promise.resolve();

                      callback({ different: 'structure' });
                    }),
                  ),
                  fc.constantFrom(
                    ...extractPhrases(
                      assertions.functionEventuallyCallCallbackWithValueSatisfyingAssertion,
                    ),
                  ),
                  fc.constant(expectedValue),
                ),
              ),
            async (params) => {
              try {
                await expectAsync(
                  params[0],
                  `not ${params[1]}`,
                  ...params.slice(2),
                );
                return true;
              } catch {
                return false;
              }
            },
          ),
      },
    },
  ],

  [
    assertions.functionEventuallyCallNodebackAssertion,
    {
      invalid: {
        async: true,
        generators: [
          fc.constant(async () => {
            await new Promise((resolve) => setTimeout(resolve, 1));
            return 'no nodeback expected';
          }),
          fc.constantFrom(
            ...extractPhrases(
              assertions.functionEventuallyCallNodebackAssertion,
            ),
          ),
        ],
        shouldInterrupt: true,
        timeout: 2000,
      },
      valid: {
        async: true,
        generators: [
          fc.constant(async (nodeback: (err: null, value?: any) => void) => {
            await new Promise((resolve) => setTimeout(resolve, 1));
            await Promise.resolve();
            nodeback(null, 'success');
          }),
          fc.constantFrom(
            ...extractPhrases(
              assertions.functionEventuallyCallNodebackAssertion,
            ),
          ),
        ],
        timeout: 2000,
      },
    },
  ],

  [
    assertions.functionEventuallyCallNodebackWithErrorAssertion,
    {
      invalid: {
        async: true,
        generators: [
          fc.constant(async (nodeback: (err: any, value?: any) => void) => {
            await Promise.resolve();
            nodeback(null, 'success');
          }),
          fc.constantFrom(
            ...extractPhrases(
              assertions.functionEventuallyCallNodebackWithErrorAssertion,
            ),
          ),
        ],
        timeout: 2000,
      },
      valid: {
        async: true,
        generators: [
          fc.constant(async (nodeback: (err: any, value?: any) => void) => {
            await Promise.resolve();
            nodeback(new Error('Expected error'));
          }),
          fc.constantFrom(
            ...extractPhrases(
              assertions.functionEventuallyCallNodebackWithErrorAssertion,
            ),
          ),
        ],
        timeout: 2000,
      },
    },
  ],

  [
    assertions.functionEventuallyCallNodebackWithErrorClassAssertion,
    {
      invalid: {
        asyncProperty: () =>
          fc.asyncProperty(
            fc
              .constantFrom(Error, TypeError, ReferenceError)
              .chain((ErrorClass) =>
                fc.tuple(
                  fc.constant(
                    async (nodeback: (err: any, value?: any) => void) => {
                      await Promise.resolve();

                      const errorObj =
                        ErrorClass === Error
                          ? { message: 'Not an Error instance' }
                          : new Error('Different error class');
                      nodeback(errorObj);
                    },
                  ),
                  fc.constantFrom(
                    ...extractPhrases(
                      assertions.functionEventuallyCallNodebackWithErrorClassAssertion,
                    ),
                  ),
                  fc.constant(ErrorClass),
                ),
              ),
            async (params) => {
              try {
                await expectAsync(...params);
                return false;
              } catch {
                return true;
              }
            },
          ),
      },
      valid: {
        asyncProperty: () =>
          fc.asyncProperty(
            fc
              .constantFrom(Error, TypeError, ReferenceError)
              .chain((ErrorClass) =>
                fc.tuple(
                  fc.constant(
                    async (nodeback: (err: any, value?: any) => void) => {
                      await Promise.resolve();
                      nodeback(new ErrorClass('Expected error'));
                    },
                  ),
                  fc.constantFrom(
                    ...extractPhrases(
                      assertions.functionEventuallyCallNodebackWithErrorClassAssertion,
                    ),
                  ),
                  fc.constant(ErrorClass),
                ),
              ),
            async (params) => {
              await expectAsync(...params);
            },
          ),
      },
    },
  ],

  [
    assertions.functionEventuallyCallNodebackWithErrorPatternAssertion,
    {
      invalid: {
        asyncProperty: () =>
          fc.asyncProperty(
            fc.oneof(fc.string(), objectFilter).chain((expectedError) =>
              fc.tuple(
                fc.constant(
                  async (nodeback: (err: any, value?: any) => void) => {
                    await Promise.resolve();
                    nodeback(new Error('Different error message'));
                  },
                ),
                fc.constantFrom(
                  ...extractPhrases(
                    assertions.functionEventuallyCallNodebackWithErrorPatternAssertion,
                  ),
                ),
                fc.constant(expectedError),
              ),
            ),
            async (params) => {
              try {
                await expectAsync(...params);
                return false;
              } catch {
                return true;
              }
            },
          ),
      },
      valid: {
        asyncProperty: () =>
          fc.asyncProperty(
            fc.oneof(fc.string(), objectFilter).chain((expectedError) =>
              fc.tuple(
                fc.constant(
                  async (nodeback: (err: any, value?: any) => void) => {
                    await Promise.resolve();

                    const error =
                      typeof expectedError === 'string'
                        ? new Error(expectedError)
                        : expectedError;
                    nodeback(error);
                  },
                ),
                fc.constantFrom(
                  ...extractPhrases(
                    assertions.functionEventuallyCallNodebackWithErrorPatternAssertion,
                  ),
                ),
                fc.constant(expectedError),
              ),
            ),
            async (params) => {
              await expectAsync(...params);
            },
          ),
      },
    },
  ],

  [
    assertions.functionEventuallyCallNodebackWithExactValueAssertion,
    {
      invalid: {
        asyncProperty: () =>
          fc.asyncProperty(
            fc
              .string()
              .filter((s) => s !== 'wrong')
              .chain((expectedValue) =>
                fc.tuple(
                  fc.constant(
                    async (nodeback: (err: any, value?: any) => void) => {
                      await Promise.resolve();

                      nodeback(null, 'wrong');
                    },
                  ),
                  fc.constantFrom(
                    ...extractPhrases(
                      assertions.functionEventuallyCallNodebackWithExactValueAssertion,
                    ),
                  ),
                  fc.constant(expectedValue),
                ),
              ),
            async (params) => {
              try {
                await expectAsync(...params);
                return false;
              } catch {
                return true;
              }
            },
          ),
      },
      valid: {
        asyncProperty: () =>
          fc.asyncProperty(
            fc.string().chain((expectedValue) =>
              fc.tuple(
                fc.constant(
                  async (nodeback: (err: any, value?: any) => void) => {
                    await Promise.resolve();

                    nodeback(null, expectedValue);
                  },
                ),
                fc.constantFrom(
                  ...extractPhrases(
                    assertions.functionEventuallyCallNodebackWithExactValueAssertion,
                  ),
                ),
                fc.constant(expectedValue),
              ),
            ),
            async (params) => {
              await expectAsync(...params);
            },
          ),
      },
    },
  ],

  [
    assertions.functionEventuallyCallNodebackWithValueAssertion,
    {
      invalid: {
        asyncProperty: () =>
          fc.asyncProperty(
            fc
              .string()
              .filter((s) => s !== 'wrong')
              .chain((expectedValue) =>
                fc.tuple(
                  fc.constant(
                    async (nodeback: (err: any, value?: any) => void) => {
                      await Promise.resolve();

                      nodeback(null, 'wrong');
                    },
                  ),
                  fc.constantFrom(
                    ...extractPhrases(
                      assertions.functionEventuallyCallNodebackWithValueAssertion,
                    ),
                  ),
                  fc.constant(expectedValue),
                ),
              ),
            async (params) => {
              try {
                await expectAsync(...params);
                return false;
              } catch {
                return true;
              }
            },
          ),
      },
      valid: {
        asyncProperty: () =>
          fc.asyncProperty(
            fc
              .anything()
              .filter(
                (v) => typeof v === 'object' && !!v && !hasKey(v, '__proto__'),
              )
              .chain((expectedValue) =>
                fc.tuple(
                  fc.constant(
                    async (nodeback: (err: any, value?: any) => void) => {
                      await Promise.resolve();

                      nodeback(null, expectedValue);
                    },
                  ),
                  fc.constantFrom(
                    ...extractPhrases(
                      assertions.functionEventuallyCallNodebackWithValueAssertion,
                    ),
                  ),
                  fc.constant(expectedValue),
                ),
              ),
            async (params) => {
              await expectAsync(...params);
            },
          ),
      },
    },
  ],

  [
    assertions.functionEventuallyCallNodebackWithValueSatisfyingAssertion,
    {
      invalid: {
        asyncProperty: () =>
          fc.asyncProperty(
            fc
              .oneof(
                fc.string().filter((s) => s !== 'wrongvalue'),
                objectFilter.filter(
                  (o) => !('different' in o) || o.different !== 'structure',
                ),
              )
              .chain((expectedValue) =>
                fc.tuple(
                  fc.oneof(
                    fc.constant(
                      async (nodeback: (err: any, value?: any) => void) => {
                        await Promise.resolve();

                        nodeback(null, 'wrongvalue');
                      },
                    ),

                    fc.constant(
                      async (nodeback: (err: any, value?: any) => void) => {
                        await Promise.resolve();

                        nodeback(null, { different: 'structure' });
                      },
                    ),
                  ),
                  fc.constantFrom(
                    ...extractPhrases(
                      assertions.functionEventuallyCallNodebackWithValueSatisfyingAssertion,
                    ),
                  ),
                  fc.constant(expectedValue),
                ),
              ),
            async (params) => {
              try {
                await expectAsync(...params);
                return false;
              } catch {
                return true;
              }
            },
          ),
      },
      valid: {
        asyncProperty: () =>
          fc.asyncProperty(
            fc.oneof(fc.string(), objectFilter).chain((expectedValue) =>
              fc.tuple(
                fc.constant(
                  async (nodeback: (err: any, value?: any) => void) => {
                    await Promise.resolve();

                    nodeback(null, expectedValue);
                  },
                ),
                fc.constantFrom(
                  ...extractPhrases(
                    assertions.functionEventuallyCallNodebackWithValueSatisfyingAssertion,
                  ),
                ),
                fc.constant(expectedValue),
              ),
            ),
            async (params) => {
              await expectAsync(...params);
            },
          ),
      },
    },
  ],
]);

describe('Property-Based Tests for Callback Assertions (Async)', () => {
  assertExhaustiveTestConfigs(
    'Async Callback Assertions',
    AsyncCallbackAssertions,
    asyncTestConfigs,
  );
  runPropertyTests(asyncTestConfigs, testConfigDefaults);
});
