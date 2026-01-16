import {
  extractPhrases,
  filteredAnything,
  type PropertyTestConfig,
} from '@bupkis/property-testing';
import fc from 'fast-check';

import type { AnyAssertion } from '../../../src/types.js';

import * as assertions from '../../../src/assertion/impl/sync-date.js';
import {
  SyncDateGenerators,
  validDateLikeGenerator,
  weekdayDateGenerator,
  weekendDateGenerator,
} from '../../../test-data/sync-date-generators.js';

const invalidDateLikeGenerator = filteredAnything.filter(
  (v) =>
    !(v instanceof Date) &&
    (typeof v !== 'string' || Number.isNaN(new Date(v).getTime())) &&
    (typeof v !== 'number' || Number.isNaN(new Date(v).getTime())),
);

export const testConfigs = new Map<AnyAssertion, PropertyTestConfig>([
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
]);
