import fc from 'fast-check';

import * as assertions from '../src/assertion/impl/sync-date.js';
import { type AnyAssertion } from '../src/types.js';
import { type GeneratorParams } from '../test/property/property-test-config.js';
import { extractPhrases } from '../test/property/property-test-util.js';

/**
 * Generates past dates
 */
export const pastDateGenerator = fc.date({
  max: new Date(Date.now() - 5000), // At least 5 seconds ago to avoid timing issues
  noInvalidDate: true,
});

/**
 * Generates future dates
 */
export const futureDateGenerator = fc.date({
  min: new Date(Date.now() + 5000), // At least 5 seconds from now to avoid timing issues
  noInvalidDate: true,
});

/**
 * Generates weekend dates (Saturday or Sunday)
 */
export const weekendDateGenerator = fc
  .date({ noInvalidDate: true })
  .filter((d) => {
    const day = d.getUTCDay();
    return day === 0 || day === 6; // Sunday or Saturday
  });

/**
 * Generates weekday dates (Monday through Friday)
 */
export const weekdayDateGenerator = fc
  .date({ noInvalidDate: true })
  .filter((d) => {
    const day = d.getUTCDay();
    return day >= 1 && day <= 5; // Monday through Friday
  });

/**
 * Generates dates that are known to be today (for testing)
 */
const todayDateGenerator = fc.constant(new Date());
/**
 * Generates valid date-like values (Date objects, ISO strings, timestamps)
 */
export const validDateLikeGenerator = fc
  .oneof(
    fc.date({
      max: new Date('2100-01-01'),
      min: new Date(0),
      noInvalidDate: true,
    }),
    fc
      .date({
        max: new Date('2100-01-01'),
        min: new Date(0),
        noInvalidDate: true,
      })
      .map((d) => d.toISOString()),
    fc
      .date({
        max: new Date('2100-01-01'),
        min: new Date(0),
        noInvalidDate: true,
      })
      .map((d) => d.getTime()),
  )
  .filter((v) => `${new Date(v)}` !== 'Invalid Date');

export const SyncDateGenerators = new Map<AnyAssertion, GeneratorParams>([
  [
    assertions.afterAssertion,
    fc
      .tuple(validDateLikeGenerator, validDateLikeGenerator)
      .filter(([a, b]) => {
        const dateA = new Date(a);
        const dateB = new Date(b);
        return dateA.getTime() > dateB.getTime();
      })
      .map(([subject, other]) => [subject, 'to be after', other]),
  ],

  [
    assertions.atLeastAgoAssertion,
    fc
      .tuple(
        fc.date({
          max: new Date(Date.now() - 7200000), // 2 hours ago
          min: new Date(Date.now() - 86400000), // 1 day ago
          noInvalidDate: true,
        }),
        fc.constant('1 hour'),
      )
      .map(([date, duration]) => [date, 'to be at least', duration, 'ago']),
  ],

  [
    assertions.atLeastFromNowAssertion,
    fc
      .tuple(
        fc.date({
          max: new Date(Date.now() + 86400000), // 1 day from now
          min: new Date(Date.now() + 7200000), // 2 hours from now
          noInvalidDate: true,
        }),
        fc.constant('1 hour'),
      )
      .map(([date, duration]) => [
        date,
        'to be at least',
        duration,
        'from now',
      ]),
  ],

  [
    assertions.beforeAssertion,
    fc
      .tuple(validDateLikeGenerator, validDateLikeGenerator)
      .filter(([a, b]) => {
        const dateA = new Date(a);
        const dateB = new Date(b);
        // Ensure both dates are valid
        if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
          return false;
        }
        return dateA.getTime() < dateB.getTime();
      })
      .map(([subject, other]) => [subject, 'to be before', other]),
  ],

  [
    assertions.betweenAssertion,
    validDateLikeGenerator
      .chain((subject) =>
        fc.tuple(
          fc.constant(subject),
          fc.date({
            max: new Date(subject),
            min: new Date(0),
            noInvalidDate: true,
          }),
          fc.date({
            max: new Date('2100-01-01'),
            min: new Date(subject),
            noInvalidDate: true,
          }),
        ),
      )
      .map(([subject, start, end]) => [
        subject,
        'to be between',
        start,
        'and',
        end,
      ]),
  ],

  [
    assertions.equalWithinAssertion,
    fc
      .date({
        max: new Date('2099-01-01'), // Ensure room for addition
        min: new Date('2000-01-01'),
        noInvalidDate: true,
      })
      .filter((date) => !Number.isNaN(date.getTime())) // Ensure valid date
      .map((baseDate) => {
        const offset = Math.floor(Math.random() * 500); // Within 500ms
        const closeDate = new Date(baseDate.getTime() + offset);
        // Ensure the new date is also valid
        if (isNaN(closeDate.getTime())) {
          return [baseDate, 'to equal', baseDate, 'within', '1 second'];
        }
        return [baseDate, 'to equal', closeDate, 'within', '1 second'];
      }),
  ],
  [
    assertions.inTheFutureAssertion,
    [
      futureDateGenerator,
      fc.constantFrom(...extractPhrases(assertions.inTheFutureAssertion)),
    ],
  ],
  [
    assertions.inThePastAssertion,
    [
      pastDateGenerator,
      fc.constantFrom(...extractPhrases(assertions.inThePastAssertion)),
    ],
  ],
  [
    assertions.sameDateAssertion,
    fc
      .date({ noInvalidDate: true })
      .chain((baseDate) => {
        const sameDate = new Date(baseDate);
        return fc.tuple(fc.constant(baseDate), fc.constant(sameDate));
      })
      .map(([subject, other]) => [subject, 'to be the same date as', other]),
  ],
  [
    assertions.todayAssertion,
    [
      todayDateGenerator,
      fc.constantFrom(...extractPhrases(assertions.todayAssertion)),
    ],
  ],
  [
    assertions.validDateAssertion,
    [
      validDateLikeGenerator,
      fc.constantFrom(...extractPhrases(assertions.validDateAssertion)),
    ],
  ],
  [
    assertions.weekdayAssertion,
    [
      weekdayDateGenerator,
      fc.constantFrom(...extractPhrases(assertions.weekdayAssertion)),
    ],
  ],
  [
    assertions.weekendAssertion,
    [
      weekendDateGenerator,
      fc.constantFrom(...extractPhrases(assertions.weekendAssertion)),
    ],
  ],
  [
    assertions.withinAgoAssertion,
    fc
      .tuple(
        fc.date({
          max: new Date(Date.now() - 10000), // At least 10 seconds ago
          min: new Date(Date.now() - 1800000), // 30 minutes ago
          noInvalidDate: true,
        }),
        fc.constant('1 hour'),
      )
      .map(([date, duration]) => [date, 'to be within', duration, 'ago']),
  ],
  [
    assertions.withinFromNowAssertion,
    fc
      .tuple(
        fc
          .integer({ max: 1800000, min: 1000 })
          .map((offsetMs) => new Date(Date.now() + offsetMs)), // 1 second to 30 minutes from now
        fc.constant('1 hour'),
      )
      .map(([date, duration]) => [date, 'to be within', duration, 'from now']),
  ],
]);
