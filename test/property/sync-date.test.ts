import fc from 'fast-check';
import { describe, it } from 'node:test';

import type { AnyAssertion } from '../../src/types.js';

import * as assertions from '../../src/assertion/impl/sync-date.js';
import {
  futureDateGenerator,
  pastDateGenerator,
  SyncDateGenerators,
  validDateLikeGenerator,
  weekdayDateGenerator,
  weekendDateGenerator,
} from '../../test-data/sync-date-generators.js';
import { expect } from '../custom-assertions.js';
import {
  type PropertyTestConfig,
  type PropertyTestConfigParameters,
} from './property-test-config.js';
import {
  extractPhrases,
  filteredAnything,
  getVariants,
  runVariant,
} from './property-test-util.js';

// Get all the sync date assertions
const SyncDateAssertions = Object.values(assertions);

/**
 * Test config defaults
 */
const testConfigDefaults: PropertyTestConfigParameters = {} as const;

/**
 * Generates invalid date-like values
 */
const invalidDateLikeGenerator = filteredAnything.filter(
  (v) =>
    !(v instanceof Date) &&
    (typeof v !== 'string' || Number.isNaN(new Date(v).getTime())) &&
    (typeof v !== 'number' || Number.isNaN(new Date(v).getTime())),
);

/**
 * Generates valid duration strings
 */
const durationGenerator = fc.oneof(
  fc.integer({ max: 100, min: 1 }).map((n) => `${n} milliseconds`),
  fc.integer({ max: 100, min: 1 }).map((n) => `${n} ms`),
  fc.integer({ max: 100, min: 1 }).map((n) => `${n} seconds`),
  fc.integer({ max: 100, min: 1 }).map((n) => `${n} s`),
  fc.integer({ max: 100, min: 1 }).map((n) => `${n} minutes`),
  fc.integer({ max: 100, min: 1 }).map((n) => `${n} m`),
  fc.integer({ max: 100, min: 1 }).map((n) => `${n} hours`),
  fc.integer({ max: 100, min: 1 }).map((n) => `${n} h`),
  fc.integer({ max: 100, min: 1 }).map((n) => `${n} days`),
  fc.integer({ max: 100, min: 1 }).map((n) => `${n} d`),
  fc.integer({ max: 100, min: 1 }).map((n) => `${n} weeks`),
  fc.integer({ max: 100, min: 1 }).map((n) => `${n} w`),
  fc.integer({ max: 100, min: 1 }).map((n) => `${n} months`),
  fc.integer({ max: 100, min: 1 }).map((n) => `${n} years`),
  fc.integer({ max: 100, min: 1 }).map((n) => `${n} y`),
);

/**
 * Generates dates that are not today
 */
const notTodayDateGenerator = fc.oneof(
  fc.date({ noInvalidDate: true }).filter((d) => {
    const today = new Date();
    return !(
      d.getFullYear() === today.getFullYear() &&
      d.getMonth() === today.getMonth() &&
      d.getDate() === today.getDate()
    );
  }),
  fc.constant(new Date('2020-01-01')),
  fc.constant(new Date('2030-12-31')),
);

/**
 * Map of assertions to their property test configurations.
 */
