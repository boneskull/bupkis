/**
 * Date and time-related assertions for temporal testing scenarios.
 *
 * This module provides comprehensive Date and Time assertions with natural
 * language syntax for testing applications that deal with temporal data,
 * scheduling, timestamps, and time-based operations.
 *
 * @packageDocumentation
 * @groupDescription Date/Time Assertions
 * Temporal assertions for dates, times, durations, and time-based comparisons.
 *
 * @showGroups
 */

import { z } from 'zod/v4';

import { BupkisRegistry } from '../../metadata.js';
import { createAssertion } from '../create.js';

const { abs } = Math;
const { now } = Date;

/**
 * Converts various date-like inputs to Date objects for comparison. Supports
 * Date objects, ISO strings, and timestamps.
 *
 * @function
 */
const toDate = (value: unknown): Date | null => {
  if (value instanceof Date) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? null : parsed;
  }
  if (typeof value === 'number') {
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
};

/**
 * Parses a duration string like "1 hour", "30 minutes", "2 days" into
 * milliseconds.
 *
 * @function
 */
const parseDuration = (duration: string): null | number => {
  const match = duration
    .trim()
    .match(
      /^(\d+)\s*(milliseconds?|ms|seconds?|s|minutes?|m|hours?|h|days?|d|weeks?|w|months?|months?|years?|y)$/i,
    );
  if (!match) {
    return null;
  }

  const [, amountStr, unit] = match;
  if (!amountStr || !unit) {
    return null;
  }
  const amount = parseInt(amountStr, 10);

  switch (unit.toLowerCase()) {
    case 'd':
      return amount * 24 * 60 * 60 * 1000;
    case 'day':
    case 'days':
      return amount * 24 * 60 * 60 * 1000;
    case 'h':
      return amount * 60 * 60 * 1000;
    case 'hour':
    case 'hours':
      return amount * 60 * 60 * 1000;
    case 'm':
      return amount * 60 * 1000;
    case 'millisecond':
    case 'milliseconds':
    case 'ms':
      return amount;
    case 'minute':
    case 'minutes':
      return amount * 60 * 1000;
    case 'month':
    case 'months':
      return amount * 30 * 24 * 60 * 60 * 1000; // Approximate
    case 's':
      return amount * 1000;
    case 'second':
    case 'seconds':
      return amount * 1000;
    case 'w':
      return amount * 7 * 24 * 60 * 60 * 1000;
    case 'week':
    case 'weeks':
      return amount * 7 * 24 * 60 * 60 * 1000;
    case 'y':
      return amount * 365 * 24 * 60 * 60 * 1000; // Approximate
    case 'year':
    case 'years':
      return amount * 365 * 24 * 60 * 60 * 1000; // Approximate
    default:
      return null;
  }
};

/**
 * Schema for validating Date objects, ISO strings, or timestamps.
 */
const DateLikeSchema = z
  .union([
    z.date(),
    z.string().refine((str) => !isNaN(new Date(str).getTime()), {
      message: 'Invalid date string',
    }),
    z.number().refine((num) => !isNaN(new Date(num).getTime()), {
      message: 'Invalid timestamp',
    }),
  ])
  .register(BupkisRegistry, { name: 'date-like' })
  .describe('Date, ISO string, or timestamp');

/**
 * Schema for validating duration strings.
 */
const DurationSchema = z
  .string()
  .refine((str) => parseDuration(str) !== null, {
    message:
      'Invalid duration format. Expected format: "1 hour", "30 minutes", "2 days", etc.',
  })
  .register(BupkisRegistry, { name: 'duration' })
  .describe('Duration string like "1 hour", "30 minutes", "2 days"');

/**
 * Asserts that the subject is a valid date (Date object, ISO string, or
 * timestamp).
 *
 * @example
 *
 * ```ts
 * expect(new Date(), 'to be a valid date'); // passes
 * expect('2023-01-01T00:00:00Z', 'to be a valid date'); // passes
 * expect(1640995200000, 'to be a valid date'); // passes
 * expect('invalid', 'to be a valid date'); // fails
 * ```
 *
 * @group Date/Time Assertions
 */
export const validDateAssertion = createAssertion(
  [['to be a valid date', 'to be date-like']],
  DateLikeSchema,
  {
    anchor: 'unknown-to-be-a-valid-date',
    category: 'date',
  },
);

