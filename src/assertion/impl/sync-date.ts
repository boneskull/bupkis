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

import { DAY_NAMES } from '../../constant.js';
import {
  DateLikeFormatSchema,
  DateSchema,
  DurationFormatSchema,
  DurationSchema,
} from '../../schema.js';
import { createAssertion } from '../create.js';

const { isNaN } = Number;
const { abs } = Math;

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
 * @bupkisAnchor unknown-to-be-a-valid-date
 * @bupkisAssertionCategory date
 */
export const validDateAssertion = createAssertion(
  [['to be a valid date', 'to be date-like']],
  DateLikeFormatSchema,
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
 * @bupkisAnchor date-like-to-be-before-date-like
 * @bupkisAssertionCategory date
 */
export const beforeAssertion = createAssertion(
  [DateLikeFormatSchema, 'to be before', DateLikeFormatSchema],
  (subject, other) => {
    const subjectDate = toDate(subject);
    const otherDate = toDate(other);
    if (!subjectDate) {
      return {
        message: `Expected subject to be a valid date, but received: ${subject}`,
      };
    }
    if (!otherDate) {
      return {
        message: `Expected comparison date to be a valid date, but received: ${other}`,
      };
    }

    // Use Zod's date validation with max constraint for better error messages
    return {
      schema: DateSchema.max(new Date(otherDate.getTime() - 1)),
      subject: subjectDate,
    };
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
 * @bupkisAnchor date-like-to-be-after-date-like
 * @bupkisAssertionCategory date
 */
export const afterAssertion = createAssertion(
  [DateLikeFormatSchema, 'to be after', DateLikeFormatSchema],
  (subject, other) => {
    const subjectDate = toDate(subject);
    const otherDate = toDate(other);
    if (subjectDate === null) {
      return {
        message: `Expected subject to be a valid date, but received: ${subject}`,
      };
    }
    if (otherDate === null) {
      return {
        message: `Expected comparison date to be a valid date, but received: ${other}`,
      };
    }

    // Use Zod's date validation with min constraint for better error messages
    return {
      schema: DateSchema.min(new Date(otherDate.getTime() + 1)),
      subject: subjectDate,
    };
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
 * @bupkisAnchor date-like-to-be-between-date-like-and-date-like
 * @bupkisAssertionCategory date
 */
export const betweenAssertion = createAssertion(
  [
    DateLikeFormatSchema,
    'to be between',
    DateLikeFormatSchema,
    'and',
    DateLikeFormatSchema,
  ],
  (subject, start, end) => {
    const subjectDate = toDate(subject);
    const startDate = toDate(start);
    const endDate = toDate(end);
    if (!subjectDate) {
      return {
        message: `Expected subject to be a valid date, but received: ${subject}`,
      };
    }
    if (!startDate) {
      return {
        message: `Expected start date to be a valid date, but received: ${start}`,
      };
    }
    if (!endDate) {
      return {
        message: `Expected end date to be a valid date, but received: ${end}`,
      };
    }

    // Use Zod's date validation with min/max constraints for better error messages
    return {
      schema: DateSchema.min(startDate).max(endDate),
      subject: subjectDate,
    };
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
 * @bupkisAnchor date-like-to-be-the-same-date-as-date-like
 * @bupkisAssertionCategory date
 */
export const sameDateAssertion = createAssertion(
  [DateLikeFormatSchema, 'to be the same date as', DateLikeFormatSchema],
  (subject, other) => {
    const subjectDate = toDate(subject);
    const otherDate = toDate(other);
    if (!subjectDate) {
      return {
        message: `Expected subject to be a valid date, but received: ${subject}`,
      };
    }
    if (!otherDate) {
      return {
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
 * @bupkisAnchor date-like-to-equal-date-like-within-duration
 * @bupkisAssertionCategory date
 */
export const equalWithinAssertion = createAssertion(
  [
    DateLikeFormatSchema,
    'to equal',
    DateLikeFormatSchema,
    'within',
    DurationFormatSchema,
  ],
  (subject, other, toleranceStr) => {
    const subjectDate = toDate(subject);
    const otherDate = toDate(other);
    if (!subjectDate) {
      return {
        message: `Expected subject to be a valid date, but received: ${subject}`,
      };
    }
    if (!otherDate) {
      return {
        message: `Expected comparison date to be a valid date, but received: ${other}`,
      };
    }

    // Transform the duration string to milliseconds
    const durationResult = DurationSchema.safeParse(toleranceStr);
    if (!durationResult.success) {
      return {
        message: `Expected a valid duration string, but received: ${toleranceStr}`,
      };
    }
    const toleranceMs = durationResult.data;

    const diff = abs(subjectDate.getTime() - otherDate.getTime());
    if (diff > toleranceMs) {
      return {
        actual: { difference: diff },
        expected: { maxDifference: toleranceMs },
        message: `Expected dates to be equal within ${toleranceStr} (${toleranceMs}ms), but difference was ${diff}ms`,
      };
    }
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
 * @bupkisAnchor unknown-to-be-a-weekend
 * @bupkisAssertionCategory date
 */
export const weekendAssertion = createAssertion(
  ['to be a weekend'],
  (subject) => {
    const date = toDate(subject);
    if (!date) {
      return {
        message: `Expected subject to be a valid date, but received: ${subject}`,
      };
    }

    const day = date.getUTCDay();
    const isWeekend = day === 0 || day === 6; // Sunday or Saturday

    if (!isWeekend) {
      return {
        message: `Expected date to be a weekend (Saturday or Sunday in UTC), but it was ${DAY_NAMES[day]} in UTC`,
      };
    }
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
 * @bupkisAnchor unknown-to-be-a-weekday
 * @bupkisAssertionCategory date
 */
export const weekdayAssertion = createAssertion(
  ['to be a weekday'],
  (subject) => {
    const date = toDate(subject);
    if (!date) {
      return {
        message: `Expected subject to be a valid date, but received: ${subject}`,
      };
    }

    const day = date.getUTCDay();
    const isWeekday = day >= 1 && day <= 5; // Monday through Friday

    if (!isWeekday) {
      return {
        message: `Expected date to be a weekday (Monday through Friday in UTC), but it was ${DAY_NAMES[day]} in UTC`,
      };
    }
  },
);
