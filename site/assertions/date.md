---
title: Date & Time Assertions
category: Assertions
---

## Date & Time Assertions

These assertions test Date objects and time-related values.

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