const testConfigs = new Map<AnyAssertion, PropertyTestConfig>([
  [
    assertions.afterAssertion,
    {
      invalid: {
        generators: fc
          .tuple(validDateLikeGenerator, validDateLikeGenerator)
          .filter(([a, b]) => {
            const dateA = new Date(a);
            const dateB = new Date(b);
            return dateA.getTime() <= dateB.getTime();
          })
          .map(([subject, other]) => [subject, 'to be after', other]),
      },
      valid: {
        generators: SyncDateGenerators.get(assertions.afterAssertion)!,
      },
    },
  ],

  [
    assertions.atLeastAgoAssertion,
    {
      invalid: {
        generators: fc
          .oneof(
            // Future dates should fail
            fc.tuple(futureDateGenerator, durationGenerator),
            // Dates too close to now should fail
            fc.tuple(
              fc.date({
                max: new Date(Date.now() - 1000), // 1 second ago
                min: new Date(Date.now() - 1800000), // 30 minutes ago
                noInvalidDate: true,
              }),
              fc.constant('1 hour'),
            ),
          )
          .map(([date, duration]) => [date, 'to be at least', duration, 'ago']),
      },
      valid: {
        generators: SyncDateGenerators.get(assertions.atLeastAgoAssertion)!,
      },
    },
  ],

  [
    assertions.atLeastFromNowAssertion,
    {
      invalid: {
        generators: fc
          .oneof(
            // Past dates should fail
            fc.tuple(pastDateGenerator, durationGenerator),
            // Dates too close to now should fail
            fc.tuple(
              fc.date({
                max: new Date(Date.now() + 1800000), // 30 minutes from now
                min: new Date(Date.now() + 1000), // 1 second from now
                noInvalidDate: true,
              }),
              fc.constant('1 hour'),
            ),
          )
          .map(([date, duration]) => [
            date,
            'to be at least',
            duration,
            'from now',
          ]),
      },
      valid: {
        generators: SyncDateGenerators.get(assertions.atLeastFromNowAssertion)!,
      },
    },
  ],

  [
    assertions.beforeAssertion,
    {
      invalid: {
        generators: fc
          .tuple(validDateLikeGenerator, validDateLikeGenerator)
          .filter(([a, b]) => {
            const dateA = new Date(a);
            const dateB = new Date(b);
            // Ensure both dates are valid
            if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
              return false;
            }
            return dateA.getTime() >= dateB.getTime();
          })
          .map(([subject, other]) => [subject, 'to be before', other]),
      },
      valid: {
        generators: SyncDateGenerators.get(assertions.beforeAssertion)!,
      },
    },
  ],

  [
    assertions.betweenAssertion,
    {
      invalid: {
        generators: fc
          .tuple(
            validDateLikeGenerator,
            fc.integer({ max: 100000, min: 1 }),
            fc.integer({ max: 100000, min: 1 }),
          )
          .chain(([subject, offset1, offset2]) =>
            fc.oneof(
              fc.tuple(
                fc.constant(subject),
                fc.date({
                  min: new Date(new Date(subject).getTime() + offset1),
                  noInvalidDate: true,
                }),
                fc.date({
                  min: new Date(new Date(subject).getTime() + offset2),
                  noInvalidDate: true,
                }),
              ),
              fc.tuple(
                fc.constant(subject),
                fc.date({
                  max: new Date(new Date(subject).getTime() - offset1),
                  noInvalidDate: true,
                }),
                fc.date({
                  max: new Date(new Date(subject).getTime() - offset2),
                  noInvalidDate: true,
                }),
              ),
            ),
          )
          .map(([subject, start, end]) => [
            subject,
            'to be between',
            start,
            'and',
            end,
          ]),
      },
      valid: {
        generators: SyncDateGenerators.get(assertions.betweenAssertion)!,
      },
    },
  ],

  [
    assertions.equalWithinAssertion,
    {
      invalid: {
        generators: fc
          .tuple(
            fc.date({
              max: new Date('2100-01-01'),
              min: new Date('2000-01-01'),
              noInvalidDate: true,
            }),
            fc.date({
              max: new Date('2100-01-01'),
              min: new Date('2000-01-01'),
              noInvalidDate: true,
            }),
          )
          .filter(([a, b]) => {
            // Ensure both dates are valid and significantly apart
            return (
              !Number.isNaN(a.getTime()) &&
              !Number.isNaN(b.getTime()) &&
              Math.abs(a.getTime() - b.getTime()) > 2000
            );
          })
          .map(([subject, other]) => [
            subject,
            'to equal',
            other,
            'within',
            '1 second',
          ]),
      },
      valid: {
        generators: SyncDateGenerators.get(assertions.equalWithinAssertion)!,
      },
    },
  ],

  [
    assertions.inTheFutureAssertion,
    {
      invalid: {
        generators: [
          pastDateGenerator,
          fc.constantFrom(...extractPhrases(assertions.inTheFutureAssertion)),
        ],
      },
      valid: {
        generators: SyncDateGenerators.get(assertions.inTheFutureAssertion)!,
      },
    },
  ],

  [
    assertions.inThePastAssertion,
    {
      invalid: {
        generators: [
          futureDateGenerator,
          fc.constantFrom(...extractPhrases(assertions.inThePastAssertion)),
        ],
      },
      valid: {
        generators: SyncDateGenerators.get(assertions.inThePastAssertion)!,
      },
    },
  ],

  [
    assertions.sameDateAssertion,
    {
      invalid: {
        generators: fc
          .tuple(validDateLikeGenerator, validDateLikeGenerator)
          .filter(([a, b]) => {
            const dateA = new Date(a);
            const dateB = new Date(b);
            return !(
              dateA.getFullYear() === dateB.getFullYear() &&
              dateA.getMonth() === dateB.getMonth() &&
              dateA.getDate() === dateB.getDate()
            );
          })
          .map(([subject, other]) => [
            subject,
            'to be the same date as',
            other,
          ]),
      },
      valid: {
        generators: SyncDateGenerators.get(assertions.sameDateAssertion)!,
      },
    },
  ],

  [
    assertions.todayAssertion,
    {
      invalid: {
        generators: [
          notTodayDateGenerator,
          fc.constantFrom(...extractPhrases(assertions.todayAssertion)),
        ],
      },
      valid: {
        generators: SyncDateGenerators.get(assertions.todayAssertion)!,
      },
    },
  ],

  [
    assertions.validDateAssertion,
    {
      invalid: {
        generators: [
          invalidDateLikeGenerator,
          fc.constantFrom(...extractPhrases(assertions.validDateAssertion)),
        ],
      },
      valid: {
        generators: SyncDateGenerators.get(assertions.validDateAssertion)!,
      },
    },
  ],

  [
    assertions.weekdayAssertion,
    {
      invalid: {
        generators: [
          weekendDateGenerator,
          fc.constantFrom(...extractPhrases(assertions.weekdayAssertion)),
        ],
      },
      valid: {
        generators: SyncDateGenerators.get(assertions.weekdayAssertion)!,
      },
    },
  ],

  [
    assertions.weekendAssertion,
    {
      invalid: {
        generators: [
          weekdayDateGenerator,
          fc.constantFrom(...extractPhrases(assertions.weekendAssertion)),
        ],
      },
      valid: {
        generators: SyncDateGenerators.get(assertions.weekendAssertion)!,
      },
    },
  ],

  [
    assertions.withinAgoAssertion,
    {
      invalid: {
        generators: fc
          .oneof(
            // Future dates should fail
            fc.tuple(
              fc.date({
                min: new Date(Date.now() + 10000), // At least 10 seconds in future
                noInvalidDate: true,
              }),
              fc.constant('1 hour'),
            ),
            // Dates too far in the past should fail
            fc.tuple(
              fc.date({
                max: new Date(Date.now() - 7200000), // More than 2 hours ago
                noInvalidDate: true,
              }),
              fc.constant('1 hour'), // Only 1 hour tolerance
            ),
          )
          .map(([date, duration]) => [date, 'to be within', duration, 'ago']),
      },
      valid: {
        generators: SyncDateGenerators.get(assertions.withinAgoAssertion)!,
      },
    },
  ],

  [
    assertions.withinFromNowAssertion,
    {
      invalid: {
        generators: fc.oneof(
          // Past dates (should always be invalid for "from now")
          fc.tuple(
            fc
              .integer({ max: -1000, min: -86400000 })
              .map((offsetMs) => new Date(Date.now() + offsetMs)), // 1 second to 1 day ago
            fc.constant('to be within'),
            fc.constant('1 hour'),
            fc.constant('from now'),
          ),
          // Future dates that are too far (more than 1 hour away)
          fc.tuple(
            fc
              .integer({ max: 86400000, min: 3900000 })
              .map((offsetMs) => new Date(Date.now() + offsetMs)), // 65 minutes to 1 day from now
            fc.constant('to be within'),
            fc.constant('1 hour'),
            fc.constant('from now'),
          ),
        ),
      },
      valid: {
        generators: SyncDateGenerators.get(assertions.withinFromNowAssertion)!,
      },
    },
  ],
]);

describe('Date/Time assertions property tests', () => {
  for (const [assertion, testConfig] of testConfigs) {
    const { id } = assertion;

    describe(`Assertion: ${assertion} [${id}]`, () => {
      const runVariants = (configs: PropertyTestConfig[]) => {
        for (const config of configs) {
          const { params, variants } = getVariants(config);
          for (const [name, variant] of variants) {
            it(`should pass ${name} checks [${id}]`, async () => {
              await runVariant(variant, testConfigDefaults, params, name);
            });
          }
        }
      };

      runVariants(Array.isArray(testConfig) ? testConfig : [testConfig]);
    });
  }

  it('should exhaustively test collection SyncDateAssertions', () => {
    expect(
      testConfigs,
      'to exhaustively test collection',
      'SyncDateAssertions',
      'from',
      SyncDateAssertions,
    );
  });
});
