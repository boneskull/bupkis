import fc from 'fast-check';
import { describe } from 'node:test';

import {
  CallbackAsyncAssertions,
  CallbackSyncAssertions,
} from '../../src/assertion/impl/callback.js';
import { expect, expectAsync } from '../../src/bootstrap.js';
import { hasKey, hasValue, keyBy } from '../../src/util.js';
import {
  type PropertyTestConfig,
  type PropertyTestConfigParameters,
} from './property-test-config.js';
import { createPhraseExtractor } from './property-test-util.js';
import {
  assertExhaustiveTestConfig,
  runPropertyTests,
} from './property-test.macro.js';

const syncAssertions = keyBy(CallbackSyncAssertions, 'id');
const asyncAssertions = keyBy(CallbackAsyncAssertions, 'id');
const extractSyncPhrases = createPhraseExtractor(syncAssertions);
const extractAsyncPhrases = createPhraseExtractor(asyncAssertions);

/**
 * Test config defaults for callback assertions
 */
const testConfigDefaults: PropertyTestConfigParameters = {
  numRuns: 100,
} as const;

const objectFilter = fc
  .object()
  .filter(
    (o) =>
      Object.keys(o).length > 0 && !hasKey(o, '__proto__') && !hasValue(o, {}),
  );

/**
 * Test configurations for callback assertions
 */
