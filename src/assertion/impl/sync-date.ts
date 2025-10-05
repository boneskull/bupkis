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
import { z } from 'zod';

import type {
  AssertionFailure,
  AssertionParseRequest,
} from '../assertion-types.js';

import { DAY_NAMES } from '../../constant.js';
import {
  DateLikeFormatSchema,
  DurationFormatSchema,
  DurationSchema,
} from '../../schema.js';
import { createAssertion } from '../create.js';
const { isNaN } = Number;
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
  DateLikeFormatSchema,
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
  (subject): AssertionFailure | boolean => {
    const date = toDate(subject);
    if (!date) {
      return {
        actual: subject,
        expected: 'a valid date',
        message: `Expected subject to be a valid date, but received: ${subject}`,
      };
    }

    const today = new Date();
    const isToday =
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate();

    if (!isToday) {
      return {
        actual: date.toDateString(),
        expected: today.toDateString(),
        message: `Expected date to be today (${today.toDateString()}), but received: ${date.toDateString()}`,
      };
    }

    return true;
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
  [DateLikeFormatSchema, 'to be before', DateLikeFormatSchema],
  (subject, other): AssertionFailure | AssertionParseRequest => {
    const subjectDate = toDate(subject);
    const otherDate = toDate(other);
    if (!subjectDate) {
      return {
        actual: subject,
        expected: 'a valid date',
        message: `Expected subject to be a valid date, but received: ${subject}`,
      };
    }
    if (!otherDate) {
      return {
        actual: other,
        expected: 'a valid date',
        message: `Expected comparison date to be a valid date, but received: ${other}`,
      };
    }

    // Use Zod's date validation with max constraint for better error messages
    return {
      schema: z.date().max(new Date(otherDate.getTime() - 1)),
      subject: subjectDate,
    };
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
  [DateLikeFormatSchema, 'to be after', DateLikeFormatSchema],
  (subject, other): AssertionFailure | AssertionParseRequest => {
    const subjectDate = toDate(subject);
    const otherDate = toDate(other);
    if (!subjectDate) {
      return {
        actual: subject,
        expected: 'a valid date',
        message: `Expected subject to be a valid date, but received: ${subject}`,
      };
    }
    if (!otherDate) {
      return {
        actual: other,
        expected: 'a valid date',
        message: `Expected comparison date to be a valid date, but received: ${other}`,
      };
    }

    // Use Zod's date validation with min constraint for better error messages
    return {
      schema: z.date().min(new Date(otherDate.getTime() + 1)),
      subject: subjectDate,
    };
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
  [
    DateLikeFormatSchema,
    'to be between',
    DateLikeFormatSchema,
    'and',
    DateLikeFormatSchema,
  ],
  (subject, start, end): AssertionFailure | AssertionParseRequest => {
    const subjectDate = toDate(subject);
    const startDate = toDate(start);
    const endDate = toDate(end);
    if (!subjectDate) {
      return {
        actual: subject,
        expected: 'a valid date',
        message: `Expected subject to be a valid date, but received: ${subject}`,
      };
    }
    if (!startDate) {
      return {
        actual: start,
        expected: 'a valid date',
        message: `Expected start date to be a valid date, but received: ${start}`,
      };
    }
    if (!endDate) {
      return {
        actual: end,
        expected: 'a valid date',
        message: `Expected end date to be a valid date, but received: ${end}`,
      };
    }

    // Use Zod's date validation with min/max constraints for better error messages
    return {
      schema: z.date().min(startDate).max(endDate),
      subject: subjectDate,
    };
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
 * expect(new Date(), 'to be within', '1 hour', 'from now'); // passes if within the last hour
 * expect(
 *   new Date(Date.now() - 3600000),
 *   'to be within',
 *   '30 minutes',
 *   'from now',
 * ); // fails
 * ```
 *
 * @group Date/Time Assertions
 */
export const withinFromNowAssertion = createAssertion(
  [DateLikeFormatSchema, 'to be within', DurationFormatSchema, 'from now'],
  (subject, durationStr): AssertionFailure | AssertionParseRequest => {
    const subjectDate = toDate(subject);
    if (!subjectDate) {
      return {
        actual: subject,
        expected: 'a valid date',
        message: `Expected subject to be a valid date, but received: ${subject}`,
      };
    }

    // Transform the duration string to milliseconds
    const durationResult = DurationSchema.safeParse(durationStr);
    if (!durationResult.success) {
      return {
        actual: durationStr,
        expected: 'a valid duration string',
        message: `Expected a valid duration string, but received: ${durationStr}`,
      };
    }
    const durationMs = durationResult.data;

    const nowTime = now();
    const maxTime = nowTime + durationMs;

    // Use Zod's date validation to ensure it's between now and now + duration
    return {
      schema: z.date().min(new Date(nowTime)).max(new Date(maxTime)),
      subject: subjectDate,
    };
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
 * expect(new Date(Date.now() - 1800000), 'to be within', '1 hour', 'ago'); // passes if within 30 minutes ago
 * expect(new Date(Date.now() + 1800000), 'to be within', '1 hour', 'ago'); // fails (future date)
 * ```
 *
 * @group Date/Time Assertions
 */
export const withinAgoAssertion = createAssertion(
  [DateLikeFormatSchema, 'to be within', DurationFormatSchema, 'ago'],
  (subject, durationStr): AssertionFailure | AssertionParseRequest => {
    const subjectDate = toDate(subject);
    if (!subjectDate) {
      return {
        actual: subject,
        expected: 'a valid date',
        message: `Expected subject to be a valid date, but received: ${subject}`,
      };
    }

    // Transform the duration string to milliseconds
    const durationResult = DurationSchema.safeParse(durationStr);
    if (!durationResult.success) {
      return {
        actual: durationStr,
        expected: 'a valid duration string',
        message: `Expected a valid duration string, but received: ${durationStr}`,
      };
    }
    const durationMs = durationResult.data;

    const nowTime = now();
    const minTime = nowTime - durationMs;

    // Use Zod's date validation to ensure it's between now - duration and now
    return {
      schema: z.date().min(new Date(minTime)).max(new Date(nowTime)),
      subject: subjectDate,
    };
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
 *   '1 hour',
 *   'from now',
 * ); // passes (2 hours from now)
 * expect(
 *   new Date(Date.now() + 1800000),
 *   'to be at least',
 *   '1 hour',
 *   'from now',
 * ); // fails (30 minutes from now)
 * ```
 *
 * @group Date/Time Assertions
 */
export const atLeastFromNowAssertion = createAssertion(
  [DateLikeFormatSchema, 'to be at least', DurationFormatSchema, 'from now'],
  (subject, durationStr): AssertionFailure | AssertionParseRequest => {
    const subjectDate = toDate(subject);
    if (!subjectDate) {
      return {
        actual: subject,
        expected: 'a valid date',
        message: `Expected subject to be a valid date, but received: ${subject}`,
      };
    }

    // Transform the duration string to milliseconds
    const durationResult = DurationSchema.safeParse(durationStr);
    if (!durationResult.success) {
      return {
        actual: durationStr,
        expected: 'a valid duration string',
        message: `Expected a valid duration string, but received: ${durationStr}`,
      };
    }
    const durationMs = durationResult.data;

    const nowTime = now();
    const minTime = nowTime + durationMs;

    // Use Zod's date validation to ensure it's at least the duration from now
    return {
      schema: z.date().min(new Date(minTime)),
      subject: subjectDate,
    };
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
 * expect(
 *   new Date(Date.now() - 7200000),
 *   'to be at least',
 *   '1 hour',
 *   'ago',
 * ); // passes (2 hours ago)
 * expect(
 *   new Date(Date.now() - 1800000),
 *   'to be at least',
 *   '1 hour',
 *   'ago',
 * ); // fails (30 minutes ago)
 * ```
 *
 * @group Date/Time Assertions
 */
export const atLeastAgoAssertion = createAssertion(
  [DateLikeFormatSchema, 'to be at least', DurationFormatSchema, 'ago'],
  (subject, durationStr): AssertionFailure | AssertionParseRequest => {
    const subjectDate = toDate(subject);
    if (!subjectDate) {
      return {
        actual: subject,
        expected: 'a valid date',
        message: `Expected subject to be a valid date, but received: ${subject}`,
      };
    }

    // Transform the duration string to milliseconds
    const durationResult = DurationSchema.safeParse(durationStr);
    if (!durationResult.success) {
      return {
        actual: durationStr,
        expected: 'a valid duration string',
        message: `Expected a valid duration string, but received: ${durationStr}`,
      };
    }
    const durationMs = durationResult.data;

    const nowTime = now();
    const maxTime = nowTime - durationMs;

    // Use Zod's date validation to ensure it's at least the duration ago
    return {
      schema: z.date().max(new Date(maxTime)),
      subject: subjectDate,
    };
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
  [DateLikeFormatSchema, 'to be the same date as', DateLikeFormatSchema],
  (subject, other): AssertionFailure | boolean => {
    const subjectDate = toDate(subject);
    const otherDate = toDate(other);
    if (!subjectDate) {
      return {
        actual: subject,
        expected: 'a valid date',
        message: `Expected subject to be a valid date, but received: ${subject}`,
      };
    }
    if (!otherDate) {
      return {
        actual: other,
        expected: 'a valid date',
        message: `Expected comparison date to be a valid date, but received: ${other}`,
      };
    }

    const isSameDate =
      subjectDate.getFullYear() === otherDate.getFullYear() &&
      subjectDate.getMonth() === otherDate.getMonth() &&
      subjectDate.getDate() === otherDate.getDate();

    if (!isSameDate) {
      return {
        actual: subjectDate.toDateString(),
        expected: otherDate.toDateString(),
        message: `Expected dates to be the same day, but ${subjectDate.toDateString()} !== ${otherDate.toDateString()}`,
      };
    }

    return true;
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
  [
    DateLikeFormatSchema,
    'to equal',
    DateLikeFormatSchema,
    'within',
    DurationFormatSchema,
  ],
  (subject, other, toleranceStr): AssertionFailure | boolean => {
    const subjectDate = toDate(subject);
    const otherDate = toDate(other);
    if (!subjectDate) {
      return {
        actual: subject,
        expected: 'a valid date',
        message: `Expected subject to be a valid date, but received: ${subject}`,
      };
    }
    if (!otherDate) {
      return {
        actual: other,
        expected: 'a valid date',
        message: `Expected comparison date to be a valid date, but received: ${other}`,
      };
    }

    // Transform the duration string to milliseconds
    const durationResult = DurationSchema.safeParse(toleranceStr);
    if (!durationResult.success) {
      return {
        actual: toleranceStr,
        expected: 'a valid duration string',
        message: `Expected a valid duration string, but received: ${toleranceStr}`,
      };
    }
    const toleranceMs = durationResult.data;

    const diff = abs(subjectDate.getTime() - otherDate.getTime());
    if (diff > toleranceMs) {
      return {
        actual: `${diff}ms difference`,
        expected: `within ${toleranceMs}ms`,
        message: `Expected dates to be equal within ${toleranceStr} (${toleranceMs}ms), but difference was ${diff}ms`,
      };
    }

    return true;
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
  (subject): AssertionFailure | AssertionParseRequest => {
    const date = toDate(subject);
    if (!date) {
      return {
        actual: subject,
        expected: 'a valid date',
        message: `Expected subject to be a valid date, but received: ${subject}`,
      };
    }

    // Use Zod's date validation with max constraint for the past
    return {
      schema: z.date().max(new Date(now() - 1)), // Must be before now
      subject: date,
    };
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
  (subject): AssertionFailure | AssertionParseRequest => {
    const date = toDate(subject);
    if (!date) {
      return {
        actual: subject,
        expected: 'a valid date',
        message: `Expected subject to be a valid date, but received: ${subject}`,
      };
    }

    // Use Zod's date validation with min constraint for the future
    return {
      schema: z.date().min(new Date(now() + 1)), // Must be after now
      subject: date,
    };
  },
  {
    anchor: 'unknown-to-be-in-the-future',
    category: 'date',
  },
);

/**
 * Asserts that the subject is a weekend (Saturday or Sunday) in UTC.
 *
 * @example
 *
 * ```ts
 * expect(new Date('2023-01-07'), 'to be a weekend'); // passes (Saturday in UTC)
 * expect(new Date('2023-01-08'), 'to be a weekend'); // passes (Sunday in UTC)
 * expect(new Date('2023-01-09'), 'to be a weekend'); // fails (Monday in UTC)
 * ```
 *
 * @group Date/Time Assertions
 */
export const weekendAssertion = createAssertion(
  ['to be a weekend'],
  (subject): AssertionFailure | boolean => {
    const date = toDate(subject);
    if (!date) {
      return {
        actual: subject,
        expected: 'a valid date',
        message: `Expected subject to be a valid date, but received: ${subject}`,
      };
    }

    const day = date.getUTCDay();
    const isWeekend = day === 0 || day === 6; // Sunday or Saturday

    if (!isWeekend) {
      return {
        actual: DAY_NAMES[day],
        expected: 'Saturday or Sunday',
        message: `Expected date to be a weekend (Saturday or Sunday in UTC), but it was ${DAY_NAMES[day]} in UTC`,
      };
    }

    return true;
  },
  {
    anchor: 'unknown-to-be-a-weekend',
    category: 'date',
  },
);

/**
 * Asserts that the subject is a weekday (Monday through Friday) in UTC.
 *
 * @example
 *
 * ```ts
 * expect(new Date('2023-01-09'), 'to be a weekday'); // passes (Monday in UTC)
 * expect(new Date('2023-01-13'), 'to be a weekday'); // passes (Friday in UTC)
 * expect(new Date('2023-01-07'), 'to be a weekday'); // fails (Saturday in UTC)
 * ```
 *
 * @group Date/Time Assertions
 */
export const weekdayAssertion = createAssertion(
  ['to be a weekday'],
  (subject): AssertionFailure | boolean => {
    const date = toDate(subject);
    if (!date) {
      return {
        actual: subject,
        expected: 'a valid date',
        message: `Expected subject to be a valid date, but received: ${subject}`,
      };
    }

    const day = date.getUTCDay();
    const isWeekday = day >= 1 && day <= 5; // Monday through Friday

    if (!isWeekday) {
      return {
        actual: DAY_NAMES[day],
        expected: 'Monday through Friday',
        message: `Expected date to be a weekday (Monday through Friday in UTC), but it was ${DAY_NAMES[day]} in UTC`,
      };
    }

    return true;
  },
  {
    anchor: 'unknown-to-be-a-weekday',
    category: 'date',
  },
);
