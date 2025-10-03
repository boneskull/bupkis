---
title: Date & Time Assertions
category: Assertions
---

## Date & Time Assertions

These assertions test Date objects, time-related values, durations, and temporal relationships.

### `{unknown} to be a Date`

> ✏️ Aliases:
>
>     {unknown} to be a Date
>     {unknown} to be a date

**Success**:

```js
expect(new Date(), 'to be a date');
expect(new Date('2024-01-01'), 'to be a Date');
expect(new Date(Date.now()), 'to be a date');
```

**Failure**:

```js
expect('2024-01-01', 'to be a date');
// AssertionError: Expected '2024-01-01' to be a date
expect(1704067200000, 'to be a Date'); // Unix timestamp
```

**Negation**:

```js
expect('2024-01-01', 'not to be a date');
expect(1704067200000, 'not to be a Date');
```

### `{unknown} to be a valid date`

> ✏️ Aliases:
>
>     {unknown} to be a valid date
>     {unknown} to be date-like

**Success**:

```js
expect(new Date(), 'to be a valid date');
expect('2024-01-01', 'to be date-like');
expect(1704067200000, 'to be a valid date'); // Unix timestamp
```

**Failure**:

```js
expect('invalid-date', 'to be a valid date');
// AssertionError: Expected 'invalid-date' to be a valid date
expect(NaN, 'to be date-like');
```

**Negation**:

```js
expect('invalid-date', 'not to be a valid date');
expect(NaN, 'not to be date-like');
```

### `{unknown} to be today`

**Success**:

```js
expect(new Date(), 'to be today'); // passes if run today
expect(new Date().toISOString().split('T')[0], 'to be today');
```

**Failure**:

```js
expect(new Date('2022-01-01'), 'to be today');
// AssertionError: Expected 2022-01-01T00:00:00.000Z to be today
```

**Negation**:

```js
expect(new Date('2022-01-01'), 'not to be today');
```

### `{date-like} to be before {date-like}`

**Success**:

```js
expect(new Date('2022-01-01'), 'to be before', new Date('2023-01-01'));
expect('2022-01-01', 'to be before', '2023-01-01');
expect(1640995200000, 'to be before', new Date('2023-01-01'));
```

**Failure**:

```js
expect(new Date('2023-01-01'), 'to be before', new Date('2022-01-01'));
// AssertionError: Expected 2023-01-01T00:00:00.000Z to be before 2022-01-01T00:00:00.000Z
```

**Negation**:

```js
expect(new Date('2023-01-01'), 'not to be before', new Date('2022-01-01'));
```

### `{date-like} to be after {date-like}`

**Success**:

```js
expect(new Date('2023-01-01'), 'to be after', new Date('2022-01-01'));
expect('2023-01-01', 'to be after', '2022-01-01');
expect(Date.now(), 'to be after', new Date('2020-01-01'));
```

**Failure**:

```js
expect(new Date('2022-01-01'), 'to be after', new Date('2023-01-01'));
// AssertionError: Expected 2022-01-01T00:00:00.000Z to be after 2023-01-01T00:00:00.000Z
```

**Negation**:

```js
expect(new Date('2022-01-01'), 'not to be after', new Date('2023-01-01'));
```

### `{date-like} to be between {date-like} and {date-like}`

**Success**:

```js
expect(
  new Date('2022-06-01'),
  'to be between',
  new Date('2022-01-01'),
  new Date('2022-12-31'),
);
expect('2022-06-01', 'to be between', '2022-01-01', 'and', '2022-12-31');
```

**Failure**:

```js
expect(
  new Date('2023-01-01'),
  'to be between',
  new Date('2022-01-01'),
  'and',
  new Date('2022-12-31'),
);
// AssertionError: Expected 2023-01-01T00:00:00.000Z to be between 2022-01-01T00:00:00.000Z and 2022-12-31T00:00:00.000Z
```

**Negation**:

```js
expect(
  new Date('2023-01-01'),
  'not to be between',
  new Date('2022-01-01'),
  new Date('2022-12-31'),
);
```

### `{date-like} to be within {duration} from now`

**Success**:

```js
expect(new Date(), 'to be within', '1 hour from now');
expect(new Date(Date.now() - 30000), 'to be within', '1 minute from now'); // 30 seconds ago
```

**Failure**:

```js
expect(new Date(Date.now() - 3600000), 'to be within', '30 minutes from now');
// AssertionError: Expected date to be within 30 minutes from now
```

**Negation**:

```js
expect(
  new Date(Date.now() - 3600000),
  'not to be within',
  '30 minutes from now',
);
```

### `{date-like} to be within {duration} ago`

**Success**:

```js
expect(new Date(Date.now() - 1800000), 'to be within', '1 hour ago'); // 30 minutes ago
expect(new Date(Date.now() - 60000), 'to be within', '5 minutes ago'); // 1 minute ago
```

**Failure**:

```js
expect(new Date(Date.now() + 1800000), 'to be within', '1 hour ago'); // future date
// AssertionError: Expected future date to be within 1 hour ago
```

**Negation**:

```js
expect(new Date(Date.now() + 1800000), 'not to be within', '1 hour ago');
```

### `{date-like} to be at least {duration} from now`

**Success**:

```js
expect(new Date(Date.now() + 7200000), 'to be at least', '1 hour from now'); // 2 hours from now
expect(new Date(Date.now() + 86400000), 'to be at least', '12 hours from now'); // 1 day from now
```

**Failure**:

