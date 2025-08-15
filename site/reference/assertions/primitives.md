---
title: Primitive Assertions
group: Assertions
---

# Primitive Assertions

These are the most basic expectations about the _type_ of a subject.

## to be a string

**Success**:

```js
expect('hello, world!', 'to be a string');
```

**Failure**:

```js
expect(42, 'to be a string');
// AssertionError: Expected 42 to be a string
```

**Negation**:

```js
expect(42, 'not to be a string');
```

## to be a boolean

> _Aliases: `to be a boolean`, `to be a bool`, `to be boolean`_

**Success**:

```js
expect(true, 'to be a boolean');
expect(false, 'to be a boolean');
```

**Failure**:

```js
expect(0, 'to be a boolean');
// AssertionError: Expected 0 to be a boolean
```

**Negation**:

```js
expect(0, 'not to be a boolean');
```

## to be a number

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

## to be a bigint

**Success**:

```js
expect(9007199254741991n, 'to be a bigint');
```

**Failure**:

```js
expect(42, 'to be a bigint');
// AssertionError: Expected 42 to be a bigint
```

**Negation**:

```js
expect(42, 'not to be a bigint');
```

## to be a symbol

**Success**:

```js
expect(Symbol('foo'), 'to be a symbol');
```

**Failure**:

```js
expect('foo', 'to be a symbol');
// AssertionError: Expected 'foo' to be a symbol
```

**Negation**:

```js
expect('foo', 'not to be a symbol');
```

## to be null

**Success**:

```js
expect(null, 'to be null');
```

**Failure**:

```js
expect(undefined, 'to be null');
// AssertionError: Expected undefined to be null
```

**Negation**:

```js
expect(undefined, 'not to be null');
```

## to be undefined

**Success**:

```js
expect(undefined, 'to be undefined');
```

**Failure**:

```js
expect(null, 'to be undefined');
// AssertionError: Expected null to be undefined
```

**Negation**:

```js
expect(null, 'not to be undefined');
```

## to be a primitive

**Success**:

```js
expect('hello', 'to be a primitive');
expect(42, 'to be a primitive');
expect(true, 'to be a primitive');
expect(null, 'to be a primitive');
expect(undefined, 'to be a primitive');
expect(Symbol('test'), 'to be a primitive');
expect(123n, 'to be a primitive');
```

**Failure**:

```js
expect({}, 'to be a primitive');
// AssertionError: Expected {} to be a primitive
expect([], 'to be a primitive');
```

**Negation**:

```js
expect({}, 'not to be a primitive');
expect([], 'not to be a primitive');
```
