---
title: Numeric Assertions
group: Assertions
---

# Numeric Assertions

These assertions test numeric values, ranges, and mathematical relationships.

## to be a number

<!-- this is duplicated in `primitives.md`, and that is OK -->

> _Aliases: `to be a number`, `to be finite`_

The definition of "number" is that of Zod v4's; only _finite_ numbers are considered valid.

**Success**:

```js
expect(3.14, 'to be a number');
expect(-42, 'to be a number');
expect(0, 'to be a number');
```

**Failure**:

```js
expect(NaN, 'to be a number');
// AssertionError: Expected NaN to be a number
expect(Infinity, 'to be a number');
```

**Negation**:

```js
expect(NaN, 'not to be a number');
expect(Infinity, 'not to be a number');
```

## to be infinite

**Success**:

```js
expect(Infinity, 'to be infinite');
expect(-Infinity, 'to be infinite');
```

**Failure**:

```js
expect(42, 'to be infinite');
// AssertionError: Expected 42 to be infinite
```

**Negation**:

```js
expect(42, 'not to be infinite');
```

## to be Infinity

**Success**:

```js
expect(Infinity, 'to be Infinity');
```

**Failure**:

```js
expect(-Infinity, 'to be Infinity');
// AssertionError: Expected -Infinity to be Infinity
```

**Negation**:

```js
expect(-Infinity, 'not to be Infinity');
```

## to be -Infinity

**Success**:

```js
expect(-Infinity, 'to be -Infinity');
```

**Failure**:

```js
expect(Infinity, 'to be -Infinity');
// AssertionError: Expected Infinity to be -Infinity
```

**Negation**:

```js
expect(Infinity, 'not to be -Infinity');
```

## to be positive

> _Aliases: `to be positive`, `to be a positive number`_

**Success**:

```js
expect(42, 'to be positive');
expect(3.14, 'to be positive');
```

**Failure**:

```js
expect(-5, 'to be positive');
// AssertionError: Expected -5 to be positive
expect(0, 'to be positive');
```

**Negation**:

```js
expect(-5, 'not to be positive');
expect(0, 'not to be positive');
```

## to be a positive integer

> _Aliases: `to be a positive integer`, `to be a positive int`_

**Success**:

```js
expect(42, 'to be a positive integer');
expect(1, 'to be a positive integer');
```

**Failure**:

```js
expect(3.14, 'to be a positive integer');
// AssertionError: Expected 3.14 to be a positive integer
expect(-5, 'to be a positive integer');
```

**Negation**:

```js
expect(3.14, 'not to be a positive integer');
```

## to be negative

> _Aliases: `to be negative`, `to be a negative number`_

**Success**:

```js
expect(-42, 'to be negative');
expect(-3.14, 'to be negative');
```

**Failure**:

```js
expect(5, 'to be negative');
// AssertionError: Expected 5 to be negative
expect(0, 'to be negative');
```

**Negation**:

```js
expect(5, 'not to be negative');
expect(0, 'not to be negative');
```

## to be a negative integer

> _Aliases: `to be a negative integer`, `to be a negative int`_

**Success**:

```js
expect(-42, 'to be a negative integer');
expect(-1, 'to be a negative integer');
```

**Failure**:

```js
expect(-3.14, 'to be a negative integer');
// AssertionError: Expected -3.14 to be a negative integer
expect(5, 'to be a negative integer');
```

**Negation**:

```js
expect(-3.14, 'not to be a negative integer');
```

## to be NaN

**Success**:

```js
expect(NaN, 'to be NaN');
expect(Number.NaN, 'to be NaN');
```

**Failure**:

```js
expect(42, 'to be NaN');
// AssertionError: Expected 42 to be NaN
```

**Negation**:

```js
expect(42, 'not to be NaN');
```

## to be an integer

> _Aliases: `to be an integer`, `to be a safe integer`, `to be an int`, `to be a safe int`_

**Success**:

```js
expect(42, 'to be an integer');
expect(-17, 'to be an integer');
expect(0, 'to be an integer');
```

**Failure**:

```js
expect(3.14, 'to be an integer');
// AssertionError: Expected 3.14 to be an integer
```

**Negation**:

```js
expect(3.14, 'not to be an integer');
```

## to be greater than

**Success**:

```js
expect(10, 'to be greater than', 5);
expect(3.14, 'to be greater than', 3);
```

**Failure**:

```js
expect(5, 'to be greater than', 10);
// AssertionError: Expected 5 to be greater than 10
```

**Negation**:

```js
expect(5, 'not to be greater than', 10);
```

## to be less than

**Success**:

```js
expect(5, 'to be less than', 10);
expect(3, 'to be less than', 3.14);
```

**Failure**:

```js
expect(10, 'to be less than', 5);
// AssertionError: Expected 10 to be less than 5
```

**Negation**:

```js
expect(10, 'not to be less than', 5);
```

## to be greater than or equal to

> _Aliases: `to be greater than or equal to`, `to be at least`_

**Success**:

```js
expect(10, 'to be greater than or equal to', 10);
expect(15, 'to be at least', 10);
```

**Failure**:

```js
expect(5, 'to be greater than or equal to', 10);
// AssertionError: Expected 5 to be greater than or equal to 10
```

**Negation**:

```js
expect(5, 'not to be greater than or equal to', 10);
```

## to be less than or equal to

> _Aliases: `to be less than or equal to`, `to be at most`_

**Success**:

```js
expect(10, 'to be less than or equal to', 10);
expect(5, 'to be at most', 10);
```

**Failure**:

```js
expect(15, 'to be less than or equal to', 10);
// AssertionError: Expected 15 to be less than or equal to 10
```

**Negation**:

```js
expect(15, 'not to be less than or equal to', 10);
```

## to be within

**Success**:

```js
expect(5, 'to be within', 1, 10);
expect(7.5, 'to be within', 7, 8);
```

**Failure**:

```js
expect(15, 'to be within', 1, 10);
// AssertionError: Expected 15 to be within 1 and 10
```

**Negation**:

```js
expect(15, 'not to be within', 1, 10);
```

## to be close to

**Success**:

```js
expect(1.0, 'to be close to', 1.1, 0.2);
expect(3.14159, 'to be close to', 3.14, 0.01);
```

**Failure**:

```js
expect(1.0, 'to be close to', 2.0, 0.5);
// AssertionError: Expected 1.0 to be close to 2.0 within 0.5
```

**Negation**:

```js
expect(1.0, 'not to be close to', 2.0, 0.5);
```