/**
 * Asserts that the subject represents today's date.
 *
 * @example
 *
 * ```ts
 * expect(new Date(), 'to be today'); // passes if run today
 * expect(new Date('2022-01-01'), 'to be today'); // fails unless run on 2022-01-01
 * ```
 *
 * @group Date/Time Assertions
 */
export const todayAssertion = createAssertion(
  ['to be today'],
  (subject) => {
    const date = toDate(subject);
    if (!date) {
      return false;
    }

    const today = new Date();
    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    );
  },
  {
    anchor: 'unknown-to-be-today',
    category: 'date',
  },
);

/**
 * Asserts that the subject is before another date.
 *
 * @example
 *
 * ```ts
 * expect(new Date('2022-01-01'), 'to be before', new Date('2023-01-01')); // passes
 * expect(new Date('2023-01-01'), 'to be before', new Date('2022-01-01')); // fails
 * expect('2022-01-01', 'to be before', '2023-01-01'); // passes
 * ```
 *
 * @group Date/Time Assertions
 */
export const beforeAssertion = createAssertion(
  [DateLikeSchema, 'to be before', DateLikeSchema],
  (subject, other) => {
    const subjectDate = toDate(subject);
    const otherDate = toDate(other);
    if (!subjectDate || !otherDate) {
      return false;
    }
    return subjectDate.getTime() < otherDate.getTime();
  },
  {
    anchor: 'date-like-to-be-before-date-like',
    category: 'date',
  },
);

/**
 * Asserts that the subject is after another date.
 *
 * @example
 *
 * ```ts
 * expect(new Date('2023-01-01'), 'to be after', new Date('2022-01-01')); // passes
 * expect(new Date('2022-01-01'), 'to be after', new Date('2023-01-01')); // fails
 * expect('2023-01-01', 'to be after', '2022-01-01'); // passes
 * ```
 *
 * @group Date/Time Assertions
 */
export const afterAssertion = createAssertion(
  [DateLikeSchema, 'to be after', DateLikeSchema],
  (subject, other) => {
    const subjectDate = toDate(subject);
    const otherDate = toDate(other);
    if (!subjectDate || !otherDate) {
      return false;
    }
    return subjectDate.getTime() > otherDate.getTime();
  },
  {
    anchor: 'date-like-to-be-after-date-like',
    category: 'date',
  },
);

/**
 * Asserts that the subject is between two dates (inclusive).
 *
 * @example
 *
 * ```ts
 * expect(
 *   new Date('2022-06-01'),
 *   'to be between',
 *   new Date('2022-01-01'),
 *   new Date('2022-12-31'),
 * ); // passes
 * expect(
 *   new Date('2023-01-01'),
 *   'to be between',
 *   new Date('2022-01-01'),
 *   new Date('2022-12-31'),
 * ); // fails
 * ```
 *
 * @group Date/Time Assertions
 */
export const betweenAssertion = createAssertion(
  [DateLikeSchema, 'to be between', DateLikeSchema, 'and', DateLikeSchema],
  (subject, start, end) => {
    const subjectDate = toDate(subject);
    const startDate = toDate(start);
    const endDate = toDate(end);
    if (!subjectDate || !startDate || !endDate) {
      return false;
    }
    const subjectTime = subjectDate.getTime();
    return (
      subjectTime >= startDate.getTime() && subjectTime <= endDate.getTime()
    );
  },
  {
    anchor: 'date-like-to-be-between-date-like-and-date-like',
    category: 'date',
  },
);

/**
 * Asserts that the subject is within a specific duration from now.
 *
 * @example
 *
 * ```ts
 * expect(new Date(), 'to be within', '1 hour from now'); // passes if within the last hour
 * expect(
 *   new Date(Date.now() - 3600000),
 *   'to be within',
 *   '30 minutes from now',
 * ); // fails
 * ```
 *
 * @group Date/Time Assertions
 */
export const withinFromNowAssertion = createAssertion(
  [DateLikeSchema, 'to be within', DurationSchema, 'from now'],
  (subject, durationStr) => {
    const subjectDate = toDate(subject);
    if (!subjectDate) {
      return false;
    }

    const durationMs = parseDuration(durationStr);
    if (durationMs === null) {
      return false;
    }

    const nowTime = now();
    const diff = abs(subjectDate.getTime() - nowTime);
    return diff <= durationMs;
  },
  {
    anchor: 'date-like-to-be-within-duration-from-now',
    category: 'date',
  },
);

