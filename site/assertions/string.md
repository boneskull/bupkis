---
title: String & Pattern Assertions
category: Assertions
---

## String & Pattern Assertions

These assertions test strings, regular expressions, and pattern matching.

### `{unknown} to be a string`

> 👉 See [to be a string](primitive.md#unknown-to-be-a-string)

### `{unknown} to be a RegExp`

> ✏️ Aliases:
>
>     {unknown} to be a RegExp
>     {unknown} to be a regex
>     {unknown} to be a regexp

**Success**:

```js
expect(/hello/, 'to be a RegExp');
expect(new RegExp('world'), 'to be a regex');
expect(/[a-z]+/i, 'to be a regexp');
```

**Failure**:

```js
expect('hello', 'to be a RegExp');
// AssertionError: Expected 'hello' to be a RegExp
```

**Negation**:

```js
expect('hello', 'not to be a RegExp');
```

### `{string} to begin with {string}`

> ✏️ Aliases:
>
>     {string} to begin with {string}
>     {string} to start with {string}

**Success**:

```js
expect('hello world', 'to begin with', 'hello');
expect('JavaScript', 'to start with', 'Java');
```

**Failure**:

```js
expect('hello world', 'to begin with', 'world');
// AssertionError: Expected 'hello world' to begin with 'world'
```

**Negation**:

```js
expect('hello world', 'not to begin with', 'world');
```

### `{string} to end with {string}`

**Success**:

```js
expect('hello world', 'to end with', 'world');
expect('test.js', 'to end with', '.js');
```

**Failure**:

```js
expect('hello world', 'to end with', 'hello');
// AssertionError: Expected 'hello world' to end with 'hello'
```

**Negation**:

```js
expect('hello world', 'not to end with', 'hello');
```

### `{string} to match {RegExp}`

**Success**:

```js
expect('hello123', 'to match', /\d+/);
expect('JavaScript', 'to match', /^Java/);
expect('test@example.com', 'to match', /@/);
```

**Failure**:

```js
expect('hello', 'to match', /\d+/);
// AssertionError: Expected 'hello' to match /\d+/
```

**Negation**:

```js
expect('hello', 'not to match', /\d+/);
```

### `{string} to be empty`

**Success**:

```js
expect('', 'to be empty');
```

**Failure**:

```js
expect('hello', 'to be empty');
// AssertionError: Expected 'hello' to be empty
```

**Negation**:

```js
expect('hello', 'not to be empty');
```

### `{string} to be non-empty`

Functionally identical to ["not to be empty"](#string-to-be-empty).

**Success**:

```js
expect('hello', 'to be non-empty');
expect(' ', 'to be non-empty'); // Whitespace counts as non-empty
```

**Failure**:

```js
expect('', 'to be non-empty');
// AssertionError: Expected '' to be non-empty
```

**Negation**:

> **PRO TIP**: Use ["to be empty"](#string-to-be-empty) instead.

```js
expect('', 'not to be non-empty');
```

### `{string} includes {string}`

> ✏️ Aliases:
>
>     {string} includes {string}
>     {string} contains {string}

**Success**:

```js
expect('hello world', 'includes', 'world');
expect('JavaScript', 'contains', 'Script');
expect([1, 2, 3], 'to include', 2);
expect('test string', 'to contain', 'string');
```

**Failure**:

```js
expect('hello', 'includes', 'world');
// AssertionError: Expected 'hello' to include 'world'
```

**Negation**:

```js
expect('hello', 'not to include', 'world');
```
