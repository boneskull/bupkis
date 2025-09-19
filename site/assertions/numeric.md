---
title: Numeric Assertions
category: Assertions
---

## Numeric Assertions

These assertions test numeric values, ranges, and mathematical relationships.

### `{unknown} to be a number`

> 👉 See [to be a number](primitive.md#to-be-a-number)

### `{unknown} to be infinite`

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

### `{unknown} to be Infinity`

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

### `{unknown} to be -Infinity`

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

### `{unknown} to be positive`

> ✏️ Aliases:
>
>     {unknown} to be positive
>     {unknown} to be a positive number

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

### `{unknown} to be a positive integer`

> ✏️ Aliases:
>
>     {unknown} to be a positive integer
>     {unknown} to be a positive int

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

### `{unknown} to be negative`

> ✏️ Aliases:
>
>     {unknown} to be negative
>     {unknown} to be a negative number

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

### `{unknown} to be a negative integer`

> ✏️ Aliases:
>
>     {unknown} to be a negative integer
>     {unknown} to be a negative int

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

### `{unknown} to be NaN`

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

### `{unknown} to be an integer`

> ✏️ Aliases:
>
>     {unknown} to be an integer
>     {unknown} to be a safe integer
>     {unknown} to be an int
>     {unknown} to be a safe int

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

### `{unknown} to be greater than {number}`

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

### `{unknown} to be less than {number}`

> ✏️ Aliases:
>
>     {unknown} to be less than {number}
>     {unknown} to be lt {number}

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

### `{unknown} to be greater than or equal to {number}`

> ✏️ Aliases:
>
>     {unknown} to be greater than or equal to {number}
>     {unknown} to be at least {number}
>     {unknown} to be gte {number}

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

### `{unknown} to be less than or equal to {number}`

> ✏️ Aliases:
>
>     {unknown} to be less than or equal to {number}
>     {unknown} to be at most {number}
>     {unknown} to be lte {number}

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

### `{number} to be within {number} and {number}`

> ✏️ Aliases:
>
>     {number} to be within {number} and {number}
>     {number} to be between {number} and {number}

> ℹ️ This assertion is inclusive of the boundary values.

**Success**:

```js
expect(5, 'to be within', 1, 10);
expect(7.5, 'to be between', 7, 8);
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

### `{number} to be close to {number} within {number}`

> ℹ️ The first number is the _subject_, the second number is the _target_, and the third number is the _tolerance_.

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