/**
 * Asserts that the subject is within a specific duration ago from now.
 *
 * @example
 *
 * ```ts
 * expect(new Date(Date.now() - 1800000), 'to be within', '1 hour ago'); // passes if within 30 minutes ago
 * expect(new Date(Date.now() + 1800000), 'to be within', '1 hour ago'); // fails (future date)
 * ```
 *
 * @group Date/Time Assertions
 */
export const withinAgoAssertion = createAssertion(
  [DateLikeSchema, 'to be within', DurationSchema, 'ago'],
  (subject, durationStr) => {
    const subjectDate = toDate(subject);
    if (!subjectDate) {
      return false;
    }

    const durationMs = parseDuration(durationStr);
    if (durationMs === null) {
      return false;
    }

    const nowTime = now();
    const subjectTime = subjectDate.getTime();

    // Must be in the past and within the duration
    return subjectTime <= nowTime && nowTime - subjectTime <= durationMs;
  },
  {
    anchor: 'date-like-to-be-within-duration-ago',
    category: 'date',
  },
);

/**
 * Asserts that the subject is at least a specific duration from now (future).
 *
 * @example
 *
 * ```ts
 * expect(
 *   new Date(Date.now() + 7200000),
 *   'to be at least',
 *   '1 hour from now',
 * ); // passes (2 hours from now)
 * expect(
 *   new Date(Date.now() + 1800000),
 *   'to be at least',
 *   '1 hour from now',
 * ); // fails (30 minutes from now)
 * ```
 *
 * @group Date/Time Assertions
 */
export const atLeastFromNowAssertion = createAssertion(
  [DateLikeSchema, 'to be at least', DurationSchema, 'from now'],
  (subject, durationStr) => {
    const subjectDate = toDate(subject);
    if (!subjectDate) {
      return false;
    }

    const durationMs = parseDuration(durationStr);
    if (durationMs === null) {
      return false;
    }

    const nowTime = now();
    const subjectTime = subjectDate.getTime();

    // Must be in the future and at least the duration away
    return subjectTime > nowTime && subjectTime - nowTime >= durationMs;
  },
  {
    anchor: 'date-like-to-be-at-least-duration-from-now',
    category: 'date',
  },
);

/**
 * Asserts that the subject is at least a specific duration ago.
 *
 * @example
 *
 * ```ts
 * expect(new Date(Date.now() - 7200000), 'to be at least', '1 hour ago'); // passes (2 hours ago)
 * expect(new Date(Date.now() - 1800000), 'to be at least', '1 hour ago'); // fails (30 minutes ago)
 * ```
 *
 * @group Date/Time Assertions
 */
export const atLeastAgoAssertion = createAssertion(
  [DateLikeSchema, 'to be at least', DurationSchema, 'ago'],
  (subject, durationStr) => {
    const subjectDate = toDate(subject);
    if (!subjectDate) {
      return false;
    }

    const durationMs = parseDuration(durationStr);
    if (durationMs === null) {
      return false;
    }

    const nowTime = now();
    const subjectTime = subjectDate.getTime();

    // Must be in the past and at least the duration ago
    return subjectTime <= nowTime && nowTime - subjectTime >= durationMs;
  },
  {
    anchor: 'date-like-to-be-at-least-duration-ago',
    category: 'date',
  },
);

/**
 * Asserts that the subject is the same date as another (ignoring time).
 *
 * @example
 *
 * ```ts
 * expect(
 *   new Date('2023-01-01T10:00:00'),
 *   'to be the same date as',
 *   new Date('2023-01-01T15:30:00'),
 * ); // passes
 * expect(
 *   new Date('2023-01-01'),
 *   'to be the same date as',
 *   new Date('2023-01-02'),
 * ); // fails
 * ```
 *
 * @group Date/Time Assertions
 */