```js
expect(new Date(Date.now() + 1800000), 'to be at least', '1 hour from now'); // 30 minutes from now
// AssertionError: Expected date to be at least 1 hour from now
```

**Negation**:

```js
expect(new Date(Date.now() + 1800000), 'not to be at least', '1 hour from now');
```

### `{date-like} to be at least {duration} ago`

**Success**:

```js
expect(new Date(Date.now() - 7200000), 'to be at least', '1 hour ago'); // 2 hours ago
expect(new Date(Date.now() - 86400000), 'to be at least', '12 hours ago'); // 1 day ago
```

**Failure**:

```js
expect(new Date(Date.now() - 1800000), 'to be at least', '1 hour ago'); // 30 minutes ago
// AssertionError: Expected date to be at least 1 hour ago
```

**Negation**:

```js
expect(new Date(Date.now() - 1800000), 'not to be at least', '1 hour ago');
```

### `{date-like} to be the same date as {date-like}`

**Success**:

```js
expect(
  new Date('2023-01-01T10:00:00'),
  'to be the same date as',
  new Date('2023-01-01T15:30:00'),
); // same date, different times
expect('2023-01-01', 'to be the same date as', new Date('2023-01-01T23:59:59'));
```

**Failure**:

```js
expect(
  new Date('2023-01-01'),
  'to be the same date as',
  new Date('2023-01-02'),
);
// AssertionError: Expected 2023-01-01T00:00:00.000Z to be the same date as 2023-01-02T00:00:00.000Z
```

**Negation**:

```js
expect(
  new Date('2023-01-01'),
  'not to be the same date as',
  new Date('2023-01-02'),
);
```

### `{date-like} to equal {date-like} within {duration}`

**Success**:

```js
const date1 = new Date('2023-01-01T10:00:00.000Z');
const date2 = new Date('2023-01-01T10:00:00.500Z');
expect(date1, 'to equal', date2, 'within', '1 second'); // 500ms difference
expect(date1, 'to equal', date2, 'within', '1 minute');
```

**Failure**:

```js
const date1 = new Date('2023-01-01T10:00:00.000Z');
const date2 = new Date('2023-01-01T10:00:00.500Z');
expect(date1, 'to equal', date2, 'within', '100 milliseconds');
// AssertionError: Expected dates to be equal within 100 milliseconds
```

**Negation**:

```js
expect(date1, 'not to equal', date2, 'within', '100 milliseconds');
```

### `{unknown} to be in the past`

**Success**:

```js
expect(new Date('2022-01-01'), 'to be in the past');
expect(new Date(Date.now() - 1000), 'to be in the past'); // 1 second ago
expect('2020-01-01', 'to be in the past');
```

**Failure**:

```js
expect(new Date('2030-01-01'), 'to be in the past');
// AssertionError: Expected 2030-01-01T00:00:00.000Z to be in the past
```

**Negation**:

```js
expect(new Date('2030-01-01'), 'not to be in the past');
```

### `{unknown} to be in the future`

**Success**:

```js
expect(new Date('2030-01-01'), 'to be in the future');
expect(new Date(Date.now() + 1000), 'to be in the future'); // 1 second from now
expect('2030-12-31', 'to be in the future');
```

**Failure**:

```js
expect(new Date('2022-01-01'), 'to be in the future');
// AssertionError: Expected 2022-01-01T00:00:00.000Z to be in the future
```

**Negation**:

```js
expect(new Date('2022-01-01'), 'not to be in the future');
```

### `{unknown} to be a weekend`

**Success**:

```js
expect(new Date('2023-01-07'), 'to be a weekend'); // Saturday
expect(new Date('2023-01-08'), 'to be a weekend'); // Sunday
expect('2023-12-30', 'to be a weekend'); // Saturday
```

**Failure**:

```js
expect(new Date('2023-01-09'), 'to be a weekend'); // Monday
// AssertionError: Expected 2023-01-09T00:00:00.000Z to be a weekend
```

**Negation**:

```js
expect(new Date('2023-01-09'), 'not to be a weekend'); // Monday
```

### `{unknown} to be a weekday`

**Success**:

```js
expect(new Date('2023-01-09'), 'to be a weekday'); // Monday
expect(new Date('2023-01-13'), 'to be a weekday'); // Friday
expect('2023-01-10', 'to be a weekday'); // Tuesday
```

**Failure**:

```js
expect(new Date('2023-01-07'), 'to be a weekday'); // Saturday
// AssertionError: Expected 2023-01-07T00:00:00.000Z to be a weekday
```

**Negation**:

```js
expect(new Date('2023-01-07'), 'not to be a weekday'); // Saturday
```

## Duration Formats

The date/time assertions support human-readable duration strings in the following formats:

- **Milliseconds**: `"100 milliseconds"`, `"500 ms"`
- **Seconds**: `"30 seconds"`, `"1 second"`, `"45 sec"`
- **Minutes**: `"5 minutes"`, `"1 minute"`, `"30 min"`
- **Hours**: `"2 hours"`, `"1 hour"`, `"12 hr"`
- **Days**: `"7 days"`, `"1 day"`
- **Weeks**: `"2 weeks"`, `"1 week"`
- **Months**: `"3 months"`, `"1 month"`
- **Years**: `"2 years"`, `"1 year"`

Examples:

```js
expect(someDate, 'to be within', '30 minutes ago');
expect(futureDate, 'to be at least', '2 hours from now');
expect(date1, 'to equal', date2, 'within', '1 second');
```