const syncTestConfigs = {
  'functionschema-to-call-callback-to-invoke-callback-2s2p': {
    invalid: {
      generators: [
        fc.constant(() => {}),
        fc.constantFrom(
          ...extractSyncPhrases(
            'functionschema-to-call-callback-to-invoke-callback-2s2p',
          ),
        ),
      ],
    },
    valid: {
      generators: [
        fc.constant((callback: () => void) => {
          callback();
        }),
        fc.constantFrom(
          ...extractSyncPhrases(
            'functionschema-to-call-callback-to-invoke-callback-2s2p',
          ),
        ),
      ],
    },
  },
  'functionschema-to-call-callback-with-exactly-to-call-callback-with-exact-value-to-invoke-callback-with-exactly-to-invoke-callback-with-exact-value-unknown-3s3p':
    {
      invalid: {
        generators: [
          fc.constant((callback: (_value: any) => void) => {
            callback('wrong');
          }),
          fc.constantFrom(
            ...extractSyncPhrases(
              'functionschema-to-call-callback-with-exactly-to-call-callback-with-exact-value-to-invoke-callback-with-exactly-to-invoke-callback-with-exact-value-unknown-3s3p',
            ),
          ),
          fc.string().filter((s) => s !== 'wrong'),
        ],
      },
      valid: {
        generators: [
          fc.constant((callback: (value: unknown) => void) => {
            callback('expected');
          }),
          fc.constantFrom(
            ...extractSyncPhrases(
              'functionschema-to-call-callback-with-exactly-to-call-callback-with-exact-value-to-invoke-callback-with-exactly-to-invoke-callback-with-exact-value-unknown-3s3p',
            ),
          ),
          fc.constant('expected'),
        ],
      },
    },
  'functionschema-to-call-callback-with-to-invoke-callback-with-unknown-3s3p': {
    invalid: {
      generators: [
        fc.constant((callback: (_value: any) => void) => {
          callback('wrong');
        }),
        fc.constantFrom(
          ...extractSyncPhrases(
            'functionschema-to-call-callback-with-to-invoke-callback-with-unknown-3s3p',
          ),
        ),
        fc.string().filter((s) => s !== 'wrong'),
      ],
    },
    valid: {
      generators: [
        fc.constant((callback: (value: unknown) => void) => {
          callback('expected');
        }),
        fc.constantFrom(
          ...extractSyncPhrases(
            'functionschema-to-call-callback-with-to-invoke-callback-with-unknown-3s3p',
          ),
        ),
        fc.constant('expected'),
      ],
    },
  },
  'functionschema-to-call-callback-with-value-satisfying-to-invoke-callback-with-value-satisfying-string-regexp-object-3s3p':
    {
      invalid: {
        property: () =>
          fc.property(
            fc
              .oneof(
                fc.string().filter((s) => s !== 'wrongvalue'),
                fc
                  .object()
                  .filter(
                    (o) =>
                      Object.keys(o).length > 0 &&
                      (!('different' in o) || o.different !== 'structure') &&
                      !hasKey(o, '__proto__'),
                  ),
              )
              .chain((expectedValue) =>
                fc.tuple(
                  fc.oneof(
                    // Function that calls with string that won't match patterns
                    fc.constant((callback: (value: any) => void) => {
                      callback('wrongvalue');
                    }),
                    // Function that calls with object that won't match patterns
                    fc.constant((callback: (value: any) => void) => {
                      callback({ different: 'structure' });
                    }),
                  ),
                  fc.constantFrom(
                    ...extractSyncPhrases(
                      'functionschema-to-call-callback-with-value-satisfying-to-invoke-callback-with-value-satisfying-string-regexp-object-3s3p',
                    ),
                  ),
                  fc.constant(expectedValue),
                ),
              ),
            (params) => {
              try {
                expect(...params);
                return false;
              } catch {
                return true;
              }
            },
          ),
      },
      invalidNegated: {
        property: () =>
          fc.property(
            fc.oneof(fc.string(), objectFilter).chain((expectedValue) =>
              fc.tuple(
                fc.constant((callback: (value: any) => void) => {
                  callback(expectedValue);
                }),
                fc.constantFrom(
                  ...extractSyncPhrases(
                    'functionschema-to-call-callback-with-value-satisfying-to-invoke-callback-with-value-satisfying-string-regexp-object-3s3p',
                  ),
                ),
                fc.constant(expectedValue),
              ),
            ),
            (params) => {
              try {
                expect(params[0], `not ${params[1]}`, ...params.slice(2));
                return false;
              } catch {
                return true;
              }
            },
          ),
      },
      valid: {
        property: () =>
          fc.property(
            fc.oneof(fc.string(), objectFilter).chain((expectedValue) =>
              fc.tuple(
                fc.constant((callback: (value: any) => void) => {
                  callback(expectedValue);
                }),
                fc.constantFrom(
                  ...extractSyncPhrases(
                    'functionschema-to-call-callback-with-value-satisfying-to-invoke-callback-with-value-satisfying-string-regexp-object-3s3p',
                  ),
                ),
                fc.constant(expectedValue),
              ),
            ),
            (params) => {
              expect(...params);
            },
          ),
      },
      validNegated: {
        property: () =>
          fc.property(
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
                    // Function that calls with string that won't match patterns
                    fc.constant((callback: (value: any) => void) => {
                      callback('wrongvalue');
                    }),
                    // Function that calls with object that won't match patterns
                    fc.constant((callback: (value: any) => void) => {
                      callback({ different: 'structure' });
                    }),
                  ),
                  fc.constantFrom(
                    ...extractSyncPhrases(
                      'functionschema-to-call-callback-with-value-satisfying-to-invoke-callback-with-value-satisfying-string-regexp-object-3s3p',
                    ),
                  ),
                  fc.constant(expectedValue),
                ),
              ),
            (params) => {
              expect(params[0], `not ${params[1]}`, ...params.slice(2));
            },
          ),
      },
    },
  'functionschema-to-call-nodeback-to-invoke-nodeback-2s2p': {
    invalid: {
      generators: [
        fc.func(fc.anything()).map((_fn) => {
          // Create a function that doesn't call the nodeback
          return () => {
            // Do nothing - nodeback is never called
          };
        }),
        fc.constantFrom(
          ...extractSyncPhrases(
            'functionschema-to-call-nodeback-to-invoke-nodeback-2s2p',
          ),
        ),
      ],
    },
    valid: {
      generators: [
        fc.func(fc.anything()).map((_fn) => {
          // Create a function that calls the nodeback
          return (nodeback: (err: Error | null, result?: any) => void) => {
            nodeback(null, 'success');
          };
        }),
        fc.constantFrom(
          ...extractSyncPhrases(
            'functionschema-to-call-nodeback-to-invoke-nodeback-2s2p',
          ),
        ),
      ],
    },
  },
  'functionschema-to-call-nodeback-with-a-to-call-nodeback-with-an-to-invoke-nodeback-with-a-to-invoke-nodeback-with-an-classschema-3s3p':
    {
      invalid: {
        generators: [
          fc.func(fc.anything()).map((_fn) => {
            // Create a function that calls nodeback with wrong error type
            return (nodeback: (err: any, result?: any) => void) => {
              nodeback('string error', null);
            };
          }),
          fc.constantFrom(
            ...extractSyncPhrases(
              'functionschema-to-call-nodeback-with-a-to-call-nodeback-with-an-to-invoke-nodeback-with-a-to-invoke-nodeback-with-an-classschema-3s3p',
            ),
          ),
          fc.constant(Error),
        ],
      },
      valid: {
        generators: [
          fc.constant((nodeback: (err: any, result?: any) => void) => {
            nodeback(new Error('test error'), null);
          }),
          fc.constantFrom(
            ...extractSyncPhrases(
              'functionschema-to-call-nodeback-with-a-to-call-nodeback-with-an-to-invoke-nodeback-with-a-to-invoke-nodeback-with-an-classschema-3s3p',
            ),
          ),
          fc.constant(Error),
        ],
      },
    },
  'functionschema-to-call-nodeback-with-error-to-invoke-nodeback-with-error-2s2p':
    {
      invalid: {
        generators: [
          fc.func(fc.anything()).map((_fn) => {
            // Create a function that calls nodeback without error
            return (nodeback: (err: any, result?: any) => void) => {
              nodeback(null, 'success');
            };
          }),
          fc.constantFrom(
            ...extractSyncPhrases(
              'functionschema-to-call-nodeback-with-error-to-invoke-nodeback-with-error-2s2p',
            ),
          ),
        ],
      },
      valid: {
        generators: [
          fc.func(fc.anything()).map((_fn) => {
            // Create a function that calls nodeback with error
            return (nodeback: (err: any, result?: any) => void) => {
              nodeback(new Error('test error'), null);
            };
          }),
          fc.constantFrom(
            ...extractSyncPhrases(
              'functionschema-to-call-nodeback-with-error-to-invoke-nodeback-with-error-2s2p',
            ),
          ),
        ],
      },
    },
  'functionschema-to-call-nodeback-with-error-to-invoke-nodeback-with-error-string-regexp-object-3s3p':
    {
      invalid: {
        generators: [
          fc.func(fc.anything()).map((_fn) => {
            // Create a function that calls nodeback with wrong error
            return (nodeback: (err: any, result?: any) => void) => {
              nodeback(new Error('wrong message'), null);
            };
          }),
          fc.constantFrom(
            ...extractSyncPhrases(
              'functionschema-to-call-nodeback-with-error-to-invoke-nodeback-with-error-string-regexp-object-3s3p',
            ),
          ),
          fc.constantFrom(/^expected/, { message: 'expected error' }),
        ],
      },
      valid: {
        generators: [
          fc.constant((nodeback: (err: any, result?: any) => void) => {
            const error = new Error('test error');
            nodeback(error, null);
          }),
          fc.constantFrom(
            ...extractSyncPhrases(
              'functionschema-to-call-nodeback-with-error-to-invoke-nodeback-with-error-string-regexp-object-3s3p',
            ),
          ),
          fc.constant('test error'),
        ],
      },
    },
  'functionschema-to-call-nodeback-with-exactly-to-call-nodeback-with-exact-value-to-invoke-nodeback-with-exactly-to-invoke-nodeback-with-exact-value-unknown-3s3p':
    {
      invalid: {
        generators: [
          fc.func(fc.anything()).map((_fn) => {
            // Create a function that calls nodeback with wrong success value
            return (nodeback: (err: any, result?: any) => void) => {
              nodeback(null, 'wrong');
            };
          }),
          fc.constantFrom(
            ...extractSyncPhrases(
              'functionschema-to-call-nodeback-with-exactly-to-call-nodeback-with-exact-value-to-invoke-nodeback-with-exactly-to-invoke-nodeback-with-exact-value-unknown-3s3p',
            ),
          ),
          fc.string().filter((s) => s !== 'wrong'),
        ],
      },
      valid: {
        generators: [
          fc.func(fc.anything()).map((_fn) => {
            // Create a function that calls nodeback with expected success value
            return (nodeback: (err: any, result?: any) => void) => {
              nodeback(null, '?');
            };
          }),
          fc.constantFrom(
            ...extractSyncPhrases(
              'functionschema-to-call-nodeback-with-exactly-to-call-nodeback-with-exact-value-to-invoke-nodeback-with-exactly-to-invoke-nodeback-with-exact-value-unknown-3s3p',
            ),
          ),
          fc.constant('?'),
        ],
      },
    },
  'functionschema-to-call-nodeback-with-to-invoke-nodeback-with-unknown-3s3p': {
    invalid: {
      generators: [
        fc.func(fc.anything()).map((_fn) => {
          // Create a function that calls nodeback with wrong success value
          return (nodeback: (err: any, result?: any) => void) => {
            nodeback(null, 'wrong');
          };
        }),
        fc.constantFrom(
          ...extractSyncPhrases(
            'functionschema-to-call-nodeback-with-to-invoke-nodeback-with-unknown-3s3p',
          ),
        ),
        fc.string().filter((s) => s !== 'wrong'),
      ],
    },
    valid: {
      generators: [
        fc.func(fc.anything()).map((_fn) => {
          // Create a function that calls nodeback with expected success value
          return (nodeback: (err: any, result?: any) => void) => {
            nodeback(null, 'expected');
          };
        }),
        fc.constantFrom(
          ...extractSyncPhrases(
            'functionschema-to-call-nodeback-with-to-invoke-nodeback-with-unknown-3s3p',
          ),
        ),
        fc.constant('expected'),
      ],
    },
  },
  'functionschema-to-call-nodeback-with-value-satisfying-to-invoke-nodeback-with-value-satisfying-string-regexp-object-3s3p':
    {
      invalid: {
        property: () =>
          fc.property(
            fc
              .oneof(
                fc.string().filter((s) => s !== 'nomatch'),
                objectFilter.filter(
                  (o) => !('different' in o) || o.different !== 'structure',
                ),
              )
              .chain((expectedValue) =>
                fc.tuple(
                  fc.oneof(
                    // Function that calls with string that won't match patterns
                    fc.constant(
                      (nodeback: (err: any, result?: any) => void) => {
                        nodeback(null, 'nomatch');
                      },
                    ),
                    // Function that calls with object that won't match patterns
                    fc.constant(
                      (nodeback: (err: any, result?: any) => void) => {
                        nodeback(null, { different: 'structure' });
                      },
                    ),
                  ),
                  fc.constantFrom(
                    ...extractSyncPhrases(
                      'functionschema-to-call-nodeback-with-value-satisfying-to-invoke-nodeback-with-value-satisfying-string-regexp-object-3s3p',
                    ),
                  ),
                  fc.constant(expectedValue),
                ),
              ),
            (params) => {
              try {
                expect(...params);
                return false;
              } catch {
                return true;
              }
            },
          ),
      },
      invalidNegated: {
        property: () =>
          fc.property(
            fc.oneof(fc.string(), objectFilter).chain((expectedValue) =>
              fc.tuple(
                fc.constant((nodeback: (err: any, result?: any) => void) => {
                  nodeback(null, expectedValue);
                }),
                fc.constantFrom(
                  ...extractSyncPhrases(
                    'functionschema-to-call-nodeback-with-value-satisfying-to-invoke-nodeback-with-value-satisfying-string-regexp-object-3s3p',
                  ),
                ),
                fc.constant(expectedValue),
              ),
            ),
            (params) => {
              try {
                expect(params[0], `not ${params[1]}`, ...params.slice(2));
                return false;
              } catch {
                return true;
              }
            },
          ),
      },
      valid: {
        property: () =>
          fc.property(
            fc.oneof(fc.string(), objectFilter).chain((expectedValue) =>
              fc.tuple(
                fc.constant((nodeback: (err: any, result?: any) => void) => {
                  nodeback(null, expectedValue);
                }),
                fc.constantFrom(
                  ...extractSyncPhrases(
                    'functionschema-to-call-nodeback-with-value-satisfying-to-invoke-nodeback-with-value-satisfying-string-regexp-object-3s3p',
                  ),
                ),
                fc.constant(expectedValue),
              ),
            ),
            (params) => {
              expect(...params);
            },
          ),
      },
      validNegated: {
        property: () =>
          fc.property(
            fc
              .oneof(
                fc.string().filter((s) => s !== 'nomatch'),
                objectFilter.filter(
                  (o) => !('different' in o) || o.different !== 'structure',
                ),
              )
              .chain((expectedValue) =>
                fc.tuple(
                  fc.oneof(
                    // Function that calls with string that won't match patterns
                    fc.constant(
                      (nodeback: (err: any, result?: any) => void) => {
                        nodeback(null, 'nomatch');
                      },
                    ),
                    // Function that calls with object that won't match patterns
                    fc.constant(
                      (nodeback: (err: any, result?: any) => void) => {
                        nodeback(null, { different: 'structure' });
                      },
                    ),
                  ),
                  fc.constantFrom(
                    ...extractSyncPhrases(
                      'functionschema-to-call-nodeback-with-value-satisfying-to-invoke-nodeback-with-value-satisfying-string-regexp-object-3s3p',
                    ),
                  ),
                  fc.constant(expectedValue),
                ),
              ),
            (params) => {
              expect(params[0], `not ${params[1]}`, ...params.slice(2));
            },
          ),
      },
    },
} as const satisfies Record<string, PropertyTestConfig>;

