---
title: Date & Time Assertions
group: Assertions
---

# Date & Time Assertions

These assertions test Date objects and time-related values.

## to be a date

> _Aliases: `to be a date`, `to be a Date`_

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
