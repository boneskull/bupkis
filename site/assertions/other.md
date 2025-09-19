---
title: Other Assertions
category: Assertions
---

## Other Assertions

These assertions are the odd ducks. We don't have the mental stamina to categorize them properly.

### `{unknown} to be truthy`

> ✏️ Aliases:
>
>     {unknown} to be truthy
>     {unknown} to exist
>     {unknown} to be ok

**Success**:

```js
expect(1, 'to be truthy');
expect('hello', 'to be truthy');
expect(true, 'to exist');
expect({}, 'to be ok');
expect([], 'to exist');
```

**Failure**:

```js
expect(0, 'to be truthy');
// AssertionError: Expected 0 to be truthy
expect('', 'to exist');
expect(false, 'to be ok');
expect(null, 'to exist');
expect(undefined, 'to be truthy');
```

**Negation**:

```js
expect(0, 'not to be truthy');
expect('', 'not to exist');
expect(false, 'not to be ok');
```

### `{unknown} to be falsy`

**Success**:

```js
expect(0, 'to be falsy');
expect('', 'to be falsy');
expect(false, 'to be falsy');
expect(null, 'to be falsy');
expect(undefined, 'to be falsy');
expect(NaN, 'to be falsy');
```

**Failure**:

```js
expect(1, 'to be falsy');
// AssertionError: Expected 1 to be falsy
expect('hello', 'to be falsy');
expect(true, 'to be falsy');
```

**Negation**:

```js
expect(1, 'not to be falsy');
expect('hello', 'not to be falsy');
expect(true, 'not to be falsy');
```

### `{unknown} to be defined`

**Success**:

```js
expect(0, 'to be defined');
expect('', 'to be defined');
expect(false, 'to be defined');
expect(null, 'to be defined');
```

**Failure**:

```js
expect(undefined, 'to be defined');
// AssertionError: Expected undefined to be defined
```

**Negation**:

```js
expect(undefined, 'not to be defined');
```