describe('Property-Based Tests for Callback Assertions (Sync)', () => {
  assertExhaustiveTestConfig('sync callback', syncAssertions, syncTestConfigs);

  runPropertyTests(syncTestConfigs, syncAssertions, testConfigDefaults);
});

const asyncTestConfigs = {
  'functionschema-to-eventually-call-callback-to-eventually-invoke-callback-2s2p':
    {
      invalid: {
        async: true,
        generators: [
          fc.constant(async () => {
            // Function that doesn't expect a callback but still completes
            await new Promise((resolve) => setTimeout(resolve, 1));
            return 'no callback expected';
          }),
          fc.constantFrom(
            ...extractAsyncPhrases(
              'functionschema-to-eventually-call-callback-to-eventually-invoke-callback-2s2p',
            ),
          ),
        ],
        shouldInterrupt: true, // Expect fast-check to timeout since assertion waits for callback
        timeout: 2000, // Longer timeout to accommodate assertion library timeout
      },
      valid: {
        async: true,
        generators: [
          fc.constant(async (callback: () => void) => {
            await new Promise((resolve) => setTimeout(resolve, 1));
            callback();
          }),
          fc.constantFrom(
            ...extractAsyncPhrases(
              'functionschema-to-eventually-call-callback-to-eventually-invoke-callback-2s2p',
            ),
          ),
        ],
        timeout: 2000, // Longer timeout to accommodate assertion library timeout
      },
    },
  'functionschema-to-eventually-call-callback-with-exactly-to-eventually-call-callback-with-exact-value-to-eventually-invoke-callback-with-exactly-to-eventually-invoke-callback-with-exact-value-unknown-3s3p':
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
                    callback('wrong');
                  }),
                  fc.constantFrom(
                    ...extractAsyncPhrases(
                      'functionschema-to-eventually-call-callback-with-exactly-to-eventually-call-callback-with-exact-value-to-eventually-invoke-callback-with-exactly-to-eventually-invoke-callback-with-exact-value-unknown-3s3p',
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
                  callback(expectedValue);
                }),
                fc.constantFrom(
                  ...extractAsyncPhrases(
                    'functionschema-to-eventually-call-callback-with-exactly-to-eventually-call-callback-with-exact-value-to-eventually-invoke-callback-with-exactly-to-eventually-invoke-callback-with-exact-value-unknown-3s3p',
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
  'functionschema-to-eventually-call-callback-with-to-eventually-invoke-callback-with-unknown-3s3p':
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
                    callback('wrong');
                  }),
                  fc.constantFrom(
                    ...extractAsyncPhrases(
                      'functionschema-to-eventually-call-callback-with-to-eventually-invoke-callback-with-unknown-3s3p',
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
                    callback(expectedValue);
                  }),
                  fc.constantFrom(
                    ...extractAsyncPhrases(
                      'functionschema-to-eventually-call-callback-with-to-eventually-invoke-callback-with-unknown-3s3p',
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
  'functionschema-to-eventually-call-callback-with-value-satisfying-to-eventually-invoke-callback-with-value-satisfying-string-regexp-object-3s3p':
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
                    // Function that calls with string that won't match patterns
                    fc.constant(async (callback: (value: any) => void) => {
                      await Promise.resolve();
                      callback('wrongvalue');
                    }),
                    // Function that calls with object that won't match patterns
                    fc.constant(async (callback: (value: any) => void) => {
                      await Promise.resolve();
                      callback({ different: 'structure' });
                    }),
                  ),
                  fc.constantFrom(
                    ...extractAsyncPhrases(
                      'functionschema-to-eventually-call-callback-with-value-satisfying-to-eventually-invoke-callback-with-value-satisfying-string-regexp-object-3s3p',
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
        numRuns: 500,
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
                  ...extractAsyncPhrases(
                    'functionschema-to-eventually-call-callback-with-value-satisfying-to-eventually-invoke-callback-with-value-satisfying-string-regexp-object-3s3p',
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
                  ...extractAsyncPhrases(
                    'functionschema-to-eventually-call-callback-with-value-satisfying-to-eventually-invoke-callback-with-value-satisfying-string-regexp-object-3s3p',
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
                    // Function that calls with string that won't match patterns
                    fc.constant(async (callback: (value: any) => void) => {
                      await Promise.resolve();
                      callback('wrongvalue');
                    }),
                    // Function that calls with object that won't match patterns
                    fc.constant(async (callback: (value: any) => void) => {
                      await Promise.resolve();
                      callback({ different: 'structure' });
                    }),
                  ),
                  fc.constantFrom(
                    ...extractAsyncPhrases(
                      'functionschema-to-eventually-call-callback-with-value-satisfying-to-eventually-invoke-callback-with-value-satisfying-string-regexp-object-3s3p',
                    ),
                  ),
                  fc.constant(expectedValue),
                ),
              ),
            async (params) => {
              await expectAsync(
                params[0],
                `not ${params[1]}`,
                ...params.slice(2),
              );
            },
          ),
      },
    },
  'functionschema-to-eventually-call-nodeback-to-eventually-invoke-nodeback-2s2p':
    {
      invalid: {
        async: true,
        generators: [
          fc.func(fc.anything()).map((_fn) => {
            // Create a function that doesn't expect a nodeback
            return async () => {
              await new Promise((resolve) => setTimeout(resolve, 1));
              return 'no nodeback expected';
            };
          }),
          fc.constantFrom(
            ...extractAsyncPhrases(
              'functionschema-to-eventually-call-nodeback-to-eventually-invoke-nodeback-2s2p',
            ),
          ),
        ],
        shouldInterrupt: true, // Expect fast-check to timeout since assertion waits for nodeback
        timeout: 2000, // Longer timeout to accommodate assertion library timeout
      },
      valid: {
        async: true,
        generators: [
          fc.func(fc.anything()).map((_fn) => {
            // Create a function that calls the nodeback
            return async (
              nodeback: (err: Error | null, result?: any) => void,
            ) => {
              await new Promise((resolve) => setTimeout(resolve, 1));
              nodeback(null, 'success');
            };
          }),
          fc.constantFrom(
            ...extractAsyncPhrases(
              'functionschema-to-eventually-call-nodeback-to-eventually-invoke-nodeback-2s2p',
            ),
          ),
        ],
        timeout: 2000, // Longer timeout to accommodate assertion library timeout
      },
    },
  'functionschema-to-eventually-call-nodeback-with-a-to-eventually-call-nodeback-with-an-to-eventually-invoke-nodeback-with-a-to-eventually-invoke-nodeback-with-an-classschema-3s3p':
    {
      invalid: {
        async: true,
        generators: [
          fc.func(fc.anything()).map((_fn) => {
            // Create a function that calls nodeback with wrong error type
            return async (nodeback: (err: any, result?: any) => void) => {
              nodeback('string error', null);
            };
          }),
          fc.constantFrom(
            ...extractAsyncPhrases(
              'functionschema-to-eventually-call-nodeback-with-a-to-eventually-call-nodeback-with-an-to-eventually-invoke-nodeback-with-a-to-eventually-invoke-nodeback-with-an-classschema-3s3p',
            ),
          ),
          fc.constant(Error),
        ],
        timeout: 500, // Short timeout since function should complete quickly
      },
      valid: {
        async: true,
        generators: [
          fc.constant(async (nodeback: (err: any, result?: any) => void) => {
            nodeback(new Error('test error'), null);
          }),
          fc.constantFrom(
            ...extractAsyncPhrases(
              'functionschema-to-eventually-call-nodeback-with-a-to-eventually-call-nodeback-with-an-to-eventually-invoke-nodeback-with-a-to-eventually-invoke-nodeback-with-an-classschema-3s3p',
            ),
          ),
          fc.constant(Error),
        ],
        timeout: 500, // Short timeout since function should complete quickly
      },
    },
  'functionschema-to-eventually-call-nodeback-with-error-to-eventually-invoke-nodeback-with-error-2s2p':
    {
      invalid: {
        async: true,
        generators: [
          fc.func(fc.anything()).map((_fn) => {
            // Create a function that calls nodeback without error
            return async (nodeback: (err: any, result?: any) => void) => {
              nodeback(null, 'success');
            };
          }),
          fc.constantFrom(
            ...extractAsyncPhrases(
              'functionschema-to-eventually-call-nodeback-with-error-to-eventually-invoke-nodeback-with-error-2s2p',
            ),
          ),
        ],
        timeout: 500, // Short timeout since function should complete quickly
      },
      valid: {
        async: true,
        generators: [
          fc.func(fc.anything()).map((_fn) => {
            // Create a function that calls nodeback with error
            return async (nodeback: (err: any, result?: any) => void) => {
              nodeback(new Error('test error'), null);
            };
          }),
          fc.constantFrom(
            ...extractAsyncPhrases(
              'functionschema-to-eventually-call-nodeback-with-error-to-eventually-invoke-nodeback-with-error-2s2p',
            ),
          ),
        ],
        timeout: 500, // Short timeout since function should complete quickly
      },
    },
  'functionschema-to-eventually-call-nodeback-with-error-to-eventually-invoke-nodeback-with-error-string-regexp-object-3s3p':
    {
      invalid: {
        asyncProperty: () =>
          fc.asyncProperty(
            fc
              .oneof(fc.string(), fc.record({ message: fc.string() }))
              .chain((expectedError) =>
                fc.tuple(
                  fc.func(fc.anything()).map((_fn) => {
                    // Create a function that calls nodeback with wrong error
                    return async (
                      nodeback: (err: any, result?: any) => void,
                    ) => {
                      await Promise.resolve();
                      nodeback(new Error('wrong message'), null);
                    };
                  }),
                  fc.constantFrom(
                    ...extractAsyncPhrases(
                      'functionschema-to-eventually-call-nodeback-with-error-to-eventually-invoke-nodeback-with-error-string-regexp-object-3s3p',
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
            fc
              .oneof(fc.string(), fc.record({ message: fc.string() }))
              .chain((expectedError) =>
                fc.tuple(
                  fc.constant(
                    async (nodeback: (err: any, result?: any) => void) => {
                      const error =
                        typeof expectedError === 'string'
                          ? new Error(expectedError)
                          : new Error(expectedError.message);
                      await Promise.resolve();
                      nodeback(error, null);
                    },
                  ),
                  fc.constantFrom(
                    ...extractAsyncPhrases(
                      'functionschema-to-eventually-call-nodeback-with-error-to-eventually-invoke-nodeback-with-error-string-regexp-object-3s3p',
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
  'functionschema-to-eventually-call-nodeback-with-exactly-to-eventually-call-nodeback-with-exact-value-to-eventually-invoke-nodeback-with-exactly-to-eventually-invoke-nodeback-with-exact-value-unknown-3s3p':
    {
      invalid: {
        asyncProperty: () =>
          fc.asyncProperty(
            fc
              .string()
              .filter((s) => s !== 'wrong')
              .chain((expectedValue) =>
                fc.tuple(
                  fc.func(fc.anything()).map((_fn) => {
                    // Create a function that calls nodeback with wrong success value
                    return async (
                      nodeback: (err: any, result?: any) => void,
                    ) => {
                      await Promise.resolve();
                      nodeback(null, 'wrong');
                    };
                  }),
                  fc.constantFrom(
                    ...extractAsyncPhrases(
                      'functionschema-to-eventually-call-nodeback-with-exactly-to-eventually-call-nodeback-with-exact-value-to-eventually-invoke-nodeback-with-exactly-to-eventually-invoke-nodeback-with-exact-value-unknown-3s3p',
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
            fc.anything().chain((expectedValue) =>
              fc.tuple(
                fc.func(fc.anything()).map((_fn) => {
                  // Create a function that calls nodeback with expected success value
                  return async (nodeback: (err: any, result?: any) => void) => {
                    await Promise.resolve();
                    nodeback(null, expectedValue);
                  };
                }),
                fc.constantFrom(
                  ...extractAsyncPhrases(
                    'functionschema-to-eventually-call-nodeback-with-exactly-to-eventually-call-nodeback-with-exact-value-to-eventually-invoke-nodeback-with-exactly-to-eventually-invoke-nodeback-with-exact-value-unknown-3s3p',
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
  'functionschema-to-eventually-call-nodeback-with-to-eventually-invoke-nodeback-with-unknown-3s3p':
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
                    async (nodeback: (err: any, result?: any) => void) => {
                      await Promise.resolve();
                      nodeback(null, 'wrong');
                    },
                  ),
                  fc.constantFrom(
                    ...extractAsyncPhrases(
                      'functionschema-to-eventually-call-nodeback-with-to-eventually-invoke-nodeback-with-unknown-3s3p',
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
                  async (nodeback: (err: any, result?: any) => void) => {
                    await Promise.resolve();
                    nodeback(null, expectedValue);
                  },
                ),
                fc.constantFrom(
                  ...extractAsyncPhrases(
                    'functionschema-to-eventually-call-nodeback-with-to-eventually-invoke-nodeback-with-unknown-3s3p',
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
  'functionschema-to-eventually-call-nodeback-with-value-satisfying-to-eventually-invoke-nodeback-with-value-satisfying-string-regexp-object-3s3p':
    {
      invalid: {
        asyncProperty: () =>
          fc.asyncProperty(
            fc
              .oneof(
                fc.string().filter((s) => s !== 'nomatch'),
                objectFilter.filter(
                  (o) => !('different' in o) || o.different !== 'structure',
                ),
              )
              .chain((expectedValue) =>
                fc.tuple(
                  fc.oneof(
                    // Function that calls with string that won't match patterns
                    fc.constant(
                      async (nodeback: (err: any, result?: any) => void) => {
                        await Promise.resolve();
                        nodeback(null, 'nomatch');
                      },
                    ),
                    // Function that calls with object that won't match patterns
                    fc.constant(
                      async (nodeback: (err: any, result?: any) => void) => {
                        await Promise.resolve();
                        nodeback(null, { different: 'structure' });
                      },
                    ),
                  ),
                  fc.constantFrom(
                    ...extractAsyncPhrases(
                      'functionschema-to-eventually-call-nodeback-with-value-satisfying-to-eventually-invoke-nodeback-with-value-satisfying-string-regexp-object-3s3p',
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
      invalidNegated: {
        asyncProperty: () =>
          fc.asyncProperty(
            fc.oneof(fc.string(), objectFilter).chain((expectedValue) =>
              fc.tuple(
                fc.constant(
                  async (nodeback: (err: any, result?: any) => void) => {
                    await Promise.resolve();
                    nodeback(null, expectedValue);
                  },
                ),
                fc.constantFrom(
                  ...extractAsyncPhrases(
                    'functionschema-to-eventually-call-nodeback-with-value-satisfying-to-eventually-invoke-nodeback-with-value-satisfying-string-regexp-object-3s3p',
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
                fc.constant(
                  async (nodeback: (err: any, result?: any) => void) => {
                    await Promise.resolve();
                    nodeback(null, expectedValue);
                  },
                ),
                fc.constantFrom(
                  ...extractAsyncPhrases(
                    'functionschema-to-eventually-call-nodeback-with-value-satisfying-to-eventually-invoke-nodeback-with-value-satisfying-string-regexp-object-3s3p',
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
                fc.string().filter((s) => s !== 'nomatch'),
                fc
                  .object()
                  .filter(
                    (o) =>
                      Object.keys(o).length > 0 &&
                      (!('different' in o) || o.different !== 'structure') &&
                      !hasKey(o, '__proto__'),
                  ),
              )
              .chain((expectedValue) =>
                fc.tuple(
                  fc.oneof(
                    // Function that calls with string that won't match patterns
                    fc.constant(
                      async (nodeback: (err: any, result?: any) => void) => {
                        await Promise.resolve();
                        nodeback(null, 'nomatch');
                      },
                    ),
                    // Function that calls with object that won't match patterns
                    fc.constant(
                      async (nodeback: (err: any, result?: any) => void) => {
                        await Promise.resolve();
                        nodeback(null, { different: 'structure' });
                      },
                    ),
                  ),
                  fc.constantFrom(
                    ...extractAsyncPhrases(
                      'functionschema-to-eventually-call-nodeback-with-value-satisfying-to-eventually-invoke-nodeback-with-value-satisfying-string-regexp-object-3s3p',
                    ),
                  ),
                  fc.constant(expectedValue),
                ),
              ),
            async (params) => {
              await expectAsync(
                params[0],
                `not ${params[1]}`,
                ...params.slice(2),
              );
            },
          ),
      },
    },
} as const satisfies Record<string, PropertyTestConfig>;

describe('Property-Based Tests for Callback Assertions (Async)', () => {
  assertExhaustiveTestConfig(
    'async callback',
    asyncAssertions,
    asyncTestConfigs,
  );

  runPropertyTests(asyncTestConfigs, asyncAssertions, testConfigDefaults);
});