export const sameDateAssertion = createAssertion(
  [DateLikeSchema, 'to be the same date as', DateLikeSchema],
  (subject, other) => {
    const subjectDate = toDate(subject);
    const otherDate = toDate(other);
    if (!subjectDate || !otherDate) {
      return false;
    }

    return (
      subjectDate.getFullYear() === otherDate.getFullYear() &&
      subjectDate.getMonth() === otherDate.getMonth() &&
      subjectDate.getDate() === otherDate.getDate()
    );
  },
  {
    anchor: 'date-like-to-be-the-same-date-as-date-like',
    category: 'date',
  },
);

/**
 * Asserts that the subject is equal to another date within a tolerance.
 *
 * @example
 *
 * ```ts
 * const date1 = new Date('2023-01-01T10:00:00.000Z');
 * const date2 = new Date('2023-01-01T10:00:00.500Z');
 * expect(date1, 'to equal', date2, 'within', '1 second'); // passes
 * expect(date1, 'to equal', date2, 'within', '100 milliseconds'); // fails
 * ```
 *
 * @group Date/Time Assertions
 */
export const equalWithinAssertion = createAssertion(
  [DateLikeSchema, 'to equal', DateLikeSchema, 'within', DurationSchema],
  (subject, other, toleranceStr) => {
    const subjectDate = toDate(subject);
    const otherDate = toDate(other);
    if (!subjectDate || !otherDate) {
      return false;
    }

    const toleranceMs = parseDuration(toleranceStr);
    if (toleranceMs === null) {
      return false;
    }

    const diff = abs(subjectDate.getTime() - otherDate.getTime());
    return diff <= toleranceMs;
  },
  {
    anchor: 'date-like-to-equal-date-like-within-duration',
    category: 'date',
  },
);

/**
 * Asserts that the subject is in the past.
 *
 * @example
 *
 * ```ts
 * expect(new Date('2022-01-01'), 'to be in the past'); // passes
 * expect(new Date('2030-01-01'), 'to be in the past'); // fails
 * ```
 *
 * @group Date/Time Assertions
 */
export const inThePastAssertion = createAssertion(
  ['to be in the past'],
  (subject) => {
    const date = toDate(subject);
    if (!date) {
      return false;
    }
    return date.getTime() < now();
  },
  {
    anchor: 'unknown-to-be-in-the-past',
    category: 'date',
  },
);

/**
 * Asserts that the subject is in the future.
 *
 * @example
 *
 * ```ts
 * expect(new Date('2030-01-01'), 'to be in the future'); // passes
 * expect(new Date('2022-01-01'), 'to be in the future'); // fails
 * ```
 *
 * @group Date/Time Assertions
 */
export const inTheFutureAssertion = createAssertion(
  ['to be in the future'],
  (subject) => {
    const date = toDate(subject);
    if (!date) {
      return false;
    }
    return date.getTime() > now();
  },
  {
    anchor: 'unknown-to-be-in-the-future',
    category: 'date',
  },
);

/**
 * Asserts that the subject is a weekend (Saturday or Sunday).
 *
 * @example
 *
 * ```ts
 * expect(new Date('2023-01-07'), 'to be a weekend'); // passes (Saturday)
 * expect(new Date('2023-01-08'), 'to be a weekend'); // passes (Sunday)
 * expect(new Date('2023-01-09'), 'to be a weekend'); // fails (Monday)
 * ```
 *
 * @group Date/Time Assertions
 */
export const weekendAssertion = createAssertion(
  ['to be a weekend'],
  (subject) => {
    const date = toDate(subject);
    if (!date) {
      return false;
    }
    const day = date.getDay();
    return day === 0 || day === 6; // Sunday or Saturday
  },
  {
    anchor: 'unknown-to-be-a-weekend',
    category: 'date',
  },
);

/**
 * Asserts that the subject is a weekday (Monday through Friday).
 *
 * @example
 *
 * ```ts
 * expect(new Date('2023-01-09'), 'to be a weekday'); // passes (Monday)
 * expect(new Date('2023-01-13'), 'to be a weekday'); // passes (Friday)
 * expect(new Date('2023-01-07'), 'to be a weekday'); // fails (Saturday)
 * ```
 *
 * @group Date/Time Assertions
 */
export const weekdayAssertion = createAssertion(
  ['to be a weekday'],
  (subject) => {
    const date = toDate(subject);
    if (!date) {
      return false;
    }
    const day = date.getDay();
    return day >= 1 && day <= 5; // Monday through Friday
  },
  {
    anchor: 'unknown-to-be-a-weekday',
    category: 'date',
  },
);
